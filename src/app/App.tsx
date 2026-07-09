import { lazy, Suspense, useState } from "react";
import { PublicSite } from "./components/PublicSite";

// El sitio público es la primera pantalla: el panel y el login se cargan en
// chunks aparte solo cuando se necesitan (mejor primera carga en redes lentas).
const LoginPage = lazy(() =>
  import("./components/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const DashboardShell = lazy(() =>
  import("./components/DashboardShell").then((m) => ({ default: m.DashboardShell })),
);

type AppView = "public" | "login" | "dashboard";

function ViewLoader() {
  return (
    <div className="h-full flex items-center justify-center bg-[#F8F7F4]">
      <div className="w-8 h-8 bg-[#C9A84C] flex items-center justify-center animate-pulse">
        <span className="text-[#0B1F3A] font-black text-xs tracking-tighter">C21</span>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<AppView>("public");

  return (
    <div className="size-full">
      {view === "public" && (
        <PublicSite onNavigateToDashboard={() => setView("login")} />
      )}
      {view === "login" && (
        <Suspense fallback={<ViewLoader />}>
          <LoginPage
            onLogin={() => setView("dashboard")}
            onBack={() => setView("public")}
          />
        </Suspense>
      )}
      {view === "dashboard" && (
        <Suspense fallback={<ViewLoader />}>
          <DashboardShell onLogout={() => setView("public")} />
        </Suspense>
      )}
    </div>
  );
}
