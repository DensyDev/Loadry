import { Outlet } from "react-router-dom";
import type { ThemeMode } from "../hooks/useTheme";
import { Header } from "./Header";

type LayoutProps = {
  onThemeModeChange: (themeMode: ThemeMode) => void;
  themeMode: ThemeMode;
};

export function Layout({ onThemeModeChange, themeMode }: LayoutProps) {
  return (
    <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden bg-background text-foreground">
      <Header onThemeModeChange={onThemeModeChange} themeMode={themeMode} />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
