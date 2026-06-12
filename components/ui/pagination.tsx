"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = [10, 30, 50, 0] as const;

export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

export function paginate<T>(rows: T[], page: number, pageSize: number) {
  if (!pageSize || pageSize <= 0) return rows;
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function Pagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  className?: string;
}) {
  const isShowAll = !pageSize || pageSize <= 0;
  const totalPages = isShowAll ? 1 : Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const firstIndex = total === 0 ? 0 : (safePage - 1) * (isShowAll ? total : pageSize) + 1;
  const lastIndex = isShowAll ? total : Math.min(safePage * pageSize, total);

  return (
    <div
      className={
        "flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between " +
        (className ?? "")
      }
    >
      <div className="flex items-center gap-2">
        <span>Hiển thị</span>
        <Select
          value={String(pageSize ?? 0)}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="h-8 w-auto px-2"
          aria-label="Số dòng mỗi trang"
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 0 ? "Tất cả" : option}
            </option>
          ))}
        </Select>
        <span>
          {total === 0
            ? "Không có dòng"
            : isShowAll
              ? `${total} dòng`
              : `${firstIndex} - ${lastIndex} / ${total} dòng`}
        </span>
      </div>
      {isShowAll ? null : (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            aria-label="Trang trước"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-[64px] text-center text-sm font-medium text-slate-800">
            {safePage} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            aria-label="Trang sau"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export { PAGE_SIZE_OPTIONS };
