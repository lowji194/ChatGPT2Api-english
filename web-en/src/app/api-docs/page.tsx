"use client";

import { BookOpenText, LoaderCircle } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { useAuthGuard } from "@/lib/use-auth-guard";
import { ApiDocsCard } from "@/app/settings/components/api-docs-card";

export default function ApiDocsPage() {
  const { isCheckingAuth, session } = useAuthGuard(["admin"]);

  if (isCheckingAuth || !session || session.role !== "admin") {
    return <div className="flex min-h-[40vh] items-center justify-center"><LoaderCircle className="size-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="Developer portal"
        title="API documentation"
        description="Explore endpoints, parameters, and request and response examples for the OpenAI-compatible API."
        actions={<div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><BookOpenText className="size-5" /></div>}
      />
      <ApiDocsCard />
    </section>
  );
}
