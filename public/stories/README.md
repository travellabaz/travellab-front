# Story media

Add files here, then list them in `/public/content/stories.json` (edit
directly via GitHub's web editor — no code change needed). A push to
`main` triggers a Netlify rebuild automatically.

Folder/file naming: `{category-id}/{segment-number}.{jpg|mp4}` — e.g.
`turistler/001.jpg`, `turistler/002.mp4`. `category-id` must match a
category's `"id"` in `stories.json`.

Media requirements:
- **Image**: min. 1080×1920 (9:16), compressed, ~300KB max.
- **Video**: MP4 (H.264), max 60s, ~5MB max.

Each story entry in `stories.json`:
```json
{
  "id": "turistler-001",
  "type": "image",
  "media_url": "/stories/turistler/001.jpg",
  "duration_seconds": 5,
  "link": null
}
```
`type` is `"image"` or `"video"`. `duration_seconds` is only used for
images (how long it's shown before auto-advancing) — leave it `null`
for videos, they auto-advance when playback ends. `link` is optional —
where tapping the story navigates to (e.g. `"/tours?category=..."`),
or `null` for none.
