import type { SourceAdapter, SourceContext } from "../types";

export class YoutubeAdapter implements SourceAdapter {
  constructor(
    private currentSubtitle: string,
    private targetWord: string
  ) {}

  getContext(): SourceContext {
    const video = document.querySelector("video") as HTMLVideoElement;
    const params = new URLSearchParams(location.search);
    return {
      type: "youtube",
      url: location.href,
      videoId: params.get("v") ?? undefined,
      title: document.title.replace(" - YouTube", ""),
      timestamp: video?.currentTime,
      context: this.currentSubtitle,
      highlightWord: this.targetWord,
    };
  }
}
