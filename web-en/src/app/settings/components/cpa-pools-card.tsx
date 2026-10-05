"use client";

import { Import, LoaderCircle, Pencil, Plus, ServerCog, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useSettingsStore } from "../store";

export function CPAPoolsCard() {
  const pools = useSettingsStore((state) => state.pools);
  const isLoadingPools = useSettingsStore((state) => state.isLoadingPools);
  const deletingId = useSettingsStore((state) => state.deletingId);
  const loadingFilesId = useSettingsStore((state) => state.loadingFilesId);
  const openAddDialog = useSettingsStore((state) => state.openAddDialog);
  const openEditDialog = useSettingsStore((state) => state.openEditDialog);
  const deletePool = useSettingsStore((state) => state.deletePool);
  const browseFiles = useSettingsStore((state) => state.browseFiles);

  return (
    <Card className="rounded-2xl border-border/80 bg-card/90 shadow-sm">
      <CardContent className="space-y-6 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
              <ServerCog className="size-5 text-foreground/80" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{"CPA connection management"}</h2>
              <p className="text-sm text-muted-foreground">{"First configure the connection, then query the remote account as needed and choose to import it to the local account pool."}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pools.length > 0 ? <Badge className="rounded-md px-2.5 py-1">{pools.length} {"connections"}</Badge> : null}
            <Button className="h-9 rounded-xl bg-slate-950 px-4 text-white hover:bg-slate-800" onClick={openAddDialog}>
              <Plus className="size-4" />
              {"Add connection"}
            </Button>
          </div>
        </div>

        {isLoadingPools ? (
          <div className="flex items-center justify-center py-10">
            <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : pools.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-muted px-6 py-10 text-center">
            <ServerCog className="size-8 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground/80">{"No CPA connection yet"}</p>
              <p className="text-sm text-muted-foreground">{"Click \"Add Connection\" to save your CLIProxyAPI information."}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {pools.map((pool) => {
              const isBusy = deletingId === pool.id || loadingFilesId === pool.id;
              const importJob = pool.import_job ?? null;
              const progress = importJob?.total
                ? Math.round((importJob.completed / importJob.total) * 100)
                : 0;

              return (
                <div key={pool.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground">{pool.name || pool.base_url}</div>
                      <div className="truncate text-xs text-muted-foreground">{pool.base_url}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground/80"
                        onClick={() => openEditDialog(pool)}
                        disabled={isBusy}
                        title="edit"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-muted-foreground transition hover:bg-rose-50 hover:text-rose-500"
                        onClick={() => void deletePool(pool)}
                        disabled={isBusy}
                        title="delete"
                      >
                        {deletingId === pool.id ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="h-8 rounded-lg border-border bg-card px-3 text-xs text-foreground/80"
                      onClick={() => void browseFiles(pool)}
                      disabled={isBusy}
                    >
                      {loadingFilesId === pool.id ? (
                        <LoaderCircle className="size-3.5 animate-spin" />
                      ) : (
                        <Import className="size-3.5" />
                      )}
                      {"synchronous"}
                    </Button>
                  </div>

                  {importJob ? (
                    <div className="space-y-2 rounded-xl bg-muted px-3 py-3">
                      <div className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">{"Import tasks"}</div>
                      <div className="rounded-lg border border-border bg-card px-3 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground/80">
                              {"state"} {importJob.status}{", processed"} {importJob.completed}/{importJob.total}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {"Task"} {importJob.job_id.slice(0, 8)} · {importJob.created_at}
                            </div>
                          </div>
                          <Badge
                            variant={
                              importJob.status === "completed"
                                ? "success"
                                : importJob.status === "failed"
                                  ? "danger"
                                  : "info"
                            }
                            className="rounded-md"
                          >
                            {progress}%
                          </Badge>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>{"New"} {importJob.added}</span>
                          <span>{"jump over"} {importJob.skipped}</span>
                          <span>{"refresh"} {importJob.refreshed}</span>
                          <span>{"fail"} {importJob.failed}</span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        <div className="rounded-xl bg-muted px-4 py-3 text-sm leading-6 text-muted-foreground">
          <p className="font-medium text-foreground/80">{"Instructions for use"}</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            <li>{"After entering the page, it first reads the configured CPA connection in the system."}</li>
            <li>{"After clicking \"Sync\" on a certain connection, the remote account list will be read first and displayed to the front-end for selection."}</li>
            <li>{"After confirming the selection, the backend downloads the corresponding access_token and imports it into the local account pool."}</li>
            <li>{"The front end only polls the import progress and does not directly participate in the download."}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
