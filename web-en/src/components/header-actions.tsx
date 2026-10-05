"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { VersionReleaseDialog } from "@/components/version-release-dialog";
import { cn } from "@/lib/utils";

export function HeaderActions({ className, showGithubText = true }: { className?: string; showGithubText?: boolean }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <ThemeToggle />
      <a
        href="https://github.com/lowji194/ChatGPT2Api-english"
        target="_blank"
        rel="noreferrer"
        className="inline-flex size-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg text-sm text-current transition hover:bg-black/10 hover:text-current dark:hover:bg-white/10"
        aria-label="GitHub repository"
      >
        <svg viewBox="0 0 24 24" className="size-[18px] fill-current" aria-hidden="true">
          <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.52-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.38.97.1-.75.4-1.27.74-1.56-2.57-.29-5.27-1.29-5.27-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.16 1.18a10.96 10.96 0 0 1 5.76 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.42-2.71 5.39-5.29 5.68.42.36.79 1.07.79 2.16v3.2c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
        </svg>
        {showGithubText ? <span className="hidden sm:inline">GitHub</span> : null}
      </a>
      <VersionReleaseDialog />
    </div>
  );
}
