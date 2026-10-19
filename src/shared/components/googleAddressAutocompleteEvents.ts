export type AddressAutocompleteElement = Pick<google.maps.places.PlaceAutocompleteElement, "value" | "addEventListener" | "removeEventListener">;

export async function readSelectedGoogleAddress(
  event: google.maps.places.PlacePredictionSelectEvent,
): Promise<string | null> {
  try {
    const place = event.placePrediction.toPlace();
    await place.fetchFields({ fields: ["formattedAddress"] });
    return place.formattedAddress?.trim() || null;
  } catch {
    return null;
  }
}

/** Bridge the custom element's editable value and Place selection into normal form state. */
export function subscribeToGoogleAddressAutocomplete(
  element: AddressAutocompleteElement,
  onChange: (address: string) => void,
  onGoogleError: () => void,
): () => void {
  let active = true;
  let editRevision = 0;
  let selectionRevision = 0;

  const handleInput = () => {
    editRevision++;
    onChange(element.value);
  };
  const handleGoogleError = () => onGoogleError();
  const handleSelection = (event: google.maps.places.PlacePredictionSelectEvent) => {
    const requestRevision = ++selectionRevision;
    const valueRevision = editRevision;
    if (element.value) onChange(element.value);

    void readSelectedGoogleAddress(event).then(address => {
      if (active && requestRevision === selectionRevision && valueRevision === editRevision && address) onChange(address);
    });
  };

  element.addEventListener("input", handleInput);
  element.addEventListener("gmp-select", handleSelection);
  element.addEventListener("gmp-error", handleGoogleError);

  return () => {
    active = false;
    element.removeEventListener("input", handleInput);
    element.removeEventListener("gmp-select", handleSelection);
    element.removeEventListener("gmp-error", handleGoogleError);
  };
}
