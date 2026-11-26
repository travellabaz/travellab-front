Drafts written by scripts/blog-job.mjs. The site never reads this folder
(src/data/blog/index.js only globs ./posts). A manager publishes a draft from
the CRM ("Bloq qaralamaları" → "Dərc et"): the CRM moves it to ../posts
(a refresh draft replaces its post) through the GitHub API, and Netlify
rebuilds the site.
