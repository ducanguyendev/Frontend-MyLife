import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XCircle, ExternalLink } from "lucide-react";
import { type LibraryPhoto } from "./types";

interface PhotoLightboxModalProps {
  photo: LibraryPhoto | null;
  onClose: () => void;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  photo,
  onClose,
}) => {
  if (!photo) return null;

  return (
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
          className="relative w-full max-w-3xl bg-secondary-bg border border-custom-border rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col"
        >
          <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
            <img
              src={photo.url}
              alt={photo.title}
              className="max-h-full max-w-full object-contain"
            />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <XCircle size={24} />
            </button>
          </div>
          <div className="p-6 bg-secondary-bg">
            <div className="flex items-center justify-between gap-4 mb-2">
              <h4 className="text-xl font-bold text-primary-text">{photo.title}</h4>
              <span className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-bold text-xs">
                {photo.year}
              </span>
            </div>
            <p className="text-secondary-text text-sm leading-relaxed mb-4">{photo.desc}</p>
            <div className="flex items-center justify-between pt-4 border-t border-custom-border text-xs text-secondary-text">
              <span>{photo.author}</span>
              <button
                onClick={() => {
                  window.open(photo.url, "_blank");
                }}
                className="px-4 py-2 rounded-xl bg-accent text-primary-bg font-bold flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer text-xs"
              >
                <ExternalLink size={14} /> Mở ảnh gốc
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
