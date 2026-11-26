// The daily blog job (run by .github/workflows/daily-blog.yml), SEO plan of
// 2026-11. It never publishes: it writes a DRAFT to src/data/blog/drafts,
// and a manager publishes it from the CRM ("Bloq qaralamaları" → "Dərc et"),
// so a wrong fact never reaches the site unseen.
//
// Week (Baku time): Mon/Wed/Fri — a new post for the next keyword of
// scripts/keywords.csv; Tue/Thu — an old post that ranks 5-20 in Google gets
// refreshed (needs Search Console access, see refreshCandidate); Sat/Sun —
// nothing. BLOG_MODE=new|refresh (manual run) overrides the day.
//
// Posts are Azerbaijani and Russian only; the Russian one is written for a
// Russian-speaking reader, not translated word by word.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { extractMinPrice } from '../src/utils/price.js';
import { TOUR_SEARCH_COUNTRIES } from '../src/data/tourSearchCountries.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const postsDir = path.join(ROOT, 'src/data/blog/posts');
const draftsDir = path.join(ROOT, 'src/data/blog/drafts');
const KEYWORDS_FILE = path.join(__dirname, 'keywords.csv');
const VIZA_FACTS_FILE = path.join(__dirname, 'viza-facts.json');
const SITE = 'https://www.travellab.az';
const TOURS_API_URL = 'https://backend.travellab-point.az/site-backend/v1/tours';

const PRIMARY_MODEL = 'gemini-flash-latest';
const FALLBACK_MODEL = 'gemini-flash-lite-latest';
const endpointFor = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

// Same keys as src/data/blog/categories.js
const CATEGORY_CLASSES = {
  viza: 'cat-q',
  istiqametler: 'cat-t',
  aviabilet: 'cat-b',
  balayi: 'cat-a',
  'mualice-turizmi': 'cat-o',
  konsertler: 'cat-k',
  korporativ: 'cat-c',
  xeberler: 'cat-n',
};

// B.4 — a draft that misses one of these can not be published from the CRM
const LIMITS = { minWords: 900, maxTitle: 60, maxDescription: 155, minFaq: 4 };

// ---------- files ----------

function readJsonDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({ file: path.join(dir, f), ...JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) }));
}

function parseCsv(text) {
  const rows = text.split(/\r?\n/).filter((line) => line.trim());
  const header = rows.shift().split(',').map((h) => h.trim());
  return rows.map((line) => {
    const cells = line.split(',').map((c) => c.trim());
    return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? '']));
  });
}

const keywords = () => parseCsv(fs.readFileSync(KEYWORDS_FILE, 'utf-8'));

const azOf = (post) => post.az || post;

// ---------- helpers kept from the old generator ----------

function slugify(text, max = 60) {
  const AZ = { ə: 'e', ı: 'i', ğ: 'g', ş: 's', ç: 'c', ö: 'o', ü: 'u', Ə: 'e', İ: 'i', Ğ: 'g', Ş: 's', Ç: 'c', Ö: 'o', Ü: 'u' };
  const RU = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l',
    м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch',
    ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  const map = { ...AZ };
  for (const [k, v] of Object.entries(RU)) {
    map[k] = v;
    map[k.toUpperCase()] = v;
  }
  const s = (text || '')
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastDash = cut.lastIndexOf('-');
  return (lastDash > 20 ? cut.slice(0, lastDash) : cut).replace(/-+$/, '');
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callModel(prompt, model) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  const res = await fetch(`${endpointFor(model)}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 16384, responseMimeType: 'application/json' },
    }),
  });
  if (!res.ok) {
    const err = new Error(`Model request failed: ${res.status} ${await res.text()}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`No text in model response: ${JSON.stringify(data).slice(0, 500)}`);
  if (candidate.finishReason === 'MAX_TOKENS') throw new Error('Response truncated (MAX_TOKENS)');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  return JSON.parse(text.slice(start, end + 1));
}

const ATTEMPTS = [
  { model: PRIMARY_MODEL, waitMs: 0 },
  { model: PRIMARY_MODEL, waitMs: 20_000 },
  { model: FALLBACK_MODEL, waitMs: 0 },
  { model: FALLBACK_MODEL, waitMs: 20_000 },
  { model: FALLBACK_MODEL, waitMs: 20_000 },
];

// the article in one language; a short or wrong-language answer is asked again
async function generate(lang, prompt) {
  let lastError;
  for (const [i, { model, waitMs }] of ATTEMPTS.entries()) {
    if (i > 0) await sleep(lastError?.status === 503 || lastError?.status === 429 ? waitMs : 2_000);
    try {
      const draft = await callModel(i > 1 ? prompt + LENGTH_REMINDER[lang] : prompt, model);
      checkShape(draft, lang);
      return draft;
    } catch (err) {
      lastError = err;
      console.warn(`[${lang}] attempt ${i + 1}/${ATTEMPTS.length} (${model}) failed: ${err.message}`);
    }
  }
  throw lastError;
}

const LENGTH_REMINDER = {
  az: '\n\nVACİB: body-dəki "p" bloklarının cəmi 1000 sözdən az olmasın.',
  ru: '\n\nВАЖНО: суммарный объём блоков "p" в body — не меньше 1000 слов.',
};

const AZ_LETTERS = /[əƏğĞıİöÖüÜşŞçÇ]/g;
const CYRILLIC = /[а-яА-ЯёЁ]/g;
const LETTERS = /[a-zA-Zа-яА-ЯёЁəƏğĞıİöÖüÜşŞçÇ]/g;

function checkShape(draft, lang) {
  for (const key of ['title', 'metaDescription', 'excerpt']) {
    if (typeof draft[key] !== 'string' || !draft[key].trim()) throw new Error(`Missing ${key}`);
  }
  if (!Array.isArray(draft.body) || !draft.body.length) throw new Error('Missing body');
  for (const block of draft.body) {
    if (!['p', 'h2'].includes(block.type) || typeof block.text !== 'string' || !block.text.trim()) {
      throw new Error(`Bad block ${JSON.stringify(block).slice(0, 120)}`);
    }
  }
  if (!Array.isArray(draft.faq)) throw new Error('Missing faq');
  if (wordCount(draft.body) < 700) throw new Error(`Body too short: ${wordCount(draft.body)} words`);
  const text = draft.title + ' ' + draft.body.map((b) => b.text).join(' ');
  const total = (text.match(LETTERS) || []).length || 1;
  if (lang === 'az' && (text.match(AZ_LETTERS) || []).length / total < 0.01) throw new Error('Not Azerbaijani');
  if (lang === 'ru' && (text.match(CYRILLIC) || []).length / total < 0.5) throw new Error('Not Russian');
}

const wordCount = (body) =>
  body.filter((b) => b.type === 'p').reduce((sum, b) => sum + b.text.trim().split(/\s+/).length, 0);

// ---------- our own data for the post (B.3) ----------

// the live tours of the target country with their lowest price: "Türkiyə turları 470 $-dan"
async function toursFor(targetUrl) {
  const match = /^\/tours\/search\/([^/?#]+)/.exec(targetUrl || '');
  const country = match && TOUR_SEARCH_COUNTRIES.find((c) => c.slug === match[1]);
  if (!country) return null;
  try {
    const res = await fetch(TOURS_API_URL);
    if (!res.ok) throw new Error(String(res.status));
    const stem = country.nameAz.toLowerCase().slice(0, 5);
    const tours = (await res.json())
      .filter((t) => `${t.title} ${t.description}`.toLowerCase().includes(stem))
      .map((t) => ({ title: t.title.replace(/[^\p{L}\p{N}\s&,.–-]/gu, '').trim(), price: extractMinPrice(t.description) }))
      .filter((t) => t.price);
    if (!tours.length) return { country: country.nameAz, tours: [], from: null };
    const cheapest = tours.reduce((min, t) => (t.price.amount < min.price.amount ? t : min));
    return { country: country.nameAz, tours: tours.slice(0, 5), from: cheapest.price };
  } catch (err) {
    console.warn(`Tours were not read: ${err.message}`);
    return null;
  }
}

const money = (price) => `${Math.round(price.amount)} ${price.currency === 'USD' ? '$' : price.currency === 'EUR' ? '€' : 'AZN'}`;

function vizaFactsFor(targetUrl) {
  const match = /^\/viza\/([^/?#]+)/.exec(targetUrl || '');
  try {
    const facts = JSON.parse(fs.readFileSync(VIZA_FACTS_FILE, 'utf-8')).countries || {};
    return match ? facts[match[1]] || null : facts;
  } catch {
    return null;
  }
}

// ---------- prompts (B.3) ----------

function ourDataBlock(lang, category, targetUrl, tours, vizaFacts) {
  const lines = [];
  if (tours?.from) {
    lines.push(
      lang === 'az'
        ? `Travellab-ın hazırkı ${tours.country} turları (saytdan, real): ${tours.tours.map((t) => `${t.title} — ${money(t.price)}-dan`).join('; ')}. Mətndə mütləq yaz: "hazırda ${tours.country} turları ${money(tours.from)}-dan başlayır".`
        : `Актуальные туры Travellab в ${tours.country} (с сайта, реальные): ${tours.tours.map((t) => `${t.title} — от ${money(t.price)}`).join('; ')}. Обязательно напиши в тексте: «сейчас туры начинаются от ${money(tours.from)}».`
    );
  }
  if (category === 'viza') {
    lines.push(
      vizaFacts && Object.keys(vizaFacts).length
        ? (lang === 'az' ? 'Viza faktları (YALNIZ bunları yaz, başqa rəqəm/müddət/sənəd uydurma): ' : 'Факты о визе (пиши ТОЛЬКО их, не придумывай других сумм/сроков/документов): ') +
            JSON.stringify(vizaFacts)
        : lang === 'az'
          ? 'Bu ölkə üzrə təsdiqlənmiş viza faktı YOXDUR: konkret rüsum, müddət və sənəd siyahısı YAZMA. Prosesi ümumi izah et və dəqiq məlumat üçün Travellab-a müraciət etməyi tövsiyə et.'
          : 'Подтверждённых фактов о визе в эту страну НЕТ: не пиши конкретные сборы, сроки и список документов. Объясни процесс в общем и посоветуй обратиться в Travellab за точными данными.'
    );
  }
  return lines.join('\n');
}

function relatedBlock(lang, related) {
  if (!related.length) return '';
  const intro = lang === 'az' ? 'Eyni kateqoriyadan bu 2 yazıya da link ver (mövzuya uyğun yerdə):' : 'Также дай ссылки на эти 2 статьи той же категории (там, где уместно):';
  return `${intro}\n${related.map((p) => `- [${p.title}](${p.path})`).join('\n')}`;
}

function promptFor(lang, row, extra) {
  const year = new Date().getUTCFullYear();
  const keyword = lang === 'az' ? row.keyword_az : row.keyword_ru;
  if (lang === 'az') {
    return `Sən Travellab üçün yazırsan — Bakıda fəaliyyət göstərən səyahət agentliyi (platforma və ya OTA DEYİL). Bu gün: ${new Date().toISOString().slice(0, 10)}, il ${year}.

Yazı bu axtarış sorğusuna cavab verməlidir: "${keyword}".
Açar söz title-da, ilk h2-də olmayan H1 rolunu oynayan title-da, ilk 100 sözdə və ən azı bir h2 başlığında olsun.

Struktur:
1) body-nin ilk bloku: sorğuya 2–3 cümləlik QISA, birbaşa cavab ("p").
2) Sonra sual formasında h2 bölmələr (5–8 ədəd), hər birində 2–3 dolğun abzas, konkret addım/nümunə.
3) Sonuncu h2: "Travellab ilə necə sifariş etmək" — WhatsApp, ofis (Caspian Business Center), sayt.
4) "faq": 4–6 sual–cavab (bizə xas, sorğuya bağlı).
Həcm: body-də 1000–1500 söz.

Terminologiya (məcburi): "səyahət agentliyi" (platforma/OTA YOX), "sərfəli" ("ucuz" YOX), "viza xidməti göstəririk" ("viza açırıq" YOX).
Faktlar uydurulmasın: aşağıda verilməyən rəqəm, qiymət, tarix, qayda YAZMA.
${ourDataBlock('az', row.category, row.target_url, extra.tours, extra.vizaFacts)}

Daxili linklər (markdown, yalnız "p" bloklarında): [açar söz](${row.target_url}) — MÜTLƏQ 1 dəfə.
${relatedBlock('az', extra.related)}
Başqa URL uydurma.

title: maksimum ${LIMITS.maxTitle} simvol, il (${year}) və ya rəqəm olsun (məs. "Şengen vizası ${year}: 7 addımda sənədlər").
metaDescription: maksimum ${LIMITS.maxDescription} simvol, sonda CTA: "Pulsuz məsləhət üçün WhatsApp-a yazın".
excerpt: 1–2 cümlə, oxucu üçün.
slug: latın, diakritiksiz, qısa (məs. sengen-vizasi-senedler-${year}).
imageQuery: şəkil üçün 1 sadə İNGİLİSCƏ axtarış ifadəsi; imageAlt: açar sözü olan Azərbaycan dilində alt mətn.

Cavab YALNIZ JSON: {"title":"","metaDescription":"","excerpt":"","slug":"","imageQuery":"","imageAlt":"","body":[{"type":"p","text":""},{"type":"h2","text":""}],"faq":[{"q":"","a":""}]}`;
  }
  return `Ты пишешь для Travellab — туристического агентства в Баку (не «платформа» и не OTA). Сегодня ${new Date().toISOString().slice(0, 10)}, ${year} год.

Статья для русскоязычного читателя из Азербайджана, отвечает на запрос: «${keyword}». Это НЕ перевод азербайджанской версии: пиши так, как ищет и читает русскоязычный клиент (его вопросы, привычные формулировки), тема та же — «${row.keyword_az}».
Ключевая фраза — в title, в первых 100 словах и минимум в одном h2.

Структура:
1) первый блок body: короткий прямой ответ на запрос, 2–3 предложения ("p").
2) Разделы h2 в форме вопросов (5–8), в каждом 2–3 содержательных абзаца с конкретикой.
3) Последний h2: «Как заказать через Travellab» — WhatsApp, офис (Caspian Business Center), сайт.
4) "faq": 4–6 вопросов и ответов.
Объём body: 1000–1500 слов.

Терминология: «туристическое агентство» (не платформа), «выгодно» (а не «дёшево»), «оказываем визовую поддержку» (а не «открываем визы»).
Не выдумывай факты: никаких цифр, цен, дат и правил, кроме данных ниже.
${ourDataBlock('ru', row.category, row.target_url, extra.tours, extra.vizaFacts)}

Внутренние ссылки (markdown, только в блоках "p"): [ключевая фраза](${row.target_url}) — ОБЯЗАТЕЛЬНО 1 раз.
${relatedBlock('ru', extra.related)}
Другие URL не придумывай.

title: максимум ${LIMITS.maxTitle} символов, с годом (${year}) или числом.
metaDescription: максимум ${LIMITS.maxDescription} символов, в конце призыв: «Бесплатная консультация в WhatsApp».
excerpt: 1–2 предложения для читателя.
slug: латиницей, коротко.
imageQuery: не нужен (оставь ""), imageAlt: alt-текст на русском с ключевой фразой.

Ответ ТОЛЬКО JSON: {"title":"","metaDescription":"","excerpt":"","slug":"","imageQuery":"","imageAlt":"","body":[{"type":"p","text":""},{"type":"h2","text":""}],"faq":[{"q":"","a":""}]}`;
}

function refreshPromptFor(lang, post, query) {
  const year = new Date().getUTCFullYear();
  const content = post[lang] || post;
  const intro =
    lang === 'az'
      ? `Bu, Travellab bloqunun köhnə yazısıdır. Google-da "${query}" sorğusu üzrə 5–20-ci yerdədir. Onu YENİLƏ: title-ı gücləndir (maks. ${LIMITS.maxTitle} simvol, il ${year}), köhnə illəri ${year} et, sorğuya cavab verən 1 yeni h2 bölmə əlavə et, 4–6 sual–cavablıq "faq" yaz (yoxdursa), metaDescription (maks. ${LIMITS.maxDescription}, sonda "Pulsuz məsləhət üçün WhatsApp-a yazın"). Mövcud linkləri saxla, fakt uydurma, "səyahət agentliyi", "sərfəli" ifadələrini işlət. Mətnin qalanını saxla, yalnız yaxşılaşdır.`
      : `Это старая статья блога Travellab. В Google она на 5–20 месте по запросу «${query}». ОБНОВИ её: усиль title (макс. ${LIMITS.maxTitle} символов, ${year} год), замени старые годы на ${year}, добавь 1 новый раздел h2 под этот запрос, напиши "faq" на 4–6 вопросов (если нет), metaDescription (макс. ${LIMITS.maxDescription}, в конце «Бесплатная консультация в WhatsApp»). Ссылки сохрани, факты не выдумывай.`;
  return `${intro}

${JSON.stringify({ title: content.title, metaDescription: content.metaDescription, excerpt: content.excerpt, body: content.body.filter((b) => b.type !== 'img'), faq: post.faq || [] })}

${lang === 'az' ? 'Cavab YALNIZ JSON' : 'Ответ ТОЛЬКО JSON'}: {"title":"","metaDescription":"","excerpt":"","slug":"","imageQuery":"","imageAlt":"","body":[{"type":"p","text":""},{"type":"h2","text":""}],"faq":[{"q":"","a":""}]}`;
}

// ---------- photo (1200x630, alt with the keyword) ----------

async function coverPhoto(query) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey || !query) return null;
  const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
    headers: { Authorization: apiKey },
  });
  if (!res.ok) return null;
  const photo = (await res.json()).photos?.[0];
  if (!photo) return null;
  return {
    src: `${photo.src.original}?auto=compress&cs=tinysrgb&fit=crop&w=1200&h=630`,
    credit: { name: photo.photographer, url: photo.url },
  };
}

// the cover is kept on our own domain (public/images/blog), as Google prefers; Pexels only on failure
async function keepCover(photo, slug) {
  if (!photo) return null;
  try {
    const res = await fetch(photo.src);
    if (!res.ok) throw new Error(String(res.status));
    const dir = path.join(ROOT, 'public/images/blog');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${slug}.jpg`), Buffer.from(await res.arrayBuffer()));
    return `/images/blog/${slug}.jpg`;
  } catch (err) {
    console.warn(`Cover was not saved: ${err.message}`);
    return photo.src;
  }
}

// ---------- quality checks (B.4) ----------

function qualityIssues(post, keyword, others) {
  const issues = [];
  for (const lang of ['az', 'ru']) {
    const c = post[lang];
    if (!c) continue;
    const words = wordCount(c.body);
    if (words < LIMITS.minWords) issues.push(`${lang}: ${words} söz (ən azı ${LIMITS.minWords})`);
    if (c.title.length > LIMITS.maxTitle) issues.push(`${lang}: title ${c.title.length} simvol (maks. ${LIMITS.maxTitle})`);
    if (c.metaDescription.length > LIMITS.maxDescription) {
      issues.push(`${lang}: description ${c.metaDescription.length} simvol (maks. ${LIMITS.maxDescription})`);
    }
    if (post.targetUrl && !c.body.some((b) => b.type === 'p' && b.text.includes(`](${post.targetUrl})`))) {
      issues.push(`${lang}: ${post.targetUrl} linki yoxdur`);
    }
    if ((c.faq || []).length < LIMITS.minFaq) issues.push(`${lang}: FAQ ${(c.faq || []).length} (ən azı ${LIMITS.minFaq})`);
  }
  if (keyword && others.some((p) => p.keyword === keyword && p.slug !== post.slug)) {
    issues.push(`"${keyword}" açar sözü ilə başqa yazı var`);
  }
  return issues;
}

// ---------- Search Console (refresh days) ----------

// a service account's key in GSC_SERVICE_ACCOUNT_JSON, the account added as a user of the
// travellab.az property in Search Console
async function searchConsoleRows() {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  const account = JSON.parse(raw);
  const now = Math.floor(Date.now() / 1000);
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(account.private_key, 'base64url');
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` }),
  });
  const { access_token: token } = await tokenRes.json();
  const site = process.env.GSC_SITE || 'sc-domain:travellab.az';
  const day = (offset) => new Date(Date.now() - offset * 86400000).toISOString().slice(0, 10);
  const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ startDate: day(30), endDate: day(2), dimensions: ['page', 'query'], rowLimit: 5000 }),
  });
  if (!res.ok) throw new Error(`Search Console: ${res.status} ${await res.text()}`);
  return (await res.json()).rows || [];
}

// a post at 5-20 with more than 20 impressions in 28 days, not refreshed in the last 30 days
async function refreshCandidate(posts, drafts) {
  const rows = await searchConsoleRows();
  if (!rows) {
    console.log('No GSC_SERVICE_ACCOUNT_JSON: refresh day skipped');
    return null;
  }
  const bySlug = new Map();
  for (const post of posts) {
    for (const lang of ['az', 'ru']) {
      const slug = (post[lang] && post[lang].slug) || (lang === 'az' ? post.slug : null);
      if (slug) bySlug.set(slug, { post, lang });
    }
  }
  const pending = new Set(drafts.map((d) => d.refreshOf).filter(Boolean));
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const pages = new Map();
  for (const row of rows) {
    const [page, query] = row.keys;
    const slug = /\/blog\/([^/?#]+)/.exec(page)?.[1];
    const hit = slug && bySlug.get(slug);
    if (!hit || hit.post.noindex || pending.has(hit.post.slug) || (hit.post.dateModified || '') > monthAgo) continue;
    const entry = pages.get(hit.post.slug) || { ...hit, impressions: 0, best: null };
    entry.impressions += row.impressions;
    if (row.position >= 5 && row.position <= 20 && (!entry.best || row.impressions > entry.best.impressions)) {
      entry.best = { query, impressions: row.impressions };
    }
    pages.set(hit.post.slug, entry);
  }
  return [...pages.values()].filter((p) => p.best && p.impressions > 20).sort((a, b) => b.impressions - a.impressions)[0] || null;
}

// ---------- jobs ----------

function relatedPosts(category, posts, exceptSlug) {
  return posts
    .filter((p) => p.category === category && p.slug !== exceptSlug && !p.noindex)
    .slice(0, 2)
    .map((p) => ({ title: azOf(p).title, path: `/blog/${p.slug}` }));
}

function content(draft, slug, faq, photo, alt) {
  return {
    title: draft.title.trim(),
    excerpt: draft.excerpt.trim(),
    metaDescription: draft.metaDescription.trim(),
    slug,
    body: draft.body,
    faq,
    ...(alt ? { coverAlt: alt } : {}),
  };
}

async function newPost(posts, drafts) {
  const done = new Set([...posts, ...drafts].map((p) => p.keyword).filter(Boolean));
  const row = keywords()
    .filter((r) => r.status === 'todo' && !done.has(r.keyword_az))
    .sort((a, b) => Number(a.priority) - Number(b.priority))[0];
  if (!row) {
    console.log('keywords.csv has no "todo" keyword left');
    return null;
  }
  console.log(`keyword: ${row.keyword_az} (${row.category})`);
  const extra = {
    tours: await toursFor(row.target_url),
    vizaFacts: row.category === 'viza' ? vizaFactsFor(row.target_url) : null,
    related: relatedPosts(row.category, posts),
  };
  const az = await generate('az', promptFor('az', row, extra));
  const ru = await generate('ru', promptFor('ru', row, extra));
  const taken = new Set([...posts, ...drafts].map((p) => p.slug));
  let slug = slugify(az.slug || row.keyword_az, 50);
  if (taken.has(slug)) slug = `${slug}-${new Date().getUTCFullYear()}`;
  const photo = await coverPhoto(az.imageQuery || row.keyword_az);
  const cover = await keepCover(photo, slug);
  const today = new Date().toISOString().slice(0, 10);
  return {
    slug,
    category: row.category,
    categoryClass: CATEGORY_CLASSES[row.category],
    keyword: row.keyword_az,
    keywordRu: row.keyword_ru,
    targetUrl: row.target_url,
    author: 'Travellab',
    date: today,
    coverImage: cover || '/images/hero/balloons.jpg',
    coverCredit: photo?.credit || null,
    az: content(az, slug, az.faq, photo, az.imageAlt),
    ru: content(ru, slugify(ru.slug || row.keyword_ru, 50), ru.faq, photo, ru.imageAlt),
    createdAt: new Date().toISOString(),
  };
}

async function refreshPost(posts, drafts) {
  // a keyword marked "refresh" in keywords.csv first (its post_slug says which post), then Search Console
  const pending = new Set(drafts.map((d) => d.refreshOf).filter(Boolean));
  let target = null;
  let query = null;
  let queryRu = null;
  for (const row of keywords().filter((r) => r.status === 'refresh' && r.post_slug)) {
    const post = posts.find((p) => p.slug === row.post_slug);
    if (post && !pending.has(post.slug) && !(post.refreshedFor || []).includes(row.keyword_az)) {
      target = post;
      query = row.keyword_az;
      queryRu = row.keyword_ru || null;
      break;
    }
  }
  if (!target) {
    const candidate = await refreshCandidate(posts, drafts);
    if (!candidate) return null;
    target = candidate.post;
    query = candidate.best.query;
  }
  console.log(`refresh: ${target.slug} for "${query}"`);
  const result = { ...target, refreshOf: target.slug, refreshQuery: query, createdAt: new Date().toISOString() };
  delete result.file;
  // an old flat post (Azerbaijani only) gets its "az" version now, the rest stays as it was
  const flat = !target.az && !target.ru;
  for (const lang of ['az', 'ru']) {
    const old = flat
      ? lang === 'az'
        ? { title: target.title, excerpt: target.excerpt, metaDescription: target.metaDescription || target.excerpt, slug: target.slug, body: target.body }
        : null
      : target[lang];
    if (!old) continue;
    const draft = await generate(lang, refreshPromptFor(lang, flat ? old : target, lang === 'ru' && queryRu ? queryRu : query));
    // the photos inside the text stay where they were: the new text goes between them
    const photos = old.body.filter((b) => b.type === 'img');
    const body = [...draft.body];
    photos.forEach((photo, i) => body.splice(Math.floor(((i + 1) * body.length) / (photos.length + 1)), 0, photo));
    result[lang] = {
      ...old,
      title: draft.title.trim(),
      metaDescription: draft.metaDescription.trim(),
      excerpt: draft.excerpt.trim(),
      body,
      faq: draft.faq,
    };
  }
  result.dateModified = new Date().toISOString().slice(0, 10);
  result.refreshedFor = [...(target.refreshedFor || []), query];
  return result;
}

function weekdayInBaku() {
  return new Date(Date.now() + 4 * 3600000).getUTCDay();
}

async function main() {
  const day = weekdayInBaku();
  const mode = process.env.BLOG_MODE || ({ 1: 'new', 3: 'new', 5: 'new', 2: 'refresh', 4: 'refresh' }[day] ?? null);
  if (!mode) {
    console.log('Weekend: no post');
    return;
  }
  const posts = readJsonDir(postsDir);
  const drafts = readJsonDir(draftsDir);
  const draft = mode === 'refresh' ? await refreshPost(posts, drafts) : await newPost(posts, drafts);
  if (!draft) return;
  draft.qualityIssues = qualityIssues(draft, draft.keyword, [...posts, ...drafts]);
  fs.mkdirSync(draftsDir, { recursive: true });
  const outPath = path.join(draftsDir, `${draft.refreshOf ? `${draft.slug}--refresh` : draft.slug}.json`);
  fs.writeFileSync(outPath, JSON.stringify(draft, null, 2) + '\n');
  console.log(`wrote ${path.relative(ROOT, outPath)}; issues: ${draft.qualityIssues.join('; ') || 'none'}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
