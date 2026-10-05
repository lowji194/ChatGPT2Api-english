"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Copy, FileArchive, FileText, KeyRound, ListChecks, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import webConfig from "@/constants/common-env";
import { getStoredAuthSession } from "@/store/auth";

type ParamRow = [string, string, string];

type ApiDoc = {
  title: string;
  method: string;
  path: string;
  icon: LucideIcon;
  input: ParamRow[];
  output: ParamRow[];
  example: (baseUrl: string, key: string) => string;
};

const docs: ApiDoc[] = [
  {
    title: "Danh sách model",
    method: "GET",
    path: "/v1/models",
    icon: ListChecks,
    input: [
      ["Authorization", "header", "Bearer <auth-key>."],
    ],
    output: [
      ["data", "array", "Model list, including id, object, created, owned_by."],
    ],
    example: (baseUrl: string, key: string) => `curl ${baseUrl}/models \\
  -H "Authorization: Bearer ${key}"`,
  },
  {
    title: "Hoàn tất hội thoại",
    method: "POST",
    path: "/v1/chat/completions",
    icon: FileText,
    input: [
      ["model", "string", "Use auto or a model currently returned by /v1/models."],
      ["messages", "array", "OpenAI compatible message array."],
      ["stream", "boolean", "Optional, whether to stream the return."],
      ["n", "number", "Optionally, image-compatible scenarios resolve to generated quantities."],
    ],
    output: [
      ["id", "string", "Response ID."],
      ["choices", "array", "OpenAI compatible choices."],
      ["usage", "object", "Optional, token usage information."],
    ],
    example: (baseUrl: string, key: string) => `curl ${baseUrl}/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${key}" \
  -d '{"model":"auto","messages":[{"role":"user","content":"Hello"}]}'`,
  },
  {
    title: "Tổng quota hình ảnh",
    method: "GET",
    path: "/v1/image-quota",
    icon: ListChecks,
    input: [["Authorization", "header", "Bearer <auth-key>."]],
    output: [
      ["total_remaining", "number", "Tổng số lượt tạo ảnh còn lại của các tài khoản đang hoạt động."],
      ["active_accounts", "number", "Số tài khoản đang hoạt động."],
      ["limited_accounts", "number", "Số tài khoản đang bị giới hạn."],
      ["unit", "string", "Đơn vị quota, luôn là images."],
    ],
    example: (baseUrl: string, key: string) => `curl ${baseUrl}/image-quota \\
  -H "Authorization: Bearer ${key}"`,
  },
  {
    title: "Responses",
    method: "POST",
    path: "/v1/responses",
    icon: FileText,
    input: [
      ["model", "string", "Model name."],
      ["input", "string | array | object", "User input, from which image generation parses the prompt words."],
      ["tools", "array", "Optional, Responses tool definition."],
      ["stream", "boolean", "Optional, whether to stream the return."],
    ],
    output: [
      ["id", "string", "Response ID."],
      ["output", "array", "Responses compatible output."],
      ["status", "string", "Response status."],
    ],
    example: (baseUrl: string, key: string) => `curl ${baseUrl}/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${key}" \
  -d '{"model":"auto","input":"Describe a future city"}'`,
  },
  {
    title: "search",
    method: "POST",
    path: "/v1/search",
    icon: ListChecks,
    input: [
      ["prompt", "string", "Search questions or retrieve instructions."],
    ],
    output: [
      ["answer", "string", "The answer content after searching, the specific fields are subject to the returned results."],
      ["sources", "array", "Optionally, search for cited sources."],
      ["_account_email", "string", "The account email used this time."],
    ],
    example: (baseUrl: string, key: string) => `curl ${baseUrl}/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${key}" \
  -d '{"prompt":"Search for the latest usage of chatgpt2api"}'`,
  },
  {
    title: "Tạo hình ảnh",
    method: "POST",
    path: "/v1/images/generations",
    icon: FileArchive,
    input: [
      ["prompt", "string", "Pictures generate prompt words."],
      ["model", "string", "Optional, defaults to gpt-image-2."],
      ["n", "number", "Optional, generated quantity, currently limited to 1-4."],
      ["Kích thước", "string", "Optional, image size."],
      ["Chất lượng", "string", "Optional, default is auto."],
      ["response_format", "string", "Optional, default is b64_json."],
    ],
    output: [
      ["data", "array", "Image result list."],
      ["data[].b64_json", "string", "base64 image content."],
      ["data[].url", "string", "Returns the image URL under partial configuration."],
    ],
    example: (baseUrl: string, key: string) => `curl ${baseUrl}/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${key}" \
  -d '{"model":"gpt-image-2","prompt":"A minimalist product poster","n":1}'`,
  },
  {
    title: "Picture editing",
    method: "POST",
    path: "/v1/images/edits",
    icon: FileArchive,
    input: [
      ["image", "file | file[] | URL", "Reference pictures support multipart upload and JSON image links."],
      ["prompt", "string", "Edit prompt word."],
      ["model", "string", "Optional, defaults to gpt-image-2."],
      ["n", "number", "Optional, generated quantity, currently limited to 1-4."],
      ["Kích thước", "string", "Optional, image size."],
      ["Chất lượng", "string", "Optional, default is auto."],
    ],
    output: [
      ["data", "array", "Edited image result list."],
      ["data[].b64_json", "string", "base64 image content."],
      ["data[].url", "string", "Returns the image URL under partial configuration."],
    ],
    example: (baseUrl: string, key: string) => `curl ${baseUrl}/images/edits \
  -H "Authorization: Bearer ${key}" \
  -F "model=gpt-image-2" \
  -F "prompt=Change to cyberpunk night scene" \
  -F "image=@./input.png"`,
  },
  {
    title: "Create a PPT task",
    method: "POST",
    path: "/v1/ppt/generations",
    icon: FileText,
    input: [
      ["prompt", "string", "PPT requirement description, it can be empty but it is recommended to fill in the complete topic, number of pages, style and content structure."],
      ["base64_images", "string[]", "Optional, image data URL/base64, used as PPT reference material."],
      ["client_task_id", "string", "Optional, client-side idempotent task ID; repeated submissions with the same ID will return existing tasks."],
    ],
    output: [
      ["id / taskId", "string", "Task ID for polling status."],
      ["status", "queued | running | success | error", "Task status."],
      ["kind", "ppt", "Task type."],
      ["created_at / updated_at", "string", "Task creation and update time."],
    ],
    example: (baseUrl: string, key: string) => `curl ${baseUrl}/ppt/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${key}" \
  -d '{"prompt":"Create a quarterly business report PPT within 8 pages","base64_images":[]}'`,
  },
  {
    title: "Create PSD task",
    method: "POST",
    path: "/v1/psd/generations",
    icon: FileArchive,
    input: [
      ["prompt", "string", "PSD splitting and compositing requirements, such as preserving layers, positions, backgrounds, and footage zips."],
      ["base64_images", "string[]", "Required, at least one image data URL/base64, as a PSD split source image."],
      ["client_task_id", "string", "Optional, client idempotent task ID."],
    ],
    output: [
      ["id / taskId", "string", "Task ID for polling status."],
      ["status", "queued | running | success | error", "Task status."],
      ["kind", "psd", "Task type."],
      ["error", "string", "Returns an error message on failure."],
    ],
    example: (baseUrl: string, key: string) => `curl ${baseUrl}/psd/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${key}" \
  -d '{"prompt":"Split the poster elements according to the original image position and synthesize them into editable PSD","base64_images":["data:image/png;base64,..."]}'`,
  },
  {
    title: "Task status query",
    method: "GET",
    path: "/v1/editable-file-tasks?ids={taskId1,taskId2}",
    icon: ListChecks,
    input: [
      ["ids", "string", "Optional, comma separated task IDs; if not passed, all editable file tasks for the current user will be returned."],
    ],
    output: [
      ["items", "array", "Task list. The result of a successful task contains primary_url and zip_url."],
      ["missing_ids", "string[]", "When querying the specified ids, return the task ID not found."],
      ["result.primary_url", "string", "Main file download address."],
      ["result.zip_url", "string", "Material zip download address."],
    ],
    example: (baseUrl: string, key: string) => `curl "${baseUrl}/editable-file-tasks?ids=<task_id>" \\
  -H "Authorization: Bearer ${key}"`,
  },
  {
    title: "Result file download",
    method: "GET",
    path: "/files/{file_path}",
    icon: FileArchive,
    input: [
      ["file_path", "string", "Returned by task result.primary_url or result.zip_url, manual splicing is usually not required."],
    ],
    output: [
      ["binary", "file", "Returns a pptx/psd/zip file stream."],
    ],
    example: (baseUrl: string, _key: string) => `curl ${baseUrl.replace(/\/v1$/, "")}/files/<file_path> -o result.zip`,
  },
];

const usableModels = ["auto", "gpt-5-6", "gpt-5-6-mini", "gpt-5-5", "gpt-5-5-mini", "gpt-5-3-mini", "gpt-image-2", "research"];

const responseExamples: Record<string, object> = {
  "/v1/models": { object: "list", data: [{ id: "auto", object: "model", owned_by: "chatgpt2api" }] },
  "/v1/image-quota": { object: "image_quota", total_remaining: 380, active_accounts: 27, limited_accounts: 3, unit: "images" },
  "/v1/chat/completions": { id: "chatcmpl_example", object: "chat.completion", choices: [{ index: 0, message: { role: "assistant", content: "Hello! How can I help you?" }, finish_reason: "stop" }] },
  "/v1/responses": { id: "resp_example", object: "response", status: "completed", output: [{ type: "message", role: "assistant", content: [{ type: "output_text", text: "A future city powered by clean energy." }] }] },
  "/v1/search": { answer: "Search result summary", sources: [{ title: "Source title", url: "https://example.com" }] },
  "/v1/images/generations": { created: 1760000000, data: [{ url: "https://example.com/generated-image.png" }] },
  "/v1/images/edits": { created: 1760000000, data: [{ url: "https://example.com/edited-image.png" }] },
  "/v1/ppt/generations": { id: "task_example", kind: "ppt", status: "queued" },
  "/v1/psd/generations": { id: "task_example", kind: "psd", status: "queued" },
};

function CodeBlock({ code, language = "bash", label }: { code: string; language?: "bash" | "json"; label: string }) {
  const [copied, setCopied] = useState(false);
  const lineContinuation = " \\" + "\n  ";
  const displayCode = language === "bash"
    ? code.replace(/\s+(-(?:H|d|F)\s)/g, `${lineContinuation}$1`)
    : code;
  const tokens = displayCode.split(/("(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|\b\d+(?:\.\d+)?\b|(?:^|\s)(?:curl|-H|-d|-F)\b)/gm);
  const copy = async () => {
    await navigator.clipboard.writeText(displayCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-[#07111f] shadow-sm">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</span>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-slate-300 hover:bg-white/10 hover:text-white" onClick={() => void copy()}>
          {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          {copied ? "Đã chép" : "Sao chép"}
        </Button>
      </div>
      <pre className="whitespace-pre-wrap break-words p-4 text-[13px] leading-6 text-slate-200"><code>{tokens.map((token, index) => {
        if (!token) return null;
        const trimmed = token.trim();
        const color = token.startsWith('"') ? "text-emerald-300" : /^(true|false|null)$/.test(trimmed) ? "text-violet-300" : /^\d/.test(trimmed) ? "text-amber-300" : /^(curl|-H|-d|-F)$/.test(trimmed) ? "text-sky-300" : "text-slate-200";
        return <span key={`${index}-${token.slice(0, 8)}`} className={color}>{token}</span>;
      })}</code></pre>
    </div>
  );
}

function ParamTable({ rows }: { rows: ParamRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <tr>
            <th className="px-3 py-2 font-medium">{"Tham số"}</th>
            <th className="px-3 py-2 font-medium">{"Kiểu dữ liệu"}</th>
            <th className="px-3 py-2 font-medium">{"Mô tả"}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-card">
          {rows.map(([name, type, desc]) => (
            <tr key={name}>
              <td className="px-3 py-2 font-mono text-foreground">{name}</td>
              <td className="px-3 py-2 font-mono text-muted-foreground">{type}</td>
              <td className="px-3 py-2 leading-5 text-foreground/90">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ApiDocsCard() {
  const [authKey, setAuthKey] = useState("");
  const serviceBaseUrl = webConfig.apiUrl.replace(/\/$/, "") || (typeof window !== "undefined" ? window.location.origin : "");
  const openAIBaseUrl = `${serviceBaseUrl}/v1`;
  const displayKey = authKey || "<current-key>";

  useEffect(() => {
    let active = true;
    void getStoredAuthSession().then((session) => {
      if (active) setAuthKey(session?.key || "");
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Card className="overflow-hidden rounded-2xl border-border/80 bg-card shadow-[0_18px_50px_-32px_rgba(15,23,42,.45)]">
      <CardContent className="space-y-7 p-5 sm:p-7">
        <div>
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            <KeyRound className="size-5 text-muted-foreground" />
            {"Hướng dẫn truy cập API"}
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-foreground/70">
            {"Ứng dụng bên thứ ba truy cập qua giao diện tương thích OpenAI; API tác vụ tệp dùng cùng phương thức xác thực."}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1 rounded-xl border border-blue-500/20 bg-blue-500/[0.04] px-4 py-3">
            <div className="text-xs text-muted-foreground">{"Địa chỉ dịch vụ"}</div>
            <div className="break-all font-mono text-xs text-foreground">{serviceBaseUrl}</div>
          </div>
          <div className="space-y-1 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] px-4 py-3">
            <div className="text-xs text-muted-foreground">Địa chỉ dịch vụ (OpenAI)</div>
            <div className="break-all font-mono text-xs text-foreground">{openAIBaseUrl}</div>
          </div>
          <div className="space-y-1 rounded-xl border border-violet-500/20 bg-violet-500/[0.04] px-4 py-3">
            <div className="text-xs text-muted-foreground">Khóa API</div>
            <div className="break-all font-mono text-xs text-foreground">{displayKey}</div>
          </div>
          <div className="space-y-1 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] px-4 py-3">
            <div className="text-xs text-muted-foreground">{"Header yêu cầu"}</div>
            <div className="break-all font-mono text-xs text-foreground">Authorization: Bearer {displayKey}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-foreground/80">{"Có thể lấy danh sách model qua /v1/models"}</div>
          <div className="flex flex-wrap gap-2">
            {usableModels.map((model) => (
              <span key={model} className="rounded-md border border-border bg-card px-2 py-1 font-mono text-xs text-foreground/80">{model}</span>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {docs.map((item) => {
            const Icon = item.icon;
            return (
              <details key={item.path} className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm open:border-blue-500/30 open:ring-4 open:ring-blue-500/[0.04]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 hover:bg-muted/45">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground/80">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">{item.title}</span>
                      <span className="mt-1 flex items-center gap-2 truncate font-mono text-xs text-muted-foreground"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${item.method === "GET" ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600"}`}>{item.method}</span>{item.path}</span>
                    </span>
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
                </summary>

                <div className="grid gap-5 border-t border-border bg-muted/20 p-4 sm:p-5 lg:grid-cols-2">
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-foreground/80">{"Tham số đầu vào"}</h3>
                    <ParamTable rows={item.input} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-foreground/80">{"Tham số đầu ra"}</h3>
                    <ParamTable rows={item.output} />
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <h3 className="text-sm font-semibold text-foreground">Ví dụ request và response</h3>
                    <div className="grid gap-4 xl:grid-cols-2">
                      <CodeBlock code={item.example(openAIBaseUrl, displayKey)} label="cURL request" />
                      <CodeBlock code={JSON.stringify(responseExamples[item.path] || { status: "success", message: "Request completed" }, null, 2)} language="json" label="JSON response" />
                    </div>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
