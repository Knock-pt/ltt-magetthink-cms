import PortfolioDetailClient from './PortfolioDetailClient';

const SEED_SLUGS = [
  'cross-pattaya-oceanphere',
  'the-politan-aqua',
  'pavilion-samui',
  'rachabura-hotel',
  'suncave-cafe'
];

export async function generateStaticParams() {
  return SEED_SLUGS.map((slug) => ({ slug }));
}

export default function PortfolioDetailPage({ params }) {
  return <PortfolioDetailClient slug={params.slug} />;
}
