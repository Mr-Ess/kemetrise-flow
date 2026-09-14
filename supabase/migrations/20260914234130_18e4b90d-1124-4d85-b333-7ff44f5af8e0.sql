
-- ============ helper: manager check already exists (public.is_manager, public.is_staff) ============

-- ============ website settings (singleton) ============
CREATE TABLE public.website_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text NOT NULL DEFAULT 'KemetRise',
  tagline text,
  logo_url text,
  email text,
  phone text,
  whatsapp text,
  address text,
  social jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo_title text,
  seo_description text,
  footer_text text,
  default_locale text NOT NULL DEFAULT 'ar',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.website_hero (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  badge text,
  title text NOT NULL DEFAULT 'KemetRise',
  subtitle text,
  primary_cta_label text NOT NULL DEFAULT 'ابدأ الآن',
  primary_cta_href text NOT NULL DEFAULT '/request',
  secondary_cta_label text NOT NULL DEFAULT 'استكشف خدماتنا',
  secondary_cta_href text NOT NULL DEFAULT '/services',
  media_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.website_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  value text NOT NULL,
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.website_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.website_how_it_works (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_no int NOT NULL DEFAULT 1,
  title text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.website_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  name_en text,
  description text,
  category text,
  icon text,
  image_url text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  product_service_id uuid REFERENCES public.products_services(id) ON DELETE SET NULL,
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.website_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  name_en text,
  description text,
  category text,
  subcategory text,
  brand text,
  product_type text NOT NULL DEFAULT 'physical',
  pricing_model text NOT NULL DEFAULT 'fixed',
  price numeric,
  compare_price numeric,
  currency text NOT NULL DEFAULT 'EGP',
  image_url text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  rating numeric NOT NULL DEFAULT 0,
  reviews_count int NOT NULL DEFAULT 0,
  product_service_id uuid REFERENCES public.products_services(id) ON DELETE SET NULL,
  is_featured boolean NOT NULL DEFAULT false,
  is_new boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.website_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  client_name text,
  sector text,
  description text,
  status text NOT NULL DEFAULT 'completed',
  execution_type text,
  cover_url text,
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.website_portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  category text,
  description text,
  image_url text,
  results text,
  is_published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.website_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  partner_type text,
  category text,
  description text,
  website_url text,
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.website_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  region text,
  country text,
  coverage text,
  bio text,
  photo_url text,
  email text,
  phone text,
  whatsapp text,
  brands jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.website_leadership_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text,
  bio text,
  photo_url text,
  linkedin_url text,
  is_published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.website_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  title_en text,
  excerpt text,
  content text,
  cover_url text,
  category text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  author text,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  views int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.website_testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  author_title text,
  company text,
  avatar_url text,
  quote text NOT NULL,
  rating int NOT NULL DEFAULT 5,
  is_published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.website_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text,
  is_published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.website_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric,
  currency text NOT NULL DEFAULT 'EGP',
  billing_period text NOT NULL DEFAULT 'monthly',
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  cta_label text NOT NULL DEFAULT 'اطلب الباقة',
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.website_about (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  title text NOT NULL,
  body text,
  image_url text,
  is_published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.website_contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  phone text,
  company text,
  subject text,
  message text NOT NULL,
  inquiry_type text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'new',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  request_id uuid REFERENCES public.sales_requests(id) ON DELETE SET NULL,
  internal_notes text,
  source_page text,
  utm jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============ grants ============
GRANT SELECT ON public.website_settings, public.website_hero, public.website_stats,
  public.website_features, public.website_how_it_works, public.website_services,
  public.website_products, public.website_projects, public.website_portfolio,
  public.website_partners, public.website_agents, public.website_leadership_team,
  public.website_news, public.website_testimonials, public.website_faqs,
  public.website_plans, public.website_about TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.website_settings, public.website_hero, public.website_stats,
  public.website_features, public.website_how_it_works, public.website_services,
  public.website_products, public.website_projects, public.website_portfolio,
  public.website_partners, public.website_agents, public.website_leadership_team,
  public.website_news, public.website_testimonials, public.website_faqs,
  public.website_plans, public.website_about TO authenticated;

GRANT ALL ON public.website_settings, public.website_hero, public.website_stats,
  public.website_features, public.website_how_it_works, public.website_services,
  public.website_products, public.website_projects, public.website_portfolio,
  public.website_partners, public.website_agents, public.website_leadership_team,
  public.website_news, public.website_testimonials, public.website_faqs,
  public.website_plans, public.website_about, public.website_contact_submissions TO service_role;

GRANT SELECT, UPDATE ON public.website_contact_submissions TO authenticated;

-- ============ RLS ============
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'website_settings','website_hero','website_stats','website_features','website_how_it_works',
    'website_services','website_products','website_projects','website_portfolio','website_partners',
    'website_agents','website_leadership_team','website_news','website_testimonials','website_faqs',
    'website_plans','website_about'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (true)', t||'_read', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_manager())', t||'_ins', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.is_manager()) WITH CHECK (public.is_manager())', t||'_upd', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.is_manager())', t||'_del', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', 'trg_'||t||'_updated', t);
  END LOOP;
END $$;

ALTER TABLE public.website_contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY contact_read_staff ON public.website_contact_submissions FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY contact_update_staff ON public.website_contact_submissions FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER trg_contact_updated BEFORE UPDATE ON public.website_contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ attribution fields ============
ALTER TABLE public.sales_requests
  ADD COLUMN IF NOT EXISTS request_type text NOT NULL DEFAULT 'service',
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'dashboard',
  ADD COLUMN IF NOT EXISTS source_detail text,
  ADD COLUMN IF NOT EXISTS origin_page text,
  ADD COLUMN IF NOT EXISTS origin_entity_type text,
  ADD COLUMN IF NOT EXISTS origin_entity_id uuid,
  ADD COLUMN IF NOT EXISTS website_service_id uuid REFERENCES public.website_services(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS website_product_id uuid REFERENCES public.website_products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS website_project_id uuid REFERENCES public.website_projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES public.website_agents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS utm jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS campaign text,
  ADD COLUMN IF NOT EXISTS budget_range text,
  ADD COLUMN IF NOT EXISTS decision_date date,
  ADD COLUMN IF NOT EXISTS preferred_payment_method text,
  ADD COLUMN IF NOT EXISTS delivery_location text,
  ADD COLUMN IF NOT EXISTS needs_shipping boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS needs_installation boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS needs_customization boolean NOT NULL DEFAULT false;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS lifecycle_stage text NOT NULL DEFAULT 'customer',
  ADD COLUMN IF NOT EXISTS source_detail text,
  ADD COLUMN IF NOT EXISTS campaign text,
  ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES public.website_agents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS utm jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS preferred_contact text;

CREATE INDEX IF NOT EXISTS idx_sales_requests_source ON public.sales_requests(source);
CREATE INDEX IF NOT EXISTS idx_customers_lifecycle ON public.customers(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_contact_status ON public.website_contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_news_published ON public.website_news(is_published, published_at DESC);
