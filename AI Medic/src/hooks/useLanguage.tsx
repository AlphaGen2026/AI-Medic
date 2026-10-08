import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { translations, Lang } from "@/i18n/translations";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

// Keep a single context instance across hot reloads so consumers never lose the provider.
const g = globalThis as unknown as { __mediLangCtx?: React.Context<LanguageContextType | undefined> };
const LanguageContext = g.__mediLangCtx ?? (g.__mediLangCtx = createContext<LanguageContextType | undefined>(undefined));

const fallbackLang = (): Lang => {
  const saved = typeof localStorage !== "undefined" ? localStorage.getItem("medi-lang") : null;
  return saved === "ru" || saved === "en" ? saved : "uz";
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (ctx) return ctx;
  const lang = fallbackLang();
  return {
    lang,
    setLang: (l: Lang) => { localStorage.setItem("medi-lang", l); window.location.reload(); },
    t: (key: string) => translations[lang]?.[key] || translations["uz"]?.[key] || key,
  };
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("medi-lang");
    return saved === "ru" || saved === "en" ? saved : "uz";
  });

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("medi-lang", l);
  }, []);

  const t = useCallback((key: string) => {
    return translations[lang]?.[key] || translations["uz"]?.[key] || key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
