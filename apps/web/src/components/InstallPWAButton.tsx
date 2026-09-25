import { useEffect, useState } from "react";

export function InstallPWAButton() {
  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: any) => {
      e.preventDefault();
      setPromptEvent(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (installed || !promptEvent) return null;

  return (
    <button
      className="btn-secondary text-xs"
      onClick={async () => {
        promptEvent.prompt();
        await promptEvent.userChoice;
        setPromptEvent(null);
      }}
    >
      📲 Install LEXON Automation
    </button>
  );
}
