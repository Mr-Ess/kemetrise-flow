import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ar" | "en";

const STORAGE_KEY = "kemet-lang";

type I18nValue = {
  language: Lang;
  changeLanguage: (l: Lang) => void;
};

const I18nContext = createContext<I18nValue>({ language: "ar", changeLanguage: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Lang>("ar");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem(STORAGE_KEY) as Lang | null) : null;
    if (saved === "en" || saved === "ar") setLanguage(saved);
  }, []);

  const changeLanguage = useCallback((l: Lang) => {
    setLanguage(l);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, l);
  }, []);

  return <I18nContext.Provider value={{ language, changeLanguage }}>{children}</I18nContext.Provider>;
}

/** Drop-in replacement for react-i18next's useTranslation used by the ported pages. */
export function useTranslation() {
  const ctx = useContext(I18nContext);
  return {
    i18n: ctx,
    t: (key: string, fallback?: string) => fallback ?? key,
  };
}
