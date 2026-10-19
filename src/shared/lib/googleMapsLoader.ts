import { createGooglePlacesLoader } from "./googleMapsLoaderCore";

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ?? "";

const loadPlaces = createGooglePlacesLoader<google.maps.PlacesLibrary>({
  apiKey,
  getRuntime: () => window.google?.maps ? {
    importLibrary: async library => await window.google.maps.importLibrary(library) as google.maps.PlacesLibrary,
  } : null,
  document,
});

export const isGoogleMapsApiKeyConfigured = () => Boolean(apiKey);
export const loadGooglePlaces = loadPlaces;
