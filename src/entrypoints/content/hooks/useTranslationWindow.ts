import { useEffect, useRef } from "react";
import type { SubtitleCue } from "@/lib/types";
import { sendMessage } from "@/lib/messages";
import { PREFETCH_INTERVAL_MS } from "@/lib/constants";

const PREFETCH_BATCH_SIZE = 25; // 每次预加载25条字幕
const PREFETCH_INTERVAL = PREFETCH_INTERVAL_MS; // 批次间隔（50ms）

interface PrefetchState {
  pending: Set<number>; // 正在翻译的索引
  completed: Set<number>; // 已完成的索引
}

/**
 * 激进的主动预翻译整个视频
 *
 * 工作流：
 * 1. 字幕加载完成 → 立即启动持续翻译循环
 * 2. 独立的 setInterval 定时器持续扫描未翻译字幕
 * 3. 后台并发翻译，即使用户暂停也继续
 * 4. 50ms 批次间隔，激进地翻译整个视频
 *
 * @param cues - 字幕数组
 * @param setCues - 更新字幕的setter
 * @param currentIdx - 当前播放位置 (-1 = 未播放)
 * @param videoId - 视频ID用于缓存
 * @param lang - 目标语言
 */
export function useTranslationWindow(
  cues: SubtitleCue[],
  setCues: (cues: SubtitleCue[]) => void,
  currentIdx: number,
  videoId: string,
  lang: string
): void {
  const stateRef = useRef<PrefetchState>({
    pending: new Set(),
    completed: new Set(),
  });
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // 持续翻译循环：独立的定时器，不依赖effect
  useEffect(() => {
    if (cues.length === 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
      return;
    }

    const state = stateRef.current;

    // 首次初始化
    if (state.completed.size === 0 && state.pending.size === 0) {
      console.log(`[useTranslationWindow] 🚀 Starting aggressive prefetch for ${cues.length} cues`);
    }

    // 清除旧的定时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // 启动持续的翻译循环
    timerRef.current = setInterval(() => {
      // 扫描所有未翻译的字幕
      const toTranslate: { idx: number; text: string }[] = [];
      for (let i = 0; i < cues.length && toTranslate.length < PREFETCH_BATCH_SIZE; i++) {
        if (!state.pending.has(i) && !state.completed.has(i) && !cues[i].translation) {
          toTranslate.push({ idx: i, text: cues[i].text });
        }
      }

      // 如果没有待翻译的
      if (toTranslate.length === 0) {
        const allDone = state.completed.size === cues.length;
        if (allDone) {
          console.log(`[useTranslationWindow] ✅ All ${cues.length} cues translated!`);
          clearInterval(timerRef.current);
          timerRef.current = undefined;
        }
        return;
      }

      // 标记为待处理
      toTranslate.forEach(({ idx }) => state.pending.add(idx));

      const progressPct = Math.round((state.completed.size / cues.length) * 100);
      console.log(
        `[useTranslationWindow] 📤 Sending batch: ${toTranslate.length} cues [${progressPct}% progress]`
      );

      // 并发发送翻译请求（不等待）
      (async () => {
        try {
          const res = await sendMessage({
            type: "TRANSLATE",
            texts: toTranslate.map(({ text }) => text),
            videoId,
            lang,
          });

          if (res.success) {
            const translations = res.data as string[];
            const updated = [...cues];
            toTranslate.forEach(({ idx }, j) => {
              updated[idx].translation = translations[j];
              state.pending.delete(idx);
              state.completed.add(idx);
            });
            setCues(updated);
            const newProgressPct = Math.round((state.completed.size / cues.length) * 100);
            console.log(
              `[useTranslationWindow] ✓ Batch done: ${toTranslate.length} translated [${newProgressPct}% total]`
            );
          } else {
            console.warn("[useTranslationWindow] ❌ Translation API failed:", res.error);
            // 标记失败的为已尝试，避免无限重试
            toTranslate.forEach(({ idx }) => {
              state.pending.delete(idx);
              state.completed.add(idx);
            });
          }
        } catch (err) {
          console.error("[useTranslationWindow] ❌ Translation error:", err);
          toTranslate.forEach(({ idx }) => {
            state.pending.delete(idx);
            state.completed.add(idx);
          });
        }
      })();
    }, PREFETCH_INTERVAL);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
    };
  }, [cues, setCues, videoId, lang]);

  // 处理用户跳转（优先级调整，但不中断翻译）
  useEffect(() => {
    if (currentIdx !== -1) {
      console.log(`[useTranslationWindow] Player at index ${currentIdx}`);
    }
  }, [currentIdx]);
}
