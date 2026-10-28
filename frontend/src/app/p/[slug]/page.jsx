import CustomPageClient from './CustomPageClient';

const SEED_PAGE_SLUGS = [
  'sample-page'
];

export async function generateStaticParams() {
  try {
    const res = await fetch('https://ltt-backend.thunchanok-raj.workers.dev/api/public/pages');
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      return data.data.map((p) => ({ slug: p.slug }));
    }
  } catch (e) {}
  return SEED_PAGE_SLUGS.map((slug) => ({ slug }));
}

export default function CustomPage({ params }) {
  return <CustomPageClient slug={params.slug} />;
}
