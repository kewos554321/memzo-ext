import { useState } from "react";
import type { CEFRLevel, LanguageCode } from "@/lib/types";
import { getDifficulty, CEFR_LEVELS } from "@/lib/wordDifficulty";
import { saveLevel, loadLevel } from "@/lib/difficulty/storage";

interface PlacementTestProps {
  targetLang: LanguageCode;
  onComplete: (level: CEFRLevel) => void;
  onCancel?: () => void;
}

export function PlacementTest({ targetLang, onComplete, onCancel }: PlacementTestProps) {
  const difficulty = getDifficulty(targetLang);

  // Fallback: if no difficulty data for this language, skip straight to manual select
  if (!difficulty) {
    return <ManualSelect targetLang={targetLang} onSelect={onComplete} onCancel={onCancel} />;
  }

  return (
    <TestFlow
      targetLang={targetLang}
      onComplete={onComplete}
      onCancel={onCancel}
    />
  );
}

// ── Test flow ────────────────────────────────────────────────────────────────

interface TestFlowProps {
  targetLang: LanguageCode;
  onComplete: (level: CEFRLevel) => void;
  onCancel?: () => void;
}

function TestFlow({ targetLang, onComplete, onCancel }: TestFlowProps) {
  const difficulty = getDifficulty(targetLang)!;
  const [levelIdx, setLevelIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [scores, setScores] = useState<number[]>(CEFR_LEVELS.map(() => 0));
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<CEFRLevel | null>(null);

  const currentLevel = CEFR_LEVELS[levelIdx];
  const words = difficulty.placementWords[currentLevel];
  const totalWords = CEFR_LEVELS.length * words.length;
  const currentProgress = levelIdx * words.length + wordIdx + 1;

  function handleAnswer(knows: boolean) {
    const newScores = [...scores];
    if (knows) newScores[levelIdx]++;
    setScores(newScores);

    const nextWordIdx = wordIdx + 1;
    if (nextWordIdx < words.length) {
      setWordIdx(nextWordIdx);
    } else {
      const nextLevelIdx = levelIdx + 1;
      if (nextLevelIdx < CEFR_LEVELS.length) {
        setLevelIdx(nextLevelIdx);
        setWordIdx(0);
      } else {
        finalize(newScores);
      }
    }
  }

  function finalize(finalScores: number[]) {
    // Highest level where user knows ≥ 62.5% (5/8) of words
    let assigned: CEFRLevel = "A1";
    for (let i = 0; i < CEFR_LEVELS.length; i++) {
      const total = difficulty.placementWords[CEFR_LEVELS[i]].length;
      if (finalScores[i] / total >= 0.625) {
        assigned = CEFR_LEVELS[i];
      } else {
        break;
      }
    }
    saveLevel(targetLang, assigned);
    setResult(assigned);
    setDone(true);
  }

  if (done && result) {
    return (
      <ResultScreen
        result={result}
        targetLang={targetLang}
        onConfirm={() => onComplete(result)}
        onAdjust={(lvl) => {
          saveLevel(targetLang, lvl);
          setResult(lvl);
        }}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ textAlign: "center" }}>
        <p style={titleStyle}>程度測試</p>
        <p style={hintStyle}>你認識這個單字嗎？</p>
      </div>

      {/* Progress bar */}
      <div style={progressBgStyle}>
        <div style={{ ...progressFillStyle, width: `${(currentProgress / totalWords) * 100}%` }} />
      </div>

      {/* Level badge */}
      <div style={{ textAlign: "center" }}>
        <span style={badgeStyle}>
          {difficulty.levelLabel(currentLevel)} · {currentProgress}/{totalWords}
        </span>
      </div>

      {/* Word card */}
      <div style={wordCardStyle}>
        <p style={wordTextStyle}>{words[wordIdx]}</p>
      </div>

      {/* Answer buttons */}
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={() => handleAnswer(false)} style={noStyle}>不認識</button>
        <button onClick={() => handleAnswer(true)} style={yesStyle}>認識 ✓</button>
      </div>

      {onCancel && (
        <button onClick={onCancel} style={cancelStyle}>取消</button>
      )}
    </div>
  );
}

// ── Result screen ────────────────────────────────────────────────────────────

function ResultScreen({
  result, targetLang, onConfirm, onAdjust,
}: {
  result: CEFRLevel;
  targetLang: LanguageCode;
  onConfirm: () => void;
  onAdjust: (l: CEFRLevel) => void;
}) {
  const [selected, setSelected] = useState(result);
  const difficulty = getDifficulty(targetLang)!;

  function handleAdjust(lvl: CEFRLevel) {
    setSelected(lvl);
    onAdjust(lvl);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ textAlign: "center" }}>
        <p style={hintStyle}>測試完成！你的程度是</p>
        <p style={{ ...titleStyle, fontSize: "26px", color: "#0D9488" }}>
          {difficulty.levelLabel(selected)}
        </p>
        <p style={{ fontSize: "11px", color: "#0F766E", marginTop: "2px" }}>
          ({selected})
        </p>
      </div>

      <p style={{ ...hintStyle, textAlign: "center" }}>
        字幕綠框將只標示適合你的單字。
      </p>

      {/* Manual adjustment */}
      <div>
        <p style={{ fontSize: "11px", color: "#0F766E", marginBottom: "6px", textAlign: "center" }}>
          不準確？手動調整：
        </p>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "center" }}>
          {CEFR_LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => handleAdjust(lvl)}
              style={levelChipStyle(selected === lvl)}
            >
              {difficulty.levelLabel(lvl)}
            </button>
          ))}
        </div>
      </div>

      <button style={confirmBtnStyle} onClick={onConfirm}>確認 →</button>
    </div>
  );
}

// ── Manual select fallback ───────────────────────────────────────────────────

function ManualSelect({
  targetLang, onSelect, onCancel,
}: {
  targetLang: LanguageCode;
  onSelect: (l: CEFRLevel) => void;
  onCancel?: () => void;
}) {
  const difficulty = getDifficulty(targetLang);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <p style={{ ...titleStyle, textAlign: "center" }}>選擇你的程度</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {CEFR_LEVELS.map((lvl) => (
          <button
            key={lvl}
            onClick={() => { saveLevel(targetLang, lvl); onSelect(lvl); }}
            style={levelRowBtnStyle}
          >
            <span style={{ fontWeight: 700 }}>
              {difficulty ? difficulty.levelLabel(lvl) : lvl}
            </span>
            <span style={{ opacity: 0.6, fontSize: "11px" }}>({lvl})</span>
          </button>
        ))}
      </div>
      {onCancel && (
        <button onClick={onCancel} style={cancelStyle}>取消</button>
      )}
    </div>
  );
}

// Re-export shared storage helpers for convenience
export { saveLevel, loadLevel } from "@/lib/difficulty/storage";

// ── Styles ───────────────────────────────────────────────────────────────────

const titleStyle: React.CSSProperties = {
  fontFamily: "var(--font-heading)",
  fontSize: "15px",
  fontWeight: 600,
  color: "#5EEAD4",
  margin: 0,
};

const hintStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#0F766E",
  margin: 0,
};

const progressBgStyle: React.CSSProperties = {
  height: "4px",
  background: "rgba(13,148,136,0.2)",
  borderRadius: "2px",
  overflow: "hidden",
};

const progressFillStyle: React.CSSProperties = {
  height: "100%",
  background: "#0D9488",
  borderRadius: "2px",
  transition: "width 0.2s",
};

const badgeStyle: React.CSSProperties = {
  fontSize: "10px",
  color: "#0F766E",
  background: "rgba(13,148,136,0.12)",
  padding: "2px 8px",
  borderRadius: "4px",
  fontWeight: 600,
};

const wordCardStyle: React.CSSProperties = {
  background: "rgba(13,148,136,0.08)",
  border: "1.5px solid rgba(13,148,136,0.25)",
  borderRadius: "12px",
  padding: "28px 20px",
  textAlign: "center",
};

const wordTextStyle: React.CSSProperties = {
  fontFamily: "var(--font-heading)",
  fontSize: "28px",
  fontWeight: 700,
  color: "#fff",
  letterSpacing: "-0.5px",
  margin: 0,
};

const noStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px",
  borderRadius: "10px",
  border: "1.5px solid rgba(239,68,68,0.4)",
  background: "rgba(239,68,68,0.08)",
  color: "#fca5a5",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

const yesStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px",
  borderRadius: "10px",
  border: "1.5px solid rgba(13,148,136,0.5)",
  background: "rgba(13,148,136,0.12)",
  color: "#5EEAD4",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

const cancelStyle: React.CSSProperties = {
  width: "100%",
  padding: "7px",
  background: "none",
  border: "none",
  color: "#0F766E",
  fontSize: "12px",
  cursor: "pointer",
};

const confirmBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  borderRadius: "10px",
  border: "1.5px solid rgba(13,148,136,0.5)",
  background: "rgba(13,148,136,0.12)",
  color: "#5EEAD4",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

function levelChipStyle(active: boolean): React.CSSProperties {
  return {
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: active ? 700 : 400,
    border: active ? "1.5px solid #0D9488" : "1.5px solid rgba(13,148,136,0.3)",
    background: active ? "rgba(13,148,136,0.15)" : "transparent",
    color: active ? "#0D9488" : "#5EEAD4",
    cursor: "pointer",
  };
}

const levelRowBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "9px",
  border: "1.5px solid rgba(13,148,136,0.25)",
  background: "rgba(13,148,136,0.06)",
  color: "#5EEAD4",
  fontSize: "13px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  textAlign: "left",
};
