"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  FileJson,
  FileText,
  Files,
  KeyRound,
  LoaderCircle,
  LogIn,
  ServerCog,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  createAccounts,
  finishOAuthLogin,
  startOAuthLogin,
  type Account,
  type AccountImportPayload,
  type OAuthLoginStartResponse,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type ImportMethod = "menu" | "token" | "session" | "codex-auth" | "account-json" | "oauth";

type AccountImportDialogProps = {
  disabled?: boolean;
  onImported: (items: Account[]) => void;
};

type PendingAccountJsonImport = {
  tokens: string[];
  accounts: AccountImportPayload[];
  parsedAccountCount: number;
  errorCount: number;
};

const sessionUrl = "https://chatgpt.com/api/auth/session";

function splitTokens(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getSessionAccessToken(value: unknown) {
  const token = (value as { accessToken?: unknown })?.accessToken;
  return typeof token === "string" ? token.trim() : "";
}

function getAccountJsonAccount(value: unknown): AccountImportPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const raw = value as Record<string, unknown>;
  const tokenValue = raw.access_token ?? raw.accessToken;
  const token = typeof tokenValue === "string" ? tokenValue.trim() : "";
  if (!token) {
    return null;
  }

  const payload: AccountImportPayload = {
    ...raw,
    access_token: token,
    source_type: "codex",
  };
  delete payload.accessToken;
  if (payload.type === "codex") {
    payload.export_type = "codex";
    delete payload.type;
  }
  return payload;
}

function getAccountJsonAccounts(value: unknown): AccountImportPayload[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => getAccountJsonAccount(item))
      .filter((item): item is AccountImportPayload => Boolean(item));
  }

  const singleAccount = getAccountJsonAccount(value);
  if (singleAccount) {
    return [singleAccount];
  }

  if (value && typeof value === "object") {
    const raw = value as Record<string, unknown>;
    const nested = raw.accounts ?? raw.items;
    if (Array.isArray(nested)) {
      return nested
        .map((item) => getAccountJsonAccount(item))
        .filter((item): item is AccountImportPayload => Boolean(item));
    }
  }

  return [];
}

function getCodexAuthAccount(value: unknown): AccountImportPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const raw = value as Record<string, unknown>;
  const tokenValue = raw.access_token ?? raw.accessToken;
  const token = typeof tokenValue === "string" ? tokenValue.trim() : "";
  if (!token) {
    return null;
  }

  const payload: AccountImportPayload = {
    ...raw,
    access_token: token,
    export_type: "codex",
    source_type: "codex",
  };
  delete payload.accessToken;
  if (payload.type === "codex") {
    delete payload.type;
  }
  return payload;
}

function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error(`Failed to read file: ${file.name}`));
    reader.readAsText(file);
  });
}

function MethodCard({
  title,
  description,
  icon: Icon,
  onClick,
  tone = "surface-blue",
}: {
  title: string;
  description: string;
  icon: typeof KeyRound;
  onClick: () => void;
  tone?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("w-full rounded-xl border p-0 text-left transition hover:-translate-y-0.5 hover:shadow-md", tone)}
    >
      <Card className="rounded-xl border-0 bg-transparent shadow-none">
        <CardContent className="flex items-start gap-3 p-3.5">
          <div className="rounded-lg bg-white/70 p-2.5 text-current dark:bg-white/10">
            <Icon className="size-5" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-semibold text-foreground">{title}</div>
            <div className="text-sm leading-6 text-muted-foreground">{description}</div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

export function AccountImportDialog({ disabled, onImported }: AccountImportDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<ImportMethod>("menu");
  const [tokenInput, setTokenInput] = useState("");
  const [sessionInput, setSessionInput] = useState("");
  const [codexAuthInput, setCodexAuthInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAccountJsonImport, setPendingAccountJsonImport] = useState<PendingAccountJsonImport | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [oauthEmailHint, setOauthEmailHint] = useState("");
  const [oauthSession, setOauthSession] = useState<OAuthLoginStartResponse | null>(null);
  const [oauthCallbackInput, setOauthCallbackInput] = useState("");
  const [oauthStarting, setOauthStarting] = useState(false);

  const txtInputRef = useRef<HTMLInputElement | null>(null);
  const accountJsonInputRef = useRef<HTMLInputElement | null>(null);

  const resetState = () => {
    setMethod("menu");
    setTokenInput("");
    setSessionInput("");
    setCodexAuthInput("");
    setPendingAccountJsonImport(null);
    setConfirmOpen(false);
    setOauthEmailHint("");
    setOauthSession(null);
    setOauthCallbackInput("");
    setOauthStarting(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetState();
    }
  };

  const submitTokens = async (tokens: string[], successText?: string, accountPayloads: AccountImportPayload[] = []) => {
    const normalizedTokens = tokens.map((item) => item.trim()).filter(Boolean);

    if (normalizedTokens.length === 0) {
      toast.error("Vui lòng nhập ít nhất một token hợp lệ");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await createAccounts(normalizedTokens, accountPayloads);
      onImported(data.items);
      setOpen(false);
      resetState();

      if ((data.errors?.length ?? 0) > 0) {
        const firstError = data.errors?.[0]?.error;
        toast.error(
          `${successText ?? "Hoàn tất nhập tài khoản"}: thêm mới ${data.added ?? 0}, cập nhật ${data.updated ?? 0}, làm mới ${data.refreshed ?? 0}, lỗi ${data.errors?.length ?? 0}${firstError ? `. Lỗi đầu tiên: ${firstError}` : ""}`,
        );
      } else {
        toast.success(
          `${successText ?? "Hoàn tất nhập tài khoản"}: thêm mới ${data.added ?? 0}, cập nhật ${data.updated ?? 0}; thông tin tài khoản đã được làm mới`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể nhập tài khoản";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportTokenText = async () => {
    await submitTokens(splitTokens(tokenInput), "Đã xử lý Access Token");
  };

  // 起授权：拿 authorize URL，立刻在新窗口打开，方便用户登录
  const handleStartOAuth = async () => {
    setOauthStarting(true);
    try {
      const data = await startOAuthLogin(oauthEmailHint.trim());
      setOauthSession(data);
      setOauthCallbackInput("");
      if (typeof window !== "undefined") {
        window.open(data.authorize_url, "_blank", "noopener,noreferrer");
      }
      toast.success("Đã mở trang cấp quyền OpenAI. Sau khi đăng nhập, hãy sao chép URL callback và dán lại đây.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể khởi tạo OAuth";
      toast.error(message);
    } finally {
      setOauthStarting(false);
    }
  };

  // 用粘贴回来的 callback URL 完成换 token + 落盘
  const handleFinishOAuth = async () => {
    if (!oauthSession) {
      toast.error("Vui lòng mở trang cấp quyền trước để tạo phiên");
      return;
    }
    const trimmed = oauthCallbackInput.trim();
    if (!trimmed) {
      toast.error("Vui lòng dán callback URL hoặc mã code");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await finishOAuthLogin(oauthSession.session_id, trimmed);
      onImported(data.items);
      setOpen(false);
      resetState();

      if ((data.errors?.length ?? 0) > 0) {
        const firstError = data.errors?.[0]?.error;
        toast.error(
          `Hoàn tất đăng nhập OAuth: thêm mới ${data.added ?? 0}, cập nhật ${data.updated ?? 0}, làm mới ${data.refreshed ?? 0}, lỗi ${data.errors?.length ?? 0}${firstError ? `. Lỗi đầu tiên: ${firstError}` : ""}`,
        );
      } else {
        toast.success(
          `Hoàn tất đăng nhập OAuth: thêm mới ${data.added ?? 0}, cập nhật ${data.updated ?? 0}; thông tin tài khoản đã được làm mới`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể đổi token OAuth";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 复制 authorize URL 到剪贴板（适配浏览器和 fallback）
  const handleCopyAuthorizeUrl = async () => {
    if (!oauthSession) {
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(oauthSession.authorize_url);
        toast.success("Đã sao chép URL cấp quyền");
      } else {
        toast.error("Môi trường hiện tại không hỗ trợ sao chép tự động, vui lòng chọn và sao chép thủ công.");
      }
    } catch {
      toast.error("Sao chép thất bại, vui lòng chọn và sao chép thủ công");
    }
  };

  const handleTxtSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const content = await readFileAsText(file);
      const tokens = splitTokens(content);

      if (tokens.length === 0) {
        toast.error("Không đọc được token hợp lệ trong tệp TXT.");
        return;
      }

      setTokenInput((prev) => {
        const next = [...splitTokens(prev), ...tokens];
        return next.join("\n");
      });
      toast.success(`${tokens.length} Tokens read from ${file.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to read TXT file";
      toast.error(message);
    }
  };

  const handleImportSessionJson = async () => {
    if (!sessionInput.trim()) {
      toast.error("Vui lòng dán Session JSON đầy đủ");
      return;
    }

    try {
      const payload = JSON.parse(sessionInput) as unknown;
      const token = getSessionAccessToken(payload);

      if (!token) {
        toast.error("Không tìm thấy accessToken trong Session JSON");
        return;
      }

      await submitTokens([token], "Đã xử lý Session JSON");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Session JSON parsing failed";
      toast.error(message);
    }
  };

  const handleImportCodexAuthJson = async () => {
    if (!codexAuthInput.trim()) {
      toast.error("Vui lòng dán JSON xác thực Codex");
      return;
    }

    try {
      const payload = JSON.parse(codexAuthInput) as unknown;
      const account = getCodexAuthAccount(payload);

      if (!account) {
        toast.error("Không tìm thấy access_token trong JSON xác thực Codex");
        return;
      }

      await submitTokens([account.access_token], "Đã xử lý JSON xác thực Codex", [account]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Codex authentication JSON parsing failed";
      toast.error(message);
    }
  };

  const handleAccountJsonSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    try {
      const results = await Promise.all(
        files.map(async (file) => {
          const raw = await readFileAsText(file);
          const parsed = JSON.parse(raw) as unknown;
          const accounts = getAccountJsonAccounts(parsed);
          return {
            accounts,
          };
        }),
      );

      const accounts = results.flatMap((item) => item.accounts);
      const tokens = accounts.map((item) => item.access_token);
      const parsedAccountCount = accounts.length;
      const errorCount = results.filter((item) => item.accounts.length === 0).length;

      if (parsedAccountCount === 0) {
        toast.error("Không đọc được access_token hợp lệ trong các tệp JSON");
        return;
      }

      setPendingAccountJsonImport({
        tokens,
        accounts,
        parsedAccountCount,
        errorCount,
      });
      setConfirmOpen(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to read account JSON file";
      toast.error(message);
    }
  };

  const renderMethodBody = () => {
    if (method === "token") {
      const tokenCount = splitTokens(tokenInput).length;

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMethod("menu")}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              {"Quay lại cách nhập"}
            </button>
            <span className="text-xs text-muted-foreground">{"Đã nhận diện"} {tokenCount} {"Token"}</span>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">{"Danh sách Access Token"}</label>
            <Textarea
              placeholder="Mỗi dòng một Access Token..."
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              className="min-h-56 resize-none rounded-xl border-border"
            />
          </div>
          <div className="rounded-2xl border border-dashed border-border bg-muted p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium text-foreground">{"Nhập từ tệp TXT"}</div>
                <div className="text-sm leading-6 text-muted-foreground">{"Hỗ trợ tệp `.txt`, mỗi dòng chứa một token."}</div>
              </div>
              <Button
                type="button"
                variant="info"
                onClick={() => txtInputRef.current?.click()}
                disabled={isSubmitting}
              >
                <FileText className="size-4" />
                {"Chọn tệp TXT"}
              </Button>
            </div>
          </div>
          <input
            ref={txtInputRef}
            type="file"
            accept=".txt,text/plain"
            className="hidden"
            onChange={(event) => void handleTxtSelected(event)}
          />
        </div>
      );
    }

    if (method === "session") {
      return (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setMethod("menu")}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {"Quay lại cách nhập"}
          </button>
          <div className="rounded-2xl border border-border bg-muted p-4 text-sm leading-6 text-foreground/80">
            {"Mở"}
            {" "}
            <a
              href={sessionUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-4"
            >
              {sessionUrl}
              <ExternalLink className="size-3.5" />
            </a>
            {", copy the complete JSON returned by the page, and the system will automatically extract the `accessToken` import."}
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <div className="font-medium">{"Cảnh báo rủi ro"}</div>
            <div>
              {"Không nên dùng tài khoản cá nhân quan trọng. Hãy cân nhắc rủi ro khóa tài khoản trước khi nhập."}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Session JSON</label>
            <Textarea
              placeholder='Paste the complete JSON, e.g. the object containing "accessToken"...'
              value={sessionInput}
              onChange={(event) => setSessionInput(event.target.value)}
              className="min-h-56 resize-none rounded-xl border-border font-mono text-xs"
            />
          </div>
        </div>
      );
    }

    if (method === "oauth") {
      return (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setMethod("menu")}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {"Quay lại cách nhập"}
          </button>
          <div className="rounded-2xl border border-border bg-muted p-4 text-sm leading-6 text-foreground/80 space-y-2">
            <div className="font-medium text-foreground">{"Các bước thực hiện"}</div>
            <ol className="list-decimal pl-5 space-y-1">
              <li>{"(Optional) Fill in the email address of your ChatGPT account, and the login page will be pre-filled."}</li>
              <li>{"Click \"Open Authorization Page\" below and log in to your ChatGPT account in a new tab."}</li>
              <li>{"Sau khi đăng nhập, trình duyệt sẽ chuyển đến"} <code className="rounded bg-muted px-1">platform.openai.com/auth/callback?code=...</code>{". Sao chép ngay toàn bộ URL trên thanh địa chỉ, hoặc mở F12, tìm dòng callback trong Network rồi chọn Copy URL."}</li>
              <li>{"Paste the callback URL into the input box below and click \"Complete Import\"."}</li>
            </ol>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">{"Email (không bắt buộc)"}</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={oauthEmailHint}
              onChange={(event) => setOauthEmailHint(event.target.value)}
              disabled={Boolean(oauthSession) || oauthStarting}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-border"
            />
          </div>
          {!oauthSession ? (
            <Button
              type="button"
              variant="info"
              className="h-10"
              onClick={() => void handleStartOAuth()}
              disabled={oauthStarting}
            >
              {oauthStarting ? <LoaderCircle className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
              {"Mở trang cấp quyền"}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="rounded-2xl border border-border bg-card p-3 text-xs leading-6 text-foreground/80 break-all font-mono">
                {oauthSession.authorize_url}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-border bg-card"
                  onClick={() => void handleCopyAuthorizeUrl()}
                >
                  <Copy className="size-4" />
                  {"Sao chép URL cấp quyền"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-border bg-card"
                  onClick={() => window.open(oauthSession.authorize_url, "_blank", "noopener,noreferrer")}
                >
                  <ExternalLink className="size-4" />
                  {"Mở lại"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-border bg-card"
                  onClick={() => {
                    setOauthSession(null);
                    setOauthCallbackInput("");
                  }}
                >
                  {"Tạo lại"}
                </Button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">{"Dán callback URL hoặc mã code"}</label>
                <Textarea
                  placeholder={"https://platform.openai.com/auth/callback?code=...&state=..."}
                  value={oauthCallbackInput}
                  onChange={(event) => setOauthCallbackInput(event.target.value)}
                  className="min-h-24 resize-none rounded-xl border-border font-mono text-xs"
                />
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <div className="font-medium">{"Lưu ý"}</div>
            <div>
              {"The authorization code (code) can only be used once. If the browser's callback page is loaded and an OpenAI error page is displayed, the code has most likely been consumed.\n              Please click \"Regenerate\" to try again. The entire process can be completed in less than 10 minutes."}
            </div>
          </div>
        </div>
      );
    }

    if (method === "account-json") {
      return (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setMethod("menu")}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {"Quay lại cách nhập"}
          </button>
          <div className="rounded-2xl border border-dashed border-border bg-muted p-5">
            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">{"Chọn tệp JSON tài khoản"}</div>
              <div className="text-sm leading-6 text-muted-foreground">
                {"Hỗ trợ một tài khoản hoặc mảng tài khoản xuất từ hệ thống, đồng thời tương thích JSON CPA. Hệ thống tự lấy `access_token` hoặc `accessToken`."}
              </div>
            </div>
            <Button
              type="button"
              className="mt-4 rounded-xl bg-slate-950 text-white hover:bg-slate-800"
              onClick={() => accountJsonInputRef.current?.click()}
              disabled={isSubmitting}
            >
              <Files className="size-4" />
              {"Chọn tệp JSON"}
            </Button>
          </div>
          <input
            ref={accountJsonInputRef}
            type="file"
            accept=".json,application/json"
            multiple
            className="hidden"
            onChange={(event) => void handleAccountJsonSelected(event)}
          />
          {pendingAccountJsonImport ? (
            <div className="rounded-2xl border border-border bg-card p-4 text-sm leading-6 text-foreground/80">
              {"Lần đọc gần nhất"} {pendingAccountJsonImport.parsedAccountCount} {"Token"}
              {pendingAccountJsonImport.errorCount > 0 ? `, and ${pendingAccountJsonImport.errorCount} files were not extracted successfully.` : ""}。
            </div>
          ) : null}
        </div>
      );
    }

    if (method === "codex-auth") {
      return (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setMethod("menu")}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {"Quay lại cách nhập"}
          </button>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">{"JSON xác thực Codex"}</label>
            <Textarea
              placeholder='Paste the Codex authentication JSON containing "access_token", "refresh_token", "id_token"...'
              value={codexAuthInput}
              onChange={(event) => setCodexAuthInput(event.target.value)}
              className="min-h-64 resize-none rounded-xl border-border font-mono text-xs"
            />
          </div>
        </div>
      );
    }

    return (
      <div className="import-method-grid grid gap-3 sm:grid-cols-2">
        <MethodCard
          title="Đăng nhập OAuth tài khoản hiện có"
          description="Đăng nhập để lấy token tự động gia hạn."
          icon={LogIn}
          tone="surface-blue"
          onClick={() => setMethod("oauth")}
        />
        <MethodCard
          title="Nhập Access Token"
          description="Dán token hoặc chọn tệp TXT."
          icon={KeyRound}
          tone="surface-green"
          onClick={() => setMethod("token")}
        />
        <MethodCard
          title="Nhập Session JSON"
          description="Tự lấy accessToken từ Session JSON."
          icon={FileJson}
          tone="surface-violet"
          onClick={() => setMethod("session")}
        />
        <MethodCard
          title="Nhập JSON xác thực Codex"
          description="Nhập tệp xác thực Codex."
          icon={FileJson}
          tone="surface-cyan"
          onClick={() => setMethod("codex-auth")}
        />
        <MethodCard
          title="Nhập tệp JSON tài khoản"
          description="Nhập JSON tài khoản hoặc JSON CPA."
          icon={Files}
          tone="surface-amber"
          onClick={() => setMethod("account-json")}
        />
        <MethodCard
          title="Nhập từ máy chủ CPA"
          description="Nhập tài khoản từ máy chủ CPA."
          icon={Files}
          tone="surface-rose"
          onClick={() => {
            setOpen(false);
            resetState();
            router.push("/settings");
          }}
        />
        <MethodCard
          title="Nhập từ máy chủ Sub2API"
          description="Nhập tài khoản từ Sub2API."
          icon={ServerCog}
          tone="surface-blue"
          onClick={() => {
            setOpen(false);
            resetState();
            router.push("/settings");
          }}
        />
      </div>
    );
  };

  const footerDisabled = disabled || isSubmitting;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <Button
          variant="success"
          className="h-9 px-3.5"
          onClick={() => setOpen(true)}
          disabled={disabled}
        >
          <Upload className="size-4" />
          Import
        </Button>
        <DialogContent showCloseButton={false} className="w-[min(96vw,920px)] max-h-[88dvh] overflow-y-auto rounded-xl p-5 sm:p-6">
          <DialogHeader className="gap-2">
            <DialogTitle>
              {method === "menu"
                ? "Thêm hoặc cập nhật tài khoản"
                : method === "token"
                  ? "Nhập Access Token"
                  : method === "session"
                    ? "Nhập Session JSON"
                    : method === "codex-auth"
                      ? "Nhập JSON xác thực Codex"
                    : method === "oauth"
                      ? "OAuth login to existing account"
                      : "Import account JSON"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-6">
              {method === "menu"
                ? "Choose an import method. After the import is successful, the email address, type and quota will be automatically pulled."
                : method === "token"
                  ? "Supports manual pasting or importing from TXT files, one Token per line."
                  : method === "session"
                    ? "Paste the complete Session JSON and the system will automatically extract the accessToken."
                    : method === "codex-auth"
                      ? "Paste the Codex authentication JSON and the system will import it according to the codex source."
                    : method === "oauth"
                      ? "Use your browser to run OpenAI standard OAuth, and the system will automatically renew it after you get the refresh_token back."
                      : "Supports reading the single account object or all account arrays exported by this project, and confirms the quantity before submission."}
            </DialogDescription>
          </DialogHeader>

          {renderMethodBody()}

          <DialogFooter className="pt-2">
            <Button
              variant="secondary"
              className="h-10 rounded-xl bg-muted px-5 text-foreground/80 hover:bg-muted"
              onClick={() => setOpen(false)}
              disabled={footerDisabled}
            >
              {"Hủy"}
            </Button>
            {method === "token" ? (
              <Button
                variant="success"
                className="h-10 px-5"
                onClick={() => void handleImportTokenText()}
                disabled={footerDisabled}
              >
                {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
                {"Nhập token"}
              </Button>
            ) : null}
            {method === "session" ? (
              <Button
                variant="violet"
                className="h-10 px-5"
                onClick={() => void handleImportSessionJson()}
                disabled={footerDisabled}
              >
                {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
                {"Nhập JSON"}
              </Button>
            ) : null}
            {method === "codex-auth" ? (
              <Button
                variant="info"
                className="h-10 px-5"
                onClick={() => void handleImportCodexAuthJson()}
                disabled={footerDisabled}
              >
                {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
                {"Nhập JSON"}
              </Button>
            ) : null}
            {method === "oauth" ? (
              <Button
                variant="default"
                className={cn(
                  "h-10 px-5",
                  !oauthSession ? "hidden" : "",
                )}
                onClick={() => void handleFinishOAuth()}
                disabled={footerDisabled || !oauthSession || !oauthCallbackInput.trim()}
              >
                {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
                {"Hoàn tất nhập"}
              </Button>
            ) : null}
            {method === "account-json" ? (
              <Button
                variant="warning"
                className={cn(
                  "h-10 px-5",
                  !pendingAccountJsonImport ? "hidden" : "",
                )}
                onClick={() => setConfirmOpen(true)}
                disabled={footerDisabled || !pendingAccountJsonImport}
              >
                {"Xem xác nhận nhập"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-2xl p-6">
          <DialogHeader className="gap-2">
            <DialogTitle>{"Xác nhận nhập token tài khoản"}</DialogTitle>
            <DialogDescription className="text-sm leading-6">
              {pendingAccountJsonImport
                ? `Confirm that ${pendingAccountJsonImport.parsedAccountCount} Tokens have been recognized. Do you want to confirm the import?`
                : "No importable Token has been read yet."}
              {pendingAccountJsonImport?.errorCount
                ? `, and ${pendingAccountJsonImport.errorCount} files were not extracted successfully.`
                : "。"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              variant="secondary"
              className="h-10 rounded-xl bg-muted px-5 text-foreground/80 hover:bg-muted"
              onClick={() => setConfirmOpen(false)}
              disabled={isSubmitting}
            >
              {"Quay lại"}
            </Button>
            <Button
              variant="success"
              className="h-10 px-5"
              onClick={() =>
                void submitTokens(
                  pendingAccountJsonImport?.tokens ?? [],
                  "Account JSON import completed",
                  pendingAccountJsonImport?.accounts ?? [],
                )
              }
              disabled={isSubmitting || !pendingAccountJsonImport}
            >
              {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {"Xác nhận nhập"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
