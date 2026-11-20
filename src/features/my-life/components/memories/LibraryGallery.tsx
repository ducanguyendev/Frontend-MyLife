import { normalizeDisplayText } from '@/shared/utils/normalizeDisplayText';
import { Images, Pencil, Trash2 } from 'lucide-react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import type { LibraryAlbum } from '@/features/admin/services/libraryService';
import type { LibraryPhoto } from '@/features/admin/components/family-tree/types';
import { LibraryImage } from '@/features/admin/components/family-tree/LibraryImage';
import { MemoryActions } from './MemoryActions';

export function AlbumCard({ album, photos, onSelect, onEdit, onDelete }: { album: LibraryAlbum; photos: LibraryPhoto[]; onSelect: () => void; onEdit: () => void; onDelete: () => void }) {
  const { t, language } = useLanguage();
  const cover = photos.find(photo => photo.id === album.coverPhotoId) ?? photos.find(photo => photo.albumId === album.id);
  const updated = new Date(album.updatedAt);
  return <article className="memory-album" data-album-id={album.id}>
    <button type="button" className="memory-album__open" onClick={onSelect} aria-label={t('memories.openAlbum', { name:album.name })}>
      <span className="memory-album__cover">{cover ? <LibraryImage photoId={cover.id} variant="thumbnail" url={cover.url} driveFileId={cover.driveFileId} alt="" className="memory-album__image"/> : album.coverPhotoUrl ? <img loading="lazy" src={album.coverPhotoUrl} alt="" className="memory-album__image"/> : <span className="memory-album__placeholder"><Images size={32} strokeWidth={1.2}/></span>}<span className="memory-album__count">{t('memories.photoCount', { count:album.photoCount })}</span></span>
      <span className="memory-album__copy"><strong>{normalizeDisplayText(album.name)}</strong>{album.description && <span className="memory-album__description">{album.description}</span>}{!Number.isNaN(updated.getTime()) && <small>{new Intl.DateTimeFormat(language, { dateStyle:'medium' }).format(updated)}</small>}</span>
    </button>
    <div className="memory-album__actions"><MemoryActions label={t('memories.albumActions')} actions={[
      { label:t('admin.library_ui.edit_album'), icon:<Pencil size={14}/>, onClick:onEdit },
      { label:t('admin.library_ui.delete_album'), icon:<Trash2 size={14}/>, danger:true, onClick:onDelete },
    ]}/></div>
  </article>;
}

export function PhotoCard({ photo, onView, onEdit, onDelete }: { photo:LibraryPhoto; onView:() => void; onEdit:() => void; onDelete:() => void }) {
  const { t } = useLanguage();
  return <article className="memory-photo" data-photo-id={photo.id}>
    <button type="button" className="memory-photo__open" onClick={onView} aria-label={`${t('admin.view_detail')}: ${normalizeDisplayText(photo.title)}`}>
      <span className="memory-photo__frame"><LibraryImage photoId={photo.id} variant="thumbnail" url={photo.url} driveFileId={photo.driveFileId} alt={photo.title || t('admin.library_ui.photo_alt')} className="memory-photo__image"/><span className="memory-photo__overlay"><span>{t('admin.library_ui.enlarge')}</span>{photo.author && <span>{normalizeDisplayText(photo.author)}</span>}</span></span>
      <span className="memory-photo__caption"><strong title={normalizeDisplayText(photo.title)}>{normalizeDisplayText(photo.title)}</strong>{photo.year && <span>{photo.year}</span>}</span>
    </button>
    <div className="memory-photo__actions"><MemoryActions label={t('memories.photoActions')} actions={[
      { label:t('admin.library_ui.edit_photo'), icon:<Pencil size={14}/>, onClick:onEdit },
      { label:t('admin.library_ui.delete'), icon:<Trash2 size={14}/>, danger:true, onClick:onDelete },
    ]}/></div>
  </article>;
}
