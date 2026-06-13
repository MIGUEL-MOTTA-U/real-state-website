import { useState } from "react";
import { PublicSite } from "./components/PublicSite";
import { LoginPage } from "./components/LoginPage";
import { DashboardShell } from "./components/DashboardShell";

type AppView = "public" | "login" | "dashboard";

export default function App() {
  const [view, setView] = useState<AppView>("public");

  return (
    <div className="size-full">
      {view === "public" && (
        <PublicSite onNavigateToDashboard={() => setView("login")} />
      )}
      {view === "login" && (
        <LoginPage
          onLogin={() => setView("dashboard")}
          onBack={() => setView("public")}
        />
      )}
      {view === "dashboard" && (
        <DashboardShell onLogout={() => setView("public")} />
      )}
    </div>
  );
}
