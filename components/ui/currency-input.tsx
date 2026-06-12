"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";

function formatVN(value: string) {
  if (!value) return "";
  // chi giu lai chu so
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return "";
  // chen dau cham phan nghin
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function unformat(value: string) {
  return value.replace(/[^\d]/g, "");
}

/**
 * Input chi nhan so nguyen, format theo locale vi-VN voi dau "." la phan nghin.
 * `value` truyen vao la chuoi so thuan (vi du "1500000"); component se hien thi "1.500.000".
 */
export function CurrencyInput({
  value,
  onValueChange,
  placeholder,
  ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: string | number | null | undefined;
  onValueChange: (rawDigits: string) => void;
}) {
  const display = React.useMemo(() => formatVN(String(value ?? "")), [value]);

  return (
    <Input
      inputMode="numeric"
      autoComplete="off"
      value={display}
      placeholder={placeholder ?? "0"}
      onChange={(event) => {
        const next = unformat(event.target.value);
        onValueChange(next);
      }}
      {...rest}
    />
  );
}
