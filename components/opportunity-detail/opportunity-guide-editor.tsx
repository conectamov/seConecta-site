"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Eye, Heading2, ImageIcon, Link2, ListChecks, PencilLine, RotateCcw, Save, Video, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

type EditorMode = "write" | "preview";

type OpportunityGuideEditorProps = {
  open: boolean;
  title: string;
  initialMarkdown: string;
  onClose: () => void;
  onSave: (markdown: string) => void;
  onReset: () => void;
  renderPreview: (markdown: string) => ReactNode;
};

const tools = [
  { label: "Título", icon: Heading2, prefix: "## ", suffix: "", placeholder: "Novo título" },
  { label: "Checklist", icon: ListChecks, prefix: "- [ ] ", suffix: "", placeholder: "Nova etapa" },
  { label: "Link", icon: Link2, prefix: "[", suffix: "](https://)", placeholder: "Texto do link" },
  { label: "Imagem", icon: ImageIcon, prefix: "![", suffix: "](/images/guias/imagem.jpg)", placeholder: "Legenda da imagem" },
  { label: "Vídeo", icon: Video, prefix: "![Vídeo: ", suffix: "](https://www.youtube.com/watch?v=)", placeholder: "Título do vídeo" },
];

export function OpportunityGuideEditor({
  open,
  title,
  initialMarkdown,
  onClose,
  onSave,
  onReset,
  renderPreview,
}: OpportunityGuideEditorProps) {
  const [draft, setDraft] = useState(initialMarkdown);
  const [mode, setMode] = useState<EditorMode>("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(initialMarkdown);
    setMode("write");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [initialMarkdown, open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  const insertMarkdown = (prefix: string, suffix: string, placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = draft.slice(start, end) || placeholder;
    const before = draft.slice(0, start);
    const needsNewLine = prefix.startsWith("#") || prefix.startsWith("-") ? before.length > 0 && !before.endsWith("\n") : false;
    const insertion = `${needsNewLine ? "\n" : ""}${prefix}${selected}${suffix}`;
    const next = `${before}${insertion}${draft.slice(end)}`;
    setDraft(next);
    window.requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + insertion.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1300] grid place-items-center bg-[#14221d]/48 p-0 backdrop-blur-sm sm:p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => event.currentTarget === event.target && onClose()}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-editor-title"
            className="flex h-[100svh] w-full flex-col overflow-hidden bg-[#f7f9f7] shadow-[0_30px_100px_rgba(17,39,30,.3)] sm:h-[min(820px,calc(100svh-40px))] sm:max-w-[1120px] sm:rounded-[28px] sm:border sm:border-white/70"
            initial={{ opacity: 0, y: 16, scale: .988 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: .992 }}
            transition={{ duration: .2 }}
          >
            <header className="flex min-h-17 items-center gap-3 border-b border-[#dce4e0] bg-white px-4 sm:px-6">
              <span className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-[#eaf7f2] text-[#078166]"><PencilLine size={16} /></span>
              <div className="min-w-0 flex-1">
                <span className="text-[8px] font-bold uppercase tracking-[.13em] text-[#078166]">Editor Markdown</span>
                <h2 id="guide-editor-title" className="truncate text-sm font-semibold tracking-[-.02em] text-[#17372b]">{title}</h2>
              </div>
              <div className="flex rounded-full border border-[#dce4e0] bg-[#f4f7f5] p-1">
                <button type="button" onClick={() => setMode("write")} className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-[9px] font-semibold ${mode === "write" ? "bg-white text-[#078166] shadow-sm" : "text-[#6f7c76]"}`}><PencilLine size={11} />Editar</button>
                <button type="button" onClick={() => setMode("preview")} className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-[9px] font-semibold ${mode === "preview" ? "bg-white text-[#078166] shadow-sm" : "text-[#6f7c76]"}`}><Eye size={11} />Visualizar</button>
              </div>
              <button type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-full text-[#65736c] hover:bg-[#f0f4f2]" aria-label="Fechar editor"><X size={17} /></button>
            </header>

            {mode === "write" && (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex min-h-13 items-center gap-1.5 overflow-x-auto border-b border-[#dce4e0] bg-white px-4 sm:px-6">
                  {tools.map(({ label, icon: Icon, prefix, suffix, placeholder }) => (
                    <button key={label} type="button" title={`Inserir ${label.toLocaleLowerCase("pt-BR")}`} onClick={() => insertMarkdown(prefix, suffix, placeholder)} className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-[9px] px-2.5 text-[9px] font-medium text-[#607068] transition hover:bg-[#edf5f1] hover:text-[#078166]">
                      <Icon size={12} />{label}
                    </button>
                  ))}
                  <span className="ml-auto hidden shrink-0 text-[8px] text-[#929c97] md:block">As alterações ficam salvas neste navegador.</span>
                </div>
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  spellCheck
                  className="min-h-0 flex-1 resize-none border-0 bg-[#fbfcfb] px-5 py-6 font-mono text-[12px] leading-6 text-[#31483f] outline-none selection:bg-[#cce9dd] sm:px-8"
                  aria-label="Conteúdo Markdown do guia"
                />
              </div>
            )}

            {mode === "preview" && (
              <div className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-7 sm:px-10">
                <div className="mx-auto max-w-[760px]">{renderPreview(draft)}</div>
              </div>
            )}

            <footer className="flex min-h-17 items-center gap-3 border-t border-[#dce4e0] bg-white px-4 sm:px-6">
              <button type="button" onClick={() => { onReset(); onClose(); }} className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-[9px] font-semibold text-[#78847e] transition hover:bg-[#f1f4f2] hover:text-[#b05e48]"><RotateCcw size={13} />Restaurar original</button>
              <button type="button" onClick={onClose} className="ml-auto hidden min-h-10 rounded-full px-4 text-[9px] font-semibold text-[#607068] sm:block">Cancelar</button>
              <button type="button" onClick={() => { onSave(draft); onClose(); }} disabled={!draft.trim()} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#079272] px-5 text-[9px] font-semibold text-white shadow-[0_7px_18px_rgba(7,146,114,.15)] transition hover:bg-[#06765d] disabled:opacity-40"><Save size={13} />Salvar guia</button>
            </footer>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
