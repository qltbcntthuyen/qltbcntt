"use client";

import { Save } from "lucide-react";
import { useState, useTransition } from "react";

import { saveSystemConfigAction } from "@/app/actions/mutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { runTransitionAction } from "@/lib/utils";

export function SystemConfigClient({
  defaults,
}: {
  defaults: { ctsCanhBaoSoNgay: number };
}) {
  const [days, setDays] = useState(String(defaults.ctsCanhBaoSoNgay));
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    runTransitionAction(startTransition, async () => {
      const result = await saveSystemConfigAction({ cts_canh_bao_so_ngay: days });
      setMessage(result.message);
    });
  }

  return (
    <div className="space-y-4">
      {message ? (
        <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
          {message}
        </p>
      ) : null}

      <section className="admin-panel space-y-4 p-4">
        <div className="grid gap-2">
          <Label>Ngưỡng nhắc gia hạn chứng thư số (ngày)</Label>
          <Input
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(event) => setDays(event.target.value)}
            className="max-w-[160px]"
          />
          <p className="text-xs text-slate-500">
            Khi số ngày còn lại trước khi CTS hết hiệu lực &lt;= giá trị này, CTS được đánh dấu
            “Sắp hết hạn” trong dashboard và báo cáo. Mặc định 30, đề xuất 30 - 40 ngày.
          </p>
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={submit} disabled={isPending}>
            <Save className="size-4" />
            {isPending ? "Đang lưu..." : "Lưu cấu hình"}
          </Button>
        </div>
      </section>
    </div>
  );
}
