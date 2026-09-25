import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center font-bold">LX</div>
          <span className="font-semibold text-lg">LEXON Automation</span>
        </div>
        {sent ? (
          <p className="text-white/70 text-sm">Login link sent to {email}. Check your inbox and tap the link.</p>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              try {
                await signInWithEmail(email);
                setSent(true);
              } catch (err: any) {
                setError(err.message);
              }
            }}
            className="flex flex-col gap-3"
          >
            <label className="text-sm text-white/60">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button className="btn-primary mt-2" type="submit">Send login link</button>
          </form>
        )}
      </div>
    </div>
  );
}
