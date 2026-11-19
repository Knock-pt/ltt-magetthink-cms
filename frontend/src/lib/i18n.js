import { dictionary } from './dictionary.js';

/**
 * Determine active language on the server from ?lang= query or ltt_lang cookie
 */
export function getLanguageContext(Astro) {
  const queryLang = Astro.url.searchParams.get('lang');
  const cookieLang = Astro.cookies.get('ltt_lang')?.value;

  let language = 'th';
  if (queryLang === 'en' || queryLang === 'th') {
    language = queryLang;
    Astro.cookies.set('ltt_lang', queryLang, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  } else if (cookieLang === 'en' || cookieLang === 'th') {
    language = cookieLang;
  }

  const dict = dictionary[language] || dictionary.th;
  const t = (key) => dict[key] || dictionary.th[key] || key;

  return { language, t };
}

/**
 * Set standard Edge Cache-Control header for public SSR pages
 */
export function setPublicCacheHeaders(Astro, maxAge = 60, sMaxAge = 300) {
  Astro.response.headers.set(
    'Cache-Control',
    `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=600`
  );
  Astro.response.headers.set('Vary', 'Cookie');
}
