"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Calendar, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeContext";

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "Events", href: "/events", icon: Calendar },
    { name: "Members", href: "/members", icon: Users },
  ];

  return (
    <aside className="fixed top-0 left-0 h-screen w-60 bg-csi-sidebar border-r border-csi-border flex flex-col z-50 transition-colors duration-200 overflow-y-auto">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-csi-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-csi-purple flex items-center justify-center font-extrabold text-base text-white shadow-lg shadow-csi-purple/30">
            OP
          </div>
          <div>
            <Link href="/" className="font-extrabold text-base text-white hover:text-csi-purpleLight transition">
              Operations Platform
            </Link>
            <p className="text-xs text-csi-textDim uppercase tracking-wider font-semibold">Student Chapter Hub</p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-5 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3.5 py-3 rounded-xl text-[18px] font-bold transition-all ${
                isActive
                  ? "bg-csi-purple text-white shadow-lg shadow-csi-purple/25"
                  : "text-csi-textMuted hover:bg-csi-surfaceLight hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Theme Switcher */}
      <div className="px-4 py-3 border-t border-csi-border">
        <button
          onClick={toggleTheme}
          type="button"
          aria-label="Toggle dark/light theme"
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-csi-surface hover:bg-csi-surfaceLight text-csi-text transition text-xs font-bold border border-csi-border shadow-sm group"
        >
          <div className="flex items-center gap-2">
            {theme === "light" ? (
              <Sun className="w-4 h-4 text-amber-500 transition-transform group-hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-purple-400 transition-transform group-hover:-rotate-12" />
            )}
            <span className="text-xs font-semibold">
              {theme === "light" ? "Light Mode" : "Dark Mode"}
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300">
            Switch
          </span>
        </button>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-csi-border">
        <p className="text-xs text-csi-textDim font-mono">CSI Operations v1.2</p>
      </div>
    </aside>
  );
}
