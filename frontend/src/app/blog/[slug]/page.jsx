import BlogDetailClient from './BlogDetailClient';

const SEED_SLUGS = [
  '5-short-video-trends-2026',
  'power-of-architectural-photography'
];

export async function generateStaticParams() {
  return SEED_SLUGS.map((slug) => ({ slug }));
}

export default function BlogDetailPage({ params }) {
  return <BlogDetailClient slug={params.slug} />;
}
