import React, { useEffect, useState } from "react";
import { BookOpen, Plus, Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { Button, Modal, Select } from "@/shared/components/ui";
import { featureSuccessKeys, getFeatureErrorKey } from '../../services/featureMessages';
import { libraryService, type LibraryAlbum, type LibraryPhotoMetadata, type LibraryCategory } from '../../services/libraryService';
import { type LibraryPhoto } from "./types";
import { PhotoLightboxModal } from "./PhotoLightboxModal";
import { LibraryAlbumModal } from './LibraryAlbumModal';
import { LibraryUploadModal } from './LibraryUploadModal';
import { LibraryPhotoEditModal } from './LibraryPhotoEditModal';
import { libraryFieldClass, libraryCategoryLabel } from './LibraryPhotoFormFields';
import { LibraryCategoryModal } from './LibraryCategoryModal';
import { LibraryImage } from './LibraryImage';

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
        setCategories(currentCategories); setCategoryLoading(false);
        setLibraryCategory(current => current === 'all' || currentCategories.some(category => category.slug === current) ? current : 'all');
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
    ...categories.map(category => ({ id: category.id, slug: category.slug, label: libraryCategoryLabel(category, t) }))];

  const filteredPhotos = libraryPhotos.filter(
    (photo) => libraryCategory === "all" || photo.category === libraryCategory
  );

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 custom-scrollbar space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-secondary-bg border border-custom-border p-6 rounded-2xl shadow-sm">
        <div>
          <h3 className="text-xl font-bold text-primary-text mb-1 flex items-center gap-2">
            <BookOpen className="text-accent" size={20} />
            {t("admin.library_title", { defaultValue: "Thư Viện & Kỷ Vật Dòng Tộc" })}
          </h3>
          <p className="text-secondary-text text-sm">
            {t("admin.library_desc", { defaultValue: "Nơi lưu giữ gia phả cổ, sắc phong, văn tự và tư liệu lịch sử dòng họ." })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
        <Button variant="secondary" leftIcon={<Plus size={16} />} onClick={() => setAlbumDialog('create')}>
          {t('admin.library_ui.create_album')}
        </Button>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          disabled={isLoading || categoryLoading || albums.length === 0 || categories.length === 0}
          onClick={() => setUploadOpen(true)}
        >
          {t('admin.library_ui.upload')}
        </Button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <Select aria-label={t('admin.library_ui.album_filter')}
          containerClassName="!w-auto"
          className={`${libraryFieldClass} max-w-full min-w-44 !py-0 !pl-4 !pr-10 border-0`}
          value={selectedAlbum} disabled={isLoading} onChange={event => setSelectedAlbum(event.target.value === 'all' ? 'all' : Number(event.target.value))}>
          <option value="all">{t('admin.library_ui.all_albums')}</option>
          {albums.map(album => <option key={album.id} value={album.id}>{album.name}</option>)}
        </Select>
        {activeAlbum && <>
          <button className="p-2 text-secondary-text hover:text-accent cursor-pointer" title={t('admin.library_ui.edit_album')}
            aria-label={t('admin.library_ui.edit_album')} onClick={() => setAlbumDialog(activeAlbum)}><Pencil size={16} /></button>
          <button className="p-2 text-secondary-text hover:text-error cursor-pointer" title={t('admin.library_ui.delete_album')}
            aria-label={t('admin.library_ui.delete_album')} onClick={() => requestDelete({ kind: 'album', id: activeAlbum.id, name: activeAlbum.name })}><Trash2 size={16} /></button>
        </>}
        <Button variant="secondary" leftIcon={<Plus size={16} />} onClick={() => setCategoryDialog('create')}>{t('admin.library_ui.create_category')}</Button>
        {activeCategory && !activeCategory.isDefault && <>
          <button aria-label={t('admin.library_ui.edit_category')} title={t('admin.library_ui.edit_category')}
            className="p-2 text-secondary-text hover:text-accent cursor-pointer"
            onClick={() => setCategoryDialog(activeCategory)}><Pencil size={16} /></button>
          <button aria-label={t('admin.library_ui.delete_category')}
          title={t('admin.library_ui.delete_category')} className="p-2 text-secondary-text hover:text-error cursor-pointer"
          onClick={() => requestDelete({ kind: 'category', id: activeCategory.id, name: activeCategory.name, slug: activeCategory.slug })}><Trash2 size={16} /></button></>}
        {categoryFilters.map((cat) => (
          <button
            key={cat.id}
            aria-pressed={libraryCategory === cat.slug}
            onClick={() => setLibraryCategory(cat.slug)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer shrink-0 ${
              libraryCategory === cat.slug
                ? "bg-accent text-primary-bg border-accent shadow-sm"
                : "bg-secondary-bg border-custom-border text-secondary-text hover:text-primary-text hover:bg-primary-bg"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      {isLoading && <div role="status" className="flex items-center justify-center gap-2 py-12 text-secondary-text"><Loader2 className="animate-spin" size={20} />{t('admin.library_ui.loading')}</div>}
      {!isLoading && error && <div role="alert" className="p-6 text-center rounded-2xl border border-custom-border bg-secondary-bg space-y-3">
        <p className="text-error">{t(error)}</p><Button variant="secondary" onClick={refresh}>{t('admin.library_ui.retry')}</Button>
      </div>}
      {!isLoading && !error && filteredPhotos.length === 0 && <p className="py-12 text-center text-secondary-text">
        {t(libraryPhotos.length === 0 ? 'admin.library_ui.empty' : 'admin.library_ui.no_matches')}
      </p>}
      <div style={{ display: isLoading || error ? "none" : undefined }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPhotos.map((photo) => (
          <div
            key={photo.id}
            role="button" tabIndex={0} aria-label={t("admin.view_detail") + ": " + photo.title}
            onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setPreviewPhoto(photo); } }}
            onClick={() => setPreviewPhoto(photo)}
            className="bg-secondary-bg border border-custom-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-accent/40 transition-all duration-300 flex flex-col group cursor-pointer"
          >
            <div className="relative aspect-video overflow-hidden bg-black/10">
              <LibraryImage photoId={photo.id} variant="thumbnail"
                url={photo.url} driveFileId={photo.driveFileId}
                alt={photo.title || t('admin.library_ui.photo_alt')}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <span className="text-white text-xs font-medium flex items-center gap-1.5">
                  <Eye size={14} /> {t('admin.library_ui.enlarge')}
                </span>
              </div>
              {photo.year && <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white font-bold text-[10px] border border-white/10">
                {photo.year}
              </span>}
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-primary-text text-base group-hover:text-accent transition-colors line-clamp-1 mb-1.5">
                  {photo.title}
                </h4>
                <p className="text-xs text-secondary-text line-clamp-2 leading-relaxed">
                  {photo.desc}
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-custom-border/60 flex items-center justify-between text-[11px] text-secondary-text">
                <span className="truncate max-w-[180px]">{photo.author}</span>
                <span className="text-accent font-semibold flex items-center gap-1">
                  <Eye size={13} /> {t("admin.view_detail", { defaultValue: "Xem ảnh" })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

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
        initialCategory={libraryCategory === 'all' ? categories.find(category => category.slug === 'photos')?.slug ?? categories[0]?.slug ?? '' : libraryCategory}
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
