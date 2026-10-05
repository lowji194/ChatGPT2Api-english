"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentType } from "react";
import { BookOpenText, Bot, Bug, Images, LogOut, ScrollText, Settings2, Sparkles, UsersRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { HeaderActions } from "@/components/header-actions";
import { getValidatedAuthSession } from "@/lib/auth-session";
import { cn } from "@/lib/utils";
import { clearStoredAuthSession, getDefaultRouteForRole, type StoredAuthSession } from "@/store/auth";

type NavItem = { href: string; label: string; shortLabel: string; icon: ComponentType<{ className?: string }> };

const adminNavItems: NavItem[] = [
  { href: "/accounts", label: "Accounts", shortLabel: "Accounts", icon: UsersRound },
  { href: "/image", label: "Generate images", shortLabel: "Generate", icon: Sparkles },
  { href: "/image-manager", label: "Image library", shortLabel: "Library", icon: Images },
  { href: "/logs", label: "Activity logs", shortLabel: "Activity", icon: ScrollText },
  { href: "/debug", label: "API playground", shortLabel: "Playground", icon: Bug },
  { href: "/api-docs", label: "API documentation", shortLabel: "API Docs", icon: BookOpenText },
  { href: "/settings", label: "System settings", shortLabel: "Settings", icon: Settings2 },
];
const userNavItems = [adminNavItems[1]];

function Brand({ href }: { href: string }) {
  return <Link href={href} className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"><span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white"><Bot className="size-[17px]" aria-hidden="true" /></span><span className="hidden text-sm font-bold tracking-tight text-white sm:block">GPT Control</span></Link>;
}

function MenuItems({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return <nav aria-label="Primary navigation" className="flex min-w-max items-center gap-1">{items.map((item) => { const active = pathname === item.href || pathname.startsWith(`${item.href}/`); const Icon = item.icon; return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40", active ? "bg-white text-slate-950 shadow-sm" : "text-slate-300 hover:bg-white/10 hover:text-white")}><Icon className="size-4" aria-hidden="true" /><span>{item.shortLabel}</span></Link>; })}</nav>;
}

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<StoredAuthSession | null | undefined>(undefined);

  useEffect(() => { let active = true; void (async () => { if (pathname === "/login") { if (active) setSession(null); return; } const stored = await getValidatedAuthSession(); if (active) setSession(stored); })(); return () => { active = false; }; }, [pathname]);

  if (pathname === "/login" || session === null) return null;
  if (session === undefined) return <div className="h-14 bg-slate-950" />;

  const items = session.role === "admin" ? adminNavItems : userNavItems;
  const home = getDefaultRouteForRole(session.role);
  const logout = async () => { await clearStoredAuthSession(); router.replace("/login"); };

  return <>
    <header className="sticky top-0 z-40 bg-slate-950 text-white shadow-sm">
      <div className="mx-auto flex h-14 w-full max-w-[1680px] items-center gap-3 px-3 sm:px-5 lg:px-6">
        <Brand href={home} />
        <div className="hidden min-w-0 flex-1 justify-center md:flex"><MenuItems items={items} pathname={pathname} /></div>
        <div className="ml-auto flex items-center gap-1"><span className="mr-1 hidden items-center gap-1.5 text-xs text-slate-400 lg:inline-flex"><span className="size-2 rounded-full bg-emerald-400" />Operational</span><div className="[&_button]:text-slate-300 [&_button:hover]:bg-white/10 [&_button:hover]:text-white"><HeaderActions showGithubText={false} /></div><button type="button" onClick={() => void logout()} className="flex size-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white" aria-label="Sign out" title="Sign out"><LogOut className="size-4" /></button></div>
      </div>
      <div className="hide-scrollbar overflow-x-auto border-t border-white/10 md:hidden"><div className="flex min-w-max px-2 py-1"><MenuItems items={items} pathname={pathname} /></div></div>
    </header>
  </>;
}
