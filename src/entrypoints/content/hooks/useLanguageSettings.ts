import { useState, useEffect } from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import type { LanguageCode } from "@/lib/types";

const DEFAULT_NATIVE: LanguageCode = "zh-TW";
const DEFAULT_TARGET: LanguageCode = "en";

export function useLanguageSettings() {
  const [nativeLang, setNativeLangState] = useState<LanguageCode>(DEFAULT_NATIVE);
  const [targetLang, setTargetLangState] = useState<LanguageCode>(DEFAULT_TARGET);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const native = await storage.getItem<LanguageCode>(`local:${STORAGE_KEYS.NATIVE_LANG}`);
      const target = await storage.getItem<LanguageCode>(`local:${STORAGE_KEYS.TARGET_LANG}`);
      if (native) setNativeLangState(native);
      if (target) setTargetLangState(target);
      setLoaded(true);
    }
    load();
  }, []);

  async function setNativeLang(lang: LanguageCode) {
    setNativeLangState(lang);
    await storage.setItem(`local:${STORAGE_KEYS.NATIVE_LANG}`, lang);
    window.dispatchEvent(new CustomEvent("memzo:lang-changed", { detail: { nativeLang: lang } }));
  }

  async function setTargetLang(lang: LanguageCode) {
    setTargetLangState(lang);
    await storage.setItem(`local:${STORAGE_KEYS.TARGET_LANG}`, lang);
    window.dispatchEvent(new CustomEvent("memzo:lang-changed", { detail: { targetLang: lang } }));
  }

  return { nativeLang, targetLang, setNativeLang, setTargetLang, loaded };
}
