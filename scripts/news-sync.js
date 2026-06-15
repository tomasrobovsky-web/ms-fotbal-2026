'use strict';
/**
 * News Sync — stahuje fotbalové zprávy (MS 2026) z českých sportovních RSS feedů.
 *
 * Pracuje VÝHRADNĚ s daty z RSS (žádné stahování obsahu stránek).
 * Lehký a stabilní: každý zdroj v try/catch, pád jednoho feedu nezhodí ostatní.
 *
 * Spuštění:
 *   node scripts/news-sync.js        → jeden sync, zapíše public/data/news.json
 *   require('./news-sync').syncNews() → z workeru
 */

const Parser = require('rss-parser');
const { writeJSON } = require('./lib/store');

// ── Zdroje ───────────────────────────────────────────────────────────────────

const SOURCES = [
  { source: 'iSport',     url: 'https://isport.blesk.cz/rss' },
  { source: 'Sport.cz',   url: 'https://www.sport.cz/rss' },
  { source: 'ČT sport',   url: 'https://sport.ceskatelevize.cz/rss' },
  { source: 'Eurofotbal', url: 'https://www.eurofotbal.cz/feed/rss/' },
  { source: 'Nova Sport', url: 'https://tn.nova.cz/feed/atom/tnnova-3' },
];

const MAX_ITEMS = 40;       // kolik nejnovějších článků celkem ponechat
const FEED_TIMEOUT = 10000; // ms na jeden feed

const parser = new Parser({
  timeout: FEED_TIMEOUT,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MS-Fotbal-2026/1.0; news-sync)' },
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

// ── Filtrovací logika (třífázová) ────────────────────────────────────────────

// Fáze 1 — vylučovací slova (jiné sporty)
const blacklist = /hokej|florbal|basketbal|ragby|atletik|biatlon|tenis|formule|ea sports|esport|nhl|nba|nfl|baseball|cyklist|lyžov|volejbal|házen|šipk|extralig/i;

// Fáze 2 — přesné shody (jednoznačně MS ve fotbale → rovnou propustit)
const exactMatches = /MS 2026|MS '26|MS 26|MS ve fotbale|fotbalové MS|fotbalovém MS|Mistrovství světa 2026|Mistrovství světa ve fotbale|fotbalové mistrovství|fotbalového mistrovství|World Cup|FIFA|Mundial|šampionát ve fotbale|fotbalový šampionát|fotbalovém šampionátu|světový fotbalový šampionát|fotbalový svátek|MS v USA|MS v Mexiku|MS v Kanadě|MS v Severní Americe|United 2026/i;

// Fáze 3a — obecné pojmy (samy o sobě nestačí)
const broadTerms = /(^|\s)(MS|mistrovství světa|světový šampionát|světového šampionátu|šampionát|turnaj|Mexik[ou]?|Kanad[aěyeou]?|USA|Spojené státy|Spojených státech)($|\s|[.,:;?!])/i;

// Fáze 3b — globální fotbalový kontext (musí být spolu s obecným pojmem)
const globalContext = /osmifinále|čtvrtfinále|semifinále|finále|reprezentac|národní tým|výběr|zápas|utkání|postup|Brazíli|Argentin|Franc|Angli|Španělsk|Německ|Itáli|Portugal|Nizozemsk|Uruguay|Kolumbi|Belgi|Chorvatsk|Mbappé|Messi|Bellingham|Vinícius|Ronaldo|trenér|kouč/i;

/**
 * Vrací true, když je text relevantní pro fotbalové MS 2026.
 *   !blacklist && ( exactMatches || (broadTerms && globalContext) )
 */
function isRelevant(text) {
  if (!text) return false;
  if (blacklist.test(text)) return false;
  if (exactMatches.test(text)) return true;
  return broadTerms.test(text) && globalContext.test(text);
}

// ── Trvale vyřazené přehledové / rozcestníkové stránky ───────────────────────
// Stále aktualizované „hub" stránky (program, tabulky, skupiny) se re-publikují
// a vracejí při každém refreshi. Vyřazujeme je podle URL i charakteristického
// titulku (odolné i vůči nové URL se stejným typem stránky).

const EXCLUDED_URLS = new Set([
  'https://isport.blesk.cz/clanek/fotbal-reprezentace-ms-fotbal-2026/469672/ms-ve-fotbale-2026-kompletni-program-vysledky-tabulky-skupiny-zajimavosti-kdy-hraji-cesi.html',
  'https://isport.blesk.cz/clanek/fotbal-reprezentace-ms-fotbal-2026/476278/tabulky-ms-ve-fotbale-2026-jake-je-poradi-skupin-jak-si-vedou-cesi.html',
]);

const evergreenTitle = /kompletní program|kdy hrají Češi|jaké je pořadí skupin|pořadí skupin\?|kompletní přehled|vše, co potřebujete vědět/i;

function isExcludedPage(title, url) {
  if (url && EXCLUDED_URLS.has(url)) return true;
  return evergreenTitle.test(title || '');
}

// ── Pomocné funkce ───────────────────────────────────────────────────────────

// Krátký stabilní hash z URL (jen pro React key / dedup) — djb2 → base36
function hashId(url) {
  let h = 5381;
  for (let i = 0; i < url.length; i++) {
    h = ((h << 5) + h + url.charCodeAt(i)) | 0;
  }
  return 'n' + (h >>> 0).toString(36);
}

// Vyextrahuje obrázek POUZE z RSS dat (enclosure / media:content / media:thumbnail
// / <img> v content:encoded). Žádné stahování stránek. Jinak null.
function extractImage(item) {
  // 1) enclosure (rss-parser parsuje defaultně)
  if (item.enclosure && item.enclosure.url) {
    const type = item.enclosure.type || '';
    if (!type || /^image\//i.test(type)) return item.enclosure.url;
  }
  // 2) media:content (může být pole)
  const mc = item.mediaContent;
  if (Array.isArray(mc)) {
    for (const m of mc) {
      const url = m && m.$ && m.$.url;
      const medium = m && m.$ && (m.$.medium || m.$.type || '');
      if (url && (!medium || /image/i.test(medium))) return url;
    }
  } else if (mc && mc.$ && mc.$.url) {
    return mc.$.url;
  }
  // 3) media:thumbnail
  if (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) {
    return item.mediaThumbnail.$.url;
  }
  // 4) první <img> v content:encoded / content
  const html = item.contentEncoded || item['content:encoded'] || item.content || '';
  const m = /<img[^>]+src=["']([^"']+)["']/i.exec(html);
  if (m) return m[1];

  return null;
}

function toIso(item) {
  if (item.isoDate) return item.isoDate;
  if (item.pubDate) {
    const d = new Date(item.pubDate);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

function cleanText(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

// ── Stažení jednoho feedu ────────────────────────────────────────────────────

async function fetchFeed({ source, url }) {
  try {
    const feed = await parser.parseURL(url);
    const items = (feed.items || [])
      .map((item) => {
        const title = cleanText(item.title);
        const description = cleanText(item.contentSnippet || item.summary || item.content);
        const link = item.link;
        if (!title || !link) return null;

        if (isExcludedPage(title, link)) return null;

        const text = `${title} ${description}`;
        if (!isRelevant(text)) return null;

        return {
          id: hashId(link),
          title,
          description,
          url: link,
          source,
          imageUrl: extractImage(item),
          publishedAt: toIso(item),
        };
      })
      .filter(Boolean);

    console.log(`  ✅ ${source}: ${items.length} relevantních z ${feed.items ? feed.items.length : 0}`);
    return items;
  } catch (err) {
    console.warn(`  ⚠️  ${source} selhal (${url}): ${err.message}`);
    return [];
  }
}

// ── Hlavní sync ──────────────────────────────────────────────────────────────

async function syncNews() {
  console.log('  📰 News sync — stahuji RSS feedy...');

  const results = await Promise.allSettled(SOURCES.map(fetchFeed));
  let all = [];
  for (const r of results) {
    if (r.status === 'fulfilled') all = all.concat(r.value);
  }

  // Dedup podle URL
  const byUrl = new Map();
  for (const item of all) {
    if (!byUrl.has(item.url)) byUrl.set(item.url, item);
  }
  let items = Array.from(byUrl.values());

  // Seřadit sestupně podle publishedAt (nejnovější první); bez data dolů
  items.sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });

  items = items.slice(0, MAX_ITEMS);

  writeJSON('news.json', items);
  console.log(`  💾 Uloženo ${items.length} zpráv → public/data/news.json`);
  return items.length;
}

module.exports = { syncNews };

// Samostatné spuštění
if (require.main === module) {
  syncNews()
    .then((n) => {
      console.log(`Hotovo: ${n} zpráv.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('News sync selhal:', err.message);
      process.exit(1);
    });
}
