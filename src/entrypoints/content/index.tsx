import ReactDOM from "react-dom/client";
import { SubtitleOverlay } from "./components/SubtitleOverlay";

export default defineContentScript({
  matches: ["*://www.youtube.com/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    let currentVideoId: string | null = null;
    let ui: Awaited<ReturnType<typeof createUI>> | null = null;

    async function createUI(videoId: string) {
      return createShadowRootUi(ctx, {
        name: "memzo-subtitles",
        position: "inline",
        anchor: "#movie_player",
        onMount(container) {
          const root = ReactDOM.createRoot(container);
          root.render(<SubtitleOverlay videoId={videoId} />);
          return root;
        },
        onRemove(root) {
          root?.unmount();
        },
      });
    }

    function getVideoId(): string | null {
      const url = new URL(window.location.href);
      return url.searchParams.get("v");
    }

    function hideYtCaptions() {
      if (!document.getElementById("memzo-hide-captions")) {
        const style = document.createElement("style");
        style.id = "memzo-hide-captions";
        style.textContent =
          ".ytp-caption-window-container { display: none !important; }";
        document.head.appendChild(style);
      }
    }

    function restoreYtCaptions() {
      document.getElementById("memzo-hide-captions")?.remove();
    }

    async function handleNavigation() {
      const videoId = getVideoId();
      if (!videoId || videoId === currentVideoId) return;

      // Remove existing UI and restore YT captions
      if (ui) {
        ui.remove();
        ui = null;
        restoreYtCaptions();
      }

      currentVideoId = videoId;

      // Wait for player to be ready
      await waitForElement("#movie_player");

      ui = await createUI(videoId);
      ui.mount();
      hideYtCaptions();
    }

    // Initial load
    handleNavigation();

    // YouTube SPA navigation: watch for title changes
    const observer = new MutationObserver(() => {
      handleNavigation();
    });

    const titleEl = document.querySelector("title");
    if (titleEl) {
      observer.observe(titleEl, { childList: true });
    }

    // Also listen for yt-navigate-finish (YouTube's custom event)
    window.addEventListener("yt-navigate-finish", () => {
      handleNavigation();
    });

    // Inject a script to capture ytInitialPlayerResponse before it's consumed
    const script = document.createElement("script");
    script.textContent = `
      if (typeof ytInitialPlayerResponse !== 'undefined') {
        window.__memzo_player_response = ytInitialPlayerResponse;
      }
      // Hook into the fetch to capture player responses on SPA navigation
      const _origFetch = window.fetch;
      window.fetch = async function(...args) {
        const res = await _origFetch.apply(this, args);
        try {
          const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
          if (url && url.includes('/youtubei/v1/player')) {
            const clone = res.clone();
            clone.json().then(data => {
              window.__memzo_player_response = data;
            }).catch(() => {});
          }
        } catch(e) {}
        return res;
      };
    `;
    document.documentElement.appendChild(script);
    script.remove();
  },
});

function waitForElement(selector: string, timeout = 10000): Promise<Element> {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for ${selector}`));
    }, timeout);
  });
}
