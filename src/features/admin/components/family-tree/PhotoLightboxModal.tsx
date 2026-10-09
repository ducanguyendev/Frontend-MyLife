import React, { useEffect } from "react";
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from "framer-motion";
import { XCircle, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { useLanguage } from '@/shared/hooks/useLanguage';
import { type LibraryPhoto } from "./types";
import { LibraryImage, libraryOriginalUrl } from './LibraryImage';

interface PhotoLightboxModalProps {
  photo: LibraryPhoto | null;
  onClose: () => void;
  onEdit?: (photo: LibraryPhoto) => void;
  onDelete?: (photo: LibraryPhoto) => void;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  photo,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { t } = useLanguage();
  useEffect(() => {
    if (!photo) return;
    const overflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const keyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', keyDown);
    return () => { document.body.style.overflow = overflow; document.documentElement.style.overflow = htmlOverflow; window.removeEventListener('keydown', keyDown); };
  }, [photo, onClose]);
  if (!photo) return null;

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
        />

        {/* Content */}
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-3xl max-h-[90vh] bg-secondary-bg border border-custom-border rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col"
          role="dialog" aria-modal="true" aria-label={photo.title}
        >
          <div className="relative aspect-video max-h-[55vh] shrink-0 bg-black overflow-hidden flex items-center justify-center">
            <LibraryImage photoId={photo.id} variant="lightbox"
              url={photo.url} driveFileId={photo.driveFileId}
              alt={photo.title}
              className="max-h-full max-w-full object-contain"
            />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors cursor-pointer"
              aria-label={t('admin.library_ui.close')}
            >
              <XCircle size={24} />
            </button>
          </div>
          <div className="p-6 bg-secondary-bg min-h-0 overflow-y-auto">
            <div className="flex items-center justify-between gap-4 mb-2">
              <h4 className="text-xl font-bold text-primary-text min-w-0 break-words">{photo.title}</h4>
              {photo.year && <span className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-bold text-xs break-words">
                {photo.year}
              </span>}
            </div>
            <p className="text-secondary-text text-sm leading-relaxed mb-4 break-words">{photo.desc}</p>
            <div className="flex flex-wrap gap-3 items-center justify-between pt-4 border-t border-custom-border text-xs text-secondary-text">
              <span className="min-w-0 break-words">{photo.author}</span>
              <button
                onClick={() => {
                  window.open(libraryOriginalUrl(photo.url, photo.driveFileId), "_blank", "noopener,noreferrer");
                }}
                className="px-4 py-2 rounded-xl bg-accent text-primary-bg font-bold flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer text-xs"
              >
                <ExternalLink size={14} /> {t('admin.library_ui.open_original')}
              </button>
            </div>
            {(onEdit || onDelete) && <div className="flex justify-end gap-3 mt-4">
              {onEdit && <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-custom-border text-sm text-primary-text cursor-pointer hover:text-accent" onClick={() => onEdit(photo)}><Pencil size={14} />{t('admin.library_ui.edit_photo')}</button>}
              {onDelete && <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-custom-border text-sm text-error cursor-pointer" onClick={() => onDelete(photo)}><Trash2 size={14} />{t('admin.library_ui.delete')}</button>}
            </div>}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>, document.body
  );
};
