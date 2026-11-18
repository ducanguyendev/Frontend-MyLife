import React, { useEffect, useState } from 'react';
import { BookOpen, CalendarDays, Network, RotateCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchFamilyMembers } from '@/features/admin/services/familyV2Service';
import { anniversaryService, type FamilyAnniversary } from '@/features/admin/services/anniversaryService';
import { libraryService, type LibraryAlbum } from '@/features/admin/services/libraryService';
import './HubSummary.css';

type SectionStatus = 'loading' | 'ready' | 'empty' | 'error';

interface SectionState<T> {
  status: SectionStatus;
  data?: T;
}

function useHubSection<T>(load: (signal: AbortSignal) => Promise<T>, isEmpty: (data: T) => boolean) {
  const [state, setState] = useState<SectionState<T>>({ status: 'loading' });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({ status: isEmpty(data) ? 'empty' : 'ready', data });
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && (error as { name?: string } | null)?.name !== 'AbortError') {
          setState({ status: 'error' });
        }
      });
    return () => controller.abort();
    // load/isEmpty are module-level stable references; retryKey re-runs the load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryKey]);

  return { ...state, retry: () => setRetryKey((key) => key + 1) };
}

const isEmptyArray = <T,>(data: T[]) => data.length === 0;

const nextAnniversary = (items: FamilyAnniversary[]) =>
  items.reduce<FamilyAnniversary | null>((best, item) => (best === null || item.daysUntil < best.daysUntil ? item : best), null);

/** Parse a YYYY-MM-DD date as a local date (avoids UTC-midnight shifting the day). */
const parseLocalDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};

interface SummaryCardProps {
  to: string;
  variant: 'family' | 'anniversary' | 'library';
  icon: React.ReactNode;
  title: string;
  status: SectionStatus;
  onRetry: () => void;
  children?: React.ReactNode;
  emptyText: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ to, variant, icon, title, status, onRetry, children, emptyText }) => {
  const { t } = useTranslation();

  return (
    <Link
      to={to}
      className={`hub-summary-card hub-summary-card--${variant} group relative flex min-h-[168px] flex-col overflow-hidden rounded-[1.5rem] border border-custom-border bg-secondary-bg p-5 text-primary-text`}
    >
      <span className="flex items-center gap-3">
        <span className="hub-summary-card__icon flex items-center justify-center rounded-2xl border border-custom-border/70 bg-[var(--surface-elevated)] p-2.5 text-[var(--hub-accent)] shadow-sm">
          {icon}
        </span>
        <span className="text-base font-bold tracking-tight">{title}</span>
      </span>

      {status === 'loading' && (
        <span className="mt-5 block" aria-busy="true" aria-label={t('myLife.summary.loading')}>
          <span className="hub-summary-card__skeleton block h-8 w-2/3 rounded-lg" />
          <span className="hub-summary-card__skeleton mt-3 block h-4 w-full rounded-lg" />
        </span>
      )}

      {status === 'ready' && <span className="mt-5 block">{children}</span>}

      {status === 'empty' && (
        <span className="mt-5 block text-sm leading-relaxed text-secondary-text">{emptyText}</span>
      )}

      {status === 'error' && (
        <span className="mt-5 block">
          <span className="block text-sm leading-relaxed text-secondary-text">{t('myLife.summary.error')}</span>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              onRetry();
            }}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-custom-border bg-[var(--surface-elevated)] px-3.5 py-1.5 text-sm font-semibold text-[var(--hub-accent)]"
          >
            <RotateCw size={14} aria-hidden="true" />
            {t('myLife.summary.retry')}
          </button>
        </span>
      )}
    </Link>
  );
};

export const HubSummary: React.FC = () => {
  const { t, i18n } = useTranslation();
  const family = useHubSection(fetchFamilyMembers, isEmptyArray);
  const anniversaries = useHubSection(anniversaryService.getAnniversaries, isEmptyArray);
  const albums = useHubSection(libraryService.getAlbums, isEmptyArray);

  const locale = i18n.language === 'en' ? 'en-US' : 'vi-VN';
  const formatDate = (value: string) =>
    parseLocalDate(value).toLocaleDateString(locale, { day: 'numeric', month: 'numeric', year: 'numeric' });

  const members = family.data ?? [];
  const generations = new Set(members.map((member) => member.generation)).size;
  const next = anniversaries.data ? nextAnniversary(anniversaries.data) : null;
  const albumList = albums.data ?? [];
  const totalPhotos = albumList.reduce((sum, album) => sum + album.photoCount, 0);
  const latestAlbum = albumList.reduce<LibraryAlbum | null>(
    (best, album) => (best === null || album.updatedAt > best.updatedAt ? album : best),
    null,
  );

  return (
    <section aria-labelledby="my-life-summary-heading" className="mb-6 md:mb-8">
      <div className="mb-4 flex items-center gap-3">
        <span className="my-life-section__marker" aria-hidden="true" />
        <h2 id="my-life-summary-heading" className="m-0 text-lg font-bold tracking-tight text-primary-text">
          {t('myLife.summary.title')}
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          to="/familytree"
          variant="family"
          icon={<Network size={20} aria-hidden="true" />}
          title={t('myLife.modules.familyTree.title')}
          status={family.status}
          onRetry={family.retry}
          emptyText={t('myLife.summary.family.empty')}
        >
          <span className="block text-3xl font-black tracking-tight">
            {t('myLife.summary.family.members', { count: members.length })}
          </span>
          <span className="mt-1 block text-sm text-secondary-text">
            {t('myLife.summary.family.generations', { count: generations })}
          </span>
        </SummaryCard>

        <SummaryCard
          to="/anniversaries"
          variant="anniversary"
          icon={<CalendarDays size={20} aria-hidden="true" />}
          title={t('myLife.modules.anniversaries.title')}
          status={anniversaries.status}
          onRetry={anniversaries.retry}
          emptyText={t('myLife.summary.anniversary.empty')}
        >
          {next && (
            <>
              <span className="block text-2xl font-black tracking-tight">
                {next.daysUntil === 0
                  ? t('myLife.summary.anniversary.today')
                  : t('myLife.summary.anniversary.daysLeft', { count: next.daysUntil })}
              </span>
              <span className="mt-1 block truncate text-sm text-secondary-text" title={next.title}>
                {next.title}
                {next.relatedMemberName ? ` · ${next.relatedMemberName}` : ''}
              </span>
              <span className="mt-0.5 block text-sm text-secondary-text">{formatDate(next.nextSolarDate)}</span>
            </>
          )}
        </SummaryCard>

        <SummaryCard
          to="/library"
          variant="library"
          icon={<BookOpen size={20} aria-hidden="true" />}
          title={t('myLife.modules.library.title')}
          status={albums.status}
          onRetry={albums.retry}
          emptyText={t('myLife.summary.library.empty')}
        >
          <span className="block text-3xl font-black tracking-tight">
            {t('myLife.summary.library.albums', { count: albumList.length })}
          </span>
          <span className="mt-1 block text-sm text-secondary-text">
            {t('myLife.summary.library.photos', { count: totalPhotos })}
            {latestAlbum ? ` · ${t('myLife.summary.library.latest', { name: latestAlbum.name })}` : ''}
          </span>
        </SummaryCard>
      </div>
    </section>
  );
};
