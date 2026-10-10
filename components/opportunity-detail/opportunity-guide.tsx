"use client";

import { BookOpen, Check, Clock3, ExternalLink } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { OpportunityGuideDocument } from "@/types/opportunity-knowledge-hub";

function youtubeEmbed(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return `https://www.youtube-nocookie.com/embed/${parsed.pathname.slice(1)}`;
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v") ?? parsed.pathname.split("/").filter(Boolean).at(-1);
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

function vimeoEmbed(url: string) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("vimeo.com")) return null;
    const id = parsed.pathname.split("/").filter(Boolean).at(-1);
    return id ? `https://player.vimeo.com/video/${id}` : null;
  } catch {
    return null;
  }
}

const markdownComponents: Components = {
  h1: ({ children }) => <h2 className="mb-5 mt-12 text-[clamp(1.85rem,4vw,2.6rem)] font-semibold leading-tight tracking-[-.045em] text-[#18372b] first:mt-0">{children}</h2>,
  h2: ({ children }) => <h2 className="mb-4 mt-12 scroll-mt-28 border-t border-[#dfe5e1] pt-10 text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-[-.04em] text-[#1c372c] first:mt-0 first:border-0 first:pt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-3 mt-8 text-lg font-semibold tracking-[-.025em] text-[#29493c]">{children}</h3>,
  p: ({ children }) => <p className="my-4 text-[13px] leading-7 text-[#506159]">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-[#29493c]">{children}</strong>,
  ul: ({ children }) => <ul className="my-5 grid gap-2.5 pl-1">{children}</ul>,
  ol: ({ children }) => <ol className="my-6 ml-4 list-decimal space-y-3 pl-4 marker:font-semibold marker:text-[#078166]">{children}</ol>,
  li: ({ children, className }) => {
    const isTask = className?.includes("task-list-item");
    return <li className={isTask ? "flex list-none items-start gap-3 rounded-[14px] border border-[#e0e6e3] bg-white px-4 py-3 text-[11px] leading-5 text-[#596a62] [&>input]:mt-0.5 [&>input]:size-4 [&>input]:accent-[#079272]" : "ml-4 list-disc pl-1 text-[12px] leading-6 text-[#596a62] marker:text-[#079272]"}>{children}</li>;
  },
  blockquote: ({ children }) => <blockquote className="my-7 border-l-2 border-[#079272] bg-[#f1f8f5] px-5 py-3 [&>p]:my-1 [&>p]:text-[#456056]">{children}</blockquote>,
  hr: () => <hr className="my-10 border-0 border-t border-[#dce4e0]" />,
  a: ({ href = "", children }) => {
    const external = /^https?:\/\//.test(href);
    return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className="inline-flex items-center gap-1 font-semibold text-[#067b61] underline decoration-[#a6cfc0] underline-offset-4 transition hover:text-[#045d4a]">{children}{external && <ExternalLink size={11} />}</a>;
  },
  table: ({ children }) => <div className="my-7 overflow-x-auto rounded-[16px] border border-[#dce4e0]"><table className="w-full min-w-[520px] border-collapse bg-white text-left">{children}</table></div>,
  thead: ({ children }) => <thead className="bg-[#eff6f2]">{children}</thead>,
  th: ({ children }) => <th className="border-b border-[#dce4e0] px-4 py-3 text-[9px] font-bold uppercase tracking-[.09em] text-[#597067]">{children}</th>,
  td: ({ children }) => <td className="border-b border-[#e5eae7] px-4 py-3 text-[10px] leading-5 text-[#5d6c65] last:[tr:last-child_&]:border-b-0">{children}</td>,
  code: ({ children, className }) => className
    ? <code className={`${className} my-5 block overflow-x-auto rounded-[14px] bg-[#17372b] p-4 text-[10px] leading-5 text-[#e9f7f1]`}>{children}</code>
    : <code className="rounded bg-[#edf3ef] px-1.5 py-0.5 text-[10px] text-[#14644f]">{children}</code>,
  img: ({ src = "", alt = "" }) => {
    const source = typeof src === "string" ? src : "";
    const isVideo = alt.toLocaleLowerCase("pt-BR").startsWith("vídeo:");
    const caption = isVideo ? alt.replace(/^vídeo:\s*/i, "") : alt;
    const embed = isVideo ? youtubeEmbed(source) ?? vimeoEmbed(source) : null;
    const directVideo = isVideo && /\.(mp4|webm|ogg)(\?.*)?$/i.test(source);

    if (embed) {
      return <figure className="my-8"><div className="aspect-video overflow-hidden rounded-[18px] border border-[#dce4e0] bg-[#132e25] shadow-[0_14px_34px_rgba(28,54,43,.09)]"><iframe className="size-full" src={embed} title={caption || "Vídeo do guia"} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>{caption && <figcaption className="mt-2 text-center text-[9px] text-[#7d8983]">{caption}</figcaption>}</figure>;
    }

    if (directVideo) {
      return <figure className="my-8"><video className="w-full rounded-[18px] border border-[#dce4e0] bg-[#132e25]" src={source} controls preload="metadata" />{caption && <figcaption className="mt-2 text-center text-[9px] text-[#7d8983]">{caption}</figcaption>}</figure>;
    }

    return <figure className="my-8"><img className="h-auto w-full rounded-[18px] border border-[#dce4e0] object-cover shadow-[0_14px_34px_rgba(28,54,43,.07)]" src={source} alt={alt} loading="lazy" />{alt && <figcaption className="mt-2 text-center text-[9px] text-[#7d8983]">{alt}</figcaption>}</figure>;
  },
};

function GuideMarkdown({ markdown }: { markdown: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{markdown}</ReactMarkdown>;
}

export function OpportunityGuide({ document }: { document: OpportunityGuideDocument }) {
  return (
    <article className="mx-auto max-w-[760px]">
      <header className="border-b border-[#dce4e0] pb-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-[9px] font-semibold text-[#7b8781]">
            <span className="inline-flex items-center gap-1.5 text-[#078166]"><BookOpen size={13} />Guia seConecta</span>
            <span className="size-1 rounded-full bg-[#c4cec9]" />
            <span className="inline-flex items-center gap-1.5"><Clock3 size={12} />{document.readTime}</span>
          </div>
        </div>
        <h1 className="mt-5 text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.05] tracking-[-.055em] text-[#17372b]">{document.title}</h1>
        <p className="mt-5 max-w-2xl text-[14px] leading-7 text-[#5d6d65]">{document.summary}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[9px] text-[#87928c]">
          <span>Curadoria seConecta</span>
          <span className="inline-flex items-center gap-1.5"><Check size={11} className="text-[#078166]" />{document.updatedAt}</span>
        </div>
      </header>

      <div className="py-8">
        <GuideMarkdown markdown={document.markdown} />
      </div>
    </article>
  );
}
