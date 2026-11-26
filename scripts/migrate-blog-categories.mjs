// One-off (2026-11 SEO plan): moves every post to the new service-bound
// categories (see src/data/blog/categories.js). Posts of the removed
// "Təbiət", "Səyahət Fəndləri" and "Macəra" categories are moved one by one
// by their topic; posts about nothing we sell get `noindex: true`.
// Safe to run again: a post already on a new category is left as it is.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const postsDir = path.join(__dirname, '../src/data/blog/posts');

const CLASSES = {
  viza: 'cat-q',
  istiqametler: 'cat-t',
  aviabilet: 'cat-b',
  balayi: 'cat-a',
  'mualice-turizmi': 'cat-o',
  konsertler: 'cat-k',
  korporativ: 'cat-c',
  xeberler: 'cat-n',
};

const BY_CATEGORY = {
  Viza: 'viza',
  'Getməzdən Əvvəl': 'istiqametler',
  Bilet: 'aviabilet',
  Konsertlər: 'konsertler',
  Korporativ: 'korporativ',
  'Tibbi Turizm': 'mualice-turizmi',
  Xəbərlər: 'xeberler',
};

// the posts of the removed categories, by their topic
const BY_SLUG = {
  'ailevi-seyahet-meslehetleri-usaqlarla-asan-tetil-rehberi': 'istiqametler',
  'azerbaycanda-ekoturizm-tebiet-qoynunda-sakit-istirahet': 'istiqametler',
  'azerbaycanin-ciceklenme-movsumu-bahar-tebieti-kesfleri': 'istiqametler',
  'azerbaycanin-mohtesem-golleri-tebiet-seyaheti-beledcisi': 'istiqametler',
  'azerbaycanin-qoruqlari-ve-milli-parklari-tebiet-seyaheti': 'istiqametler',
  'azerbaycanin-tebiet-seyaheti-gizli-cennetleri-kesf-et': 'istiqametler',
  'azerbaycanli-seyahetciler-ucun-qeyri-adi-tebiet-ve-kanyoninq': 'istiqametler',
  'budce-seyaheti-azerbaycandan-cixisla-ucuz-bilet-tapmaq-ve-pu': 'aviabilet',
  'dag-trekkinqi-ve-ekstremal-macera-seyaheti-beledcisi': 'istiqametler',
  'dunyanin-en-gozel-telequlleleri-memarliq-sahesertleri-ve': 'istiqametler',
  'dunyanin-en-qedim-restoranlari-tarixi-qastronomiya': 'istiqametler',
  'islandiyada-ekstremal-macera-seyaheti-tam-beledci': 'istiqametler',
  'movsumi-tebiet-seyaheti-payiz-rengleri-ve-mese-kesfleri': 'istiqametler',
  'qafqazda-dag-trekkinqi-ilk-defe-seyahet-edenler-ucun-beledci': 'istiqametler',
  'qalapaqos-adalari-darvinin-adalari-ve-tebiet-kesfleri': 'istiqametler',
  'seyahet-sigortasi-ve-tibbi-xercler-xaricde-risklerden': 'istiqametler',
  'seyahet-sigortasi-xaricde-risklerden-nece-qorunmali': 'istiqametler',
  'seyahete-qenaetle-hazirlasmaq': 'istiqametler',
  'solo-macera-seyaheti-tek-basina-kesf-etmeyin-yollari': 'istiqametler',
  'tek-seyahet-edenler-ucun-en-vacib-solo-seyahet-meslehetleri': 'istiqametler',
  'termal-bulaqlar-tebietde-isti-su-ve-sefali-marsrutlar': 'mualice-turizmi',
  'ucuz-teyyare-bileti-tapmaq-ucun-8-qizil-qayda-beledci': 'aviabilet',
  'vizasiz-macera-olkeleri-ekstremal-seyahet-beledcisi': 'viza',
};

// topics of no service of ours, named in the SEO plan (C.1): kept online, out of Google
const NOINDEX = new Set([
  'dunyanin-en-qedim-restoranlari-tarixi-qastronomiya',
  'solo-seyahet-trendleri-tek-seyahet-edenlere-yeni-xidmetler',
  'biometrik-minme-uz-tanima-texnologiyasi-ile-ucusa-nece',
]);
const NOINDEX_TITLE = /simfonik/i;

// the only English post kept in Google (C.3)
const EN_INDEXED = new Set(['azerbaycan-vtendaslari-ucun-vizasiz-olkeler-siyahisi-2024']);

let moved = 0;
for (const file of fs.readdirSync(postsDir).filter((name) => name.endsWith('.json'))) {
  const fullPath = path.join(postsDir, file);
  const post = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  const before = JSON.stringify(post);
  if (!CLASSES[post.category]) {
    const next = BY_SLUG[post.slug] || BY_CATEGORY[post.category];
    if (!next) throw new Error(`No new category for ${post.slug} (${post.category})`);
    post.category = next;
  }
  post.categoryClass = CLASSES[post.category];
  const title = (post.az || post).title || '';
  if (NOINDEX.has(post.slug) || NOINDEX_TITLE.test(title)) post.noindex = true;
  if (EN_INDEXED.has(post.slug)) post.enIndexed = true;
  if (JSON.stringify(post) !== before) {
    fs.writeFileSync(fullPath, JSON.stringify(post, null, 2) + '\n');
    moved += 1;
  }
}
console.log(`updated ${moved} posts`);
