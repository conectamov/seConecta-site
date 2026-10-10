import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="site-shell" style={{ padding: "72px 0 96px" }}>
        <section
          style={{
            maxWidth: 640,
            border: "1px solid #e7e5e4",
            borderRadius: 28,
            padding: 32,
            background: "#fff",
            boxShadow: "0 20px 60px rgba(24, 24, 27, 0.06)",
          }}
        >
          <p style={{ margin: 0, color: "#079272", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Página não encontrada
          </p>
          <h1 style={{ margin: "16px 0 12px", fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05, letterSpacing: "-0.04em" }}>
            Essa página saiu do mapa.
          </h1>
          <p style={{ margin: 0, color: "#52525b", fontSize: 16, lineHeight: 1.7 }}>
            A seConecta ajuda estudantes a encontrar oportunidades, acompanhar prazos, descobrir trajetórias e se conectar com a comunidade certa.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 44,
                padding: "0 18px",
                borderRadius: 999,
                background: "#079272",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Voltar para o início
            </Link>
            <Link
              href="/explorar"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 44,
                padding: "0 18px",
                border: "1px solid #d6d3d1",
                borderRadius: 999,
                background: "#fafaf9",
                color: "#18181b",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Explorar oportunidades
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
