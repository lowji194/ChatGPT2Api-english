"use client";

import { useEffect, useRef, useState } from "react";
import {
  LoaderCircle,
  PlugZap,
  Save,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  fetchProxy,
  testProxy,
  updateProxy,
  type ProxySettings,
  type ProxyTestResult,
} from "@/lib/api";

export function ProxySettingsCard() {
  const didLoadRef = useRef(false);
  const [settings, setSettings] = useState<ProxySettings>({ enabled: false, url: "" });
  const [formUrl, setFormUrl] = useState("");
  const [formEnabled, setFormEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ProxyTestResult | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await fetchProxy();
      setSettings(data.proxy);
      setFormUrl(data.proxy.url);
      setFormEnabled(data.proxy.enabled);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải cấu hình proxy");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (didLoadRef.current) {
      return;
    }
    didLoadRef.current = true;
    void load();
  }, []);

  const urlChanged = formUrl.trim() !== settings.url;
  const enabledChanged = formEnabled !== settings.enabled;
  const dirty = urlChanged || enabledChanged;

  const handleSave = async () => {
    if (formEnabled && !formUrl.trim()) {
      toast.error("Phải nhập địa chỉ proxy khi bật proxy");
      return;
    }
    setIsSaving(true);
    try {
      const payload: { enabled?: boolean; url?: string } = {};
      if (enabledChanged) payload.enabled = formEnabled;
      if (urlChanged) payload.url = formUrl.trim();
      const data = await updateProxy(payload);
      setSettings(data.proxy);
      setFormUrl(data.proxy.url);
      setFormEnabled(data.proxy.enabled);
      toast.success("Đã lưu cấu hình proxy");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lưu thất bại");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    const candidate = formUrl.trim();
    if (!candidate) {
      toast.error("Vui lòng nhập địa chỉ proxy trước");
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const data = await testProxy(candidate);
      setTestResult(data.result);
      if (data.result.ok) {
        toast.success(`Proxy available (${data.result.latency_ms} ms, HTTP ${data.result.status})`);
      } else {
        toast.error(`Proxy unavailable: ${data.result.error ?? "Lỗi không xác định"}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kiểm tra proxy thất bại");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="rounded-2xl border-border/80 bg-card/90 shadow-sm">
      <CardContent className="space-y-6 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
              <Wifi className="size-5 text-foreground/80" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{"Cấu hình proxy thượng nguồn"}</h2>
              <p className="text-sm text-muted-foreground">
                Configure the outbound proxy used for chatgpt.com requests. Sub2API and CPA requests are not affected.
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <input
                type="checkbox"
                className="mt-1 size-4 rounded border-border text-foreground focus:ring-slate-900"
                checked={formEnabled}
                onChange={(event) => setFormEnabled(event.target.checked)}
              />
              <div className="space-y-0.5">
                <div className="text-sm font-medium text-foreground">{"Bật proxy"}</div>
                <div className="text-sm text-muted-foreground">
                  {"After closing, chatgpt.com requests will be connected directly. It will take effect immediately after saving, no need to restart."}
                </div>
              </div>
            </label>

            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                <PlugZap className="size-3.5" />
                {"Địa chỉ proxy"}
              </label>
              <Input
                value={formUrl}
                onChange={(event) => setFormUrl(event.target.value)}
                placeholder="http://user:pass@host:port or socks5://host:port"
                className="h-11 rounded-xl border-border bg-card font-mono text-xs"
              />
              <div className="text-xs text-muted-foreground">
                {"Hỗ trợ"} <code className="font-mono">http / https / socks4 / socks5 / socks5h</code>。
              </div>
            </div>

            {testResult ? (
              <div
                className={`rounded-xl border px-4 py-3 text-sm leading-6 ${
                  testResult.ok
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                {testResult.ok ? (
                  <>
                    {"Proxy khả dụng: HTTP"} {testResult.status}{", time"} {testResult.latency_ms} ms
                  </>
                ) : (
                  <>Proxy unavailable: {testResult.error ?? "Lỗi không xác định"} (took {testResult.latency_ms} ms)</>
                )}
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <Button
                className="h-10 rounded-xl bg-slate-950 px-5 text-white hover:bg-slate-800"
                onClick={() => void handleSave()}
                disabled={isSaving || !dirty}
              >
                {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
                {"save"}
              </Button>
              <Button
                variant="outline"
                className="h-10 rounded-xl border-border bg-card px-5 text-foreground/80"
                onClick={() => void handleTest()}
                disabled={isTesting}
              >
                {isTesting ? <LoaderCircle className="size-4 animate-spin" /> : <PlugZap className="size-4" />}
                {"Kiểm tra kết nối"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
