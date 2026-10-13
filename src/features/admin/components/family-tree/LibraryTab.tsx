import React, { useEffect, useState } from "react";
import { BookOpen, Plus, Eye, Pencil, Trash2, Loader2, Upload } from "lucide-react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { Button, Modal, Select, SelectItem } from "@/shared/components/ui";
import { featureSuccessKeys, getFeatureErrorKey } from '../../services/featureMessages';
import { libraryService, type LibraryAlbum, type LibraryPhotoMetadata, type LibraryCategory } from '../../services/libraryService';
import { type LibraryPhoto } from "./types";
import { PhotoLightboxModal } from "./PhotoLightboxModal";
import { LibraryAlbumModal } from './LibraryAlbumModal';
import { LibraryUploadModal } from './LibraryUploadModal';
import { LibraryPhotoEditModal } from './LibraryPhotoEditModal';
import { libraryCategoryLabel } from './LibraryPhotoFormFields';
import { LibraryCategoryModal } from './LibraryCategoryModal';
import { LibraryImage } from './LibraryImage';
import './LibraryTab.css';

interface LibraryTabProps {
  showToast: (text: string, ok: boolean) => void;
}

export const LibraryTab: React.FC<LibraryTabProps> = ({ showToast }) => {
  const { t } = useLanguage();
  const [libraryCategory, setLibraryCategory] = useState<string>("all");
  const [previewPhoto, setPreviewPhoto] = useState<LibraryPhoto | null>(null);
  const [albums, setAlbums] = useState<LibraryAlbum[]>([]);
  const [categories, setCategories] = useState<LibraryCategory[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryDialog, setCategoryDialog] = useState<'create' | LibraryCategory | null>(null);
  const [libraryPhotos, setLibraryPhotos] = useState<LibraryPhoto[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<number | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [albumDialog, setAlbumDialog] = useState<'create' | LibraryAlbum | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<LibraryPhoto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: 'album' | 'photo' | 'category'; id: number; name: string; slug?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true); setCategoryLoading(true); setError(null);
    const load = async () => {
      try {
        const [currentAlbums, currentCategories] = await Promise.all([
          libraryService.getAlbums(controller.signal), libraryService.getCategories(controller.signal),
        ]);
        if (controller.signal.aborted) return;
        setAlbums(currentAlbums);
        const userCategories = currentCategories.filter(category => !category.isDefault && category.slug !== 'all');
        setCategories(userCategories); setCategoryLoading(false);
        setLibraryCategory(current => current === 'all' || userCategories.some(category => category.slug === current) ? current : 'all');
        const wanted = selectedAlbum === 'all' ? currentAlbums : currentAlbums.filter(album => album.id === selectedAlbum);
        const details = await Promise.all(wanted.map(album => libraryService.getAlbum(album.id, controller.signal)));
        if (controller.signal.aborted) return;
        const photos: LibraryPhoto[] = details.flatMap(album => album.photos.map(photo => ({
          id: photo.id, albumId: album.id, title: photo.title?.trim() || photo.fileName,
          category: photo.category, driveFileId: photo.driveFileId, year: photo.displayDate ?? '', url: photo.url,
          desc: photo.description ?? photo.caption ?? '', author: photo.author ?? '',
        })));
        setLibraryPhotos(photos);
        setPreviewPhoto(previous => previous ? photos.find(photo => photo.id === previous.id) ?? null : null);
      } catch (failure) {
        if (!controller.signal.aborted) { setError(getFeatureErrorKey(failure, 'album_load')); setPreviewPhoto(null); }
      } finally { if (!controller.signal.aborted) { setIsLoading(false); setCategoryLoading(false); } }
    };
    void load();
    return () => controller.abort();
  }, [selectedAlbum, refreshKey]);

  const activeAlbum = albums.find(album => album.id === selectedAlbum);
  const activeCategory = categories.find(category => category.slug === libraryCategory);
  const refresh = () => setRefreshKey(value => value + 1);
  const requestDelete = (target: NonNullable<typeof deleteTarget>) => {
    setPreviewPhoto(null); setDeleteError(null); setDeleteTarget(target);
  };
  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true); setDeleteError(null);
    try {
      if (deleteTarget.kind === 'photo') await libraryService.deletePhoto(deleteTarget.id);
      else if (deleteTarget.kind === 'category') {
        await libraryService.deleteCategory(deleteTarget.id);
        setCategories(current => current.filter(category => category.id !== deleteTarget.id));
        setLibraryCategory(current => current === deleteTarget.slug ? 'all' : current);
      }
      else { await libraryService.deleteAlbum(deleteTarget.id); setSelectedAlbum('all'); }
      setDeleteTarget(null); refresh(); showToast(t(deleteTarget.kind === 'photo' ? featureSuccessKeys.photoDelete : deleteTarget.kind === 'category' ? featureSuccessKeys.categoryDelete : featureSuccessKeys.albumDelete), true);
    } catch (failure) { setDeleteError(getFeatureErrorKey(failure, deleteTarget.kind === 'photo' ? 'photo_delete' : deleteTarget.kind === 'category' ? 'category_delete' : 'album_delete')); }
    finally { setIsDeleting(false); }
  };
  const savePhoto = async (metadata: LibraryPhotoMetadata) => {
    if (!editingPhoto) return;
    await libraryService.updatePhoto(editingPhoto.id, metadata);
    setEditingPhoto(null); refresh(); showToast(t(featureSuccessKeys.photoUpdate), true);
  };

  const categoryFilters = [{ id: 'all', slug: 'all', label: t('admin.all_categories') },
    ...categories.map(category => ({ id: category.id, slug: category.slug, label: libraryCategoryLabel(category) }))];

  const filteredPhotos = libraryPhotos.filter(
    (photo) => libraryCategory === "all" || photo.category === libraryCategory
  );

  return (
    <div className="library-workspace flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header className="flex shrink-0 flex-col gap-3 border-b border-custom-border px-1 pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent">
            <BookOpen size={19} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight text-primary-text sm:text-xl">{t('admin.library_title')}</h1>
            <p className="hidden truncate text-xs text-secondary-text sm:block">{t('admin.library_desc')}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Button variant="secondary" leftIcon={<Plus size={16} />} onClick={() => setCategoryDialog('create')}>
            {t('admin.library_ui.create_category')}
          </Button>
          <Button variant="secondary" leftIcon={<Plus size={16} />} onClick={() => setAlbumDialog('create')}>
            {t('admin.library_ui.create_album')}
          </Button>
          <Button
            variant="primary"
            leftIcon={<Upload size={16} />}
            disabled={isLoading || categoryLoading || albums.length === 0 || categories.length === 0}
            onClick={() => setUploadOpen(true)}
          >
            {t('admin.library_ui.upload')}
          </Button>
        </div>
      </header>

      {/* Category Filters */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-custom-border px-1 py-2">
        <Select aria-label={t('admin.library_ui.album_filter')}
          containerClassName="min-w-0 flex-1 sm:w-52 sm:flex-none"
          variant="compact"
          className="w-full border-0"
          value={String(selectedAlbum)} disabled={isLoading} onValueChange={value => setSelectedAlbum(value === 'all' ? 'all' : Number(value))}>
          <SelectItem value="all">{t('admin.library_ui.all_albums')}</SelectItem>
          {albums.map(album => <SelectItem key={album.id} value={String(album.id)}>{album.name}</SelectItem>)}
        </Select>
        {activeAlbum && <div className="flex shrink-0 items-center rounded-xl border border-custom-border bg-secondary-bg">
          <button className="cursor-pointer p-2 text-secondary-text transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-accent" title={t('admin.library_ui.edit_album')}
            aria-label={t('admin.library_ui.edit_album')} onClick={() => setAlbumDialog(activeAlbum)}><Pencil size={15} /></button>
          <button className="cursor-pointer p-2 text-secondary-text transition-colors hover:text-error focus-visible:outline-2 focus-visible:outline-error" title={t('admin.library_ui.delete_album')}
            aria-label={t('admin.library_ui.delete_album')} onClick={() => requestDelete({ kind: 'album', id: activeAlbum.id, name: activeAlbum.name })}><Trash2 size={15} /></button>
        </div>}
        <Select aria-label={t('admin.library_ui.category_filter')}
          containerClassName="min-w-0 flex-1 sm:w-48 sm:flex-none"
          variant="compact"
          className="w-full border-0"
          value={libraryCategory} disabled={categoryLoading} onValueChange={setLibraryCategory}>
          {categoryFilters.map(category => <SelectItem key={category.id} value={category.slug}>{category.label}</SelectItem>)}
        </Select>
        {activeCategory && !activeCategory.isDefault && <div className="flex shrink-0 items-center rounded-xl border border-custom-border bg-secondary-bg">
          <button aria-label={t('admin.library_ui.edit_category')} title={t('admin.library_ui.edit_category')}
            className="cursor-pointer p-2 text-secondary-text transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
            onClick={() => setCategoryDialog(activeCategory)}><Pencil size={15} /></button>
          <button aria-label={t('admin.library_ui.delete_category')} title={t('admin.library_ui.delete_category')}
            className="cursor-pointer p-2 text-secondary-text transition-colors hover:text-error focus-visible:outline-2 focus-visible:outline-error"
            onClick={() => requestDelete({ kind: 'category', id: activeCategory.id, name: activeCategory.name, slug: activeCategory.slug })}><Trash2 size={15} /></button>
        </div>}
      </div>

      {/* Gallery Grid */}
      <section className="library-gallery custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 py-3 sm:px-2 sm:py-4" aria-label={t('admin.library_title')}>
        {isLoading && <div role="status" className="flex min-h-48 items-center justify-center gap-2 text-secondary-text"><Loader2 className="motion-safe:animate-spin motion-reduce:animate-none" size={20} />{t('admin.library_ui.loading')}</div>}
        {!isLoading && error && <div role="alert" className="mx-auto mt-6 max-w-lg space-y-3 rounded-2xl border border-custom-border bg-secondary-bg p-6 text-center">
          <p className="text-error">{t(error)}</p><Button variant="secondary" onClick={refresh}>{t('admin.library_ui.retry')}</Button>
        </div>}
        {!isLoading && !error && filteredPhotos.length === 0 && <div className="flex min-h-48 flex-col items-center justify-center gap-2 py-10 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-accent"><BookOpen size={21} aria-hidden="true" /></span>
          <p className="text-sm font-medium text-primary-text">{t(libraryPhotos.length === 0 ? 'admin.library_ui.empty' : 'admin.library_ui.no_matches')}</p>
        </div>}
        {!isLoading && !error && filteredPhotos.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4 2xl:grid-cols-5">
          {filteredPhotos.map(photo => {
            const photoCategory = categories.find(category => category.slug === photo.category);
            return <button
              key={photo.id}
              type="button"
              aria-label={t('admin.view_detail') + ': ' + photo.title}
              onClick={() => setPreviewPhoto(photo)}
              className="library-media-card group min-w-0 overflow-hidden rounded-2xl border border-custom-border bg-secondary-bg text-left shadow-sm transition-colors duration-200 hover:border-accent/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span className="relative block aspect-[4/3] overflow-hidden bg-primary-bg">
                <LibraryImage photoId={photo.id} variant="thumbnail"
                  url={photo.url} driveFileId={photo.driveFileId}
                  alt={photo.title || t('admin.library_ui.photo_alt')}
                  className="library-media-card__image h-full w-full object-cover"
                />
                <span className="library-media-card__overlay absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-black/0 to-transparent p-3 opacity-0">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-white"><Eye size={14} aria-hidden="true" />{t('admin.library_ui.enlarge')}</span>
                </span>
                {photo.year && <span className="absolute right-2 top-2 rounded-lg border border-white/15 bg-black/60 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">{photo.year}</span>}
              </span>
              <span className="block p-3">
                <span className="block truncate text-sm font-semibold text-primary-text">{photo.title}</span>
                {photo.desc && <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-secondary-text">{photo.desc}</span>}
                <span className="mt-2 flex min-w-0 items-center justify-between gap-2 text-[11px] text-secondary-text">
                  <span className="truncate">{photo.author}</span>
                  {photoCategory && <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-accent">{libraryCategoryLabel(photoCategory)}</span>}
                </span>
              </span>
            </button>;
          })}
        </div>}
      </section>
      {/* Lightbox Modal */}
      {previewPhoto && <PhotoLightboxModal key={previewPhoto.id}
        photo={previewPhoto}
        onClose={() => setPreviewPhoto(null)}
        onEdit={photo => { setPreviewPhoto(null); setEditingPhoto(photo); }}
        onDelete={photo => requestDelete({ kind: 'photo', id: photo.id, name: photo.title })}
      />}
      {albumDialog && <LibraryAlbumModal album={albumDialog === 'create' ? undefined : albumDialog}
        onClose={() => setAlbumDialog(null)} onSubmit={async metadata => {
          const album = albumDialog === 'create' ? await libraryService.createAlbum(metadata) : await libraryService.updateAlbum(albumDialog.id, metadata);
          setAlbumDialog(null); setSelectedAlbum(album.id); refresh(); showToast(t(albumDialog === 'create' ? featureSuccessKeys.albumCreate : featureSuccessKeys.albumUpdate), true);
        }} />}
      {categoryDialog && <LibraryCategoryModal category={categoryDialog === 'create' ? undefined : categoryDialog}
        onClose={() => setCategoryDialog(null)} onSubmit={async name => {
          const isCreate = categoryDialog === 'create';
          const category = isCreate ? await libraryService.createCategory(name) : await libraryService.updateCategory(categoryDialog.id, name);
          setCategories(current => isCreate ? [...current, category] : current.map(item => item.id === category.id ? category : item));
          if (isCreate) setLibraryCategory(category.slug);
          setCategoryDialog(null);
          showToast(t(isCreate ? featureSuccessKeys.categoryCreate : featureSuccessKeys.categoryUpdate), true);
        }} />}
      {uploadOpen && <LibraryUploadModal albums={albums} categories={categories} initialAlbumId={selectedAlbum === 'all' ? undefined : selectedAlbum}
        initialCategory={libraryCategory === 'all' ? categories[0]?.slug ?? '' : libraryCategory}
        onClose={() => setUploadOpen(false)} onSubmit={async (albumId, files, metadata) => {
          await libraryService.uploadPhotos(albumId, files, metadata);
          setUploadOpen(false); setSelectedAlbum(albumId); setLibraryCategory(metadata.category); refresh(); showToast(t(featureSuccessKeys.photoUpload), true);
        }} />}
      {editingPhoto && <LibraryPhotoEditModal photo={editingPhoto} categories={categories} onClose={() => setEditingPhoto(null)} onSubmit={savePhoto} />}
      <Modal isOpen={deleteTarget !== null} title={t('admin.library_ui.confirm_delete')} onClose={() => { if (!isDeleting) setDeleteTarget(null); }}
        closeOnBackdropClick={!isDeleting} closeOnEsc={!isDeleting} maxWidth="sm">
        <p className="text-sm text-secondary-text break-words">{t(deleteTarget?.kind === 'album' ? 'admin.library_ui.delete_album_hint' : deleteTarget?.kind === 'category' ? 'admin.library_ui.delete_category_hint' : 'admin.library_ui.delete_photo_hint')} <strong>{deleteTarget?.name}</strong></p>
        {deleteError && <p role="alert" className="mt-3 text-sm text-error">{t(deleteError)}</p>}
        <div className="flex justify-end gap-3 mt-6"><Button variant="secondary" disabled={isDeleting} onClick={() => setDeleteTarget(null)}>{t('admin.library_ui.cancel')}</Button>
          <Button variant="danger" isLoading={isDeleting} onClick={() => void confirmDelete()}>{t('admin.library_ui.delete')}</Button></div>
      </Modal>
    </div>
  );
};
