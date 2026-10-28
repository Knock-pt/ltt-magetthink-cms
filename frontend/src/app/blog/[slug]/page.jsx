import BlogDetailClient from './BlogDetailClient';

const SEED_SLUGS = [
  '5-short-video-trends-2026',
  'power-of-architectural-photography',
  'test-content-blog-4753'
];

export async function generateStaticParams() {
  try {
    const res = await fetch('https://ltt-backend.thunchanok-raj.workers.dev/api/public/articles');
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      return data.data.map((art) => ({ slug: art.slug || String(art.id) }));
    }
  } catch (err) {}
  return SEED_SLUGS.map((slug) => ({ slug }));
}

export default function BlogDetailPage({ params }) {
  return <BlogDetailClient slug={params.slug} />;
}
