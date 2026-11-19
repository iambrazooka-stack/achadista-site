// ===== CONFIG: troque aqui =====
const CONFIG = {
  instagram: "achadista",                 // @ do Instagram (sem o @)
  groupUrl: "https://www.instagram.com/achadista/", // link do grupo WhatsApp/Telegram (ou deixe o Instagram)
};

const CATEGORIES = [
  { id: "all", name: "Todos" },
  { id: "beleza", name: "Beleza e Cuidado" },
  { id: "moda", name: "Moda e Calçados" },
  { id: "casa", name: "Casa e Decoração" },
  { id: "cozinha", name: "Cozinha" },
  { id: "bebes", name: "Bebês e Kids" },
  { id: "esportes", name: "Esportes e Fitness" },
  { id: "games", name: "Games" },
  { id: "eletronicos", name: "Celulares e Eletrônicos" },
  { id: "informatica", name: "Informática" },
  { id: "ferramentas", name: "Ferramentas" },
  { id: "pet", name: "Pets" },
];

const $ = (s) => document.querySelector(s);
const igUrl = `https://www.instagram.com/${CONFIG.instagram}/`;
const state = { deals: [], cat: "all", q: "", sort: "new", free: false };

const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const off = (d) => (d.oldPrice > d.price ? Math.round((1 - d.price / d.oldPrice) * 100) : 0);
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const catName = (id) => (CATEGORIES.find((c) => c.id === id) || {}).name || "";

function ago(d) {
  if (!d.added) return "";
  const days = Math.round((new Date().setHours(12, 0, 0, 0) - new Date(d.added + "T12:00")) / 864e5);
  return days <= 0 ? "Postado hoje" : days === 1 ? "Postado ontem" : `Postado há ${days} dias`;
}
function priceHTML(n) {
  const [int, cents] = n.toFixed(2).split(".");
  return `R$ ${Number(int).toLocaleString("pt-BR")}<sup>${cents}</sup>`;
}
function thumbHTML(d) {
  return d.img ? `<img src="${esc(d.img)}" alt="" loading="lazy">` : `<span aria-hidden="true">${d.emoji || "🛍️"}</span>`;
}
function safeLink(u) {
  try { const x = new URL(u); return x.protocol === "https:" ? x.href : "#"; } catch { return "#"; }
}
function buyBtn(d, cls = "") {
  return `<a class="btn btn-primary ${cls}" href="${safeLink(d.link)}" target="_blank" rel="sponsored nofollow noopener" data-buy="${esc(d.code)}">Ver no Mercado Livre</a>`;
}

function cardHTML(d) {
  const o = off(d);
  return `<article class="card${d.expired ? " expired" : ""}" data-code="${esc(d.code)}" tabindex="0">
    <span class="code-tag">${esc(d.code)}</span>${d.expired ? '<span class="hot-tag exp-tag">Encerrado</span>' : d.hot ? '<span class="hot-tag">🔥 Quente</span>' : ""}
    <div class="thumb">${thumbHTML(d)}</div>
    <div class="card-body">
      ${o ? `<span class="old">${brl(d.oldPrice)}</span>` : ""}
      <div class="price-row"><span class="price">${priceHTML(d.price)}</span>${o ? `<span class="off">${o}% OFF</span>` : ""}</div>
      ${d.freeShipping ? `<span class="ship">Frete grátis ${d.full ? '<span class="full">⚡FULL</span>' : ""}</span>` : ""}
      <h3 class="card-title">${esc(d.title)}</h3>
      <span class="when${ago(d) === "Postado hoje" ? " today" : ""}">${ago(d)}</span>
      <div class="go">${buyBtn(d, "btn-block")}</div>
    </div>
  </article>`;
}

function renderCats() {
  $("#cats").innerHTML = CATEGORIES.filter((c) => c.id === "all" || state.deals.some((d) => d.category === c.id))
    .map((c) => `<button class="cat${c.id === state.cat ? " active" : ""}" data-cat="${c.id}">${c.name}</button>`).join("");
}

function filtered() {
  const q = norm(state.q.trim());
  let list = state.deals.filter((d) => (state.cat === "all" || d.category === state.cat) && (!state.free || d.freeShipping));
  if (q) {
    const exact = list.filter((d) => norm(d.code) === q.replace(/^#/, ""));
    if (exact.length) return exact;
    const words = q.split(/\s+/);
    list = list.filter((d) => { const hay = norm(`${d.title} ${d.code} ${catName(d.category)}`); return words.every((w) => hay.includes(w)); });
  }
  const s = { new: (a, b) => (b.added || "").localeCompare(a.added || ""), discount: (a, b) => off(b) - off(a), low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price }[state.sort];
  return [...list].sort(s).sort((a, b) => !!a.expired - !!b.expired);
}

function render() {
  const list = filtered();
  $("#grid").innerHTML = list.map(cardHTML).join("");
  $("#empty").hidden = list.length > 0;
  const title = state.q ? `Resultados para “${state.q}”` : state.cat !== "all" ? catName(state.cat) : "Achados de hoje";
  $("#listTitle").textContent = `${title} (${list.length})`;
  renderCats();
}

function renderDealOfDay() {
  const d = state.deals.filter((x) => x.hot && !x.expired).sort((a, b) => off(b) - off(a))[0] || state.deals[0];
  if (!d) return;
  $("#dealOfDay").innerHTML = `<span class="badge-day">Achado do dia · ${esc(d.code)}</span>
    <div class="thumb">${thumbHTML(d)}</div>
    <div><h3>${esc(d.title)}</h3>
      <span class="old">${brl(d.oldPrice)}</span>
      <div class="price-row"><span class="price">${priceHTML(d.price)}</span><span class="off">${off(d)}% OFF</span></div>
    </div>`;
  $("#dealOfDay").onclick = () => openDeal(d.code);
}

function openDeal(code) {
  const d = state.deals.find((x) => x.code.toLowerCase() === String(code).toLowerCase());
  if (!d) return;
  const o = off(d);
  const share = `${location.origin}${location.pathname}#${encodeURIComponent(d.code)}`;
  $("#dlgBody").innerHTML = `<button class="dlg-close" aria-label="Fechar">×</button>
    <div class="thumb">${thumbHTML(d)}</div>
    <span class="code-tag" style="position:static;align-self:flex-start">Código ${esc(d.code)} · ${esc(catName(d.category))}</span>
    <h3>${esc(d.title)}</h3>
    ${o ? `<span class="old">${brl(d.oldPrice)}</span>` : ""}
    <div class="price-row"><span class="price">${priceHTML(d.price)}</span>${o ? `<span class="off">${o}% OFF</span>` : ""}</div>
    ${d.freeShipping ? `<span class="ship">Frete grátis ${d.full ? '<span class="full">⚡FULL</span>' : ""}</span>` : ""}
    <div class="dlg-row">${buyBtn(d)}${d.ig ? `<a class="btn btn-ghost" href="${safeLink(d.ig)}" target="_blank" rel="noopener">Ver o post</a>` : ""}</div>
    ${d.expired ? '<p class="exp-note">Esta oferta pode ter acabado. Confira o preço atual antes de comprar.</p>' : ""}
    <div class="dlg-row"><a class="btn btn-wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(`${d.title} por ${brl(d.price)} 👉 ${share}`)}">WhatsApp</a><button class="btn btn-ghost" id="shareBtn">Compartilhar</button></div>
    <p class="fine">Link de afiliado: podemos receber comissão se você comprar. ${ago(d)}. Preço sujeito a mudança: confira o valor final no Mercado Livre.</p>`;
  const dlg = $("#dealDialog");
  dlg.showModal();
  dlg.querySelector(".dlg-close").onclick = () => dlg.close();
  $("#shareBtn").onclick = async () => {
    const data = { title: d.title, text: `${d.title} por ${brl(d.price)} — achado ${d.code}`, url: share };
    try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(share); $("#shareBtn").textContent = "Link copiado!"; } } catch {}
  };
  history.replaceState(null, "", `?d=${encodeURIComponent(d.code)}`);
}

function bind() {
  for (const id of ["#igTop", "#igHero", "#igBand", "#igFoot"]) $(id).href = igUrl;
  for (const id of ["#groupHero", "#groupBand"]) $(id).href = CONFIG.groupUrl;
  $("#igHandleTop").textContent = "@" + CONFIG.instagram;
  $("#igBand").textContent = "Seguir @" + CONFIG.instagram;
  $("#year").textContent = new Date().getFullYear();

  let t;
  $("#q").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value; render(); }, 120); });
  $("#searchForm").addEventListener("submit", (e) => {
    e.preventDefault(); state.q = $("#q").value; render();
    const list = filtered();
    if (list.length === 1 && norm(list[0].code) === norm(state.q.trim()).replace(/^#/, "")) openDeal(list[0].code);
    $("#grid").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#cats").addEventListener("click", (e) => { const b = e.target.closest("[data-cat]"); if (!b) return; state.cat = b.dataset.cat; render(); });
  $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
  $("#fFree").addEventListener("change", (e) => { state.free = e.target.checked; render(); });
  $("#grid").addEventListener("click", (e) => { if (e.target.closest("[data-buy]")) return; const c = e.target.closest(".card"); if (c) openDeal(c.dataset.code); });
  $("#grid").addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.classList.contains("card")) openDeal(e.target.dataset.code); });
  document.querySelectorAll(".code-chip").forEach((b) => b.addEventListener("click", () => { $("#q").value = b.dataset.code; $("#searchForm").requestSubmit(); }));
  $("#dealDialog").addEventListener("close", () => history.replaceState(null, "", location.pathname));
  $("#dealDialog").addEventListener("click", (e) => { if (e.target.id === "dealDialog") e.target.close(); });
}

async function init() {
  bind();
  try {
    const res = await fetch("deals.json", { cache: "no-cache" });
    state.deals = (await res.json()).deals || [];
  } catch { state.deals = []; }
  const p = new URLSearchParams(location.search);
  if (p.get("cat")) state.cat = p.get("cat");
  if (p.get("q")) { state.q = p.get("q"); $("#q").value = state.q; }
  renderDealOfDay();
  render();
  const code = p.get("d") || decodeURIComponent(location.hash.slice(1));
  if (code && code !== "sobre") openDeal(code);
  window.addEventListener("hashchange", () => { const c = decodeURIComponent(location.hash.slice(1)); if (c && c !== "sobre") openDeal(c); });
}
init();
