import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiSend } from "../lib/api";

export default function Connect() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function connect() {
    setLoading(true);
    setError(null);
    try {
      const { authorizeUrl } = await apiGet("/api/instagram/oauth/start");
      if (authorizeUrl.includes("/connect/mock-callback")) {
        // Mock mode: complete instantly instead of a real Meta redirect.
        await apiSend("POST", "/api/instagram/oauth/mock-complete");
        navigate("/dashboard?connected=1");
      } else {
        window.location.href = authorizeUrl;
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto mb-4 text-2xl">📷</div>
        <h1 className="font-semibold text-lg mb-2">Connect your Instagram</h1>
        <p className="text-white/60 text-sm mb-6">
          LEXON never asks for your password. You'll authorize through Instagram's official login screen.
        </p>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button className="btn-primary w-full" onClick={connect} disabled={loading}>
          {loading ? "Connecting…" : "Connect Instagram"}
        </button>
      </div>
    </div>
  );
}
