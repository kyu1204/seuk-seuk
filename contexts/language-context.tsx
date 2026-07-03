"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { setLanguageCookie } from "@/app/actions/language-actions";
import koTranslations from "@/locales/ko";

// Define available languages
export type Language = "ko" | "en";

// Define the context type
type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: (
    key: string,
    fallbackOrParams?: string | Record<string, string | number>,
    params?: Record<string, string | number>
  ) => string;
};

// Create the context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: "ko",
  setLanguage: async () => { },
  t: (key, fallbackOrParams) => typeof fallbackOrParams === "string" ? fallbackOrParams : key,
});

// Translation data
// `ko` is the default locale and is bundled eagerly (imported statically
// above) to avoid key-flicker on first paint. `en` is fetched via a dynamic
// import on demand and cached at module scope so it only loads once.
let enTranslations: Record<string, string> | null = null;
let enTranslationsPromise: Promise<Record<string, string>> | null = null;

function loadEnTranslations(): Promise<Record<string, string>> {
  if (enTranslations) {
    return Promise.resolve(enTranslations);
  }
  if (!enTranslationsPromise) {
    enTranslationsPromise = import("@/locales/en").then((mod) => {
      enTranslations = mod.default;
      return enTranslations;
    });
  }
  return enTranslationsPromise;
}

// Resolve the active dictionary. Falls back to `ko` when `en` hasn't
// finished loading yet, so `t()` never throws or returns undefined text.
function getTranslations(language: Language): Record<string, string> {
  if (language === "en") {
    return enTranslations ?? koTranslations;
  }
  return koTranslations;
}

// Provider component
export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialize with Korean as default
  const [language, setLanguageState] = useState<Language>("ko");
  // Bumped once the async `en` dictionary finishes loading, purely to force
  // a re-render (the dictionary itself lives in module scope, not state).
  const [, setEnLoadTick] = useState(0);

  // Load saved language preference on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("seukSeukLanguage") as Language;
    const initialLanguage: Language =
      savedLanguage === "ko" || savedLanguage === "en" ? savedLanguage : "ko";

    if (savedLanguage === "ko" || savedLanguage === "en") {
      setLanguageState(savedLanguage);
    }

    if (initialLanguage === "en") {
      loadEnTranslations().then(() => setEnLoadTick((tick) => tick + 1));
    }

    // Only round-trip to the server when the cookie is out of sync with
    // localStorage — avoids an unconditional server action on every mount.
    const cookieMatch = document.cookie.match(
      /(?:^|;\s*)seukSeukLanguage=([^;]*)/
    );
    const cookieLanguage = cookieMatch
      ? decodeURIComponent(cookieMatch[1])
      : undefined;

    if (cookieLanguage !== initialLanguage) {
      setLanguageCookie(initialLanguage);
    }
  }, []);

  // Save language preference when it changes
  const setLanguage = async (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem("seukSeukLanguage", newLanguage);
    if (newLanguage === "en") {
      loadEnTranslations().then(() => setEnLoadTick((tick) => tick + 1));
    }
    // Update server-side cookie for metadata generation
    await setLanguageCookie(newLanguage);
  };

  // Translation function with parameter support
  // Supports: t(key), t(key, params), t(key, fallback), t(key, fallback, params)
  const t = (
    key: string,
    fallbackOrParams?: string | Record<string, string | number>,
    params?: Record<string, string | number>
  ): string => {
    let translation: string | undefined = getTranslations(language)[key];
    let actualParams: Record<string, string | number> | undefined;

    // Determine fallback and params based on argument types
    if (typeof fallbackOrParams === "string") {
      // t(key, fallback) or t(key, fallback, params)
      if (translation === undefined) {
        translation = fallbackOrParams;
      }
      actualParams = params;
    } else if (typeof fallbackOrParams === "object" && fallbackOrParams !== null) {
      // t(key, params)
      if (translation === undefined) {
        translation = key;
      }
      actualParams = fallbackOrParams;
    } else {
      // t(key)
      if (translation === undefined) {
        translation = key;
      }
    }

    // Replace parameters in the translation string. Existing copy uses both
    // {{param}} and {param}, so support both formats in a single pass.
    if (actualParams) {
      Object.keys(actualParams).forEach((param) => {
        const escapedParam = param.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        translation = translation?.replace(
          new RegExp(`\\{\\{${escapedParam}\\}\\}|\\{${escapedParam}\\}`, "g"),
          String(actualParams![param])
        ) ?? '';
      });
    }

    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook for using the language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
