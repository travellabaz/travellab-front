// Generates one new blog post JSON file under src/data/blog/posts and
// writes it to disk. Run by .github/workflows/daily-blog.yml on a
// schedule; the workflow commits+pushes whatever this script writes.
//
// Uses GitHub Models (https://docs.github.com/en/github-models) — free,
// no separate API key, authenticated with the workflow's own GITHUB_TOKEN
// (needs `permissions: models: read`). Swap MODEL / the fetch URL below if
// you'd rather use a different free provider.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const postsDir = path.join(__dirname, '../src/data/blog/posts');

const MODEL = 'openai/gpt-4o-mini';
const ENDPOINT = 'https://models.github.ai/inference/chat/completions';

// CSS only has these four category pill colors defined (see .cat-a/.cat-t/
// .cat-n/.cat-m in global.css) — the model has to pick one of these exact
// Azerbaijani names, not invent a new category with no matching style.
const CATEGORIES = {
  'Məsləhətlər': 'cat-a',
  'Bələdçi': 'cat-t',
  'Xəbərlər': 'cat-n',
  'Macəra': 'cat-m',
};

// Rotate through our own already-licensed hero photos instead of hotlinking
// external images (no image API/budget, and no copyright risk).
const COVER_IMAGES = [
  '/images/hero/aurora.jpg',
  '/images/hero/balloons.jpg',
  '/images/hero/plane-wing.jpg',
  '/images/hero/mosque.jpg',
];

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

function existingSlugsAndTitles() {
  return fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(postsDir, f), 'utf-8')))
    .map((p) => ({ slug: p.slug, title: p.title }));
}

async function callModel(prompt) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is not set');

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.9,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Model request failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

function buildPrompt(existing) {
  const categoryList = Object.keys(CATEGORIES).join(', ');
  const avoidList = existing.length
    ? `Bu mövzular artıq işlənib, onları TƏKRARLAMA:\n${existing.map((p) => `- ${p.title}`).join('\n')}`
    : '';

  return `Sən Travellab (Azərbaycanda fəaliyyət göstərən bir səyahət/turizm platforması) üçün SEO məqsədli bloq yazıçısısan.

Azərbaycan dilində, səyahət və turizm mövzusunda, faydalı və konkret bir bloq yazısı yaz (təxminən 600-900 söz, 5-8 abzas, bəziləri alt başlıqla). Mövzu nümunələri: büdcə səyahəti, konkret istiqamət bələdçisi, bagaj/sənəd məsləhətləri, mövsümi tövsiyələr, ailəvi səyahət, ucuz bilet tapmaq üsulları və s. Faktiki səhv ehtimalı olan konkret vasitə/rəqəm iddiaları (məsələn dəqiq vizasız ölkə siyahısı) YAZMA — ümumi, həmişə doğru olan məsləhətlərə üstünlük ver.

${avoidList}

Kateqoriya YALNIZ bunlardan biri olmalıdır: ${categoryList}.

Cavabı YALNIZ aşağıdakı JSON formatında ver, başqa heç nə yazma (izah, markdown fence və ya əlavə mətn olmasın):

{
  "title": "qısa, cəlbedici başlıq",
  "category": "yuxarıdakı siyahıdan biri",
  "excerpt": "1-2 cümləlik qısa təsvir (150 simvoldan az)",
  "body": [
    { "type": "p", "text": "..." },
    { "type": "h2", "text": "..." },
    { "type": "p", "text": "..." }
  ]
}`;
}

function extractJson(raw) {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error(`No JSON object found in model output:\n${raw}`);
  return JSON.parse(raw.slice(start, end + 1));
}

function validate(post) {
  if (!post.title || typeof post.title !== 'string') throw new Error('Missing/invalid title');
  if (!CATEGORIES[post.category]) throw new Error(`Unknown category: ${post.category}`);
  if (!post.excerpt || typeof post.excerpt !== 'string') throw new Error('Missing/invalid excerpt');
  if (!Array.isArray(post.body) || post.body.length === 0) throw new Error('Missing/empty body');
  for (const block of post.body) {
    if (!['p', 'h2'].includes(block.type) || typeof block.text !== 'string' || !block.text.trim()) {
      throw new Error(`Invalid body block: ${JSON.stringify(block)}`);
    }
  }
}

async function main() {
  const existing = existingSlugsAndTitles();
  const raw = await callModel(buildPrompt(existing));
  const draft = extractJson(raw);
  validate(draft);

  let slug = slugify(draft.title);
  const existingSlugs = new Set(existing.map((p) => p.slug));
  if (existingSlugs.has(slug)) slug = `${slug}-${Date.now().toString(36)}`;

  const today = new Date().toISOString().slice(0, 10);
  const dayIndex = new Date(today).getUTCDate();

  const post = {
    slug,
    title: draft.title,
    excerpt: draft.excerpt,
    category: draft.category,
    categoryClass: CATEGORIES[draft.category],
    date: today,
    coverImage: COVER_IMAGES[dayIndex % COVER_IMAGES.length],
    body: draft.body,
  };

  const outPath = path.join(postsDir, `${slug}.json`);
  fs.writeFileSync(outPath, JSON.stringify(post, null, 2) + '\n');
  console.log(`wrote ${path.relative(process.cwd(), outPath)}`);

  // Exposes the path to the workflow step that commits it.
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `post_path=${outPath}\npost_title=${post.title}\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
