export interface MapsPlacesRuntime<TPlaces> {
  importLibrary: (library: "places") => Promise<TPlaces>;
}

export interface MapsScript extends Node {
  async: boolean;
  src: string;
  onload: (() => void) | null;
  onerror: (() => void) | null;
  remove: () => void;
}

export interface MapsScriptDocument {
  createElement: (name: "script") => MapsScript;
  head: { appendChild: (script: MapsScript) => unknown };
}

/** A per-app singleton factory that deduplicates script and Places library requests. */
export function createGooglePlacesLoader<TPlaces>(options: {
  apiKey?: string;
  getRuntime: () => MapsPlacesRuntime<TPlaces> | null | undefined;
  document: MapsScriptDocument;
}): () => Promise<TPlaces> {
  const apiKey = options.apiKey?.trim() ?? "";
  let scriptPromise: Promise<void> | null = null;
  let placesPromise: Promise<TPlaces> | null = null;

  const loadScript = (): Promise<void> => {
    if (options.getRuntime()) return Promise.resolve();
    if (scriptPromise) return scriptPromise;
    if (!apiKey) return Promise.reject(new Error("Google Maps API key is missing."));

    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = options.document.createElement("script");
      script.async = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async&language=vi&region=VN`;
      script.onload = () => resolve();
      script.onerror = () => {
        script.remove();
        scriptPromise = null;
        reject(new Error("Google Maps JavaScript API could not load."));
      };
      options.document.head.appendChild(script);
    });
    return scriptPromise;
  };

  return () => {
    if (!apiKey) return Promise.reject(new Error("Google Maps API key is missing."));
    if (!placesPromise) {
      placesPromise = loadScript()
        .then(() => {
          const runtime = options.getRuntime();
          if (!runtime) throw new Error("Google Maps JavaScript API did not initialize.");
          return runtime.importLibrary("places");
        })
        .catch(error => {
          placesPromise = null;
          throw error;
        });
    }
    return placesPromise;
  };
}
