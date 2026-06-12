"use client";

import { ChevronDown, Search } from "lucide-react";
import * as React from "react";

import { Input } from "@/components/ui/input";
import { normalizeText } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ComboboxOption = {
  value: string;
  label: string;
  description?: string;
  searchText?: string;
};

/**
 * Lightweight searchable combobox built on a text input + popover list.
 * Khong dung Base UI Combobox de tranh phu thuoc detail API; phu hop voi nhu cau:
 * loc theo tu khoa, hien thi description (nguoi dung, phong ban) ben canh.
 */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Chọn",
  emptyText = "Không có kết quả phù hợp",
  className,
  inputClassName,
  disabled,
}: {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selected = options.find((option) => option.value === value);

  const filtered = React.useMemo(() => {
    const term = normalizeText(query);
    if (!term) return options;
    return options.filter((option) => {
      const haystack = normalizeText(`${option.label} ${option.description ?? ""} ${option.searchText ?? ""}`);
      return haystack.includes(term);
    });
  }, [options, query]);

  React.useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target as Node)) return;
      setOpen(false);
      setQuery("");
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function selectValue(next: string) {
    onChange(next);
    setOpen(false);
    setQuery("");
  }

  function togglePopover() {
    setOpen((current) => {
      if (current) {
        setQuery("");
        return false;
      }
      return true;
    });
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-white px-3 text-left text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
          inputClassName
        )}
        onClick={togglePopover}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={cn("truncate", !selected && "text-slate-400")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className="size-4 text-slate-400" />
      </button>

      {open ? (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-border bg-white shadow-lg">
          <div className="relative border-b border-border bg-slate-50">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo mã, tên, phòng ban..."
              className="h-9 border-0 bg-transparent pl-9 focus:border-0 focus:ring-0"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">{emptyText}</li>
            ) : (
              filtered.map((option) => {
                const active = option.value === value;
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      onClick={() => selectValue(option.value)}
                      className={cn(
                        "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition hover:bg-blue-50",
                        active && "bg-blue-50/80"
                      )}
                    >
                      <span className="font-medium text-slate-900">{option.label}</span>
                      {option.description ? (
                        <span className="text-xs text-slate-500">{option.description}</span>
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          {value ? (
            <button
              type="button"
              className="block w-full border-t border-border px-3 py-2 text-left text-xs text-slate-500 hover:bg-slate-50"
              onClick={() => selectValue("")}
            >
              Bỏ chọn
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
