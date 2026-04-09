import { useState } from "react";

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {error && <div className="error-msg">{error}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <label
          htmlFor="memzo-email"
          style={{ fontSize: "12px", fontWeight: 700, color: "#0F766E", textTransform: "uppercase", letterSpacing: "0.5px" }}
        >
          Email
        </label>
        <input
          id="memzo-email"
          className="clay-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          autoComplete="email"
          required
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <label
          htmlFor="memzo-password"
          style={{ fontSize: "12px", fontWeight: 700, color: "#0F766E", textTransform: "uppercase", letterSpacing: "0.5px" }}
        >
          Password
        </label>
        <input
          id="memzo-password"
          className="clay-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>

      <button className="clay-btn-primary" type="submit" disabled={loading} style={{ marginTop: "2px" }}>
        {loading ? (
          <>
            <span className="spinner" />
            Logging in…
          </>
        ) : (
          "Log in"
        )}
      </button>

      <p style={{ textAlign: "center", fontSize: "13px", color: "#0F766E" }}>
        Don't have an account?{" "}
        <a
          href="http://localhost:3001/register"
          target="_blank"
          rel="noreferrer"
          style={{ color: "#0D9488", fontWeight: 700, textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          Sign up
        </a>
      </p>
    </form>
  );
}
