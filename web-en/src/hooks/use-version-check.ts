"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import webConfig from "@/constants/common-env";
import type { ReleaseInfo } from "@/lib/release";

const latestVersionUrl =
  "https://raw.githubusercontent.com/lowji194/ChatGPT2Api-english/main/VERSION";
function readLocalReleases(): ReleaseInfo[] {
  return JSON.parse(process.env.NEXT_PUBLIC_APP_RELEASES || "[]");
}

function toVersionParts(version: string) {
  const match = version.trim().match(/^v?(\d+)\.(\d+)\.(\d+)/);
  return match ? match.slice(1).map(Number) : null;
}

function isNewerVersion(latestVersion: string, currentVersion: string) {
  const latest = toVersionParts(latestVersion);
  const current = toVersionParts(currentVersion);
  if (!latest || !current) return false;
  return latest.some(
    (value, index) =>
      value > current[index] &&
      latest.slice(0, index).every((part, prevIndex) => part === current[prevIndex]),
  );
}

export function useVersionCheck() {
  const currentVersion = webConfig.appVersion;
  const localReleases = useMemo(readLocalReleases, []);
  const [latestVersion, setLatestVersion] = useState(currentVersion);
  const [releases, setReleases] = useState<ReleaseInfo[]>(localReleases);
  const [checking, setChecking] = useState(false);
  const [open, setOpen] = useState(false);
  const hasNewVersion = isNewerVersion(latestVersion, currentVersion);

  const checkLatestRelease = useCallback(
    async (showMessage = false) => {
      setChecking(true);
      try {
        const versionResponse = await fetch(latestVersionUrl);
        if (!versionResponse.ok) throw new Error();
        const version = await versionResponse.text();
        setLatestVersion(version.trim() || currentVersion);
        setReleases(localReleases);
        if (showMessage) toast.success("Latest version information loaded");
      } catch {
        setLatestVersion(currentVersion);
        setReleases(localReleases);
        if (showMessage) toast.error("Unable to load latest version information");
      } finally {
        setChecking(false);
      }
    },
    [currentVersion, localReleases],
  );

  const openReleaseModal = () => {
    setOpen(true);
    void checkLatestRelease();
  };

  return {
    open,
    setOpen,
    openReleaseModal,
    latestVersion,
    releases,
    checking,
    hasNewVersion,
    checkLatestRelease,
  };
}
