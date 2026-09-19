import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CONDITIONS } from "./NutritionSafety";
import { RELATIONS, ageToGroup, AGE_GROUP_LABEL, parseAge, type FamilyMember } from "@/lib/nutritionProfile";

export const readFamily = (meta: Record<string, unknown> | undefined): FamilyMember[] => {
  const raw = meta?.family;
  if (!Array.isArray(raw)) return [];
  return raw.filter((m) => m && typeof m === "object") as FamilyMember[];
};

const FamilyManager = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState<string>(RELATIONS[0]);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"erkak" | "ayol">("erkak");
  const [conditions, setConditions] = useState<string[]>([]);

  useEffect(() => {
    setMembers(readFamily(user?.user_metadata));
  }, [user]);

  const persist = async (next: FamilyMember[]) => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { family: next } });
    setSaving(false);
    if (error) {
      toast.error("Saqlashda xatolik: " + error.message);
      return false;
    }
    setMembers(next);
    return true;
  };

  const add = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) { toast.error("Ism kamida 2 ta belgidan iborat bo'lsin"); return; }
    if (trimmed.length > 60) { toast.error("Ism juda uzun"); return; }
    const parsed = parseAge(age);
    if (age && parsed === null) { toast.error("Yoshni 0–120 oralig'ida kiriting"); return; }
    if (members.length >= 12) { toast.error("Ko'pi bilan 12 ta a'zo qo'shish mumkin"); return; }

    const member: FamilyMember = {
      id: crypto.randomUUID(),
      name: trimmed,
      relation,
      age: parsed,
      gender,
      conditions,
    };
    if (await persist([...members, member])) {
      toast.success(`${trimmed} oilaga qo'shildi`);
      setName(""); setAge(""); setGender("erkak"); setConditions([]); setRelation(RELATIONS[0]); setOpen(false);
    }
  };

  const remove = async (id: string) => {
    if (await persist(members.filter((m) => m.id !== id))) toast.success("O'chirildi");
  };

  const toggleCondition = (id: string) =>
    setConditions((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-card space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-foreground">Oilam</h3>
            <p className="text-xs text-muted-foreground">Oila a'zolari uchun ham ratsion tavsiyalari beriladi</p>
          </div>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="px-3 py-2 rounded-xl text-xs font-semibold gradient-primary text-primary-foreground flex items-center gap-1 shadow-glow"
        >
          <Plus size={14} /> A'zo qo'shish
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-secondary/60 rounded-xl p-4 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  placeholder="Ism"
                  className="px-3 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <select
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {RELATIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Yoshi"
                  className="px-3 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as "erkak" | "ayol")}
                  className="px-3 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="erkak">Erkak</option>
                  <option value="ayol">Ayol</option>
                </select>
              </div>

              {parseAge(age) !== null && (
                <p className="text-xs text-primary">
                  Avtomatik aniqlandi: {AGE_GROUP_LABEL[ageToGroup(parseAge(age))]}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCondition(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      conditions.includes(c.id)
                        ? "bg-medical-red-light text-medical-red border-medical-red/30"
                        : "bg-card text-muted-foreground border-border"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <button
                onClick={add}
                disabled={saving}
                className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Saqlash
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">Hozircha oila a'zolari qo'shilmagan.</p>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 bg-secondary rounded-xl px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {m.name} <span className="text-muted-foreground font-normal">· {m.relation}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {m.gender === "ayol" ? "Ayol" : "Erkak"}
                  {" · "}
                  {m.age != null ? `${m.age} yosh · ${AGE_GROUP_LABEL[ageToGroup(m.age)]}` : "Yoshi ko'rsatilmagan"}
                  {m.conditions?.length ? ` · ${m.conditions.length} ta holat` : ""}
                </p>
              </div>
              <button
                onClick={() => remove(m.id)}
                className="text-medical-red hover:opacity-70 shrink-0"
                aria-label={`${m.name}ni o'chirish`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FamilyManager;
