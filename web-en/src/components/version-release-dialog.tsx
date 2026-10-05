"use client";

import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import webConfig from "@/constants/common-env";
import { useVersionCheck } from "@/hooks/use-version-check";
import { cn } from "@/lib/utils";

function typeVariant(type: string): "success" | "danger" | "info" | "violet" | "outline" {
  if (type === "Added") return "success";
  if (type === "Fixed") return "danger";
  if (type === "Changed") return "info";
  if (type === "Improved") return "violet";
  return "outline";
}

export function VersionReleaseDialog({ className }: { className?: string }) {
  const {
    open,
    setOpen,
    openReleaseModal,
    latestVersion,
    releases,
    checking,
    hasNewVersion,
    checkLatestRelease,
  } = useVersionCheck();

  return (
    <>
      <button
        type="button"
        className={cn(
          "relative inline-flex h-9 cursor-pointer items-center rounded-lg px-2 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-card/[0.08] dark:hover:text-white",
          className,
        )}
        onClick={openReleaseModal}
        title="View version details"
      >
        v{webConfig.appVersion}
        {hasNewVersion ? (
          <span className="absolute -top-1 -right-1 size-2 rounded-full bg-emerald-500" />
        ) : null}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[min(94vw,680px)] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Version details</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <VersionCard label="Current version" value={webConfig.appVersion} />
            <VersionCard
              label="Latest version"
              value={latestVersion}
              action={
                <button
                  type="button"
                  className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground/80 hover:underline dark:hover:text-slate-200"
                  onClick={() => void checkLatestRelease(true)}
                >
                  {checking ? "Checking..." : "Check for updates"}
                </button>
              }
            />
          </div>
          <div className="max-h-[56vh] space-y-5 overflow-y-auto pr-1">
            {releases.map((release) => (
              <div key={release.version} className="border-l border-border pl-4 dark:border-border/10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground dark:text-slate-100">
                    {release.version === "Unreleased" ? "Unreleased" : release.version}
                  </span>
                  <span className="text-xs text-muted-foreground dark:text-muted-foreground">{release.date}</span>
                  {release.version === latestVersion ? <Badge variant="success">Latest</Badge> : null}
                  {release.version === webConfig.appVersion ? <Badge variant="outline">Current</Badge> : null}
                </div>
                <div className="mt-2 space-y-1.5">
                  {release.items.map((item, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm leading-6 text-foreground/80 dark:text-muted-foreground">
                      <Badge variant={typeVariant(item.type)} className="mt-0.5 shrink-0">
                        {item.type}
                      </Badge>
                      <span className="min-w-0 flex-1">{item.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="https://github.com/lowji194/ChatGPT2Api-english" target="_blank" rel="noreferrer">
              View project on GitHub
            </a>
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

function VersionCard({
  label,
  value,
  action,
}: {
  label: string;
  value: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/55 p-3 dark:border-border/10 dark:bg-card/5">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground dark:text-muted-foreground">{label}</div>
        {action}
      </div>
      <div className="mt-1 text-base font-semibold text-foreground dark:text-slate-100">{value}</div>
    </div>
  );
}
