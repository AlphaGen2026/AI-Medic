import { useMemo, useState } from "react";
import { HeartPulse, Search, Check, Loader2, Plus, Ban } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  CHRONIC_CONDITIONS,
  MAX_CHRONIC,
  conditionLabel,
  readChronic,
  saveChronic,
} from "@/lib/chronicConditions";

interface Props {
  onChanged?: () => void;
}

const ChronicConditions = ({ onChanged }: Props) => {
  const { user } = useAuth();
  const initial = readChronic(user?.user_metadata);
  const [ids, setIds] = useState<string[]>(initial.ids);
  const [none, setNone] = useState(initial.none);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(initial.ids);
  const [draftNone, setDraftNone] = useState(initial.none);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = CHRONIC_CONDITIONS.filter((c) => c.label.toLowerCase().includes(q));
    return filtered.reduce<Record<string, typeof CHRONIC_CONDITIONS>>((acc, c) => {
      (acc[c.group] ||= []).push(c);
      return acc;
    }, {});
  }, [query]);

  const openDialog = () => {
    setDraft(ids);
    setDraftNone(none);
    setQuery("");
    setOpen(true);
  };

  const toggle = (id: string) => {
    setDraftNone(false);
    setDraft((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_CHRONIC) {
        toast.error(`Maksimum ${MAX_CHRONIC} ta kasallik tanlash mumkin`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveChronic(draft, draftNone);
      setIds(draftNone ? [] : draft);
      setNone(draftNone);
      setOpen(false);
      toast.success("Saqlandi");
      onChanged?.();
    } catch {
      toast.error("Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-card space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <HeartPulse size={18} className="text-primary" /> Surunkali kasalliklar
        </h3>
        <button
          onClick={openDialog}
          className="text-xs px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground font-medium flex items-center gap-1"
        >
          <Plus size={13} /> Tanlash
        </button>
      </div>

      {none || ids.length === 0 ? (
        <button onClick={openDialog} className="w-full flex flex-col items-center gap-1 py-6 rounded-xl bg-secondary/60 border border-dashed border-border">
          <span className="text-3xl font-display font-bold text-muted-foreground leading-none">—</span>
          <span className="text-xs text-muted-foreground">
            {none ? "Surunkali kasallik yo'q" : "Hali tanlanmagan"}
          </span>
        </button>
      ) : (
        <div className="flex flex-wrap gap-2">
          {ids.map((id) => (
            <span key={id} className="medical-badge bg-medical-teal-light text-medical-teal">
              {conditionLabel(id)}
            </span>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Eng ko'pi bilan {MAX_CHRONIC} ta kasallik tanlanadi. AI shu asosda kunlik rejim tuzadi.
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Surunkali kasalliklar ({draftNone ? 0 : draft.length}/{MAX_CHRONIC})</DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Qidirish..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <button
            onClick={() => { setDraftNone(true); setDraft([]); }}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm ${
              draftNone ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary text-muted-foreground"
            }`}
          >
            <Ban size={15} /> Surunkali kasalligim yo'q
          </button>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {Object.entries(groups).map(([group, items]) => (
              <div key={group}>
                <p className="text-xs font-semibold text-muted-foreground mb-2">{group}</p>
                <div className="grid gap-2">
                  {items.map((c) => {
                    const active = draft.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggle(c.id)}
                        className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-sm text-left ${
                          active ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary/60 text-foreground/80"
                        }`}
                      >
                        {c.label}
                        {active && <Check size={15} className="text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {Object.keys(groups).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Topilmadi</p>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : "Saqlash"}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChronicConditions;
