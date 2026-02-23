import type { SessionUser } from "@/lib/types";
import { MEMZO_API_URL } from "@/lib/constants";

interface ConnectedStateProps {
  user: SessionUser;
  onLogout: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Derive the web app URL from the API URL
const APP_URL = MEMZO_API_URL.replace(/\/api$/, "").replace("localhost:3000", "localhost:3000");

export function ConnectedState({ user, onLogout }: ConnectedStateProps) {
  function openMemzo() {
    chrome.tabs.create({ url: APP_URL });
  }

  return (
    <div className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Connected badge */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <span className="badge-connected">
          <span className="badge-dot" />
          Connected
        </span>
      </div>

      {/* User info card */}
      <div
        className="clay-card"
        style={{ padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}
      >
        <div className="avatar" aria-label={`Avatar for ${user.name}`}>
          {getInitials(user.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "17px",
              fontWeight: 600,
              color: "#134E4A",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {user.name}
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "#0F766E",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginTop: "2px",
            }}
          >
            {user.email}
          </p>
        </div>
      </div>

      {/* Info text */}
      <p
        style={{
          textAlign: "center",
          fontSize: "13px",
          color: "#5EEAD4",
          lineHeight: 1.5,
          padding: "0 4px",
        }}
      >
        Extension is active. Select text on any page to save vocabulary to Memzo.
      </p>

      <div className="divider" />

      {/* Actions */}
      <button className="clay-btn-outline" onClick={openMemzo}>
        Open Memzo →
      </button>

      <button className="clay-btn-ghost" onClick={onLogout}>
        Log out
      </button>
    </div>
  );
}
