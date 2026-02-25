import ReactDOM from "react-dom/client";
import { SubtitleOverlay } from "./components/SubtitleOverlay";
import { ToolbarPill } from "./components/ToolbarPill";

export default defineContentScript({
  matches: ["*://www.youtube.com/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    let currentVideoId: string | null = null;
    let subtitleUi: Awaited<ReturnType<typeof createShadowRootUi>> | null = null;
    let toolbarUi: { remove(): void } | null = null;

    async function createSubtitleUI(videoId: string) {
      return createShadowRootUi(ctx, {
        name: "memzo-subtitles",
        position: "inline",
        anchor: "#movie_player",
        onMount(container) {
          // Host must cover the full player so position:absolute children
          // are placed relative to #movie_player's coordinate space
          const shadowRoot = container.getRootNode() as ShadowRoot;
          const host = shadowRoot.host as HTMLElement;
          host.style.cssText =
            "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2000;";
          container.style.cssText =
            "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;";

          const root = ReactDOM.createRoot(container);
          root.render(<SubtitleOverlay videoId={videoId} />);
          return root;
        },
        onRemove(root) {
          root?.unmount();
        },
      });
    }

    async function createToolbarUI() {
      await waitForElement(".ytp-right-controls");
      const rightControls = document.querySelector(".ytp-right-controls")!;

      // Direct DOM injection — prepend pill as first child of right controls
      const host = document.createElement("div");
      host.id = "memzo-toolbar-host";
      host.style.cssText =
        "display:inline-flex;align-items:center;height:100%;vertical-align:middle;";
      rightControls.prepend(host);

      const root = ReactDOM.createRoot(host);
      root.render(<ToolbarPill />);

      return {
        remove() {
          root.unmount();
          host.remove();
        },
      };
    }

    function getVideoId(): string | null {
      const url = new URL(window.location.href);
      return url.searchParams.get("v");
    }

    function hideYtCaptions() {
      // Use opacity:0 so YouTube still renders CC into DOM (needed for fallback reading)
      // pointer-events:none prevents it from blocking clicks
      if (!document.getElementById("memzo-hide-captions")) {
        const style = document.createElement("style");
        style.id = "memzo-hide-captions";
        style.textContent =
          ".ytp-caption-window-container { opacity: 0 !important; pointer-events: none !important; }";
        document.head.appendChild(style);
      }
    }

    function restoreYtCaptions() {
      document.getElementById("memzo-hide-captions")?.remove();
    }

    async function handleNavigation() {
      const videoId = getVideoId();
      if (!videoId || videoId === currentVideoId) return;

      // Teardown existing UIs
      if (subtitleUi) { subtitleUi.remove(); subtitleUi = null; }
      if (toolbarUi) { toolbarUi.remove(); toolbarUi = null; }
      restoreYtCaptions();

      currentVideoId = videoId;

      // Wait for player + right controls to be ready
      await waitForElement("#movie_player");
      await waitForElement(".ytp-right-controls");

      subtitleUi = await createSubtitleUI(videoId);
      subtitleUi.mount();

      toolbarUi = await createToolbarUI();

      hideYtCaptions();
    }

    // Sync CC with Memzo subtitle toggle
    window.addEventListener("memzo:toggle", (e) => {
      const { visible } = (e as CustomEvent<{ visible: boolean }>).detail;
      if (visible) {
        hideYtCaptions();
        document.dispatchEvent(new CustomEvent("memzo:cc-enable"));
      } else {
        restoreYtCaptions();
        document.dispatchEvent(new CustomEvent("memzo:cc-disable"));
      }
    });

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

    // Inject into page world (isolated from content script).
    // Communication back uses document.documentElement.dataset + CustomEvent
    // — both are shared across JS worlds.
    const script = document.createElement("script");
    script.textContent = `
      (function() {
        // Enable CC in the YT player — retry until player API is ready
        function memzoEnableCC(tracks) {
          var player = document.querySelector('#movie_player');
          if (player && typeof player.setOption === 'function') {
            try {
              var enTrack =
                tracks.find(function(t){ return t.languageCode === 'en'; }) ||
                tracks.find(function(t){ return t.languageCode && t.languageCode.startsWith('en'); }) ||
                tracks[0];
              if (enTrack) {
                player.setOption('captions', 'track', enTrack);
                return;
              }
            } catch(e) {}
          }
          setTimeout(function(){ memzoEnableCC(tracks); }, 600);
        }

        function memzoStoreTracks(data) {
          var tracks = data &&
            data.captions &&
            data.captions.playerCaptionsTracklistRenderer &&
            data.captions.playerCaptionsTracklistRenderer.captionTracks;
          if (tracks && tracks.length) {
            document.documentElement.dataset.memzoCaptionTracks = JSON.stringify(tracks);
            document.dispatchEvent(new CustomEvent('memzo:tracks-ready'));
            memzoEnableCC(tracks);
          }
        }

        // Listen for content script requesting CC on/off
        document.addEventListener('memzo:cc-enable', function() {
          var stored = document.documentElement.dataset.memzoCaptionTracks;
          if (stored) { try { memzoEnableCC(JSON.parse(stored)); } catch(e) {} }
        });
        document.addEventListener('memzo:cc-disable', function() {
          var player = document.querySelector('#movie_player');
          if (player && typeof player.setOption === 'function') {
            try { player.setOption('captions', 'track', {}); } catch(e) {}
          }
        });

        // Initial page load
        if (typeof ytInitialPlayerResponse !== 'undefined') {
          memzoStoreTracks(ytInitialPlayerResponse);
        }

        // SPA navigation: hook fetch to capture new player responses
        var _origFetch = window.fetch;
        window.fetch = function() {
          var args = arguments;
          return _origFetch.apply(this, args).then(function(res) {
            try {
              var url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url);
              if (url && url.includes('/youtubei/v1/player')) {
                res.clone().json().then(memzoStoreTracks).catch(function(){});
              }
            } catch(e) {}
            return res;
          });
        };
      })();
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
