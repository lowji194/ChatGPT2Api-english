"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import webConfig from "@/constants/common-env";
import { fetchSettingsConfig } from "@/lib/api";
import { getStoredAuthSession } from "@/store/auth";

export function SkillPanel() {
  const [browserBaseUrl, setBrowserBaseUrl] = useState("");
  const [configuredBaseUrl, setConfiguredBaseUrl] = useState("");
  const [authKey, setAuthKey] = useState("");

  useEffect(() => {
    setBrowserBaseUrl(window.location.origin);
    void fetchSettingsConfig().then((data) => setConfiguredBaseUrl(String(data.config.base_url || "").replace(/\/$/, ""))).catch(() => undefined);
    void getStoredAuthSession().then((session) => setAuthKey(session?.key || ""));
  }, []);

  const apiBaseUrl = configuredBaseUrl || webConfig.apiUrl.replace(/\/$/, "") || browserBaseUrl;
  const skillZh = useMemo(() => `---
name: chatgpt2api-search
description: When users need to search the Internet, query the latest information, verify facts, or need source links, the local chatgpt2api search interface is called.
---

# ChatGPT2API Search

This skill is used when users require Internet search, check the latest information, verify information, check news, check prices, check document updates, or need source links.

## Interface

POST ${apiBaseUrl} /v1/search

Headers:

Authorization: Bearer ${authKey}
Content-Type: application/json

Body:

{
  "prompt": "<Question the user wants to search for>"
}

## Return to processing

- Use the \`answer\` returned by the interface as the main answer.
- If there are \`sources\`, include the source link in the answer.
- If the interface reports an error, briefly describe the error and ask whether to try again.`, [apiBaseUrl, authKey]);

  const skillEn = useMemo(() => `---
name: chatgpt2api-search
description: Use when current web search is needed through this chatgpt2api server. Call the configured HTTP search endpoint with a prompt and return the answer with source URLs.
---

# ChatGPT2API Search

Use this skill when the user asks for current web search, online lookup, recent information, or source-backed answers. It calls the local chatgpt2api search endpoint and returns an answer with source links.

## When to use

- The user asks to search the web, look something up, verify current information, or find the latest status.
- The answer needs source URLs, recent details, prices, releases, docs, laws, schedules, or news.
- Do not use it for purely local codebase questions unless the user explicitly asks for web search.

## Request

POST ${apiBaseUrl}/v1/search

Headers:

Authorization: Bearer ${authKey}
Content-Type: application/json

JSON body:

{
  "prompt": "<search question>"
}

## Response handling

- Use \`answer\` as the main response.
- Include source URLs from \`sources\` when available.
- If the endpoint returns an error, summarize the error and ask the user whether to retry.
- Keep the final answer concise unless the user asks for detail.`, [apiBaseUrl, authKey]);

  const zhPrompt = useMemo(() => `Please help me install a skill for Internet search on this machine.

Requirements:
1. Please install it as a local skill according to the skill installation specifications of your current environment.
2. The skill name is: chatgpt2api-search
3. File name: SKILL.md
4. If you can't determine where the local skills directory is, tell me which directory it needs to be placed in first, and don't guess the path.
5. Only create or update this skill file, do not modify other irrelevant files.
6. SKILL.md Please write the complete content below.

SKILL.md content:

\`\`\`markdown
 ${skillZh}
\`\`\``, [skillZh]);

  const enPrompt = useMemo(() => `Please install a local web-search skill on this machine.

Requirements:
1. Install this as a local skill according to the skill installation rules of your current environment.
2. Skill name: chatgpt2api-search
3. File name: SKILL.md
4. If you cannot determine the local skills directory, tell me which directory is required before writing files.
5. Only create or update this skill file. Do not modify unrelated files.
6. Write the full content below into SKILL.md.

SKILL.md content:

\`\`\`markdown
${skillEn}
\`\`\``, [skillEn]);

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Đã sao chép");
  };

  const downloadSkill = (text: string) => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "SKILL.md";
    link.click();
    URL.revokeObjectURL(url);
  };

  const versions = [
    { title: "Chinese installation instructions", desc: "After copying, send it directly to Codex or Claude and let it be installed locally.", prompt: zhPrompt, skill: skillZh },
    { title: "English install prompt", desc: "Copy and send this to Codex or Claude to install locally.", prompt: enPrompt, skill: skillEn },
  ];

  return (
    <section className="grid items-stretch gap-4 lg:grid-cols-2">
      {versions.map((item) => (
        <div key={item.title} className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-card shadow-sm dark:border-border/10 dark:bg-card/[0.04]">
          <div className="flex flex-col items-start justify-between gap-3 border-b border-slate-200/70 bg-slate-50/80 p-4 sm:flex-row sm:items-center dark:border-border/10 dark:bg-card/[0.03]">
            <div className="min-w-0">
              <h2 className="font-medium text-slate-900 dark:text-slate-100">{item.title}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => downloadSkill(item.skill)}>
                <Download />
                {"Tải xuống"}
              </Button>
              <Button size="sm" className="cursor-pointer" onClick={() => void copyText(item.prompt)}>
                <Copy />
                {"Sao chép"}
              </Button>
            </div>
          </div>
          <pre className="min-w-0 flex-1 overflow-x-auto whitespace-pre-wrap p-4 font-mono text-sm leading-6 [overflow-wrap:anywhere]">
            {item.prompt}
          </pre>
        </div>
      ))}
    </section>
  );
}
