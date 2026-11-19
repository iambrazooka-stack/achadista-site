# Achadista site

A static deals site: Instagram post → code → deal → Mercado Livre affiliate link. No server or build step, so it hosts free on GitHub Pages, Cloudflare Pages or Netlify.

## Daily use
1. Generate the affiliate link in the Mercado Livre **Afiliados e Criadores** hub and use it **exactly as issued** (no Bitly; ML terms 1.8).
2. Open `admin.html`, fill in the deal, click **Adicionar**, then **Baixar deals.json** and replace `deals.json`.
3. On Instagram, put the code on the post or story ("Achado A117 — link na bio") and link straight to it: `seusite.com/#A117`.
4. Mark old deals as **Encerrado** (the commission cookie lasts only 24 h, and stale prices break the affiliate rules).

## Settings
At the top of `app.js`: `CONFIG.instagram` (your @ handle) and `CONFIG.groupUrl` (WhatsApp or Telegram group).

## Rules (from Cursor's research, 2026-11-16; confirm in the hub)
- Register the site's domain as a declared channel in the affiliate program, or clicks on it won't pay.
- No ML logo, and no "Mercado Livre" in the domain or profile name. The "links de afiliado" notice stays.
- Commission: beleza/moda/esportes 16%; casa/games/bebês/ferramentas 12%; electronics/phones/computers 5%; food 0%.
- No Google/YouTube Ads to affiliate links. Use `#publi` on Instagram posts.
- If you add GA4 or a Meta pixel, add a cookie banner and a privacy notice (LGPD).

Sample deals in `deals.json` point to the ML home page; replace them with real deals.
