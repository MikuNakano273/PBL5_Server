import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { messages, type Language, type MessageKey } from "./messages";

type I18n = { language: Language; setLanguage: (value: Language) => void; t: (key: MessageKey) => string };
const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, updateLanguage] = useState<Language>(() => localStorage.getItem("admin_language") === "en" ? "en" : "vi");
  const value = useMemo(() => ({
    language,
    setLanguage: (next: Language) => {
      localStorage.setItem("admin_language", next);
      updateLanguage(next);
    },
    t: (key: MessageKey) => messages[language][key],
  }), [language]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("I18nProvider is missing");
  return value;
}
