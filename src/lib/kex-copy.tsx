import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { kexSaveCopy, kexResetCopy } from "./kex-copy.functions";

const EDITOR_TOKEN_KEY = "kex-editor-token";
const EDITOR_ON_KEY = "kex-editor-on";

export type KexStyle = {
  color?: string;
  bg?: string;
  border?: string;
  weight?: string;
  italic?: boolean;
  underline?: boolean;
  size?: string;
};

type CopyCtx = {
  map: Record<string, string>;
  styles: Record<string, KexStyle>;
  /** Edit mode is ON: taps rewrite text instead of interacting. */
  editing: boolean;
  /** The editor password has been accepted (tool unlocked). */
  authorized: boolean;
  token: string | null;
  setEditing: (on: boolean) => void;
  save: (key: string, value: string, style?: KexStyle) => Promise<void>;
  reset: (key: string) => Promise<void>;
  startEditor: (token: string) => void;
  stopEditor: () => void;
};

const Ctx = createContext<CopyCtx | null>(null);

export function getStoredEditorToken(): string | null {
  try { return localStorage.getItem(EDITOR_TOKEN_KEY); } catch { return null; }
}

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/* =========================================================
   Universal DOM text/style overrides
   Every rendered text node in the app becomes an editable,
   Supabase-backed string. Keys are derived from the original
   text so the same phrase edits everywhere at once.
   ========================================================= */
const originals = new WeakMap<Text, string>();

function isEditableText(node: Text): boolean {
  const t = node.nodeValue ?? "";
  if (!/[A-Za-z]/.test(t)) return false;
  const el = node.parentElement;
  if (!el) return false;
  if (el.closest("[data-kex-editor]")) return false;
  const tag = el.tagName;
  if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA" || tag === "OPTION") return false;
  return true;
}

export function keyForNode(node: Text): string {
  const explicit = node.parentElement?.closest("[data-kex-key]")?.getAttribute("data-kex-key");
  if (explicit) return explicit;
  if (!originals.has(node)) originals.set(node, node.nodeValue ?? "");
  return "auto:" + hash((originals.get(node) ?? "").trim());
}

export function originalOf(node: Text): string {
  return originals.get(node) ?? node.nodeValue ?? "";
}

function applyStyle(el: HTMLElement, s: KexStyle | undefined) {
  el.style.color = s?.color ?? "";
  el.style.backgroundColor = s?.bg ?? "";
  el.style.borderColor = s?.border ?? "";
  el.style.fontWeight = s?.weight ?? "";
  el.style.fontStyle = s?.italic ? "italic" : "";
  el.style.textDecoration = s?.underline ? "underline" : "";
  el.style.fontSize = s?.size ?? "";
}

function walkTextNodes(cb: (node: Text) => void) {
  if (typeof document === "undefined") return;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const list: Text[] = [];
  while (walker.nextNode()) list.push(walker.currentNode as Text);
  for (const n of list) if (isEditableText(n)) cb(n);
}

export function CopyProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Record<string, string>>({});
  const [styles, setStyles] = useState<Record<string, KexStyle>>({});
  const [token, setToken] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const applying = useRef(false);

  useEffect(() => {
    setToken(getStoredEditorToken());
    try { setEnabled(localStorage.getItem(EDITOR_ON_KEY) === "1"); } catch {}
    supabase.from("app_copy").select("key, value, style").then(({ data }) => {
      if (!data) return;
      const nextText: Record<string, string> = {};
      const nextStyle: Record<string, KexStyle> = {};
      for (const row of data as { key: string; value: string; style: KexStyle | null }[]) {
        if (row.value) nextText[row.key] = row.value;
        if (row.style && Object.keys(row.style).length) nextStyle[row.key] = row.style;
      }
      setMap(nextText);
      setStyles(nextStyle);
    });
  }, []);

  // Re-apply DB overrides onto the live DOM whenever data or the DOM changes.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const hasOverrides = Object.keys(map).length > 0 || Object.keys(styles).length > 0;

    const run = () => {
      if (applying.current) return;
      applying.current = true;
      try {
        walkTextNodes((node) => {
          const key = keyForNode(node);
          const override = map[key];
          const orig = originalOf(node);
          const cur = node.nodeValue ?? "";
          // React re-rendered this node with genuinely new content: re-baseline.
          if (cur !== orig && cur !== override) originals.set(node, cur);
          if (override !== undefined && cur !== override) node.nodeValue = override;
          const st = styles[key];
          const el = node.parentElement;
          if (el && (st || el.style.length)) applyStyle(el, st);
        });
      } finally {
        applying.current = false;
      }
    };

    if (!hasOverrides) return;
    run();
    const obs = new MutationObserver(() => {
      if (applying.current) return;
      requestAnimationFrame(run);
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => obs.disconnect();
  }, [map, styles]);

  const save = useCallback(async (key: string, value: string, style?: KexStyle) => {
    if (!token) return;
    await kexSaveCopy({ data: { token, key, value, style: style ?? {} } });
    setMap((m) => ({ ...m, [key]: value }));
    setStyles((s) => {
      const n = { ...s };
      if (style && Object.keys(style).length) n[key] = style; else delete n[key];
      return n;
    });
  }, [token]);

  const reset = useCallback(async (key: string) => {
    if (!token) return;
    await kexResetCopy({ data: { token, key } });
    setMap((m) => { const n = { ...m }; delete n[key]; return n; });
    setStyles((s) => { const n = { ...s }; delete n[key]; return n; });
    if (typeof window !== "undefined") window.location.reload();
  }, [token]);

  const startEditor = useCallback((t: string) => {
    try { localStorage.setItem(EDITOR_TOKEN_KEY, t); localStorage.setItem(EDITOR_ON_KEY, "1"); } catch {}
    setToken(t);
    setEnabled(true);
  }, []);
  const stopEditor = useCallback(() => {
    try { localStorage.removeItem(EDITOR_TOKEN_KEY); localStorage.removeItem(EDITOR_ON_KEY); } catch {}
    setToken(null);
    setEnabled(false);
  }, []);
  const setEditing = useCallback((on: boolean) => {
    setEnabled(on);
    try { localStorage.setItem(EDITOR_ON_KEY, on ? "1" : "0"); } catch {}
  }, []);

  const value = useMemo<CopyCtx>(() => ({
    map, styles, editing: !!token && enabled, authorized: !!token, token,
    setEditing, save, reset, startEditor, stopEditor,
  }), [map, styles, token, enabled, setEditing, save, reset, startEditor, stopEditor]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <UniversalEditor />
    </Ctx.Provider>
  );
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

/** Explicitly-keyed editable text. Optional — every text node is editable anyway. */
export function T({ k, children, className }: { k: string; children: string; className?: string }) {
  const { map } = useCopyCtx();
  return <span data-kex-key={k} className={className}>{map[k] ?? children}</span>;
}

/* =========================================================
   EDITOR OVERLAY — tap anything, edit text / style / colors
   ========================================================= */
const SWATCHES: { label: string; value: string }[] = [
  { label: "Default", value: "" },
  { label: "Yellow", value: "var(--primary)" },
  { label: "Magenta", value: "var(--secondary)" },
  { label: "Cyan", value: "var(--accent)" },
  { label: "White", value: "var(--foreground)" },
  { label: "Grey", value: "var(--muted-foreground)" },
  { label: "Red", value: "var(--danger)" },
  { label: "Card", value: "var(--card)" },
  { label: "Dark", value: "var(--background)" },
];

type Target = { key: string; node: Text; el: HTMLElement; original: string };

function UniversalEditor() {
  const { editing, map, styles, save, reset } = useCopyCtx();
  const [target, setTarget] = useState<Target | null>(null);
  const [lines, setLines] = useState<Text[] | null>(null);
  const [draft, setDraft] = useState("");
  const [style, setStyle] = useState<KexStyle>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing || typeof document === "undefined") return;
    const onClick = (ev: MouseEvent) => {
      const el = ev.target as HTMLElement | null;
      if (!el || el.closest("[data-kex-editor]")) return;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") return;
      ev.preventDefault();
      ev.stopPropagation();
      // Edit mode ON = everything is text to rewrite. Toggle it off to interact.
      const pressable = el.closest("button,a,[role='button']") as HTMLElement | null;
      openFor(pressable ?? el);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [editing, map, styles]);

  /** All editable text lines inside an element, in document order. */
  const textLines = (el: HTMLElement): Text[] => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const out: Text[] = [];
    while (walker.nextNode()) {
      const n = walker.currentNode as Text;
      if (!/[A-Za-z]/.test(n.nodeValue ?? "")) continue;
      if (n.parentElement?.closest("[data-kex-editor]")) continue;
      out.push(n);
    }
    return out;
  };

  const editNode = (node: Text, fallbackEl?: HTMLElement) => {
    const key = keyForNode(node);
    const original = originalOf(node);
    setTarget({ key, node, el: node.parentElement ?? fallbackEl ?? document.body, original });
    setDraft(map[key] ?? node.nodeValue ?? original);
    setStyle(styles[key] ?? {});
    setLines(null);
  };

  const openFor = (el: HTMLElement) => {
    const found = textLines(el);
    if (found.length === 0) return;
    // Several lines of text in one element (e.g. a multi-line button): let the
    // editor pick which line to work on. Each line keeps its own override.
    if (found.length > 1) { setLines(found); return; }
    editNode(found[0], el);
  };

  if (!editing) return null;

  return (
    <div data-kex-editor="1">
      {lines && (
        <div className="fixed inset-0 z-[115] flex items-center justify-center bg-black/70 p-4" onClick={() => setLines(null)}>
          <div className="max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-2xl border-4 border-secondary bg-card p-4" onClick={(e) => e.stopPropagation()}>
            <div className="font-condensed text-xs font-black uppercase tracking-widest text-secondary">
              Which line do you want to edit?
            </div>
            <div className="mt-3 space-y-2">
              {lines.map((n, i) => {
                const k = keyForNode(n);
                const text = (map[k] ?? n.nodeValue ?? "").trim();
                return (
                  <button
                    key={`${k}-${i}`}
                    onClick={() => editNode(n)}
                    className="w-full rounded-xl border-2 border-border bg-background p-3 text-left hover:border-primary"
                  >
                    <div className="font-condensed text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Line {i + 1}
                    </div>
                    <div className="font-display text-lg leading-tight text-foreground">
                      {text.length > 70 ? `${text.slice(0, 70)}…` : text}
                    </div>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setLines(null)} className="mt-3 w-full font-condensed text-xs font-black uppercase text-muted-foreground">CANCEL</button>
          </div>
        </div>
      )}



      {target && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-3" onClick={() => setTarget(null)}>
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border-4 border-secondary bg-card p-4 shadow-comic-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-condensed text-xs font-black uppercase tracking-widest text-secondary">
              Editing text · {target.key}
            </div>
            <textarea
              autoFocus
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="mt-2 w-full rounded-lg border-2 border-border bg-background p-3 text-foreground"
            />

            <Swatches label="Text color" value={style.color ?? ""} onPick={(v) => setStyle((s) => ({ ...s, color: v || undefined }))} />
            <Swatches label="Box background" value={style.bg ?? ""} onPick={(v) => setStyle((s) => ({ ...s, bg: v || undefined }))} />
            <Swatches label="Border color" value={style.border ?? ""} onPick={(v) => setStyle((s) => ({ ...s, border: v || undefined }))} />

            <div className="mt-3 flex flex-wrap gap-2">
              <Toggle on={style.weight === "900"} label="BOLD" onClick={() => setStyle((s) => ({ ...s, weight: s.weight ? undefined : "900" }))} />
              <Toggle on={!!style.italic} label="ITALIC" onClick={() => setStyle((s) => ({ ...s, italic: !s.italic }))} />
              <Toggle on={!!style.underline} label="UNDERLINE" onClick={() => setStyle((s) => ({ ...s, underline: !s.underline }))} />
              <Toggle on={style.size === "0.85em"} label="SMALLER" onClick={() => setStyle((s) => ({ ...s, size: s.size === "0.85em" ? undefined : "0.85em" }))} />
              <Toggle on={style.size === "1.25em"} label="BIGGER" onClick={() => setStyle((s) => ({ ...s, size: s.size === "1.25em" ? undefined : "1.25em" }))} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try { await save(target.key, draft, style); setTarget(null); } finally { setBusy(false); }
                }}
                className="rounded-lg bg-primary px-4 py-2 font-display text-xl text-primary-foreground shadow-comic disabled:opacity-50"
              >SAVE</button>
              <button
                disabled={busy}
                onClick={async () => { setBusy(true); try { await reset(target.key); setTarget(null); } finally { setBusy(false); } }}
                className="rounded-lg border-2 border-border bg-card px-4 py-2 font-condensed text-sm font-black uppercase text-foreground"
              >RESET TO ORIGINAL</button>
              <button onClick={() => setTarget(null)} className="rounded-lg border-2 border-border px-4 py-2 font-condensed text-sm font-black uppercase text-muted-foreground">CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Swatches({ label, value, onPick }: { label: string; value: string; onPick: (v: string) => void }) {
  return (
    <div className="mt-3">
      <div className="font-condensed text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 flex flex-wrap gap-2">
        {SWATCHES.map((s) => (
          <button
            key={s.label}
            onClick={() => onPick(s.value)}
            title={s.label}
            className={`h-8 w-8 rounded-full border-2 ${value === s.value ? "border-primary" : "border-border"}`}
            style={{ background: s.value || "transparent" }}
          >
            {!s.value && <span className="font-condensed text-[9px] font-black text-muted-foreground">×</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border-2 px-3 py-1 font-condensed text-xs font-black uppercase ${on ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"}`}
    >
      {label}
    </button>
  );
}

/** Floating banner shown while the editor is active. */
export function EditorBar() {
  const { editing, stopEditor } = useCopyCtx();
  if (!editing) return null;
  return (
    <div data-kex-editor="1" className="fixed bottom-0 left-0 right-0 z-[90] flex items-center justify-between gap-3 border-t-4 border-secondary bg-secondary/95 px-4 py-2 text-secondary-foreground">
      <div className="font-condensed text-xs font-black uppercase tracking-widest">✏️ EDITOR MODE — tap ANY text to rewrite or restyle it</div>
      <button onClick={stopEditor} className="rounded-lg border-2 border-secondary-foreground px-3 py-1 font-condensed text-xs font-black uppercase">EXIT EDITOR</button>
    </div>
  );
}
