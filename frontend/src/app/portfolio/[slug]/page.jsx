import PortfolioDetailClient from './PortfolioDetailClient';

const SEED_SLUGS = [
  'cross-pattaya-oceanphere',
  'the-politan-aqua',
  'pavilion-samui',
  'rachabura-hotel',
  'suncave-cafe'
];

export async function generateStaticParams() {
  try {
    const res = await fetch('https://ltt-backend.thunchanok-raj.workers.dev/api/public/portfolios');
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      return data.data.map((p) => ({ slug: p.slug || String(p.id) }));
    }
  } catch (err) {}
  return SEED_SLUGS.map((slug) => ({ slug }));
}

export default function PortfolioDetailPage({ params }) {
  return <PortfolioDetailClient slug={params.slug} />;
}
