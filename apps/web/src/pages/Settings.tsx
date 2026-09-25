import { useEffect, useState } from "react";
import { apiGet, apiSend } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const [account, setAccount] = useState<any>(null);
  const { signOut } = useAuth();

  useEffect(() => {
    apiGet("/api/instagram/profile").then((r) => setAccount(r.account));
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto pb-24 md:pb-8">
      <h1 className="text-xl font-semibold mb-6">Settings</h1>
      <div className="card mb-4">
        <p className="font-medium mb-2">Instagram account</p>
        {account ? (
          <div className="flex items-center gap-3">
            <img src={account.profile_image_url ?? "https://placehold.co/48"} className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <p className="text-sm">@{account.username}</p>
              <span className="badge-active">● {account.status}</span>
            </div>
            <button
              className="btn-secondary text-xs text-red-300"
              onClick={async () => {
                if (confirm("Disconnect Instagram?")) {
                  await apiSend("POST", "/api/instagram/disconnect");
                  setAccount(null);
                }
              }}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <p className="text-white/50 text-sm">Not connected</p>
        )}
      </div>
      <button className="btn-secondary w-full" onClick={signOut}>Log out</button>
    </div>
  );
}
