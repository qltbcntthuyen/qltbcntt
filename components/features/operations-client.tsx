"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Plus, RotateCcw, Search, Trash2, Wrench } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import {
  deleteHandoverAction,
  deleteMaintenanceAction,
  saveHandoverAction,
  saveMaintenanceAction,
  type EntityInput,
} from "@/app/actions/mutations";
import { Button, buttonVariants } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Pagination, paginate } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MAINTENANCE_TYPES } from "@/lib/constants";
import type { HandoverItem, LookupData, MaintenanceItem } from "@/lib/data";
import { display, formatCurrency, formatDate, normalizeText, todayInputValue } from "@/lib/format";
import { cn } from "@/lib/utils";

type OperationMode = "ban-giao" | "bao-tri";

type OperationsData = {
  active: OperationMode;
  lookups: LookupData;
  handovers: HandoverItem[];
  maintenance: MaintenanceItem[];
};

const emptyHandover: EntityInput = {
  thiet_bi_id: "",
  nguoi_nhan_id: "",
  phong_ban_nhan_id: "",
  ngay_ban_giao: todayInputValue(),
  hinh_thuc: "Bàn giao sử dụng",
  noi_dung: "",
};

const emptyMaintenance: EntityInput = {
  thiet_bi_id: "",
  ngay_ghi_nhan: todayInputValue(),
  ngay_sua_chua: "",
  loai_xu_ly: "Bảo trì",
  mo_ta_loi: "",
  ket_qua_xu_ly: "",
  chi_phi: "",
  don_vi_sua_chua: "",
};

function handoverToInput(row: HandoverItem): EntityInput {
  return {
    id: row.id,
    thiet_bi_id: row.thiet_bi_id,
    nguoi_nhan_id: row.nguoi_nhan_id ?? "",
    phong_ban_nhan_id: row.phong_ban_nhan_id ?? "",
    ngay_ban_giao: row.ngay_ban_giao,
    hinh_thuc: row.hinh_thuc ?? "",
    noi_dung: row.noi_dung ?? "",
  };
}

function maintenanceToInput(row: MaintenanceItem): EntityInput {
  return {
    id: row.id,
    thiet_bi_id: row.thiet_bi_id,
    ngay_ghi_nhan: row.ngay_ghi_nhan,
    ngay_sua_chua: row.ngay_sua_chua ?? "",
    loai_xu_ly: row.loai_xu_ly ?? "",
    mo_ta_loi: row.mo_ta_loi ?? "",
    ket_qua_xu_ly: row.ket_qua_xu_ly ?? "",
    chi_phi: row.chi_phi ?? "",
    don_vi_sua_chua: row.don_vi_sua_chua ?? "",
  };
}

export function OperationsClient({ data }: { data: OperationsData }) {
  const router = useRouter();
  const [form, setForm] = useState<EntityInput>(
    data.active === "ban-giao" ? emptyHandover : emptyMaintenance
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteHandover, setDeleteHandover] = useState<HandoverItem | null>(null);
  const [deleteMaintenance, setDeleteMaintenance] = useState<MaintenanceItem | null>(null);
  const [filter, setFilter] = useState({ q: "", status: "all" });
  const [message, setMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [isPending, startTransition] = useTransition();

  const filteredHandovers = data.handovers.filter((row) => {
    const q = normalizeText(filter.q);
    const matchesText =
      !q ||
      [
        row.thiet_bi?.ma_thiet_bi,
        row.thiet_bi?.ten_thiet_bi,
        row.nguoi_nhan?.ho_ten,
        row.phong_ban_nhan?.ten_phong_ban,
        row.hinh_thuc,
        row.noi_dung,
      ].some((value) => normalizeText(String(value ?? "")).includes(q));
    return matchesText;
  });
  const filteredMaintenance = data.maintenance.filter((row) => {
    const q = normalizeText(filter.q);
    const matchesText =
      !q ||
      [
        row.thiet_bi?.ma_thiet_bi,
        row.thiet_bi?.ten_thiet_bi,
        row.loai_xu_ly,
        row.mo_ta_loi,
        row.ket_qua_xu_ly,
        row.don_vi_sua_chua,
      ].some((value) => normalizeText(String(value ?? "")).includes(q));
    if (!matchesText) return false;
    if (filter.status === "dang_xu_ly") return !row.ket_qua_xu_ly;
    if (filter.status === "da_xu_ly") return Boolean(row.ket_qua_xu_ly);
    return true;
  });

  const activeRows: Array<HandoverItem | MaintenanceItem> =
    data.active === "ban-giao" ? filteredHandovers : filteredMaintenance;
  const pageRows = paginate<HandoverItem | MaintenanceItem>(activeRows, page, pageSize);
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(activeRows.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);
  const baseIndex = pageSize > 0 ? (safePage - 1) * pageSize : 0;

  function setField(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    setMessage(null);
    setForm(data.active === "ban-giao" ? emptyHandover : emptyMaintenance);
    setDialogOpen(true);
  }

  function submitForm() {
    startTransition(async () => {
      const result =
        data.active === "ban-giao"
          ? await saveHandoverAction(form)
          : await saveMaintenanceAction(form);
      setMessage(result.message);
      if (result.ok) {
        setDialogOpen(false);
        router.refresh();
      }
    });
  }

  function confirmDelete() {
    startTransition(async () => {
      const result = deleteHandover
        ? await deleteHandoverAction(deleteHandover.id)
        : deleteMaintenance
          ? await deleteMaintenanceAction(deleteMaintenance.id)
          : null;
      if (!result) return;
      setMessage(result.message);
      setDeleteHandover(null);
      setDeleteMaintenance(null);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-md border border-border bg-white p-1">
          <Link
            href="/dashboard/ban-giao"
            className={cn(
              buttonVariants({ variant: data.active === "ban-giao" ? "default" : "ghost", size: "sm" }),
              "rounded-sm"
            )}
          >
            <ClipboardCheck className="size-4" />
            Bàn giao
          </Link>
          <Link
            href="/dashboard/bao-tri"
            className={cn(
              buttonVariants({ variant: data.active === "bao-tri" ? "default" : "ghost", size: "sm" }),
              "rounded-sm"
            )}
          >
            <Wrench className="size-4" />
            Bảo trì
          </Link>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="size-4" />
          {data.active === "ban-giao" ? "Lập bàn giao" : "Ghi nhận bảo trì"}
        </Button>
      </div>

      <section className="admin-panel p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_200px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={filter.q}
              onChange={(event) => setFilter((current) => ({ ...current, q: event.target.value }))}
              placeholder={
                data.active === "ban-giao"
                  ? "Tìm thiết bị, người nhận, phòng ban..."
                  : "Tìm thiết bị, lỗi, kết quả, đơn vị sửa..."
              }
              className="pl-9"
            />
          </div>
          {data.active === "bao-tri" ? (
            <Select
              value={filter.status}
              onChange={(event) => setFilter((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="dang_xu_ly">Đang xử lý</option>
              <option value="da_xu_ly">Đã xử lý</option>
            </Select>
          ) : (
            <span />
          )}
          <Button type="button" variant="outline" onClick={() => setFilter({ q: "", status: "all" })}>
            <RotateCcw className="size-4" />
            Đặt lại
          </Button>
        </div>
      </section>

      {message ? (
        <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
          {message}
        </p>
      ) : null}

      {data.active === "ban-giao" ? (
        <HandoverTable
          rows={pageRows as HandoverItem[]}
          baseIndex={baseIndex}
          onEdit={(row) => {
            setMessage(null);
            setForm(handoverToInput(row));
            setDialogOpen(true);
          }}
          onDelete={setDeleteHandover}
        />
      ) : (
        <MaintenanceTable
          rows={pageRows as MaintenanceItem[]}
          baseIndex={baseIndex}
          onEdit={(row) => {
            setMessage(null);
            setForm(maintenanceToInput(row));
            setDialogOpen(true);
          }}
          onDelete={setDeleteMaintenance}
        />
      )}

      <Pagination
        total={activeRows.length}
        page={safePage}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      <Modal
        open={dialogOpen}
        title={
          form.id
            ? data.active === "ban-giao"
              ? "Cập nhật bàn giao"
              : "Cập nhật bảo trì"
            : data.active === "ban-giao"
              ? "Lập bàn giao"
              : "Ghi nhận bảo trì"
        }
        description={
          data.active === "ban-giao"
            ? "Chọn thiết bị, người nhận và mô tả tình trạng thiết bị bàn giao."
            : "Ghi nhận lỗi, phương án xử lý, chi phí và đơn vị sửa chữa nếu có."
        }
        onClose={() => setDialogOpen(false)}
        className="max-w-3xl"
      >
        {message ? (
          <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {message}
          </p>
        ) : null}
        {data.active === "ban-giao" ? (
          <HandoverForm form={form} lookups={data.lookups} setField={setField} />
        ) : (
          <MaintenanceForm form={form} lookups={data.lookups} setField={setField} />
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
            Hủy
          </Button>
          <Button type="button" onClick={submitForm} disabled={isPending}>
            {isPending ? "Đang lưu..." : "Lưu nghiệp vụ"}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteHandover || deleteMaintenance)}
        title="Xác nhận xóa nghiệp vụ"
        description="Bạn có chắc muốn xóa bản ghi này? Thao tác có thể ảnh hưởng đến lịch sử theo dõi thiết bị."
        confirmLabel="Xóa bản ghi"
        pending={isPending}
        onCancel={() => {
          setDeleteHandover(null);
          setDeleteMaintenance(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function HandoverTable({
  rows,
  baseIndex,
  onEdit,
  onDelete,
}: {
  rows: HandoverItem[];
  baseIndex: number;
  onEdit: (row: HandoverItem) => void;
  onDelete: (row: HandoverItem) => void;
}) {
  return (
    <section className="admin-panel overflow-hidden">
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[1080px]">
            <thead>
              <tr>
                <th className="w-12">STT</th>
                <th>Ngày bàn giao</th>
                <th>Thiết bị</th>
                <th>Người nhận</th>
                <th>Phòng ban nhận</th>
                <th>Hình thức</th>
                <th>Tình trạng thiết bị bàn giao</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id}>
                  <td className="text-slate-500">{baseIndex + index + 1}</td>
                  <td>{formatDate(row.ngay_ban_giao)}</td>
                  <td>
                    <Link
                      href={`/dashboard/thiet-bi/${row.thiet_bi_id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {row.thiet_bi?.ma_thiet_bi ?? row.thiet_bi_id} - {display(row.thiet_bi?.ten_thiet_bi)}
                    </Link>
                  </td>
                  <td>{display(row.nguoi_nhan?.ho_ten)}</td>
                  <td>{display(row.phong_ban_nhan?.ten_phong_ban)}</td>
                  <td>{display(row.hinh_thuc)}</td>
                  <td>{display(row.noi_dung)}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => onEdit(row)}>
                        Sửa
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(row)}>
                        <Trash2 className="size-4" />
                        Xóa
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-5">
          <EmptyState
            title="Chưa có lịch sử bàn giao"
            description="Lập bàn giao để theo dõi ai đang sử dụng thiết bị nào."
          />
        </div>
      )}
    </section>
  );
}

function MaintenanceTable({
  rows,
  baseIndex,
  onEdit,
  onDelete,
}: {
  rows: MaintenanceItem[];
  baseIndex: number;
  onEdit: (row: MaintenanceItem) => void;
  onDelete: (row: MaintenanceItem) => void;
}) {
  return (
    <section className="admin-panel overflow-hidden">
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[1180px]">
            <thead>
              <tr>
                <th className="w-12">STT</th>
                <th>Ngày ghi nhận</th>
                <th>Thiết bị</th>
                <th>Loại xử lý</th>
                <th>Mô tả lỗi</th>
                <th>Ngày sửa</th>
                <th>Kết quả</th>
                <th>Chi phí</th>
                <th>Đơn vị sửa chữa</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id}>
                  <td className="text-slate-500">{baseIndex + index + 1}</td>
                  <td>{formatDate(row.ngay_ghi_nhan)}</td>
                  <td>
                    <Link
                      href={`/dashboard/thiet-bi/${row.thiet_bi_id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {row.thiet_bi?.ma_thiet_bi ?? row.thiet_bi_id} - {display(row.thiet_bi?.ten_thiet_bi)}
                    </Link>
                  </td>
                  <td>{display(row.loai_xu_ly)}</td>
                  <td>{display(row.mo_ta_loi)}</td>
                  <td>{formatDate(row.ngay_sua_chua)}</td>
                  <td>{display(row.ket_qua_xu_ly)}</td>
                  <td>{formatCurrency(row.chi_phi)}</td>
                  <td>{display(row.don_vi_sua_chua)}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => onEdit(row)}>
                        Sửa
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(row)}>
                        <Trash2 className="size-4" />
                        Xóa
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-5">
          <EmptyState
            title="Chưa có bảo trì, sửa chữa"
            description="Ghi nhận lỗi hoặc bảo trì định kỳ để theo dõi xử lý."
          />
        </div>
      )}
    </section>
  );
}

function deviceOptions(lookups: LookupData): ComboboxOption[] {
  const staffMap = new Map(lookups.staff.map((item) => [item.id, item]));
  const departmentMap = new Map(lookups.departments.map((item) => [item.id, item]));
  const typeMap = new Map(lookups.deviceTypes.map((item) => [item.id, item]));
  return lookups.devices.map((device) => {
    const user = device.nguoi_su_dung_id ? staffMap.get(device.nguoi_su_dung_id) : null;
    const department = device.phong_ban_id ? departmentMap.get(device.phong_ban_id) : null;
    const type = typeMap.get(device.loai_thiet_bi_id);
    const descriptionParts = [
      type?.ten_loai,
      user?.ho_ten ?? "Chưa phân công",
      department?.ten_phong_ban ?? "—",
    ].filter(Boolean);
    return {
      value: String(device.id),
      label: `${device.ma_thiet_bi} - ${device.ten_thiet_bi}`,
      description: descriptionParts.join(" · "),
      searchText: [
        device.serial,
        type?.ten_loai,
        user?.ho_ten,
        department?.ten_phong_ban,
      ]
        .filter(Boolean)
        .join(" "),
    } satisfies ComboboxOption;
  });
}

function staffOptions(lookups: LookupData): ComboboxOption[] {
  const departmentMap = new Map(lookups.departments.map((item) => [item.id, item]));
  return lookups.staff.map((staff) => {
    const department = staff.phong_ban_id ? departmentMap.get(staff.phong_ban_id) : null;
    return {
      value: String(staff.id),
      label: staff.ho_ten,
      description: [staff.ten_dang_nhap, department?.ten_phong_ban].filter(Boolean).join(" · "),
      searchText: [staff.email, staff.ten_dang_nhap, department?.ten_phong_ban].filter(Boolean).join(" "),
    } satisfies ComboboxOption;
  });
}

function HandoverForm({
  form,
  lookups,
  setField,
}: {
  form: EntityInput;
  lookups: LookupData;
  setField: (key: string, value: string) => void;
}) {
  const devices = useMemo(() => deviceOptions(lookups), [lookups]);
  const staff = useMemo(() => staffOptions(lookups), [lookups]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Thiết bị" required className="md:col-span-2">
        <Combobox
          options={devices}
          value={String(form.thiet_bi_id ?? "")}
          onChange={(value) => setField("thiet_bi_id", value)}
          placeholder="Tìm theo mã, tên, người dùng, phòng ban..."
        />
      </Field>
      <Field label="Người nhận">
        <Combobox
          options={staff}
          value={String(form.nguoi_nhan_id ?? "")}
          onChange={(value) => setField("nguoi_nhan_id", value)}
          placeholder="Chọn nhân sự"
        />
      </Field>
      <Field label="Phòng ban nhận">
        <Select
          value={String(form.phong_ban_nhan_id ?? "")}
          onChange={(e) => setField("phong_ban_nhan_id", e.target.value)}
        >
          <option value="">Chưa chọn</option>
          {lookups.departments.map((item) => (
            <option key={item.id} value={item.id}>
              {item.ten_phong_ban}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Ngày bàn giao" required>
        <Input
          type="date"
          value={String(form.ngay_ban_giao ?? "")}
          onChange={(e) => setField("ngay_ban_giao", e.target.value)}
        />
      </Field>
      <Field label="Hình thức">
        <Input value={String(form.hinh_thuc ?? "")} onChange={(e) => setField("hinh_thuc", e.target.value)} />
      </Field>
      <Field label="Tình trạng thiết bị bàn giao" className="md:col-span-2">
        <Textarea
          value={String(form.noi_dung ?? "")}
          onChange={(e) => setField("noi_dung", e.target.value)}
          placeholder="Mô tả tình trạng thiết bị tại thời điểm bàn giao (ngoại quan, phụ kiện, cài đặt...)"
        />
      </Field>
    </div>
  );
}

function MaintenanceForm({
  form,
  lookups,
  setField,
}: {
  form: EntityInput;
  lookups: LookupData;
  setField: (key: string, value: string) => void;
}) {
  const devices = useMemo(() => deviceOptions(lookups), [lookups]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Thiết bị" required className="md:col-span-2">
        <Combobox
          options={devices}
          value={String(form.thiet_bi_id ?? "")}
          onChange={(value) => setField("thiet_bi_id", value)}
          placeholder="Tìm theo mã, tên, người dùng, phòng ban..."
        />
      </Field>
      <Field label="Ngày ghi nhận" required>
        <Input
          type="date"
          value={String(form.ngay_ghi_nhan ?? "")}
          onChange={(e) => setField("ngay_ghi_nhan", e.target.value)}
        />
      </Field>
      <Field label="Ngày sửa chữa">
        <Input
          type="date"
          value={String(form.ngay_sua_chua ?? "")}
          onChange={(e) => setField("ngay_sua_chua", e.target.value)}
        />
      </Field>
      <Field label="Loại xử lý">
        <Select value={String(form.loai_xu_ly ?? "")} onChange={(e) => setField("loai_xu_ly", e.target.value)}>
          <option value="">Chưa chọn</option>
          {MAINTENANCE_TYPES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Chi phí (VND)">
        <CurrencyInput
          value={String(form.chi_phi ?? "")}
          onValueChange={(value) => setField("chi_phi", value)}
        />
      </Field>
      <Field label="Đơn vị sửa chữa">
        <Input
          value={String(form.don_vi_sua_chua ?? "")}
          onChange={(e) => setField("don_vi_sua_chua", e.target.value)}
        />
      </Field>
      <Field label="Mô tả lỗi" className="md:col-span-2">
        <Textarea value={String(form.mo_ta_loi ?? "")} onChange={(e) => setField("mo_ta_loi", e.target.value)} />
      </Field>
      <Field label="Kết quả xử lý" className="md:col-span-2">
        <Textarea
          value={String(form.ket_qua_xu_ly ?? "")}
          onChange={(e) => setField("ket_qua_xu_ly", e.target.value)}
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label>
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
