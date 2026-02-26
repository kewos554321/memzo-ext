import { useState, useEffect } from "react";
import type { SessionUser } from "@/lib/types";
import { sendMessage } from "@/lib/messages";
import { LoginForm } from "./components/LoginForm";
import { ConnectedState } from "./components/ConnectedState";
import "./style.css";

// ── Memzo wordmark SVG ──────────────────────────────────────────────────────
function MemzoLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="10" fill="#0D9488" />
        <path
          d="M10 14c0-2.2 1.8-4 4-4 .7 0 1.4.2 2 .5.6-.3 1.3-.5 2-.5 2.2 0 4 1.8 4 4 0 .4-.1.8-.2 1.2.8.6 1.2 1.5 1.2 2.5 0 1.8-1.5 3.3-3.3 3.3H18v1h-1v-1h-.7C14.5 21 13 19.5 13 17.7c0-1 .5-1.9 1.2-2.5-.1-.4-.2-.8-.2-1.2z"
          fill="white" opacity="0.9"
        />
        <path d="M18 22v3M17 22v3" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      </svg>
      <span style={{ fontFamily: "var(--font-heading)", fontSize: "26px", fontWeight: 700, color: "#0D9488", letterSpacing: "-0.3px", lineHeight: 1 }}>
        Memzo
      </span>
    </div>
  );
}

function Loading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "32px 24px" }}>
      <div style={{ width: "40px", height: "40px", border: "3px solid #CCFBF1", borderTopColor: "#0D9488", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <p style={{ color: "#5EEAD4", fontSize: "14px", fontWeight: 500 }}>Loading…</p>
    </div>
  );
}

// ── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await sendMessage({ type: "GET_AUTH_STATE" });
      if (res.success) {
        const { user: u, token } = res.data as { user: SessionUser | null; token: string | null };
        if (u && token) setUser(u);
      }
      setLoading(false);
    })();
  }, []);

  async function handleLogin(email: string, password: string) {
    const res = await sendMessage({ type: "LOGIN", email, password });
    if (!res.success) throw new Error(res.error);
    const authRes = await sendMessage({ type: "GET_AUTH_STATE" });
    if (authRes.success) {
      const { user: u, token } = authRes.data as { user: SessionUser | null; token: string | null };
      if (u && token) setUser(u);
    }
  }

  async function handleLogout() {
    await sendMessage({ type: "LOGOUT" });
    setUser(null);
  }

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <MemzoLogo />
      {loading ? (
        <Loading />
      ) : user ? (
        <ConnectedState user={user} onLogout={handleLogout} />
      ) : (
        <div className="animate-slide-up">
          <div className="clay-card" style={{ padding: "22px 20px", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "0" }}>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 500, color: "#5EEAD4", textAlign: "center", marginBottom: "14px" }}>
              Save words as you browse
            </p>
            <LoginForm onLogin={handleLogin} />
          </div>
        </div>
      )}
    </div>
  );
}
