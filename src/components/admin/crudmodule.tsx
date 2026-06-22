import { useMemo, useState, type ReactNode } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select";
  options?: { value: string; label: string }[];
}

export interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface FilterDef {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface CrudModuleProps<T extends { id: string }> {
  title: string;
  items: T[];
  fields: FieldDef[];
  columns: ColumnDef<T>[];
  searchKeys: (keyof T)[];
  filter?: FilterDef;
  globalQuery?: string;
  onCreate: (data: Record<string, string>) => void;
  onUpdate: (id: string, data: Record<string, string>) => void;
  onDelete: (id: string) => void;
}

const PAGE_SIZE = 8;

export function CrudModule<T extends { id: string }>({
  title,
  items,
  fields,
  columns,
  searchKeys,
  filter,
  globalQuery = "",
  onCreate,
  onUpdate,
  onDelete,
}: CrudModuleProps<T>) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [filterVal, setFilterVal] = useState("all");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const search = (query || globalQuery).toLowerCase();

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const matchesSearch =
        !search ||
        searchKeys.some((k) =>
          String(it[k] ?? "").toLowerCase().includes(search),
        );
      const matchesFilter =
        !filter || filterVal === "all" || String((it as Record<string, unknown>)[filter.key]) === filterVal;
      return matchesSearch && matchesFilter;
    });
  }, [items, search, searchKeys, filter, filterVal]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const rows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    const init: Record<string, string> = {};
    fields.forEach((f) => (init[f.key] = f.type === "select" ? f.options?.[0]?.value ?? "" : ""));
    setForm(init);
    setOpen(true);
  };

  const openEdit = (item: T) => {
    setEditing(item);
    const init: Record<string, string> = {};
    fields.forEach((f) => (init[f.key] = String((item as Record<string, unknown>)[f.key] ?? "")));
    setForm(init);
    setOpen(true);
  };

  const submit = () => {
    if (editing) {
      onUpdate(editing.id, form);
      toast.success(`${title} — ${t("admin.edit")} ✓`);
    } else {
      onCreate(form);
      toast.success(`${title} — ${t("admin.add")} ✓`);
    }
    setOpen(false);
  };

  const remove = (item: T) => {
    onDelete(item.id);
    toast.success(`${title} — ${t("admin.delete")} ✓`);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder={t("admin.search")}
            className="pl-9"
          />
        </div>
        {filter && (
          <Select
            value={filterVal}
            onValueChange={(v) => {
              setFilterVal(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{filter.label}</SelectItem>
              {filter.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button variant="gold" onClick={openCreate}>
          <Plus className="size-4" /> {t("admin.add")}
        </Button>
      </div>

      <div className="glass overflow-x-auto rounded-2xl border border-border/60">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              {columns.map((c) => (
                <th key={c.key} className={`p-4 ${c.className ?? ""}`}>
                  {c.label}
                </th>
              ))}
              <th className="p-4 text-right">{t("admin.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-b border-border/40 last:border-0">
                {columns.map((c) => (
                  <td key={c.key} className={`p-4 ${c.className ?? ""}`}>
                    {c.render ? c.render(item) : String((item as Record<string, unknown>)[c.key] ?? "")}
                  </td>
                ))}
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(item)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(item)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="p-8 text-center text-muted-foreground">
                  {t("admin.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-end gap-3 text-sm">
          <span className="text-muted-foreground">
            {current + 1} / {pageCount}
          </span>
          <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>
            {t("admin.prev")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={current >= pageCount - 1}
            onClick={() => setPage(current + 1)}
          >
            {t("admin.next")}
          </Button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("admin.edit") : t("admin.add")} — {title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {fields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label>{f.label}</Label>
                {f.type === "textarea" ? (
                  <Textarea
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                ) : f.type === "select" ? (
                  <Select
                    value={form[f.key] ?? ""}
                    onValueChange={(v) => setForm({ ...form, [f.key]: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options?.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={f.type === "number" ? "number" : "text"}
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("admin.cancel")}
            </Button>
            <Button variant="gold" onClick={submit}>
              {t("admin.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
