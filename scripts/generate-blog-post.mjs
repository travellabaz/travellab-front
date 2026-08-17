// Generates one new blog post JSON file under src/data/blog/posts and
// writes it to disk. Run by .github/workflows/daily-blog.yml on a
// schedule; the workflow commits+pushes whatever this script writes.
//
// Uses the Google Gemini API (free tier via Google AI Studio) — needs a
// GEMINI_API_KEY repo secret (get one at https://aistudio.google.com/apikey).
// Previously used GitHub Models, which is being retired (scheduled
// "retirement brownout" 410s as of 2026-07-31); switched to Gemini for
// both stability and noticeably better Azerbaijani-language output than
// the free Llama/Gemma models on other free providers (e.g. Groq).
//
// Trilingual: every new post gets an Azerbaijani, Russian, and English
// version, each from its own Gemini call written natively in that
// language (not a literal translation of the AZ draft) but covering the
// same underlying topic — see buildPrompt's `topicHint` param. Existing
// pre-trilingual posts (flat AZ-only shape) are left as-is; see
// src/data/blog/index.js for how the site renders both shapes.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const postsDir = path.join(__dirname, '../src/data/blog/posts');

// "-latest" alias instead of a pinned version: Gemini model versions get
// retired from new-key access surprisingly fast (gemini-2.5-flash 404'd
// within the same year), and this alias is Google's own mechanism for
// scripts like this one to keep pointing at whatever flash-tier model is
// currently available without needing a code change each time.
//
// FALLBACK_MODEL is a distinct model tier (its own capacity pool), not
// just a second attempt at the same one — seen the primary return 503
// "high demand" across 5 retries spanning ~3.5 minutes, i.e. sustained
// overload rather than a brief spike (likely everyone hammering whatever
// model this alias just got hot-swapped to). Waiting longer on the same
// model doesn't fix that; a different model tier might not be saturated.
const PRIMARY_MODEL = 'gemini-flash-latest';
const FALLBACK_MODEL = 'gemini-flash-lite-latest';
const endpointFor = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const LANGUAGES = ['az', 'ru', 'en'];

// CSS only has these category pill colors defined (see .cat-a/.cat-t/
// .cat-n/.cat-m/.cat-q/.cat-o in global.css) — has to be one of these
// exact category keys, not something the model invents with no matching
// style. Category names/guidance are in Azerbaijani (the category label
// itself is shown as-is on the site regardless of post language, same as
// before trilingual support — translating category pill labels is a
// separate, smaller piece of work, not done here).
//
// The category is picked by pickCategory() below, not left to the model —
// left to itself, Gemini defaulted to "Məsləhətlər" for every single post.
// Each entry also carries its own topic guidance so the prompt steers
// toward genuinely different kinds of posts per category, not just a
// different label on the same "tips" article.
const CATEGORIES = {
  'Məsləhətlər': {
    class: 'cat-a',
    guidance:
      'Praktiki səyahət məsləhətləri: büdcə səyahəti, bagaj/sənəd hazırlığı, səyahət sığortası, ailəvi səyahət, uçuşda rahatlıq, pul qənaəti üsulları, aviabilet axtarışı.',
  },
  'Bələdçi': {
    class: 'cat-t',
    guidance:
      'Konkret bir şəhər/ölkə/bölgə bələdçisi (məs. İstanbul, Dubay, Tbilisi, Antalya, Bakı ətrafı gəzinti yerləri). Nə görməli, neçə gün kifayətdir, yerli nəqliyyat necədir, hansı məhəllələr maraqlıdır, yemək mədəniyyəti. Dəqiq qiymət/viza rəqəmləri YAZMA — bunlar tez köhnəlir.',
  },
  'Xəbərlər': {
    class: 'cat-n',
    guidance:
      'Turizm sənayesində ümumi, HƏMİŞƏ DOĞRU olan tendensiyalar və dəyişikliklər: rəqəmsal check-in, mövsümi tələb dəyişiklikləri, dayanıqlı/məsuliyyətli turizm, hava limanı prosesləri necə asanlaşır. KONKRET tarix, statistika və ya "bu gün elan edildi" tipli iddialar YAZMA (bunlar uydurma olardı) — ümumi trend təsviri ver.',
  },
  'Macəra': {
    class: 'cat-m',
    guidance:
      'Aktiv/macəra səyahəti: dağ trekkinqi, kempinq, su idmanları, solo macəra səyahəti, az tanınan təbiət istiqamətləri, ekstremal və ya qeyri-adi təcrübələr.',
  },
  'Vizasız Ölkələr': {
    class: 'cat-q',
    guidance:
      'Azərbaycan vətəndaşlarının vizasız və ya qapıda viza (viza on arrival) ilə gedə biləcəyi ölkələr: hansı ölkələr, nə qədər müddətə qalmaq olar, hansı sənədlər lazımdır (adətən yalnız pasport). Konkret gün sayı və şərtlər ölkədən ölkəyə dəyişə bilər deyə "adətən", "ümumi qayda olaraq" kimi ehtiyatlı ifadələr istifadə et, tarixlə bağlı iddialar YAZMA.',
  },
  'Tibbi Turizm': {
    class: 'cat-o',
    guidance:
      'Tibbi turizm: xaricdə müalicə/estetik prosedurlar üçün səyahət planlaması, hansı ölkələr məşhurdur (Türkiyə, Cənubi Koreya və s.), tibbi turizmdə nələrə diqqət etmək lazımdır, səyahət+müalicə əlaqələndirilməsi. Konkret klinika adı, qiymət və ya tibbi tövsiyə YAZMA — bu, həkim səlahiyyətidir, yalnız səyahət təşkilatı perspektivindən yaz.',
  },
};

// Least-used category first (ties broken deterministically by post count)
// so the categories stay roughly balanced over time instead of drifting
// toward whichever one the model likes best. Counts against the AZ title
// (every post has one, old or new shape) since category is one shared
// value per post regardless of how many languages it has.
function pickCategory(existing) {
  const counts = Object.fromEntries(Object.keys(CATEGORIES).map((c) => [c, 0]));
  for (const p of existing) {
    if (counts[p.category] !== undefined) counts[p.category]++;
  }
  const minCount = Math.min(...Object.values(counts));
  const candidates = Object.keys(CATEGORIES).filter((c) => counts[c] === minCount);
  return candidates[existing.length % candidates.length];
}

// Fallback only — used if the Pexels lookup below fails (no key, rate
// limit, no results) so a post never fails to publish for lack of a photo.
const COVER_IMAGES = [
  '/images/hero/aurora.jpg',
  '/images/hero/balloons.jpg',
  '/images/hero/plane-wing.jpg',
  '/images/hero/mosque.jpg',
];

// Topic photos: Gemini picks an English search phrase for the post's actual
// subject (Pexels' search doesn't work well outside English), then this
// hits the free Pexels API for real matching photos — one cover + a couple
// inline, fetched ONCE per day (from the AZ draft's queries) and reused
// across all 3 language variants, since the visual content isn't
// language-specific. Needs a PEXELS_API_KEY repo secret (free at
// pexels.com/api).
async function fetchPexelsPhotos(query, count) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [];

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: apiKey } });
  if (!res.ok) {
    console.error(`Pexels request failed: ${res.status} ${await res.text()}`);
    return [];
  }
  const data = await res.json();
  return (data.photos || []).map((p) => ({
    src: p.src.large2x,
    alt: p.alt || query,
    credit: p.photographer,
    creditUrl: p.url,
  }));
}

function slugify(title) {
  const map = { ə: 'e', ı: 'i', ğ: 'g', ş: 's', ç: 'c', ö: 'o', ü: 'u', Ə: 'e', İ: 'i', Ğ: 'g', Ş: 's', Ç: 'c', Ö: 'o', Ü: 'u' };
  return title
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// Old posts are flat {title, ...}; new posts carry {az: {title, ...}, ...}
// — mirrors src/data/blog/index.js's hasLocaleVariants/localizePost.
function azTitleOf(post) {
  return post.az ? post.az.title : post.title;
}

function existingPosts() {
  return fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(postsDir, f), 'utf-8')))
    .map((p) => ({ slug: p.slug, title: azTitleOf(p), category: p.category }));
}

async function callModel(prompt, model = PRIMARY_MODEL) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const res = await fetch(`${endpointFor(model)}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.85,
        // A 1400-2000 word article plus JSON structure overhead runs well
        // past 4096 tokens — that limit truncated the response mid-string
        // and broke JSON.parse downstream. Generous headroom: some Gemini
        // models spend part of this budget on hidden internal reasoning
        // before the visible output, on top of the ~1400-2000 word
        // article the prompt asks for.
        maxOutputTokens: 16384,
        responseMimeType: 'application/json',
      },
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
  if (!text) throw new Error(`No text in model response: ${JSON.stringify(data)}`);
  if (candidate.finishReason === 'MAX_TOKENS') {
    throw new Error(`Response truncated by maxOutputTokens (finishReason=MAX_TOKENS)`);
  }
  return text;
}

// Paths the model is allowed to link to from inside a post's body text —
// a fixed, real list rather than letting the model invent URLs, so every
// in-body link actually resolves to a real page. Same paths regardless of
// post language (the site's own route structure doesn't translate URL
// slugs, see the i18n plan), only the descriptive label per path changes.
const INTERNAL_LINK_PATHS = {
  az: [
    '/search — aviabilet axtarışı', '/hotels — otel axtarışı və bron', '/tours — hazır tur paketləri (bütün kateqoriyalar)',
    '/tours?category=Türkiyə — Türkiyə turları', '/tours?category=Avropa — Avropa turları', '/tours?category=Ekzotik — ekzotik/uzaq turlar',
    '/tours?category=Qrup%20Turları — qrup turları', '/viza — viza xidməti (bütün ölkələr)', '/labpoint — Labpoint bonus proqramı',
    '/events — tədbir və konsert biletləri', '/about — Travellab haqqında',
  ],
  ru: [
    '/search — поиск авиабилетов', '/hotels — поиск и бронирование отелей', '/tours — готовые турпакеты (все категории)',
    '/tours?category=Türkiyə — туры в Турцию', '/tours?category=Avropa — туры в Европу', '/tours?category=Ekzotik — экзотические/дальние туры',
    '/tours?category=Qrup%20Turları — групповые туры', '/viza — визовая услуга (все страны)', '/labpoint — бонусная программа Labpoint',
    '/events — билеты на мероприятия и концерты', '/about — о компании Travellab',
  ],
  en: [
    '/search — flight search', '/hotels — hotel search and booking', '/tours — ready-made tour packages (all categories)',
    '/tours?category=Türkiyə — Turkey tours', '/tours?category=Avropa — Europe tours', '/tours?category=Ekzotik — exotic/far-flung tours',
    '/tours?category=Qrup%20Turları — group tours', '/viza — visa service (all countries)', '/labpoint — Labpoint bonus program',
    '/events — event and concert tickets', '/about — about Travellab',
  ],
};

// Per-language instruction shell — same requirements as the original
// single-language prompt (structure, SEO, internal linking, keyword
// density, image queries), just written natively for each language so
// Gemini's own output quality in that language isn't handicapped by
// English/AZ-language instructions (matches the same reasoning that
// picked Gemini over other free models in the first place). `topicHint`
// is only set for RU/EN — it's the AZ draft's title, so the RU/EN posts
// cover the same underlying subject instead of picking their own.
// Appended after a body-too-short retry — mainly bites on the lite
// fallback model, which tends to undershoot the length target hard
// (seen ~700 words vs the ~1400-2000 asked for above), not just fall a
// bit short like the primary occasionally does.
const LENGTH_ENFORCEMENT = {
  az: '\n\nVACİB (bu tələb məcburidir): body mətninin ümumi uzunluğu 1400 sözdən AZ OLA BİLMƏZ. Əgər fikirlərin bitdiyini hiss edirsənsə, hər alt-başlıq altında əlavə nümunə, konkret rəqəm/addım və ya izahat əlavə edərək bölmələri dərinləşdir, təzə alt-başlıqlar da əlavə edə bilərsən — məqsəd süni uzatma deyil, real dərinlikdir.',
  ru: '\n\nВАЖНО (это обязательное требование): общий объём текста body НЕ МОЖЕТ быть меньше 1400 слов. Если кажется, что тема исчерпана, углуби разделы — добавь конкретные примеры, цифры, шаги в каждый подраздел, при необходимости добавь ещё подразделы. Цель — реальная глубина, а не искусственное растягивание.',
  en: "\n\nIMPORTANT (this is a hard requirement): the body text's total length cannot be under 1400 words. If it feels like the topic is covered, go deeper in each section — add concrete examples, numbers, or steps, and add more subsections if needed. The goal is real depth, not artificial padding.",
};

function buildPrompt(lang, existing, category, topicHint, opts = {}) {
  const cat = CATEGORIES[category];
  const paths = INTERNAL_LINK_PATHS[lang];
  const lengthEnforcement = opts.enforceLength ? LENGTH_ENFORCEMENT[lang] : '';

  if (lang === 'az') {
    const avoidList = existing.length
      ? `Bu mövzular artıq işlənib, onları TƏKRARLAMA:\n${existing.map((p) => `- ${p.title}`).join('\n')}`
      : '';
    return `Sən Travellab (Azərbaycanda fəaliyyət göstərən bir səyahət agentliyi) üçün SEO üzrə ekspert bloq yazıçısısan. Travellab PLATFORMA yox, SƏYAHƏT AGENTLİYİDİR — bunu ton və mətndə əks etdir. Məqsəd — Google-da yaxşı sıralanan, oxucuya real dəyər verən, DƏRİN və ƏTRAFLI bir bloq yazısı yazmaqdır. Səthi, ümumi cümlələrlə dolu qısa mətnlər yazma.

Azərbaycan dilində, TƏXMİNƏN 1400-2000 SÖZ uzunluğunda, konkret və dərin faydalı bir bloq yazısı yaz. Struktur TƏQRIBƏN belə olmalıdır (dəqiq bənd sayını özün seç, hər yazıda eyni qəlibi TƏKRARLAMA):
- Giriş abzası (mövzunu təqdim edir, oxucuya faydasını izah edir, əsas açar sözü ilk 1-2 cümlədə keçir)
- 6-10 alt başlıqlı (h2) bölmə (yazıdan yazıya say dəyişsin), hər biri 2-4 dolğun abzasdan ibarət, konkret nümunə/addım/tövsiyə ilə izah edilir
- Yekun bir bölmə — başlığını sən seç (hər dəfə "Nəticə" yazma, fərqli formalaşdır), qısa xülasə və oxucunu hərəkətə çağırış ilə

Yazı canlı və fərdi səslənsin, şablon kimi deyil: cümlə uzunluğunu dəyişdir, hər yazıda eyni keçid ifadələrini ("İlk növbədə", "Bundan əlavə" və s.) təkrarlama, mümkün olduqca Azərbaycan reallıqlarına bağla (AZN valyutası, Bakı Heydər Əliyev Beynəlxalq Hava Limanı (GYD), yerli mövsüm/iqlim, azərbaycanlı səyahətçinin perspektivi) — bu həm oxucuya daha faydalı olur, həm də yazını generic olmaqdan çıxarır.

Bu yazının kateqoriyası MÜTLƏQ **${category}**dir — mövzunu bu kateqoriyaya uyğun seç: ${cat.guidance}

SEO tələbləri:
- Bir əsas açar söz ifadəsi seç (məsələn "ucuz bilet tapmaq", "ailəvi səyahət məsləhətləri") və onu başlıqda, girişdə, ən azı iki alt başlıqda və excerpt-də təbii şəkildə istifadə et.
- title 45-65 simvol arası, cəlbedici və açar sözlü olsun.
- excerpt 140-160 simvol arası, məqalənin başında oxucuya görünən, cəlbedici bir giriş cümləsi olsun.
- metaDescription 150-160 simvol arası — excerpt-dən FƏRQLİ formalaşdırılmış, açar sözü önə çıxaran, Google axtarış nəticəsində göstəriləcək qısa təsvir (oxucu üçün deyil, axtarış motoru üçün yazılır).
- Boş, ümumi cümlələr əvəzinə konkret nümunələr, siyahılar və praktiki addımlar istifadə et.
- Açar söz sıxlığı: əsas açar söz ifadən mətnin təxminən 1-2%-i qədər təkrarlansın (250-400 sözə 3-6 dəfə kimi düşün, bütün 1400-2000 sözlük mətn üzrə mütənasib artır) — süni yığılma hiss olunmasın, çoxu yerdə açar sözün özü yox, sinonim/əlaqəli ifadələr (LSI) işlət.

Daxili linkləmə (ZƏRURİDİR): body massivində olan p bloklarının mətni daxilində, təbii cümlə axını içində, 2-4 dəfə aşağıdakı siyahıdan konkret bir səhifəyə keçid ver. Format MÜTLƏQ markdown link sintaksisi olmalıdır: [açar söz mətni](/yol) — link mətni HƏMİŞƏ mövzuya uyğun açar söz olmalıdır, "buraya klikləyin" YOX. Yalnız aşağıdakı siyahıdakı yolları istifadə et, başqa URL uydurma:
${paths.map((p) => `- ${p}`).join('\n')}
Nümunə: "Ən sərfəli qiymətləri tapmaq üçün [aviabilet axtarışı](/search) bölməsindən müqayisə edə bilərsiniz." Bu linklər yalnız "p" tipli bloklarda, mövzuya uyğun düşən yerdə olsun.

${avoidList}

Bundan əlavə, yazının mövzusuna uyğun stok fotoları tapmaq üçün 2-3 sadə İNGİLİSCƏ axtarış ifadəsi ver. Hər axtarış ifadəsi üçün Azərbaycan dilində alt-mətn də yaz.

${lengthEnforcement}

Cavabı YALNIZ aşağıdakı JSON formatında ver: {"title": "...", "excerpt": "...", "metaDescription": "...", "imageQueries": ["...", "...", "..."], "imageAltTexts": ["...", "...", "..."], "body": [{"type": "p", "text": "..."}, {"type": "h2", "text": "..."}]}`;
  }

  if (lang === 'ru') {
    return `Ты SEO-эксперт и блог-райтер для Travellab — туристического агентства в Азербайджане (Баку). Travellab — АГЕНТСТВО, а не "платформа" — отражай это в тоне. Цель — глубокая, содержательная статья для блога, которая хорошо ранжируется в Google и даёт читателю реальную пользу. Не пиши поверхностные общие фразы.

Напиши статью на РУССКОМ языке, объёмом ПРИМЕРНО 1400-2000 слов, на тему: «${topicHint}» (раскрой именно эту тему — не выбирай другую). Структура примерно такая (не повторяй один и тот же шаблон в каждой статье):
- Вводный абзац (представляет тему, объясняет пользу для читателя, основная ключевая фраза — в первых 1-2 предложениях)
- 6-10 подразделов с заголовками (h2), количество меняется от статьи к статье, каждый — 2-4 содержательных абзаца с конкретными примерами/шагами/советами
- Заключительный раздел — заголовок придумай сам (не пиши каждый раз "Заключение"), краткое резюме и призыв к действию

Текст должен звучать живо и индивидуально, не шаблонно: меняй длину предложений, не повторяй одни и те же переходные фразы («Прежде всего», «Кроме того» и т.д.), привязывай к реалиям (стоимость в разных валютах, аэропорт Гейдар Алиев в Баку (GYD) для маршрутов из Баку, если уместно, сезон/климат).

Категория этой статьи ОБЯЗАТЕЛЬНО **${category}** — раскрывай тему в её рамках: ${cat.guidance}

Требования SEO:
- Выбери одну основную ключевую фразу и естественно используй её в заголовке, вступлении, минимум в двух подзаголовках и в excerpt.
- title — 45-65 символов, привлекательный, с ключевой фразой.
- excerpt — 140-160 символов, привлекательное вступительное предложение, видимое читателю в начале статьи.
- metaDescription — 150-160 символов, ОТЛИЧАЕТСЯ от excerpt по формулировке, с акцентом на ключевую фразу — пишется для поисковика, не для читателя.
- Вместо общих фраз используй конкретные примеры, списки и практические шаги.
- Плотность ключевой фразы: примерно 1-2% текста (3-6 раз на каждые 250-400 слов), без искусственного нагромождения — чаще используй синонимы/связанные фразы (LSI), а не саму ключевую фразу.

Внутренние ссылки (ОБЯЗАТЕЛЬНО): внутри текста абзацев (блоки типа "p"), в естественном потоке предложения, 2-4 раза дай ссылку на конкретную страницу из списка ниже. Формат ОБЯЗАТЕЛЬНО markdown: [текст ключевой фразы](/путь) — текст ссылки ВСЕГДА должен быть релевантной ключевой фразой, никогда "нажмите здесь". Используй ТОЛЬКО пути из списка, не придумывай другие:
${paths.map((p) => `- ${p}`).join('\n')}
Пример: «Чтобы найти самые выгодные цены, сравните варианты в разделе [поиск авиабилетов](/search).» Ссылки должны быть только в блоках типа "p", уместно по теме.

Также дай 2-3 простые поисковые фразы НА АНГЛИЙСКОМ для подбора стоковых фото по теме статьи. Для каждой фразы напиши alt-текст НА РУССКОМ языке.

${lengthEnforcement}

Ответ ТОЛЬКО в формате JSON: {"title": "...", "excerpt": "...", "metaDescription": "...", "imageQueries": ["...", "...", "..."], "imageAltTexts": ["...", "...", "..."], "body": [{"type": "p", "text": "..."}, {"type": "h2", "text": "..."}]}`;
  }

  // en
  return `You are an SEO expert and blog writer for Travellab, a travel agency based in Baku, Azerbaijan. Travellab is an AGENCY, not a "platform" — reflect that in tone. The goal is a deep, genuinely useful blog article that ranks well on Google and gives the reader real value. Don't write shallow, generic filler.

Write an article in ENGLISH, approximately 1400-2000 words, on the topic: "${topicHint}" (cover this exact topic — don't pick a different one). Structure roughly as follows (don't repeat the same template every time):
- An intro paragraph (introduces the topic, explains the reader's benefit, main keyword phrase in the first 1-2 sentences)
- 6-10 subsections with headings (h2), the count varies article to article, each 2-4 substantial paragraphs with concrete examples/steps/advice
- A closing section — pick your own heading (don't just write "Conclusion" every time), brief summary and a call to action

The writing should sound alive and specific, not templated: vary sentence length, don't repeat the same transition phrases ("First of all", "In addition", etc.), ground it in real specifics (currency costs, Heydar Aliyev International Airport in Baku (GYD) for routes from Baku where relevant, season/climate) where appropriate.

This article's category MUST be **${category}** — cover the topic within that scope: ${cat.guidance}

SEO requirements:
- Pick one primary keyword phrase and use it naturally in the title, intro, at least two subheadings, and the excerpt.
- title: 45-65 characters, compelling, with the keyword phrase.
- excerpt: 140-160 characters, a compelling intro sentence shown to the reader at the top of the article.
- metaDescription: 150-160 characters, phrased DIFFERENTLY from the excerpt, keyword-forward — written for the search engine, not the reader.
- Use concrete examples, lists, and practical steps instead of generic filler.
- Keyword density: roughly 1-2% of the text (think 3-6 times per 250-400 words), no artificial stuffing — favor synonyms/related phrases (LSI) over the exact keyword most of the time.

Internal linking (REQUIRED): within the text of "p" type blocks, in a natural sentence flow, link to a specific page from the list below 2-4 times. Format MUST be markdown link syntax: [keyword anchor text](/path) — the link text must ALWAYS be a relevant keyword phrase, never "click here". Only use paths from this list, don't invent others:
${paths.map((p) => `- ${p}`).join('\n')}
Example: "To find the best prices, compare options in our [flight search](/search)." Links should only appear in "p" type blocks, wherever topically relevant.

Also give 2-3 simple search phrases IN ENGLISH for finding stock photos matching the article's topic. For each phrase, write an alt text also IN ENGLISH.

${lengthEnforcement}

Respond ONLY in this JSON format: {"title": "...", "excerpt": "...", "metaDescription": "...", "imageQueries": ["...", "...", "..."], "imageAltTexts": ["...", "...", "..."], "body": [{"type": "p", "text": "..."}, {"type": "h2", "text": "..."}]}`;
}

function extractJson(raw) {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error(`No JSON object found in model output:\n${raw}`);
  return JSON.parse(raw.slice(start, end + 1));
}

function validate(post) {
  if (!post.title || typeof post.title !== 'string') throw new Error('Missing/invalid title');
  if (!post.excerpt || typeof post.excerpt !== 'string') throw new Error('Missing/invalid excerpt');
  if (!Array.isArray(post.body) || post.body.length === 0) throw new Error('Missing/empty body');
  for (const block of post.body) {
    if (!['p', 'h2'].includes(block.type) || typeof block.text !== 'string' || !block.text.trim()) {
      throw new Error(`Invalid body block: ${JSON.stringify(block)}`);
    }
  }
  const wordCount = post.body
    .filter((b) => b.type === 'p')
    .reduce((sum, b) => sum + b.text.trim().split(/\s+/).length, 0);
  if (wordCount < 900) throw new Error(`Body too short: ${wordCount} words (expected ~1400-2000)`);
}

// Spreads inline photos evenly through the p/h2 blocks (e.g. 2 photos in a
// 12-block body land after block ~4 and ~8) so they break up the article
// instead of clustering at one spot.
function insertInlinePhotos(body, photos) {
  if (!photos.length) return body;
  const result = [...body];
  const step = Math.floor(result.length / (photos.length + 1));
  photos.forEach((photo, i) => {
    const insertAt = step * (i + 1) + i;
    result.splice(insertAt, 0, {
      type: 'img',
      src: photo.src,
      alt: photo.alt,
      credit: photo.credit,
      creditUrl: photo.creditUrl,
    });
  });
  return result;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 2 quick tries on the primary model (a short wait covers a brief blip),
// then move to the fallback model tier entirely rather than continuing to
// wait on a possibly-saturated primary — a sustained outage on one model
// doesn't imply the other is also overloaded, since they're separate
// capacity pools. delayMs is how long to wait *before* that attempt.
const ATTEMPT_PLAN = [
  { model: PRIMARY_MODEL, backoffMs: 0 },
  { model: PRIMARY_MODEL, backoffMs: 20_000 },
  { model: FALLBACK_MODEL, backoffMs: 0 },
  { model: FALLBACK_MODEL, backoffMs: 20_000 },
  { model: FALLBACK_MODEL, backoffMs: 40_000 },
];

// 503/429 are capacity problems — worth the full climbing backoff above.
// A short body or unparsable JSON isn't a capacity problem, so waiting 20-
// 40s before re-asking the same (or next) model doesn't make it more
// likely to comply; a small pause is enough to not hammer the API.
function isTransient(err) {
  return err?.status === 503 || err?.status === 429;
}

// Gemini doesn't always hit the 1400-2000 word target the prompt asks for
// — seen as low as ~700 words, especially from the lite fallback model —
// that's a model-compliance miss, not a real error, so it's worth a
// couple of retries (with a stronger length instruction appended once
// this has already happened once, see LENGTH_ENFORCEMENT) before giving
// up and failing the whole workflow (which means no post that day).
async function generateDraft(lang, existing, category, topicHint, plan = ATTEMPT_PLAN) {
  let lastError;
  let enforceLength = false;
  for (let i = 0; i < plan.length; i++) {
    const { model, backoffMs } = plan[i];
    const delayMs = i === 0 ? 0 : isTransient(lastError) ? backoffMs : Math.min(backoffMs, 2_000);
    if (delayMs > 0) {
      console.warn(`[${lang}] Retrying in ${delayMs / 1000}s (model: ${model})...`);
      await sleep(delayMs);
    }
    try {
      const raw = await callModel(buildPrompt(lang, existing, category, topicHint, { enforceLength }), model);
      const draft = extractJson(raw);
      validate(draft);
      return draft;
    } catch (err) {
      lastError = err;
      console.warn(`[${lang}] Attempt ${i + 1}/${plan.length} (${model}) failed: ${err.message}`);
      if (/Body too short/.test(err.message)) enforceLength = true;
    }
  }
  throw lastError;
}

async function main() {
  const existing = existingPosts();
  const category = pickCategory(existing);

  // AZ first (also decides the day's topic — RU/EN cover the same subject,
  // written natively rather than translated, see buildPrompt).
  const azDraft = await generateDraft('az', existing, category, null);
  const ruDraft = await generateDraft('ru', existing, category, azDraft.title);
  const enDraft = await generateDraft('en', existing, category, azDraft.title);

  let slug = slugify(azDraft.title);
  const existingSlugs = new Set(existing.map((p) => p.slug));
  if (existingSlugs.has(slug)) slug = `${slug}-${Date.now().toString(36)}`;

  const today = new Date().toISOString().slice(0, 10);
  const dayIndex = new Date(today).getUTCDate();

  // Photos fetched once (from the AZ draft's queries — the underlying
  // subject is the same across all 3 languages) and reused for every
  // language's inline images; only the alt text differs per language.
  const queries = Array.isArray(azDraft.imageQueries) ? azDraft.imageQueries.slice(0, 3) : [];
  const photosByQuery = [];
  for (const query of queries) {
    const [photo] = await fetchPexelsPhotos(query, 1);
    if (photo) photosByQuery.push(photo);
  }
  const [coverPhoto, ...inlinePhotosBase] = photosByQuery;

  function altTextsFor(draft) {
    return Array.isArray(draft.imageAltTexts) ? draft.imageAltTexts : [];
  }

  function buildLangContent(draft) {
    const alts = altTextsFor(draft);
    const inlinePhotos = inlinePhotosBase.map((photo, i) => ({ ...photo, alt: alts[i + 1] || photo.alt }));
    return {
      title: draft.title,
      excerpt: draft.excerpt,
      // Falls back to excerpt if the model omits this — a slightly-too-long
      // meta description beats none at all.
      metaDescription: draft.metaDescription || draft.excerpt,
      body: insertInlinePhotos(draft.body, inlinePhotos),
    };
  }

  const post = {
    slug,
    category,
    categoryClass: CATEGORIES[category].class,
    // Shown on the article so it doesn't read as anonymous/unattributed —
    // transparency about it being editorial-team content, not a disguise.
    author: 'Travellab',
    date: today,
    coverImage: coverPhoto?.src || COVER_IMAGES[dayIndex % COVER_IMAGES.length],
    coverCredit: coverPhoto ? { name: coverPhoto.credit, url: coverPhoto.creditUrl } : null,
    az: buildLangContent(azDraft),
    ru: buildLangContent(ruDraft),
    en: buildLangContent(enDraft),
  };

  const outPath = path.join(postsDir, `${slug}.json`);
  fs.writeFileSync(outPath, JSON.stringify(post, null, 2) + '\n');
  console.log(`wrote ${path.relative(process.cwd(), outPath)} (${LANGUAGES.join(', ')})`);

  // Exposes the path to the workflow step that commits it.
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `post_path=${outPath}\npost_title=${post.az.title}\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
