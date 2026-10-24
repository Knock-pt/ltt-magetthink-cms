export interface Bindings {
  DB: D1Database;
  R2_BUCKET?: R2Bucket;
  ENVIRONMENT?: string;
  FRONTEND_ORIGIN?: string;
  ADMIN_ORIGIN?: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_POLICY_AUD?: string;
  CACHE_PURGE_WEBHOOK?: string;
}

export interface SiteSetting {
  key: string;
  value: string;
  description?: string;
  updated_at: string;
}

export interface ServiceItem {
  id: number;
  title: string;
  slug: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  bullet_points?: string;
  sort_order: number;
  is_active: number;
}

export interface PortfolioItem {
  id: number;
  title: string;
  slug: string;
  client_name: string;
  category_slug: string;
  cover_image: string;
  gallery_images?: string;
  summary?: string;
  details?: string;
  featured: number;
  sort_order: number;
  is_active: number;
}

export interface ArticleItem {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  cover_image?: string;
  author: string;
  tags?: string;
  status: string;
  published_at: string;
}

export interface ClientLogo {
  id: number;
  name: string;
  logo_url: string;
  website_url?: string;
  sort_order: number;
  is_active: number;
}

export interface InquiryItem {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  company?: string;
  service_interested?: string;
  budget_range?: string;
  message: string;
  status: 'new' | 'in_progress' | 'contacted' | 'closed';
  ip_address?: string;
  created_at: string;
  updated_at: string;
}
