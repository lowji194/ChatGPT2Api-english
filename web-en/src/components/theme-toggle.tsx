"use client";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export function ThemeToggle() {
  return (
    <AnimatedThemeToggler
      aria-label="Switch theme"
      title="Switch theme"
      variant="circle"
      className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-card/[0.08] dark:hover:text-white [&_svg]:size-4"
    />
  );
}
