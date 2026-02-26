# Settings 語言方向功能 Plan

## Context

目前 memzo-ext 所有語言相關的設定都是硬編碼的（翻譯目標 `zh-TW`、UI 字串為中文）。需要在 YouTube 頁面的齒輪按鈕點擊後，顯示 Settings 面板，讓用戶設定 **母語 (Native Language)** 和 **學習語言 (Target Language)**。

參考設計：zerostudy 的 Extension Settings 面板（白色 modal overlay）。

V1 範圍：只做語言設定。語言選項先只有 **繁體中文 (zh-TW)** 和 **English (en)**。

---

## 實作步驟

### Step 1: 新增語言設定常數和型別

**`src/lib/constants.ts`** — 新增 storage keys：
```ts
export const STORAGE_KEYS = {
  // ...existing keys...
  NATIVE_LANG: "memzo_native_lang",
  TARGET_LANG: "memzo_target_lang",
} as const;
```

**`src/lib/types.ts`** — 新增型別：
```ts
export type LanguageCode = "zh-TW" | "en";

export const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: "zh-TW", label: "繁體中文" },
  { code: "en", label: "English" },
];
```

---

### Step 2: 建立語言設定 hook

**新增 `src/entrypoints/content/hooks/useLanguageSettings.ts`**

```ts
import { useState, useEffect } from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import type { LanguageCode } from "@/lib/types";

const DEFAULT_NATIVE: LanguageCode = "zh-TW";
const DEFAULT_TARGET: LanguageCode = "en";

export function useLanguageSettings() {
  const [nativeLang, setNativeLangState] = useState<LanguageCode>(DEFAULT_NATIVE);
  const [targetLang, setTargetLangState] = useState<LanguageCode>(DEFAULT_TARGET);
  const [loaded, setLoaded] = useState(false);

  // 初始化：從 storage 讀取
  useEffect(() => {
    async function load() {
      const native = await storage.getItem<LanguageCode>(
        `local:${STORAGE_KEYS.NATIVE_LANG}`
      );
      const target = await storage.getItem<LanguageCode>(
        `local:${STORAGE_KEYS.TARGET_LANG}`
      );
      if (native) setNativeLangState(native);
      if (target) setTargetLangState(target);
      setLoaded(true);
    }
    load();
  }, []);

  async function setNativeLang(lang: LanguageCode) {
    setNativeLangState(lang);
    await storage.setItem(`local:${STORAGE_KEYS.NATIVE_LANG}`, lang);
    // 通知其他 component 語言已變更
    window.dispatchEvent(new CustomEvent("memzo:lang-changed", { detail: { nativeLang: lang } }));
  }

  async function setTargetLang(lang: LanguageCode) {
    setTargetLangState(lang);
    await storage.setItem(`local:${STORAGE_KEYS.TARGET_LANG}`, lang);
    window.dispatchEvent(new CustomEvent("memzo:lang-changed", { detail: { targetLang: lang } }));
  }

  return { nativeLang, targetLang, setNativeLang, setTargetLang, loaded };
}
```

---

### Step 3: 建立 SettingsPanel 元件

**新增 `src/entrypoints/content/components/SettingsPanel.tsx`**

- 白色背景 modal（參考 zerostudy 設計）
- Native Language + Target Language 兩個 `<select>` 下拉選單
- Done 按鈕（儲存並關閉）
- 使用 inline styles（與現有元件一致）

```tsx
import { useState, useEffect } from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import { LANGUAGES, type LanguageCode } from "@/lib/types";

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [nativeLang, setNativeLang] = useState<LanguageCode>("zh-TW");
  const [targetLang, setTargetLang] = useState<LanguageCode>("en");

  useEffect(() => {
    async function load() {
      const native = await storage.getItem<LanguageCode>(`local:${STORAGE_KEYS.NATIVE_LANG}`);
      const target = await storage.getItem<LanguageCode>(`local:${STORAGE_KEYS.TARGET_LANG}`);
      if (native) setNativeLang(native);
      if (target) setTargetLang(target);
    }
    load();
  }, []);

  async function handleDone() {
    await storage.setItem(`local:${STORAGE_KEYS.NATIVE_LANG}`, nativeLang);
    await storage.setItem(`local:${STORAGE_KEYS.TARGET_LANG}`, targetLang);
    window.dispatchEvent(new CustomEvent("memzo:lang-changed"));
    onClose();
  }

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>Extension Settings</h2>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        {/* Native Language */}
        <div style={sectionStyle}>
          <div style={labelRowStyle}>
            <span style={{ fontSize: "14px" }}>🌐</span>
            <span style={labelStyle}>Native Language</span>
          </div>
          <select
            value={nativeLang}
            onChange={(e) => setNativeLang(e.target.value as LanguageCode)}
            style={selectStyle}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
          <p style={hintStyle}>Language for translations and explanations.</p>
        </div>

        {/* Target Language */}
        <div style={sectionStyle}>
          <div style={labelRowStyle}>
            <span style={{ fontSize: "14px" }}>🎯</span>
            <span style={labelStyle}>Target Language</span>
          </div>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value as LanguageCode)}
            style={selectStyle}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
          <p style={hintStyle}>The language you are learning.</p>
        </div>

        {/* Done button */}
        <button onClick={handleDone} style={doneBtnStyle}>Done</button>
      </div>
    </div>
  );
}

// --- Styles ---
// overlayStyle: fixed 全螢幕半透明背景
// panelStyle: 白色圓角卡片，max-width 400px，padding 24px
// selectStyle: 圓角邊框 select，寬 100%
// doneBtnStyle: 藍色全寬圓角按鈕
// (實際 CSS-in-JS 值請依 zerostudy 參考圖實作)
```

---

### Step 4: 修改 ToolbarPill 整合 Settings 面板

**修改 `src/entrypoints/content/components/ToolbarPill.tsx`**

```tsx
import { useState } from "react";
import { SettingsPanel } from "./SettingsPanel";

export function ToolbarPill() {
  const [active, setActive] = useState(true);
  const [showSettings, setShowSettings] = useState(false);  // 新增

  // ...existing toggle function...

  return (
    <div style={pillStyle}>
      {/* ...existing toggle button... */}
      <div style={dividerStyle} />

      {/* Settings button — 改為 onClick toggle */}
      <button
        onClick={() => setShowSettings((v) => !v)}
        style={iconBtnStyle}
        title="Memzo 設定"
      >
        {/* ...existing gear SVG... */}
      </button>

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
```

---

### Step 5: 將硬編碼 `"zh-TW"` 改為讀取語言設定

以下是需要修改的 4 個檔案，以及每個檔案的具體改法：

#### 5a. `src/entrypoints/content/components/SubtitleOverlay.tsx`

```diff
+ import { useLanguageSettings } from "../hooks/useLanguageSettings";

  export function SubtitleOverlay({ videoId }: SubtitleOverlayProps) {
-   const { text, translation } = useCaptionMirror(videoId);
+   const { nativeLang } = useLanguageSettings();
+   const { text, translation } = useCaptionMirror(videoId, nativeLang);
    // ...
    // 傳遞 nativeLang 到 WordSpan → Tooltip
  }
```

#### 5b. `src/entrypoints/content/hooks/useCaptionMirror.ts`

```diff
- export function useCaptionMirror(videoId: string) {
+ export function useCaptionMirror(videoId: string, nativeLang: string = "zh-TW") {
    // ...
-   const { cues } = useSubtitles(videoId);
+   const { cues } = useSubtitles(videoId, nativeLang);

    // translateViaBackground 改用 nativeLang
    // 注意：translateViaBackground 是模組級函數，需要改為接收 lang 參數
    // 或者改用 ref 持有最新的 nativeLang

    // 語言變更時清除 translationCache
+   useEffect(() => {
+     translationCache.clear();
+     pendingTranslations.clear();
+   }, [nativeLang]);
```

#### 5c. `src/entrypoints/content/hooks/useSubtitles.ts`

```diff
- export function useSubtitles(videoId: string | null) {
+ export function useSubtitles(videoId: string | null, nativeLang: string = "zh-TW") {
    // ...
    // TRANSLATE message 改用 nativeLang
-   const transRes = await sendMessage({ type: "TRANSLATE", texts, videoId, lang: "zh-TW" });
+   const transRes = await sendMessage({ type: "TRANSLATE", texts, videoId, lang: nativeLang });
```

注意 `loadSubtitles` 的 `useCallback` deps 要加入 `nativeLang`，這樣語言變更時會重新翻譯。

#### 5d. `src/entrypoints/content/components/Tooltip.tsx`

```diff
  interface TooltipProps {
+   nativeLang?: string;
    // ...existing props...
  }

- export function Tooltip({ entry, word, status, onStatusChange, onMouseEnter, onMouseLeave }: TooltipProps) {
+ export function Tooltip({ entry, word, status, onStatusChange, onMouseEnter, onMouseLeave, nativeLang = "zh-TW" }: TooltipProps) {
    // ...
-   sendMessage({ type: "TRANSLATE", texts: defs, videoId: "", lang: "zh-TW" })
+   sendMessage({ type: "TRANSLATE", texts: defs, videoId: "", lang: nativeLang })
```

---

### Step 6: 語言變更時重新載入翻譯

當語言設定改變時（`memzo:lang-changed` 事件）：

1. `useCaptionMirror` 的 `translationCache` (Map) 被清空
2. `useSubtitles` 因為 `nativeLang` 是 `useCallback` 的 dep，會自動重新執行 `loadSubtitles`
3. 字幕翻譯會以新語言重新取得

---

## Props 傳遞鏈

```
SubtitleOverlay (useLanguageSettings → nativeLang)
  ├── useCaptionMirror(videoId, nativeLang)
  │     └── useSubtitles(videoId, nativeLang)
  └── WordSpan (nativeLang prop)
        └── Tooltip (nativeLang prop)
```

---

## 需修改的檔案總覽

| 檔案 | 操作 |
|------|------|
| `src/lib/constants.ts` | 修改 — 新增 `NATIVE_LANG`, `TARGET_LANG` storage keys |
| `src/lib/types.ts` | 修改 — 新增 `LanguageCode`, `LANGUAGES` |
| `src/entrypoints/content/hooks/useLanguageSettings.ts` | **新增** |
| `src/entrypoints/content/components/SettingsPanel.tsx` | **新增** |
| `src/entrypoints/content/components/ToolbarPill.tsx` | 修改 — 齒輪按鈕觸發面板 |
| `src/entrypoints/content/components/SubtitleOverlay.tsx` | 修改 — 傳遞 nativeLang |
| `src/entrypoints/content/hooks/useCaptionMirror.ts` | 修改 — 接收 nativeLang，清快取 |
| `src/entrypoints/content/hooks/useSubtitles.ts` | 修改 — 接收 nativeLang |
| `src/entrypoints/content/components/Tooltip.tsx` | 修改 — 接收 nativeLang |
| `src/entrypoints/content/components/WordSpan.tsx` | 修改 — 傳遞 nativeLang 到 Tooltip |

---

## 驗證方式

1. `pnpm dev` 啟動
2. 開 YouTube 影片，確認字幕正常
3. 點齒輪 → Settings 面板出現
4. 切換 Native Language (zh-TW ↔ en)，確認翻譯語言改變
5. 按 Done 關閉，重新開啟確認設定保留
6. 重新載入頁面，確認設定持久化
