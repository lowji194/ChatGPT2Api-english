"use client";

import { Cloud, LoaderCircle, PlugZap, RefreshCw, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ImageStorageMode } from "@/lib/api";
import { testProxy, type ProxyTestResult } from "@/lib/api";

import { useSettingsStore } from "../store";

export function ConfigCard() {
  const [isTestingProxy, setIsTestingProxy] = useState(false);
  const [proxyTestResult, setProxyTestResult] = useState<ProxyTestResult | null>(null);
  const logLevelOptions = ["debug", "info", "warning", "error"];
  const config = useSettingsStore((state) => state.config);
  const isLoadingConfig = useSettingsStore((state) => state.isLoadingConfig);
  const isSavingConfig = useSettingsStore((state) => state.isSavingConfig);
  const setRefreshAccountIntervalMinute = useSettingsStore((state) => state.setRefreshAccountIntervalMinute);
  const setImageRetentionDays = useSettingsStore((state) => state.setImageRetentionDays);
  const setImagePollTimeoutSecs = useSettingsStore((state) => state.setImagePollTimeoutSecs);
  const setImageAccountConcurrency = useSettingsStore((state) => state.setImageAccountConcurrency);
  const setImageSettleEnabled = useSettingsStore((state) => state.setImageSettleEnabled);
  const setImageRemoveConversationAfterResult = useSettingsStore((state) => state.setImageRemoveConversationAfterResult);
  const setImageRemoveConversationAlways = useSettingsStore((state) => state.setImageRemoveConversationAlways);
  const setImageSettleSecs = useSettingsStore((state) => state.setImageSettleSecs);
  const setImageTimeoutRetrySecs = useSettingsStore((state) => state.setImageTimeoutRetrySecs);
  const setAutoRemoveInvalidAccounts = useSettingsStore((state) => state.setAutoRemoveInvalidAccounts);
  const setAutoRemoveRateLimitedAccounts = useSettingsStore((state) => state.setAutoRemoveRateLimitedAccounts);
  const setAutoReloginAfterRefresh = useSettingsStore((state) => state.setAutoReloginAfterRefresh);
  const setLogLevel = useSettingsStore((state) => state.setLogLevel);
  const setProxy = useSettingsStore((state) => state.setProxy);
  const setBaseUrl = useSettingsStore((state) => state.setBaseUrl);
  const setGlobalSystemPrompt = useSettingsStore((state) => state.setGlobalSystemPrompt);
  const setDefaultUpstreamModelName = useSettingsStore((state) => state.setDefaultUpstreamModelName);
  const setDefaultThinkingEffort = useSettingsStore((state) => state.setDefaultThinkingEffort);
  const setSensitiveWordsText = useSettingsStore((state) => state.setSensitiveWordsText);
  const setAIReviewField = useSettingsStore((state) => state.setAIReviewField);
  const setImageStorageField = useSettingsStore((state) => state.setImageStorageField);
  const testImageStorage = useSettingsStore((state) => state.testImageStorage);
  const syncImagesToWebDAV = useSettingsStore((state) => state.syncImagesToWebDAV);
  const isTestingImageStorage = useSettingsStore((state) => state.isTestingImageStorage);
  const isSyncingImageStorage = useSettingsStore((state) => state.isSyncingImageStorage);
  const saveConfig = useSettingsStore((state) => state.saveConfig);

  const handleTestProxy = async () => {
    const candidate = String(config?.proxy || "").trim();
    if (!candidate) {
      toast.error("Vui lòng nhập địa chỉ proxy trước");
      return;
    }
    setIsTestingProxy(true);
    setProxyTestResult(null);
    try {
      const data = await testProxy(candidate);
      setProxyTestResult(data.result);
      if (data.result.ok) {
        toast.success(`Proxy available (${data.result.latency_ms} ms, HTTP ${data.result.status})`);
      } else {
        toast.error(`Proxy unavailable: ${data.result.error ?? "Lỗi không xác định"}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kiểm tra proxy thất bại");
    } finally {
      setIsTestingProxy(false);
    }
  };

  if (isLoadingConfig) {
    return (
      <Card className="rounded-2xl border-border/80 bg-card/90 shadow-sm">
        <CardContent className="flex items-center justify-center p-10">
          <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/80 bg-card/90 shadow-sm">
      <CardContent className="space-y-4 p-6">
        <div className="rounded-xl border border-border bg-muted px-4 py-3 text-sm leading-6 text-foreground/80">
          {"The administrator login key continues to be read from the deployment configuration and is no longer displayed on this page; if you need to distribute it to others, please create a normal user key below."}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-foreground/80">{"Chu kỳ làm mới tài khoản"}</label>
            <Input
              value={String(config?.refresh_account_interval_minute || "")}
              onChange={(event) => setRefreshAccountIntervalMinute(event.target.value)}
              placeholder="phút"
              className="h-10 rounded-xl border-border bg-card"
            />
            <p className="text-xs text-muted-foreground">{"In minutes, control the automatic refresh frequency of the account."}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-foreground/80">Proxy toàn hệ thống</label>
            <Input
              value={String(config?.proxy || "")}
              onChange={(event) => {
                setProxy(event.target.value);
                setProxyTestResult(null);
              }}
              placeholder="http://127.0.0.1:7890"
              className="h-10 rounded-xl border-border bg-card"
            />
            <p className="text-xs leading-5 text-muted-foreground">
              Leave blank to connect directly. Supported formats include protocol://user:password@host:port and host:port:user:password. URL-encode special characters in credentials.
            </p>
            {proxyTestResult ? (
              <div
                className={`rounded-xl border px-3 py-2 text-xs leading-6 ${
                  proxyTestResult.ok
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                {proxyTestResult.ok
                  ? `Proxy available: HTTP ${proxyTestResult.status}, took ${proxyTestResult.latency_ms} ms`
                  : `Proxy unavailable: ${proxyTestResult.error ?? "Lỗi không xác định"} (took ${proxyTestResult.latency_ms} ms)`}
              </div>
            ) : null}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-xl border-border bg-card px-4 text-foreground/80"
                onClick={() => void handleTestProxy()}
                disabled={isTestingProxy}
              >
                {isTestingProxy ? <LoaderCircle className="size-4 animate-spin" /> : <PlugZap className="size-4" />}
                Test proxy
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-foreground/80">{"Địa chỉ truy cập hình ảnh"}</label>
            <Input
              value={String(config?.base_url || "")}
              onChange={(event) => setBaseUrl(event.target.value)}
              placeholder="https://example.com"
              className="h-10 rounded-xl border-border bg-card"
            />
            <p className="text-xs text-muted-foreground">{"The access prefix address used to generate image results."}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-foreground/80">{"Model thượng nguồn mặc định"}</label>
            <Input
              value={String(config?.default_upstream_model_name || "")}
              onChange={(event) => setDefaultUpstreamModelName(event.target.value)}
              placeholder="gpt-5-5"
              className="h-10 rounded-xl border-border bg-card"
            />
            <p className="text-xs text-muted-foreground">{"gpt-image-2 The upstream model name used when initiating image requests. The default is gpt-5-5."}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-foreground/80">{"Mức suy luận mặc định"}</label>
            <Select
              value={String(config?.default_thinking_effort || "auto")}
              onValueChange={(value) => setDefaultThinkingEffort(value as "auto" | "standard" | "extended" | "max")}
            >
              <SelectTrigger className="h-10 rounded-xl border-border bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">{"Auto (not delivered)"}</SelectItem>
                <SelectItem value="standard">Tiêu chuẩn</SelectItem>
                <SelectItem value="extended">Mở rộng</SelectItem>
                <SelectItem value="max">Tối đa</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{"When the model name ends in -standard, -extended, or -max, the model suffix takes precedence."}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-foreground/80">{"Tự động dọn hình ảnh"}</label>
            <Input
              value={String(config?.image_retention_days || "")}
              onChange={(event) => setImageRetentionDays(event.target.value)}
              placeholder="30"
              className="h-10 rounded-xl border-border bg-card"
            />
            <p className="text-xs text-muted-foreground">{"Automatically delete local pictures from how many days ago."}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-foreground/80">{"Thời gian chờ kết quả ảnh"}</label>
            <Input
              value={String(config?.image_poll_timeout_secs || "")}
              onChange={(event) => setImagePollTimeoutSecs(event.target.value)}
              placeholder="120"
              className="h-10 rounded-xl border-border bg-card"
            />
            <p className="text-xs text-muted-foreground">{"In seconds, the maximum time to wait for upstream image results."}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-foreground/80">{"Số tác vụ ảnh đồng thời mỗi tài khoản"}</label>
            <Input
              value={String(config?.image_account_concurrency || "")}
              onChange={(event) => setImageAccountConcurrency(event.target.value)}
              placeholder="1"
              className="h-10 rounded-xl border-border bg-card"
            />
            <p className="text-xs text-muted-foreground">{"Limit the number of image requests processed by each account at the same time, default is 3."}</p>
          </div>
          <div className="space-y-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/60 dark:bg-emerald-950/30">
              <div className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Bảo toàn tài khoản lỗi</div>
              <p className="mt-1 text-xs leading-5 text-emerald-700 dark:text-emerald-400">Tài khoản lỗi hoặc hết phiên sẽ được giữ lại và chuyển vào danh sách cần xử lý.</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <Checkbox
                checked={Boolean(config?.image_settle_enabled !== false)}
                onCheckedChange={(checked) => setImageSettleEnabled(Boolean(checked))}
              />
              <span className="text-sm text-foreground/80">{"Xác nhận kết quả ảnh lần hai"}</span>
            </div>
            <p className="text-xs text-muted-foreground">{"After opening it, the success rate of obtaining pictures can be slightly improved."}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <Checkbox
                checked={Boolean(config?.image_remove_conversation_after_result)}
                onCheckedChange={(checked) => setImageRemoveConversationAfterResult(Boolean(checked))}
              />
              <span className="text-sm text-foreground/80">{"Ẩn hội thoại sau khi tạo ảnh"}</span>
            </div>
            <p className="text-xs text-muted-foreground">{"After successfully obtaining the image, the corresponding local conversation record on the ChatGPT side is hidden asynchronously."}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <Checkbox
                checked={Boolean(config?.image_remove_conversation_always)}
                onCheckedChange={(checked) => setImageRemoveConversationAlways(Boolean(checked))}
              />
              <span className="text-sm text-foreground/80">{"Ẩn cả hội thoại không có ảnh"}</span>
            </div>
            <p className="text-xs text-muted-foreground">{"The conversation record will also be hidden when it fails, times out, or only returns text (including the successful drawing after opening)."}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-foreground/80">{"Thời gian chờ bổ sung khi tạo ảnh"}</label>
            <Input
              value={String(config?.image_timeout_retry_secs || "30")}
              onChange={(event) => setImageTimeoutRetrySecs(event.target.value)}
              placeholder="30"
              className="h-10 rounded-xl border-border bg-card"
            />
            <p className="text-xs text-muted-foreground">{"The unit is seconds, the additional waiting time after clicking \"Continue Waiting\" after timeout."}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-foreground/80">{"Thời gian chờ xác nhận kết quả ảnh"}</label>
            <Input
              value={String(config?.image_settle_secs || "2.0")}
              onChange={(event) => setImageSettleSecs(event.target.value)}
              placeholder="2.0"
              className="h-10 rounded-xl border-border bg-card disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!config?.image_settle_enabled}
            />
            <p className="text-xs text-muted-foreground">{"In seconds, how long to wait to confirm again after finding the picture. It needs to be used in conjunction with the image secondary confirmation mechanism."}</p>
          </div>
          <div className="flex gap-4 md:col-span-2">
            <div className="flex-1 space-y-2">
              <label className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground/80">
                <Checkbox
                  checked={Boolean(config?.auto_relogin_after_refresh)}
                  onCheckedChange={(checked) => setAutoReloginAfterRefresh(Boolean(checked))}
                />
                {"Tự thử khôi phục tài khoản lỗi sau khi làm mới"}
              </label>
              <p className="text-xs text-muted-foreground">{"Automatically try the password to log in and recover the account when refreshing after turning it on."}</p>
            </div>
            <div className="flex-1" aria-hidden="true" />
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900/60 dark:bg-blue-950/30">
            <div className="text-sm font-medium text-blue-800 dark:text-blue-300">Giữ lại tài khoản hết hạn mức</div>
            <p className="mt-1 text-xs leading-5 text-blue-700 dark:text-blue-400">Tài khoản sẽ tự trở lại nhóm hoạt động khi hạn mức được khôi phục.</p>
          </div>
          <div className="space-y-3 rounded-xl border border-border bg-card px-4 py-3">
            <div>
              <label className="text-sm text-foreground/80">{"Mức nhật ký hệ thống"}</label>
              <p className="mt-1 text-xs text-muted-foreground">{"Use default info/warning/error when not selected."}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {logLevelOptions.map((level) => (
                <label key={level} className="flex items-center gap-2 text-sm capitalize text-foreground/80">
                  <Checkbox
                    checked={Boolean(config?.log_levels?.includes(level))}
                    onCheckedChange={(checked) => setLogLevel(level, Boolean(checked))}
                  />
                  {level}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm text-foreground/80">{"Chỉ dẫn hệ thống bổ sung"}</label>
            <Textarea
              value={String(config?.global_system_prompt || "")}
              onChange={(event) => setGlobalSystemPrompt(event.target.value)}
              placeholder="Ví dụ: kiểm tra nội dung người dùng; từ chối yêu cầu vi phạm, khiêu dâm, bạo lực hoặc thù ghét."
              className="min-h-28 rounded-xl border-border bg-card font-mono text-xs shadow-none"
            />
            <p className="text-xs text-muted-foreground">{"Each request is injected as a system message, which can be used to review user prompts, avoid illegal content, uniformly constrain model behavior, or fix role settings."}</p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm text-foreground/80">{"Từ khóa nhạy cảm"}</label>
            <Textarea
              value={(config?.sensitive_words || []).join("\n")}
              onChange={(event) => setSensitiveWordsText(event.target.value)}
              placeholder="Mỗi dòng một từ khóa; khớp thì từ chối"
              className="min-h-28 rounded-xl border-border bg-card font-mono text-xs shadow-none"
            />
            <p className="text-xs text-muted-foreground">{"As long as the user's request contains any sensitive words, a rejection will be returned directly."}</p>
          </div>
          <div className="space-y-4 rounded-xl border border-border bg-card px-4 py-3 md:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-3 text-sm text-foreground/80">
                <Checkbox
                  checked={Boolean(config?.image_storage?.enabled)}
                  onCheckedChange={(checked) => setImageStorageField("enabled", Boolean(checked))}
                />
                {"Bật lưu ảnh qua WebDAV"}
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-xl border-border bg-card px-4 text-foreground/80"
                  onClick={() => void testImageStorage()}
                  disabled={isTestingImageStorage || !config?.image_storage?.enabled}
                >
                  {isTestingImageStorage ? <LoaderCircle className="size-4 animate-spin" /> : <Cloud className="size-4" />}
                  {"Kiểm tra WebDAV"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-xl border-border bg-card px-4 text-foreground/80"
                  onClick={() => void syncImagesToWebDAV()}
                  disabled={isSyncingImageStorage || !config?.image_storage?.enabled || config?.image_storage?.mode === "local"}
                >
                  {isSyncingImageStorage ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                  {"Đồng bộ toàn bộ"}
                </Button>
              </div>
            </div>
            <p className="text-xs leading-6 text-muted-foreground">
              {"Only this new image is processed during generation; full synchronization is used to transfer existing local images to WebDAV."}
            </p>
            <div className="rounded-lg border border-border bg-muted px-3 py-2 text-xs text-foreground/80">
              {"Current mode to be saved:"}
              <span className="ml-1 font-medium text-foreground">
                {config?.image_storage?.enabled
                  ? config.image_storage.mode === "both"
                    ? "Máy chủ + WebDAV"
                    : config.image_storage.mode === "webdav"
                      ? "Chỉ WebDAV"
                      : "Chỉ lưu trên máy chủ"
                  : "Chỉ lưu trên máy chủ"}
              </span>
              <span className="ml-2 text-muted-foreground">{"After modification, you need to click Save, or save automatically through the Test/Sync button."}</span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm text-foreground/80">{"Chế độ lưu"}</label>
                <Select
                  value={String(config?.image_storage?.mode || "local")}
                  onValueChange={(value) => setImageStorageField("mode", value as ImageStorageMode)}
                  disabled={!config?.image_storage?.enabled}
                >
                  <SelectTrigger className="h-10 rounded-xl border-border bg-card shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">{"Chỉ lưu trên máy chủ"}</SelectItem>
                    <SelectItem value="webdav">{"Chỉ WebDAV"}</SelectItem>
                    <SelectItem value="both">{"Máy chủ + WebDAV"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-foreground/80">WebDAV URL</label>
                <Input
                  value={String(config?.image_storage?.webdav_url || "")}
                  onChange={(event) => setImageStorageField("webdav_url", event.target.value)}
                  placeholder="https://example.com/dav"
                  className="h-10 rounded-xl border-border bg-card"
                  disabled={!config?.image_storage?.enabled}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-foreground/80">{"Tên đăng nhập"}</label>
                <Input
                  value={String(config?.image_storage?.webdav_username || "")}
                  onChange={(event) => setImageStorageField("webdav_username", event.target.value)}
                  className="h-10 rounded-xl border-border bg-card"
                  disabled={!config?.image_storage?.enabled}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-foreground/80">{"password"}</label>
                <Input
                  type="password"
                  value={String(config?.image_storage?.webdav_password || "")}
                  onChange={(event) => setImageStorageField("webdav_password", event.target.value)}
                  className="h-10 rounded-xl border-border bg-card"
                  disabled={!config?.image_storage?.enabled}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-foreground/80">{"Thư mục từ xa"}</label>
                <Input
                  value={String(config?.image_storage?.webdav_root_path || "")}
                  onChange={(event) => setImageStorageField("webdav_root_path", event.target.value)}
                  placeholder="chatgpt2api/images"
                  className="h-10 rounded-xl border-border bg-card"
                  disabled={!config?.image_storage?.enabled}
                />
              </div>
              <div className="space-y-2 md:col-span-3">
                <label className="text-sm text-foreground/80">{"public access prefix"}</label>
                <Input
                  value={String(config?.image_storage?.public_base_url || "")}
                  onChange={(event) => setImageStorageField("public_base_url", event.target.value)}
                  placeholder="https://cdn.example.com/chatgpt2api/images"
                  className="h-10 rounded-xl border-border bg-card"
                  disabled={!config?.image_storage?.enabled}
                />
                <p className="text-xs text-muted-foreground">{"If left blank, it will return to the /images/... proxy address of this application; after filling it in, it will directly return to the public image address."}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 rounded-xl border border-border bg-card px-4 py-3 md:col-span-2">
            <label className="flex items-center gap-3 text-sm text-foreground/80">
              <Checkbox
                checked={Boolean(config?.ai_review?.enabled)}
                onCheckedChange={(checked) => setAIReviewField("enabled", Boolean(checked))}
              />
              {"Bật kiểm duyệt AI"}
            </label>
            <p className="text-xs leading-6 text-muted-foreground">
              {"After being turned on, the review model will be called before requesting to enter the account. If the review does not pass, the review will be directly rejected, reducing the risk of illegal prompt words reaching the account, causing risk control or account suspension."}
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm text-foreground/80">Địa chỉ dịch vụ</label>
                <Input value={String(config?.ai_review?.base_url || "")} onChange={(event) => setAIReviewField("base_url", event.target.value)} placeholder="https://api.openai.com" className="h-10 rounded-xl border-border bg-card" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-foreground/80">Khóa API</label>
                <Input value={String(config?.ai_review?.api_key || "")} onChange={(event) => setAIReviewField("api_key", event.target.value)} placeholder="sk-..." className="h-10 rounded-xl border-border bg-card" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-foreground/80">Model</label>
                <Input value={String(config?.ai_review?.model || "")} onChange={(event) => setAIReviewField("model", event.target.value)} placeholder="gpt-5.4-mini" className="h-10 rounded-xl border-border bg-card" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-foreground/80">{"Nội dung hướng dẫn kiểm duyệt"}</label>
              <Textarea value={String(config?.ai_review?.prompt || "")} onChange={(event) => setAIReviewField("prompt", event.target.value)} placeholder="Xác định yêu cầu có được phép hay không. Chỉ trả lời ALLOW hoặc REJECT." className="min-h-24 rounded-xl border-border bg-card text-xs shadow-none" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            className="h-10 rounded-xl bg-slate-950 px-5 text-white hover:bg-slate-800"
            onClick={() => void saveConfig()}
            disabled={isSavingConfig}
          >
            {isSavingConfig ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
            {"save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
