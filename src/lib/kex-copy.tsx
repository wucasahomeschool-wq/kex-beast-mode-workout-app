import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { kexSaveCopy, kexResetCopy } from "./kex-copy.functions";

const EDITOR_TOKEN_KEY = "kex-editor-token";

type CopyCtx = {
  map: Record<string, string>;
  editing: boolean;
  token: string | null;
  save: (key: string, value: string) => Promise<void>;
  reset: (key: string) => Promise<void>;
  startEditor: (token: string) => void;
  stopEditor: () => void;
};

const Ctx = createContext<CopyCtx | null>(null);

export function getStoredEditorToken(): string | null {
  try { return localStorage.getItem(EDITOR_TOKEN_KEY); } catch { return null; }
}

export function CopyProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Record<string, string>>({});
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(getStoredEditorToken());
    supabase.from("app_copy").select("key, value").then(({ data }) => {
      if (!data) return;
      const next: Record<string, string> = {};
      for (const row of data as { key: string; value: string }[]) next[row.key] = row.value;
      setMap(next);
    });
  }, []);

  const save = useCallback(async (key: string, value: string) => {
    if (!token) return;
    await kexSaveCopy({ data: { token, key, value } });
    setMap((m) => ({ ...m, [key]: value }));
  }, [token]);

  const reset = useCallback(async (key: string) => {
    if (!token) return;
    await kexResetCopy({ data: { token, key } });
    setMap((m) => { const n = { ...m }; delete n[key]; return n; });
  }, [token]);

  const startEditor = useCallback((t: string) => {
    try { localStorage.setItem(EDITOR_TOKEN_KEY, t); } catch {}
    setToken(t);
  }, []);
  const stopEditor = useCallback(() => {
    try { localStorage.removeItem(EDITOR_TOKEN_KEY); } catch {}
    setToken(null);
  }, []);

  const value = useMemo<CopyCtx>(() => ({
    map, editing: !!token, token, save, reset, startEditor, stopEditor,
  }), [map, token, save, reset, startEditor, stopEditor]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCopyCtx() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("CopyProvider missing");
  return ctx;
}

/** Read a copy string (DB override, else the in-code default). */
export function useCopy(key: string, fallback: string) {
  const { map } = useCopyCtx();
  return map[key] ?? fallback;
}

/**
 * Editable text. Renders the DB override if one exists, otherwise the default
 * written in code. When the EDITOR is signed in, tap it to rewrite it for everyone.
 */
export function T({ k, children, className }: { k: string; children: string; className?: string }) {
  const { map, editing, save, reset } = useCopyCtx();
  const text = map[k] ?? children;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(text);
  const [busy, setBusy] = useState(false);

  if (!editing) return <span className={className}>{text}</span>;

  return (
    <>
      <span
        className={`${className ?? ""} cursor-pointer rounded outline-dashed outline-2 outline-offset-2 outline-secondary/70 hover:bg-secondary/20`}
        title={`Edit text: ${k}`}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setDraft(text); setOpen(true); }}
      >
        {text}
      </span>
      {open && (
        <span className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-5" onClick={(e) => { e.stopPropagation(); setOpen(false); }}>
          <span className="block w-full max-w-lg rounded-2xl border-4 border-secondary bg-card p-5 shadow-comic-lg" onClick={(e) => e.stopPropagation()}>
            <span className="block font-condensed text-xs font-black uppercase tracking-widest text-secondary">Editing “{k}”</span>
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={5}
              className="mt-2 w-full rounded-lg border-2 border-border bg-background p-3 text-foreground"
            />
            <span className="mt-3 flex flex-wrap gap-2">
              <button
                disabled={busy}
                onClick={async () => { setBusy(true); try { await save(k, draft); setOpen(false); } finally { setBusy(false); } }}
                className="rounded-lg bg-primary px-4 py-2 font-display text-xl text-primary-foreground shadow-comic disabled:opacity-50"
              >SAVE</button>
              <button
                disabled={busy}
                onClick={async () => { setBusy(true); try { await reset(k); setOpen(false); } finally { setBusy(false); } }}
                className="rounded-lg border-2 border-border bg-card px-4 py-2 font-condensed text-sm font-black uppercase text-foreground"
              >RESET TO ORIGINAL</button>
              <button onClick={() => setOpen(false)} className="rounded-lg border-2 border-border px-4 py-2 font-condensed text-sm font-black uppercase text-muted-foreground">CANCEL</button>
            </span>
          </span>
        </span>
      )}
    </>
  );
}

/** Floating banner shown while the editor is active. */
export function EditorBar() {
  const { editing, stopEditor } = useCopyCtx();
  if (!editing) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[90] flex items-center justify-between gap-3 border-t-4 border-secondary bg-secondary/95 px-4 py-2 text-secondary-foreground">
      <div className="font-condensed text-xs font-black uppercase tracking-widest">✏️ EDITOR MODE — tap any dashed text to rewrite it</div>
      <button onClick={stopEditor} className="rounded-lg border-2 border-secondary-foreground px-3 py-1 font-condensed text-xs font-black uppercase">EXIT EDITOR</button>
    </div>
  );
}
