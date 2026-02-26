import { useState, useEffect } from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import { sendMessage } from "@/lib/messages";
import type { LanguageCode } from "@/lib/types";

const DEFAULT_NATIVE: LanguageCode = "zh-TW";
const DEFAULT_TARGET: LanguageCode = "en";

export function useLanguageSettings() {
  const [nativeLang, setNativeLangState] = useState<LanguageCode>(DEFAULT_NATIVE);
  const [targetLang, setTargetLangState] = useState<LanguageCode>(DEFAULT_TARGET);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function syncFromServer() {
      const res = await sendMessage({ type: "GET_SETTINGS" });
      if (res.success && res.data) {
        const { nativeLang: serverNative, targetLang: serverTarget } = res.data as {
          nativeLang: string;
          targetLang: string;
        };
        if (serverNative) {
          setNativeLangState(serverNative as LanguageCode);
          await storage.setItem(`local:${STORAGE_KEYS.NATIVE_LANG}`, serverNative);
        }
        if (serverTarget) {
          setTargetLangState(serverTarget as LanguageCode);
          await storage.setItem(`local:${STORAGE_KEYS.TARGET_LANG}`, serverTarget);
        }
      }
    }

    async function load() {
      // 1. Load local first (instant display)
      const localNative = await storage.getItem<LanguageCode>(`local:${STORAGE_KEYS.NATIVE_LANG}`);
      const localTarget = await storage.getItem<LanguageCode>(`local:${STORAGE_KEYS.TARGET_LANG}`);
      if (localNative) setNativeLangState(localNative);
      if (localTarget) setTargetLangState(localTarget);
      setLoaded(true);

      // 2. Sync from server (server wins as source of truth)
      await syncFromServer();
    }

    load();

    // Re-sync when tab regains focus (user may have changed settings on web)
    document.addEventListener("visibilitychange", syncFromServer);
    return () => document.removeEventListener("visibilitychange", syncFromServer);
  }, []);

  async function setNativeLang(lang: LanguageCode) {
    setNativeLangState(lang);
    await storage.setItem(`local:${STORAGE_KEYS.NATIVE_LANG}`, lang);
    window.dispatchEvent(new CustomEvent("memzo:lang-changed", { detail: { nativeLang: lang } }));
    sendMessage({ type: "SAVE_SETTINGS", nativeLang: lang }).catch(() => {});
  }

  async function setTargetLang(lang: LanguageCode) {
    setTargetLangState(lang);
    await storage.setItem(`local:${STORAGE_KEYS.TARGET_LANG}`, lang);
    window.dispatchEvent(new CustomEvent("memzo:lang-changed", { detail: { targetLang: lang } }));
    sendMessage({ type: "SAVE_SETTINGS", targetLang: lang }).catch(() => {});
  }

  return { nativeLang, targetLang, setNativeLang, setTargetLang, loaded };
}
