import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/shared/components/ui/Input";
import { isGoogleMapsApiKeyConfigured, loadGooglePlaces } from "@/shared/lib/googleMapsLoader";
import { subscribeToGoogleAddressAutocomplete } from "./googleAddressAutocompleteEvents";
import "./GoogleAddressAutocomplete.css";

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string | null;
  label: string;
  placeholder?: string;
  id?: string;
  name?: string;
  unavailableMessage?: string;
}

export const GoogleAddressAutocomplete: React.FC<Props> = ({
  value,
  onChange,
  disabled = false,
  error,
  label,
  placeholder,
  id,
  name = "address",
  unavailableMessage,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const propsRef = useRef({ disabled, error, id, label, name, placeholder });
  const hasApiKey = isGoogleMapsApiKeyConfigured();
  const [placesLibrary, setPlacesLibrary] = useState<google.maps.PlacesLibrary | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [widgetFailed, setWidgetFailed] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
    valueRef.current = value;
    propsRef.current = { disabled, error, id, label, name, placeholder };
  }, [value, onChange, disabled, error, id, label, name, placeholder]);

  useEffect(() => {
    if (!hasApiKey) return;
    let active = true;
    void loadGooglePlaces().then(library => {
      if (active) setPlacesLibrary(library);
    }).catch(() => {
      if (active) setLoadFailed(true);
    });
    return () => { active = false; };
  }, [hasApiKey]);

  useEffect(() => {
    if (!placesLibrary || !hostRef.current || widgetFailed) return;
    const host = hostRef.current;
    const props = propsRef.current;
    const element = new placesLibrary.PlaceAutocompleteElement({
      value: valueRef.current,
      placeholder: props.placeholder ?? "",
      name: props.name,
      disabled: props.disabled,
      description: props.label,
      includedRegionCodes: ["vn"],
      requestedLanguage: "vi",
      requestedRegion: "VN",
    });
    element.id = props.id ?? "family-member-address";
    element.setAttribute("aria-label", props.label);
    if (props.error) element.setAttribute("aria-invalid", "true");
    cleanupRef.current = subscribeToGoogleAddressAutocomplete(
      element,
      address => onChangeRef.current(address),
      () => setWidgetFailed(true),
    );
    elementRef.current = element;
    host.replaceChildren(element);
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      elementRef.current = null;
      element.remove();
      host.replaceChildren();
    };
  }, [placesLibrary, widgetFailed]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    element.id = id ?? "family-member-address";
    element.value = value;
    element.disabled = disabled;
    element.placeholder = placeholder ?? "";
    element.name = name;
    element.description = error ? `${label}. ${error}` : label;
    if (error) element.setAttribute("aria-invalid", "true");
    else element.removeAttribute("aria-invalid");
  }, [value, disabled, placeholder, name, label, error, id]);

  const showManualInput = !hasApiKey || loadFailed || widgetFailed || !placesLibrary;
  return (
    <div className="google-address-autocomplete">
      {showManualInput ? (
        <Input
          id={id}
          name={name}
          label={label}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          error={error}
          helperText={(loadFailed || widgetFailed) ? unavailableMessage : undefined}
          onChange={event => onChange(event.target.value)}
        />
      ) : (
        <div className="google-address-autocomplete__google-field">
          <label className="google-address-autocomplete__label" htmlFor={id ?? "family-member-address"}>{label}</label>
          <div ref={hostRef} className={`google-address-autocomplete__widget${error ? " is-invalid" : ""}`} />
          {error && <p className="google-address-autocomplete__error">{error}</p>}
        </div>
      )}
    </div>
  );
};
