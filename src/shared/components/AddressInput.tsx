import React from "react";
import { Input } from "@/shared/components/ui/Input";

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string | null;
  label: string;
  placeholder?: string;
  id?: string;
  name?: string;
}

/** Free-form address field; geocoding is handled asynchronously by the backend. */
export const AddressInput: React.FC<Props> = ({
  value,
  onChange,
  disabled = false,
  error,
  label,
  placeholder,
  id,
  name = "address",
}) => (
  <Input
    id={id}
    name={name}
    label={label}
    placeholder={placeholder}
    value={value}
    disabled={disabled}
    error={error}
    onChange={event => onChange(event.target.value)}
  />
);
