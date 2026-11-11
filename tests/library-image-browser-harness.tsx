import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LibraryImage } from '../src/features/admin/components/family-tree/LibraryImage';
import { PhotoLightboxModal } from '../src/features/admin/components/family-tree/PhotoLightboxModal';
import { LibraryTab } from '../src/features/admin/components/family-tree/LibraryTab';
import type { LibraryPhoto } from '../src/features/admin/components/family-tree/types';
import '../src/shared/i18n';

export function mountImageFixture(element: HTMLElement, initial: LibraryPhoto) {
  const root = createRoot(element);
  let photo = initial;
  let open = false;
  let revision = 0;
  const render = () => root.render(<StrictMode>
    <LibraryImage photoId={photo.id} url={photo.url} driveFileId={photo.driveFileId}
      variant="thumbnail" alt={'Gallery ' + revision} className="w-40 h-40" />
    <PhotoLightboxModal photo={open ? photo : null} onClose={() => { open = false; render(); }} />
  </StrictMode>);
  render();
  return {
    rerender() { revision++; render(); },
    change(update: Partial<LibraryPhoto>) { photo = { ...photo, ...update }; render(); },
    open() { open = true; render(); },
    close() { open = false; render(); },
    cleanup() { root.unmount(); },
  };
}

export function mountLibraryFixture(element: HTMLElement) {
  const root = createRoot(element);
  root.render(<StrictMode><LibraryTab showToast={() => undefined} /></StrictMode>);
  return { cleanup() { root.unmount(); } };
}
