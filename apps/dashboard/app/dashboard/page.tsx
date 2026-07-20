"use client";

import React, { useEffect, useState } from "react";

type ContactMeta = {
  totalSubmissions: number;
  lastExample: {
    name: string;
    email: string;
    messagePreview: string;
  };
  updatedAt: string;
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export default function DashboardPage() {
  const [meta, setMeta] = useState<ContactMeta | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiBase) {
      setError("NEXT_PUBLIC_API_BASE_URL is not set, cannot load dashboard data.");
      return;
    }

    async function load() {
      try {
        setStatus("loading");
        setError(null);

        const res = await fetch(`${apiBase.replace(/\/$/, "")}/dashboard`, {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        const data = (await res.json()) as ContactMeta;
        setMeta(data);
        setStatus("idle");
      } catch (err: any) {
        setStatus("error");
        setError(err?.message ?? "Failed to load dashboard data.");
      }
    }

    void load();
  }, []);

  const hasApiBase = Boolean(apiBase);

  return (
    <section className="space-y-4">
      <p className="text-sm text-slate-600">
        This dashboard consumes the same backend as the contact form, but exposes
        a simple, read-only admin view using a separate Next.js app.
      </p>

      {!hasApiBase && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          NEXT_PUBLIC_API_BASE_URL is not set. Configure it to point to your Lambda
          Function URL or local mock (e.g. http://localhost:4000).
        </p>
      )}

      {status === "loading" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Loading dashboard data…
        </div>
      )}

      {status === "error" && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {meta && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-800">
              Total submissions
            </h2>
            <p className="text-3xl font-bold text-slate-900">
              {meta.totalSubmissions}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Last updated: {new Date(meta.updatedAt).toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-800">
              Last example message
            </h2>
            <p className="text-sm font-medium text-slate-900">{meta.lastExample.name}</p>
            <p className="text-xs text-slate-500 mb-2">{meta.lastExample.email}</p>
            <p className="text-sm text-slate-700">
              {meta.lastExample.messagePreview}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}