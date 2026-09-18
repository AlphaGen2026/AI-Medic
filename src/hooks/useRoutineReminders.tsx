import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  CATEGORY_LABEL,
  loadProgress,
  loadRoutine,
  minutesOf,
  todayKey,
} from "@/lib/chronicConditions";

const notifiedKey = (uid: string) => `routine-notified:${uid}:${todayKey()}`;

const readNotified = (uid: string): string[] => {
  try {
    return JSON.parse(localStorage.getItem(notifiedKey(uid)) || "[]");
  } catch {
    return [];
  }
};

const pushNotified = (uid: string, id: string) => {
  const list = readNotified(uid);
  if (!list.includes(id)) localStorage.setItem(notifiedKey(uid), JSON.stringify([...list, id]));
};

const showBrowserNotification = (title: string, body: string) => {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/favicon.png" });
  } catch {
    /* ignore */
  }
};

/** Kunlik rejimni real vaqtda kuzatib, vaqti kelgan qadamlar uchun eslatma yuboradi */
export const useRoutineReminders = () => {
  const { user } = useAuth();
  const running = useRef(false);

  useEffect(() => {
    if (!user) return;
    const uid = user.id;

    const tick = async () => {
      if (running.current) return;
      const routine = loadRoutine(uid);
      if (!routine || routine.steps.length === 0) return;

      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const done = loadProgress(uid);
      const notified = readNotified(uid);
      const pending: { id: string; title: string; message: string }[] = [];

      routine.steps.forEach((s) => {
        const id = `step:${s.time}`;
        const diff = nowMin - minutesOf(s.time);
        if (diff >= 0 && diff <= 30 && !notified.includes(id) && !done.includes(s.time)) {
          pending.push({
            id,
            title: `${s.time} — ${s.title}`,
            message: `${CATEGORY_LABEL[s.category]}: ${s.detail}`,
          });
        }
      });

      // Kunlik xulosa (22:00 dan keyin)
      if (nowMin >= 22 * 60 && !notified.includes("summary")) {
        const missed = routine.steps.filter((s) => !done.includes(s.time));
        pending.push({
          id: "summary",
          title: "Kunlik rejim xulosasi",
          message: missed.length === 0
            ? "Barcha qadamlar bajarildi. Ajoyib! 💚"
            : `Bugun ${missed.length} ta qadam o'tkazib yuborildi: ${missed.map((m) => m.title).join(", ")}`,
        });
      }

      if (pending.length === 0) return;
      running.current = true;
      try {
        for (const p of pending) {
          const { error } = await supabase.from("notifications").insert({
            user_id: uid,
            title: p.title,
            message: p.message,
            type: "routine",
            link: "profile",
          });
          if (!error) {
            pushNotified(uid, p.id);
            showBrowserNotification(p.title, p.message);
          }
        }
      } finally {
        running.current = false;
      }
    };

    tick();
    const interval = window.setInterval(tick, 60_000);
    return () => window.clearInterval(interval);
  }, [user]);
};

export default useRoutineReminders;
