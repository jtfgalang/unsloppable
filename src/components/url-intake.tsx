"use client";

import { useState, type FormEvent } from "react";

type UrlIntakeProps = {
  onScan?: (url: string) => void | Promise<void>;
  placeholder?: string;
  buttonLabel?: string;
  className?: string;
};

export function UrlIntake({ onScan, placeholder = "yourcompany.com", buttonLabel = "Scan page", className }: UrlIntakeProps) {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const clean = url.trim();
    if (!clean) return;
    setState("loading");
    try { await onScan?.(clean); setState("done"); } catch { setState("error"); }
  };
  return <form className={`oui-url-intake oui-url-intake--${state} ${className ?? ""}`} onSubmit={(event) => void submit(event)}>
    <span aria-hidden="true">{url ? url.replace(/^https?:\/\//, "").slice(0, 1).toUpperCase() : "↗"}</span>
    <label><b>Landing page URL</b><input value={url} onChange={(event) => { setUrl(event.target.value); setState("idle"); }} placeholder={placeholder} inputMode="url" autoCapitalize="none" autoCorrect="off" required /></label>
    <button type="submit" disabled={state === "loading"}>{state === "loading" ? "Scanning" : state === "done" ? "Captured" : state === "error" ? "Try again" : buttonLabel}<i aria-hidden="true">{state === "done" ? "✓" : "→"}</i></button>
  </form>;
}
