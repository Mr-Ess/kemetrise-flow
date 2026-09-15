CREATE TABLE public.website_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  value text NOT NULL,
  label_ar text NOT NULL,
  label_en text,
  description text,
  icon text,
  color text,
  parent_id uuid REFERENCES public.website_categories(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, value)
);

GRANT SELECT ON public.website_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.website_categories TO authenticated;
GRANT ALL ON public.website_categories TO service_role;

ALTER TABLE public.website_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories public read"
  ON public.website_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "categories staff read all"
  ON public.website_categories FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "categories manager insert"
  ON public.website_categories FOR INSERT TO authenticated
  WITH CHECK (public.is_manager());

CREATE POLICY "categories manager update"
  ON public.website_categories FOR UPDATE TO authenticated
  USING (public.is_manager()) WITH CHECK (public.is_manager());

CREATE POLICY "categories manager delete"
  ON public.website_categories FOR DELETE TO authenticated
  USING (public.is_manager());

CREATE TRIGGER website_categories_updated_at
  BEFORE UPDATE ON public.website_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX website_categories_kind_idx ON public.website_categories (kind, sort_order);