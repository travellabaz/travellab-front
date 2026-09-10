// One-off + re-runnable: gives every trilingual blog post a per-language
// slug derived from that language's own title, so /en/ and /ru/ URLs stop
// carrying the Azerbaijani slug.
//
//   post.slug            -> canonical AZ slug (unchanged, = the filename)
//   post.az.slug         -> same as post.slug
//   post.en.slug         -> slugify(post.en.title)
//   post.ru.slug         -> slugify(post.ru.title)  (Cyrillic transliterated)
//
// Flat AZ-only posts are left alone (they only have an AZ version).
// Idempotent: running again only fills in what's missing / stale.
//
//   node scripts/migrate-blog-slugs.mjs          # write
//   node scripts/migrate-blog-slugs.mjs --dry    # print what would change
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugify } from '../src/utils/slugify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const postsDir = path.join(__dirname, '../src/data/blog/posts');
const dry = process.argv.includes('--dry');

const LOCALES = ['az', 'ru', 'en'];
let changed = 0;

for (const file of fs.readdirSync(postsDir).filter((f) => f.endsWith('.json'))) {
  const full = path.join(postsDir, file);
  const post = JSON.parse(fs.readFileSync(full, 'utf-8'));
  const trilingual = LOCALES.some((l) => post[l]);
  if (!trilingual) continue;

  let dirty = false;
  for (const loc of LOCALES) {
    if (!post[loc] || !post[loc].title) continue;
    const want = loc === 'az' ? post.slug : slugify(post[loc].title);
    if (post[loc].slug !== want) {
      if (dry) console.log(`${file}\n  ${loc}: ${post[loc].slug || '(none)'} -> ${want}`);
      post[loc].slug = want;
      dirty = true;
    }
  }

  if (dirty && !dry) {
    fs.writeFileSync(full, JSON.stringify(post, null, 2) + '\n');
    changed += 1;
  } else if (dirty) {
    changed += 1;
  }
}

console.log(dry ? `\n${changed} post(s) would change` : `${changed} post(s) updated`);
