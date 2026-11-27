// "/tours/123/" is answered as "/tours/123" with 200, not with a 301: browsers that cached an
// old "no slash -> slash" 301 loop forever (ERR_TOO_MANY_REDIRECTS) on a "slash -> no slash" one.
// The page's canonical is the address without the slash, so Google keeps one URL.
export default async (request) => {
  const url = new URL(request.url);
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.replace(/\/+$/, '') || '/';
    return url;
  }
  return undefined;
};

export const config = {
  path: '/*',
  excludedPath: ['/assets/*', '/images/*', '/videos/*', '/fonts/*', '/content/*', '/*.js', '/*.css', '/*.png', '/*.jpg', '/*.webp', '/*.svg', '/*.ico', '/*.xml', '/*.txt', '/*.json', '/*.mp4'],
};
