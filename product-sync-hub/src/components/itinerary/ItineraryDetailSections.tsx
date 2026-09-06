import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">{children}</h2>;
}

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</Label>
      {children}
    </div>
  );
}

export function DetailSection<T extends Record<string, string>>({
  title,
  subtitle,
  addLabel,
  icon: Icon,
  accent,
  items,
  fields,
  onAdd,
  onRemove,
  onChange,
}: {
  title: string;
  subtitle: string;
  addLabel: string;
  icon: LucideIcon;
  accent: { border: string; bg: string; iconBg: string; btn: string };
  items: T[];
  fields: { key: keyof T; label: string; placeholder?: string; type?: string; className?: string }[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, key: keyof T, value: string) => void;
}) {
  const itemLabel = title.replace(/ Details$/, "");

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <SectionLabel>{title}</SectionLabel>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>
        <Button type="button" onClick={onAdd} size="sm" variant="outline" className={cn("rounded-xl gap-1.5 w-full sm:w-auto", accent.btn)}>
          <Plus className="w-4 h-4" /> {addLabel}
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <Card key={index} className={cn("p-4 sm:p-5 rounded-2xl shadow-sm", accent.border, accent.bg)}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", accent.iconBg)}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold text-slate-800">
                  {itemLabel} {index + 1}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemove(index)}
                className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {fields.map((f) => (
                <Field key={String(f.key)} label={f.label} className={f.className}>
                  <Input
                    type={f.type || "text"}
                    placeholder={f.placeholder}
                    className="h-11 rounded-xl bg-white"
                    value={item[f.key] ?? ""}
                    onChange={(e) => onChange(index, f.key, e.target.value)}
                  />
                </Field>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
