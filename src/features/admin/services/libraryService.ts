import { apiClient } from '@/shared/api/apiClient';

export interface LibraryCategory { id: number; name: string; slug: string; isDefault: boolean }

export interface LibraryPhotoMetadata {
  title?: string | null;
  category: string;
  displayDate?: string | null;
  description?: string | null;
  author?: string | null;
}

export interface LibraryPhotoDto extends LibraryPhotoMetadata {
  id: number;
  driveFileId: string;
  url: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  caption: string | null;
  sortOrder: number;
  takenAt: string | null;
  createdAt: string;
}

export interface LibraryAlbum {
  id: number;
  name: string;
  description: string | null;
  photoCount: number;
  coverPhotoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryAlbumDetail extends LibraryAlbum { photos: LibraryPhotoDto[] }
export interface AlbumMetadata { name: string; description?: string | null }

export const libraryService = {
  getCategories: (signal?: AbortSignal) => apiClient.get<LibraryCategory[]>('/api/library/categories', { signal }),
  createCategory: (name: string) => apiClient.post<LibraryCategory>('/api/library/categories', { name }),
  deleteCategory: (id: number) => apiClient.delete<void>(`/api/library/categories/${id}`),
  getAlbums: (signal?: AbortSignal) => apiClient.get<LibraryAlbum[]>('/api/library/albums', { signal }),
  getAlbum: (id: number, signal?: AbortSignal) => apiClient.get<LibraryAlbumDetail>(`/api/library/albums/${id}`, { signal }),
  createAlbum: (metadata: AlbumMetadata) => apiClient.post<LibraryAlbum>('/api/library/albums', metadata),
  updateAlbum: (id: number, metadata: AlbumMetadata) => apiClient.put<LibraryAlbum>(`/api/library/albums/${id}`, metadata),
  deleteAlbum: (id: number) => apiClient.delete<void>(`/api/library/albums/${id}`),
  async uploadPhotos(albumId: number, files: File[], metadata: LibraryPhotoMetadata): Promise<LibraryPhotoDto[]> {
    const form = new FormData();
    files.forEach(file => form.append('files', file));
    form.append('category', metadata.category);
    for (const key of ['title', 'displayDate', 'description', 'author'] as const) {
      form.append(key, metadata[key]?.trim() ?? '');
    }
    return apiClient.post<LibraryPhotoDto[]>(`/api/library/albums/${albumId}/photos`, form);
  },
  updatePhoto: (id: number, metadata: LibraryPhotoMetadata) => apiClient.put<LibraryPhotoDto>(`/api/library/photos/${id}`, metadata),
  deletePhoto: (id: number) => apiClient.delete<void>(`/api/library/photos/${id}`),
};
