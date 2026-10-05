"use client";

import { useState } from "react";
import { ImagePlus, LoaderCircle, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { httpRequest } from "@/lib/request";

import { pretty, type ChatCompletionResponse, type ChatContentPart, type ChatMessage } from "./types";

type SelectedImage = {
  id: string;
  name: string;
  size: number;
  url: string;
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function readImage(file: File): Promise<SelectedImage> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error(`${file.name} is not an image file`));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      reject(new Error(`${file.name} exceeds 10MB`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || "");
      if (!url.startsWith("data:image/")) {
        reject(new Error(`${file.name} read failed`));
        return;
      }
      resolve({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(16).slice(2)}`,
        name: file.name,
        size: file.size,
        url,
      });
    };
    reader.onerror = () => reject(reader.error || new Error(`${file.name} read failed`));
    reader.readAsDataURL(file);
  });
}

function messageText(message: ChatMessage): string {
  if (typeof message.content === "string") {
    return message.content;
  }
  return message.content
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function messageImages(message: ChatMessage): string[] {
  if (!Array.isArray(message.content)) {
    return [];
  }
  return message.content
    .filter((part): part is { type: "image_url"; image_url: { url: string } } => part.type === "image_url")
    .map((part) => part.image_url.url);
}

export function ChatPanel() {
  const [model, setModel] = useState("auto");
  const [reasoningEffort, setReasoningEffort] = useState("");
  const [input, setInput] = useState("Hello, first remember that my project is called chatgpt2api.");
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [raw, setRaw] = useState<ChatCompletionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImagesChange = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    try {
      const images = await Promise.all(Array.from(files).map(readImage));
      setSelectedImages((current) => [...current, ...images].slice(0, 4));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const sendChat = async () => {
    const text = input.trim();
    if (!text && !selectedImages.length) return;
    const content: string | ChatContentPart[] = selectedImages.length
      ? [
          ...(text ? [{ type: "text" as const, text }] : []),
          ...selectedImages.map((image) => ({ type: "image_url" as const, image_url: { url: image.url } })),
        ]
      : text;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setSelectedImages([]);
    setLoading(true);
    setError("");
    try {
      const body = {
        model: model.trim() || "auto",
        messages: nextMessages,
        ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
      };
      const result = await httpRequest<ChatCompletionResponse>("/v1/chat/completions", { method: "POST", body });
      setRaw(result);
      setMessages([...nextMessages, { role: "assistant", content: String(result.choices?.[0]?.message?.content || "") }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSelectedImages([]);
    setRaw(null);
    setError("");
  };

  return (
    <div className="grid h-full min-h-0 gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
      <section className="flex min-h-0 flex-col lg:border-r lg:border-border/70 lg:pr-8 dark:lg:border-border/10">
        <div className="border-b border-border/70 pb-3 dark:border-border/10">
          <h2 className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">{"Câu hỏi"}</h2>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-auto pt-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
            <div className="space-y-2">
              <Label htmlFor="chat-model">Model</Label>
              <Input id="chat-model" value={model} onChange={(event) => setModel(event.target.value)} className="rounded-md border-border/70 bg-transparent shadow-none dark:border-border/10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chat-reasoning-effort">{"Mức suy luận"}</Label>
              <Select value={reasoningEffort || "default"} onValueChange={(value) => setReasoningEffort(value === "default" ? "" : value)}>
                <SelectTrigger id="chat-reasoning-effort" className="h-10 rounded-md border-border/70 bg-transparent shadow-none dark:border-border/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">{"default"}</SelectItem>
                  <SelectItem value="low">{"Thấp"}</SelectItem>
                  <SelectItem value="medium">{"Trung bình"}</SelectItem>
                  <SelectItem value="Cao">{"Cao"}</SelectItem>
                  <SelectItem value="xhigh">{"Rất cao"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="chat-input">Tin nhắn</Label>
            <Textarea id="chat-input" value={input} onChange={(event) => setInput(event.target.value)} className="min-h-32 rounded-md border-border/70 bg-transparent shadow-none dark:border-border/10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="chat-images">{"Hình ảnh"}</Label>
            <label htmlFor="chat-images" className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/70 px-3 py-3 text-sm text-foreground/80 transition hover:border-border hover:bg-muted dark:border-border/10 dark:bg-card/[0.03] dark:text-muted-foreground dark:hover:bg-card/[0.06]">
              <ImagePlus className="size-4" />
              {"Chọn hình ảnh"}
            </label>
            <input id="chat-images" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple className="sr-only" onChange={(event) => {
              void handleImagesChange(event.target.files);
              event.currentTarget.value = "";
            }} />
            {selectedImages.length ? (
              <div className="grid grid-cols-2 gap-2">
                {selectedImages.map((image) => (
                  <div key={image.id} className="group relative overflow-hidden rounded-md border border-border bg-card dark:border-border/10 dark:bg-card/[0.04]">
                    <img src={image.url} alt={image.name} className="aspect-square w-full object-cover" />
                    <button type="button" aria-label={`Remove ${image.name}`} onClick={() => setSelectedImages((current) => current.filter((item) => item.id !== image.id))} className="absolute top-1 right-1 flex size-7 items-center justify-center rounded-md bg-card/90 text-foreground/80 shadow-sm transition hover:bg-card dark:bg-slate-950/90 dark:text-slate-100">
                      <X className="size-4" />
                    </button>
                    <div className="absolute inset-x-0 bottom-0 truncate bg-card/90 px-2 py-1 text-xs text-foreground/80 dark:bg-slate-950/90 dark:text-muted-foreground">{image.name}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void sendChat()} disabled={loading || (!input.trim() && !selectedImages.length)}>
              {loading ? <LoaderCircle className="animate-spin" /> : <Send />}
              {"Gửi"}
            </Button>
            <Button size="sm" variant="outline" onClick={clearChat}>
              {"Xóa lọc"}
            </Button>
          </div>
          {error ? <div className="rounded-md border border-rose-200 bg-rose-50/60 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300">{error}</div> : null}
          <Textarea value={raw ? pretty(raw) : "{\n  \"messages\": []\n}"} readOnly className="min-h-72 resize-none rounded-md border-border/70 bg-muted/50 p-4 font-mono text-xs leading-5 text-foreground/80 shadow-none dark:border-border/10 dark:bg-card/[0.03] dark:text-muted-foreground" />
        </div>
      </section>
      <section className="flex min-h-0 flex-col">
        <div className="border-b border-border/70 pb-3 dark:border-border/10">
          <h2 className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">{"Hội thoại"}</h2>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-auto pt-4">
          {messages.length ? messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className="space-y-1.5 text-sm">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">{message.role}</div>
              {messageImages(message).length ? (
                <div className="flex flex-wrap gap-2">
                  {messageImages(message).map((url, imageIndex) => (
                    <img key={`${index}-${imageIndex}`} src={url} alt="" className="h-28 w-28 rounded-md border border-border object-cover dark:border-border/10" />
                  ))}
                </div>
              ) : null}
              {messageText(message) ? <div className="whitespace-pre-wrap leading-7 text-foreground/80 dark:text-muted-foreground">{messageText(message)}</div> : null}
            </div>
          )) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground dark:text-muted-foreground">{"Chưa có tin nhắn"}</div>
          )}
        </div>
      </section>
    </div>
  );
}
