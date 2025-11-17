"use client";

import React, { useState } from "react";
import { ContactSchema, type ContactInput } from "@wirelab/shared";

type Status = "idle" | "loading" | "success" | "error";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export default function ContactPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const formData = new FormData(e.currentTarget);
    const candidate = {
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message")
    };

    const parsed = ContactSchema.safeParse(candidate);
    if (!parsed.success) {
      setStatus("error");
      setError("Please check your input and try again.");
      return;
    }

    const payload: ContactInput = parsed.data;

    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError("Could not send your message. Please try again.");
    }
  }

  return (
    <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
      <h1 className="mb-2 text-2xl font-semibold">Contact</h1>
      <p className="mb-6 text-sm text-slate-600">
        This form demonstrates a simple end-to-end flow for the Wirelab technical challenge.
      </p>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="message">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            className="w-full min-h-[120px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            required
          />
        </div>

        {status === "error" && error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {status === "success" && (
          <p className="text-sm text-emerald-700" role="status">
            Thank you! Your message has been sent.
          </p>
        )}

        <button
          type="submit"
          disabled={status === "loading" || !apiBase}
          className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {status === "loading" ? "Sending…" : "Send message"}
        </button>

        {!apiBase && (
          <p className="mt-2 text-xs text-amber-700">
            NEXT_PUBLIC_API_BASE_URL is not set. The form will not be able to reach the backend.
          </p>
        )}
      </form>
    </section>
  );
}
