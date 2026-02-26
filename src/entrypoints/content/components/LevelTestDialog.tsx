import { useState } from "react";
import { createPortal } from "react-dom";
import type { CEFRLevel, LanguageCode } from "@/lib/types";
import { getDifficulty, CEFR_LEVELS } from "@/lib/wordDifficulty";
import { saveLevel } from "@/lib/difficulty/storage";

interface LevelTestDialogProps {
  targetLang: LanguageCode;
  onComplete: (level: CEFRLevel) => void;
  onClose: () => void;
}

export function LevelTestDialog({ targetLang, onComplete, onClose }: LevelTestDialogProps) {
  return createPortal(
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={panelStyle}>
        <TestContent targetLang={targetLang} onComplete={onComplete} onClose={onClose} />
      </div>
    </div>,
    document.body,
  );
}

// ── Main content ─────────────────────────────────────────────────────────────

type View = "intro" | "test" | "result";

function TestContent({ targetLang, onComplete, onClose }: {
  targetLang: LanguageCode;
  onComplete: (level: CEFRLevel) => void;
  onClose: () => void;
}) {
  const [view, setView] = useState<View>("intro");
  const [levelIdx, setLevelIdx] = useState(0);
  // scores[i] = number of words selected as "known" for CEFR_LEVELS[i]
  const [scores, setScores] = useState<number[]>(CEFR_LEVELS.map(() => 0));
  const [result, setResult] = useState<CEFRLevel>("A1");

  const difficulty = getDifficulty(targetLang);
  if (!difficulty) {
    return <ManualSelect targetLang={targetLang} onSelect={onComplete} onClose={onClose} />;
  }

  function handleLevelDone(knownCount: number) {
    const newScores = [...scores];
    newScores[levelIdx] = knownCount;
    setScores(newScores);

    if (levelIdx < CEFR_LEVELS.length - 1) {
      setLevelIdx(levelIdx + 1);
    } else {
      finalize(newScores);
    }
  }

  function finalize(finalScores: number[]) {
    let assigned: CEFRLevel = "A1";
    for (let i = 0; i < CEFR_LEVELS.length; i++) {
      const total = difficulty!.placementWords[CEFR_LEVELS[i]].length;
      if (finalScores[i] / total >= 0.625) {
        assigned = CEFR_LEVELS[i];
      } else {
        break;
      }
    }
    saveLevel(targetLang, assigned);
    setResult(assigned);
    setView("result");
  }

  if (view === "intro") {
    const totalWords = CEFR_LEVELS.reduce(
      (sum, lvl) => sum + difficulty.placementWords[lvl].length, 0
    );
    return (
      <div style={contentStyle}>
        <Header title="程度測試" onClose={onClose} />
        <p style={descStyle}>
          點選你認識的單字，Memzo 會找出最適合你學習的詞彙難度。
        </p>
        <div style={statRowStyle}>
          <StatChip label="共" value={`${totalWords} 個單字`} />
          <StatChip label="分" value={`${CEFR_LEVELS.length} 組`} />
          <StatChip label="約" value="30 秒" />
        </div>
        <button onClick={() => setView("test")} style={primaryBtnStyle}>開始 →</button>
        <button onClick={onClose} style={ghostBtnStyle}>稍後再說</button>
      </div>
    );
  }

  if (view === "result") {
    return (
      <ResultView
        result={result}
        targetLang={targetLang}
        onConfirm={() => onComplete(result)}
        onAdjust={(lvl) => { saveLevel(targetLang, lvl); setResult(lvl); }}
        onClose={onClose}
      />
    );
  }

  return (
    <WordSelectView
      key={levelIdx}
      levelIdx={levelIdx}
      targetLang={targetLang}
      onDone={handleLevelDone}
      onClose={onClose}
    />
  );
}

// ── Word select view (core interaction) ──────────────────────────────────────

function WordSelectView({ levelIdx, targetLang, onDone, onClose }: {
  levelIdx: number;
  targetLang: LanguageCode;
  onDone: (knownCount: number) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<string | null>(null);

  const difficulty = getDifficulty(targetLang)!;
  const currentLevel = CEFR_LEVELS[levelIdx];
  const words = difficulty.placementWords[currentLevel];
  const isLast = levelIdx === CEFR_LEVELS.length - 1;
  const isChinese = targetLang === "zh-TW";

  function toggle(word: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return next;
    });
  }

  return (
    <div style={contentStyle}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={levelBadgeStyle}>{difficulty.levelLabel(currentLevel)}</span>
          <span style={stepLabelStyle}>{levelIdx + 1} / {CEFR_LEVELS.length}</span>
        </div>
        <button onClick={onClose} style={closeBtnStyle}>✕</button>
      </div>

      {/* Progress dots */}
      <div style={dotsRowStyle}>
        {CEFR_LEVELS.map((_, i) => (
          <div key={i} style={dotStyle(i < levelIdx, i === levelIdx)} />
        ))}
      </div>

      {/* Instruction */}
      <p style={instructionStyle}>點選你認識的單字</p>

      {/* Word pills */}
      <div style={pillsContainerStyle}>
        {words.map((word) => {
          const isSelected = selected.has(word);
          const isHovered = hovered === word;
          return (
            <button
              key={word}
              onClick={() => toggle(word)}
              onMouseEnter={() => setHovered(word)}
              onMouseLeave={() => setHovered(null)}
              style={wordPillStyle(isSelected, isHovered, isChinese)}
            >
              {word}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
        <span style={selectedCountStyle}>
          {selected.size > 0 ? `已選 ${selected.size} 個` : "全不認識也沒關係"}
        </span>
        <button onClick={() => onDone(selected.size)} style={nextBtnStyle}>
          {isLast ? "完成 ✓" : "下一組 →"}
        </button>
      </div>
    </div>
  );
}

// ── Result view ──────────────────────────────────────────────────────────────

function ResultView({ result, targetLang, onConfirm, onAdjust, onClose }: {
  result: CEFRLevel;
  targetLang: LanguageCode;
  onConfirm: () => void;
  onAdjust: (l: CEFRLevel) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(result);
  const difficulty = getDifficulty(targetLang)!;

  function handleAdjust(lvl: CEFRLevel) {
    setSelected(lvl);
    onAdjust(lvl);
  }

  return (
    <div style={contentStyle}>
      <Header title="測試完成" onClose={onClose} />

      <div style={resultCardStyle}>
        <p style={resultLabelStyle}>你的程度</p>
        <p style={resultLevelStyle}>{difficulty.levelLabel(selected)}</p>
        {difficulty.systemName !== "CEFR" && (
          <p style={resultCEFRStyle}>({selected})</p>
        )}
      </div>

      <p style={{ ...descStyle, color: "#6b7280" }}>
        字幕中的綠色框框將只標示適合你程度的單字。
      </p>

      {/* Fine-tune */}
      <div>
        <p style={fineTuneLabelStyle}>調整程度</p>
        <div style={levelGridStyle}>
          {CEFR_LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => handleAdjust(lvl)}
              style={levelChipStyle(selected === lvl)}
            >
              <span style={{ display: "block", fontWeight: 700, fontSize: "13px" }}>
                {difficulty.levelLabel(lvl)}
              </span>
              {difficulty.systemName !== "CEFR" && (
                <span style={{ display: "block", fontSize: "10px", opacity: 0.6 }}>{lvl}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <button onClick={onConfirm} style={primaryBtnStyle}>開始學習 →</button>
    </div>
  );
}

// ── Manual select fallback ───────────────────────────────────────────────────

function ManualSelect({ targetLang, onSelect, onClose }: {
  targetLang: LanguageCode;
  onSelect: (l: CEFRLevel) => void;
  onClose: () => void;
}) {
  return (
    <div style={contentStyle}>
      <Header title="選擇程度" onClose={onClose} />
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {CEFR_LEVELS.map((lvl) => (
          <button
            key={lvl}
            onClick={() => { saveLevel(targetLang, lvl); onSelect(lvl); }}
            style={levelRowBtnStyle}
          >
            {lvl}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={headerStyle}>
      <h2 style={titleStyle}>{title}</h2>
      <button onClick={onClose} style={closeBtnStyle}>✕</button>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={statChipStyle}>
      <span style={{ fontSize: "11px", color: "#9ca3af" }}>{label}</span>
      <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>{value}</span>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  zIndex: 2147483647, // above SettingsPanel (2147483645)
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const panelStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "16px",
  width: "400px",
  maxWidth: "calc(100vw - 32px)",
  boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
  fontFamily: "'Segoe UI', Arial, sans-serif",
  overflow: "hidden",
};

const contentStyle: React.CSSProperties = {
  padding: "22px 24px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "17px",
  fontWeight: 700,
  color: "#111827",
};

const closeBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  fontSize: "15px",
  cursor: "pointer",
  color: "#9ca3af",
  padding: "4px 6px",
  borderRadius: "6px",
  lineHeight: 1,
};

const descStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "14px",
  color: "#374151",
  lineHeight: 1.6,
};

const statRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
};

const statChipStyle: React.CSSProperties = {
  flex: 1,
  background: "#f3f4f6",
  borderRadius: "8px",
  padding: "8px 10px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "2px",
};

// ── Test view styles ──────────────────────────────────────────────────────────

const levelBadgeStyle: React.CSSProperties = {
  background: "#eff6ff",
  color: "#2563eb",
  border: "1px solid #bfdbfe",
  borderRadius: "6px",
  padding: "3px 10px",
  fontSize: "13px",
  fontWeight: 700,
};

const stepLabelStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#9ca3af",
};

const dotsRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "6px",
  alignItems: "center",
};

function dotStyle(done: boolean, active: boolean): React.CSSProperties {
  return {
    width: active ? "20px" : "8px",
    height: "8px",
    borderRadius: "4px",
    background: done ? "#2563eb" : active ? "#93c5fd" : "#e5e7eb",
    transition: "width 0.2s, background 0.2s",
  };
}

const instructionStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "13px",
  color: "#6b7280",
  fontWeight: 500,
};

const pillsContainerStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
};

function wordPillStyle(selected: boolean, hovered: boolean, isChinese: boolean): React.CSSProperties {
  return {
    padding: isChinese ? "8px 14px" : "7px 14px",
    borderRadius: "100px",
    fontSize: isChinese ? "17px" : "14px",
    fontWeight: selected ? 600 : 400,
    border: selected ? "1.5px solid #2563eb" : "1.5px solid #e5e7eb",
    background: selected ? "#2563eb" : hovered ? "#f3f4f6" : "#fff",
    color: selected ? "#fff" : "#111827",
    cursor: "pointer",
    transition: "background 0.1s, border-color 0.1s, color 0.1s",
    userSelect: "none",
    letterSpacing: isChinese ? "0.05em" : "normal",
  };
}

const selectedCountStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
};

const nextBtnStyle: React.CSSProperties = {
  padding: "9px 20px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
};

// ── Result styles ─────────────────────────────────────────────────────────────

const resultCardStyle: React.CSSProperties = {
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: "12px",
  padding: "20px",
  textAlign: "center",
};

const resultLabelStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#3b82f6",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  margin: "0 0 6px",
};

const resultLevelStyle: React.CSSProperties = {
  fontSize: "30px",
  fontWeight: 800,
  color: "#1d4ed8",
  margin: "0 0 2px",
  letterSpacing: "-0.5px",
};

const resultCEFRStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#93c5fd",
  margin: 0,
};

const fineTuneLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: "0 0 8px",
};

const levelGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "6px",
};

function levelChipStyle(active: boolean): React.CSSProperties {
  return {
    padding: "8px 6px",
    borderRadius: "8px",
    border: active ? "2px solid #2563eb" : "1.5px solid #e5e7eb",
    background: active ? "#eff6ff" : "#fff",
    color: active ? "#2563eb" : "#374151",
    cursor: "pointer",
    textAlign: "center",
  };
}

// ── Shared button styles ──────────────────────────────────────────────────────

const primaryBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
};

const ghostBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px",
  background: "none",
  border: "none",
  color: "#9ca3af",
  fontSize: "13px",
  cursor: "pointer",
};

const levelRowBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  background: "#f9fafb",
  color: "#374151",
  fontSize: "14px",
  textAlign: "left",
  cursor: "pointer",
};
