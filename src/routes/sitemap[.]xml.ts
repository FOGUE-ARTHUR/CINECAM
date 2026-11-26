import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { movies } from "../data/movies";
import { escapeXml } from "../lib/security";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

function resolveBaseUrl(request: Request): string {
  const configured = process.env.SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // Fallback sur l'origine de la requête si SITE_URL est invalide
    }
  }
  return new URL(request.url).origin;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const baseUrl = resolveBaseUrl(request);
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/movies", changefreq: "daily", priority: "0.9" },
          { path: "/cinemas", changefreq: "weekly", priority: "0.7" },
          ...movies.map((m) => ({
            path: `/Movies/${encodeURIComponent(m.id)}`,
            changefreq: "weekly" as const,
            priority: "0.6",
          })),
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${escapeXml(`${baseUrl}${e.path}`)}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
