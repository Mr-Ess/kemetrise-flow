-- ===== ENUMS =====
CREATE TYPE public.app_role AS ENUM ('admin','management','sales','costing','staff');
CREATE TYPE public.customer_status AS ENUM ('prospect','active','inactive','returning','vip','lost');
CREATE TYPE public.lead_source AS ENUM ('facebook','instagram','tiktok','whatsapp','website','google','referral','existing_customer','walk_in','other');
CREATE TYPE public.request_status AS ENUM ('draft','submitted','under_review','waiting_information','costing_in_progress','costing_completed','pending_approval','quotation_ready','quotation_sent','negotiation','customer_approved','customer_rejected','expired','converted_to_order','cancelled');
CREATE TYPE public.priority_level AS ENUM ('low','normal','high','urgent');
CREATE TYPE public.quotation_status AS ENUM ('draft','pending_approval','approved','sent','viewed','negotiation','accepted','rejected','expired','superseded');
CREATE TYPE public.order_status AS ENUM ('new','confirmed','in_progress','waiting_customer','waiting_documents','ready','delivered','completed','on_hold','cancelled');
CREATE TYPE public.payment_method AS ENUM ('cash','bank_transfer','instapay','vodafone_cash','card','other');
CREATE TYPE public.document_status AS ENUM ('required','requested','received','verified','rejected','missing');
CREATE TYPE public.task_status AS ENUM ('pending','in_progress','completed','cancelled');
CREATE TYPE public.cost_category AS ENUM ('raw_materials','labor','production','transportation','external_services','packaging','other');
CREATE TYPE public.lost_reason AS ENUM ('price','competitor','delivery_time','specification','customer_budget','changed_mind','no_response','other');

-- ===== HELPERS =====
CREATE SEQUENCE public.seq_customer_code;
CREATE SEQUENCE public.seq_request_code;
CREATE SEQUENCE public.seq_quotation_code;
CREATE SEQUENCE public.seq_order_code;
CREATE SEQUENCE public.seq_payment_code;
CREATE SEQUENCE public.seq_document_code;
CREATE SEQUENCE public.seq_product_code;

CREATE OR REPLACE FUNCTION public.next_code(prefix text, seq text)
RETURNS text LANGUAGE sql VOLATILE SET search_path = public AS $$
  SELECT prefix || '-' || lpad(nextval(seq::regclass)::text, 6, '0');
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ===== PROFILES & ROLES =====
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.can_see_costs()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','management','costing')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','management')
  );
$$;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_manager()) WITH CHECK (id = auth.uid() OR public.is_manager());
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'sales'))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== CUSTOMERS =====
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT public.next_code('CUS','public.seq_customer_code'),
  full_name text NOT NULL,
  company_name text,
  phone text NOT NULL,
  whatsapp text,
  email text,
  address text,
  governorate text,
  city text,
  source public.lead_source NOT NULL DEFAULT 'other',
  referred_by text,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.customer_status NOT NULL DEFAULT 'prospect',
  notes text,
  is_archived boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_customers_status ON public.customers(status);
CREATE INDEX idx_customers_assigned ON public.customers(assigned_to);
CREATE INDEX idx_customers_created_at ON public.customers(created_at);
GRANT SELECT, INSERT, UPDATE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_select" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "customers_insert" ON public.customers FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "customers_update" ON public.customers FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== PRODUCTS / SERVICES =====
CREATE TABLE public.products_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT public.next_code('PRD','public.seq_product_code'),
  name text NOT NULL,
  category text,
  description text,
  unit text NOT NULL DEFAULT 'قطعة',
  default_cost numeric(14,2) NOT NULL DEFAULT 0,
  reference_price numeric(14,2) NOT NULL DEFAULT 0,
  default_margin numeric(5,2) NOT NULL DEFAULT 25,
  typical_delivery_days integer NOT NULL DEFAULT 7,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.products_services TO authenticated;
GRANT ALL ON public.products_services TO service_role;
ALTER TABLE public.products_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_select" ON public.products_services FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_write" ON public.products_services FOR INSERT TO authenticated WITH CHECK (public.can_see_costs());
CREATE POLICY "products_update" ON public.products_services FOR UPDATE TO authenticated USING (public.can_see_costs()) WITH CHECK (public.can_see_costs());

CREATE TABLE public.request_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  product_service_id uuid REFERENCES public.products_services(id) ON DELETE SET NULL,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.request_templates TO authenticated;
GRANT ALL ON public.request_templates TO service_role;
ALTER TABLE public.request_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates_select" ON public.request_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "templates_insert" ON public.request_templates FOR INSERT TO authenticated WITH CHECK (public.is_manager());
CREATE POLICY "templates_update" ON public.request_templates FOR UPDATE TO authenticated USING (public.is_manager()) WITH CHECK (public.is_manager());

-- ===== SALES REQUESTS =====
CREATE TABLE public.sales_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT public.next_code('REQ','public.seq_request_code'),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  title text NOT NULL,
  product_service_id uuid REFERENCES public.products_services(id) ON DELETE SET NULL,
  description text,
  quantity numeric(14,2) NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'قطعة',
  specs jsonb NOT NULL DEFAULT '{}'::jsonb,
  dimensions text,
  material text,
  color text,
  finish text,
  required_delivery_date date,
  priority public.priority_level NOT NULL DEFAULT 'normal',
  salesperson_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_notes text,
  internal_notes text,
  status public.request_status NOT NULL DEFAULT 'draft',
  estimated_value numeric(14,2) NOT NULL DEFAULT 0,
  lost_reason public.lost_reason,
  lost_notes text,
  submitted_at timestamptz,
  status_changed_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_requests_customer ON public.sales_requests(customer_id);
CREATE INDEX idx_requests_status ON public.sales_requests(status);
CREATE INDEX idx_requests_salesperson ON public.sales_requests(salesperson_id);
CREATE INDEX idx_requests_created_at ON public.sales_requests(created_at);
GRANT SELECT, INSERT, UPDATE ON public.sales_requests TO authenticated;
GRANT ALL ON public.sales_requests TO service_role;
ALTER TABLE public.sales_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "requests_select" ON public.sales_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "requests_insert" ON public.sales_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "requests_update" ON public.sales_requests FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TRIGGER trg_requests_updated BEFORE UPDATE ON public.sales_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.sales_request_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.sales_requests(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_attachments_request ON public.sales_request_attachments(request_id);
GRANT SELECT, INSERT, DELETE ON public.sales_request_attachments TO authenticated;
GRANT ALL ON public.sales_request_attachments TO service_role;
ALTER TABLE public.sales_request_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attachments_select" ON public.sales_request_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "attachments_insert" ON public.sales_request_attachments FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "attachments_delete" ON public.sales_request_attachments FOR DELETE TO authenticated USING (uploaded_by = auth.uid() OR public.is_manager());

-- ===== COSTING (confidential) =====
CREATE TABLE public.costings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE REFERENCES public.sales_requests(id) ON DELETE CASCADE,
  direct_cost numeric(14,2) NOT NULL DEFAULT 0,
  additional_costs numeric(14,2) NOT NULL DEFAULT 0,
  total_cost numeric(14,2) NOT NULL DEFAULT 0,
  target_margin numeric(5,2) NOT NULL DEFAULT 25,
  suggested_price numeric(14,2) NOT NULL DEFAULT 0,
  approved_price numeric(14,2),
  delivery_days integer,
  notes text,
  requires_approval boolean NOT NULL DEFAULT false,
  is_submitted boolean NOT NULL DEFAULT false,
  submitted_at timestamptz,
  costed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  approval_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_costings_request ON public.costings(request_id);
GRANT SELECT, INSERT, UPDATE ON public.costings TO authenticated;
GRANT ALL ON public.costings TO service_role;
ALTER TABLE public.costings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "costings_select" ON public.costings FOR SELECT TO authenticated USING (public.can_see_costs());
CREATE POLICY "costings_insert" ON public.costings FOR INSERT TO authenticated WITH CHECK (public.can_see_costs());
CREATE POLICY "costings_update" ON public.costings FOR UPDATE TO authenticated USING (public.can_see_costs()) WITH CHECK (public.can_see_costs());
CREATE TRIGGER trg_costings_updated BEFORE UPDATE ON public.costings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.costing_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  costing_id uuid NOT NULL REFERENCES public.costings(id) ON DELETE CASCADE,
  category public.cost_category NOT NULL DEFAULT 'other',
  description text NOT NULL,
  quantity numeric(14,2) NOT NULL DEFAULT 1,
  unit_cost numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_costing_items_costing ON public.costing_items(costing_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.costing_items TO authenticated;
GRANT ALL ON public.costing_items TO service_role;
ALTER TABLE public.costing_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "costing_items_all" ON public.costing_items FOR ALL TO authenticated USING (public.can_see_costs()) WITH CHECK (public.can_see_costs());

-- ===== QUOTATIONS =====
CREATE TABLE public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL DEFAULT public.next_code('QUO','public.seq_quotation_code'),
  request_id uuid NOT NULL REFERENCES public.sales_requests(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  version integer NOT NULL DEFAULT 1,
  is_current boolean NOT NULL DEFAULT true,
  selling_price numeric(14,2) NOT NULL DEFAULT 0,
  discount numeric(14,2) NOT NULL DEFAULT 0,
  tax numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  delivery_days integer,
  payment_terms text,
  valid_until date,
  notes text,
  change_reason text,
  previous_price numeric(14,2),
  status public.quotation_status NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, version)
);
CREATE INDEX idx_quotations_request ON public.quotations(request_id);
CREATE INDEX idx_quotations_customer ON public.quotations(customer_id);
CREATE INDEX idx_quotations_status ON public.quotations(status);
GRANT SELECT, INSERT, UPDATE ON public.quotations TO authenticated;
GRANT ALL ON public.quotations TO service_role;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quotations_select" ON public.quotations FOR SELECT TO authenticated USING (true);
CREATE POLICY "quotations_insert" ON public.quotations FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "quotations_update" ON public.quotations FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TRIGGER trg_quotations_updated BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== ORDERS =====
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT public.next_code('ORD','public.seq_order_code'),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  request_id uuid REFERENCES public.sales_requests(id) ON DELETE SET NULL,
  quotation_id uuid REFERENCES public.quotations(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  quantity numeric(14,2) NOT NULL DEFAULT 1,
  specs jsonb NOT NULL DEFAULT '{}'::jsonb,
  department text,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.order_status NOT NULL DEFAULT 'new',
  total_price numeric(14,2) NOT NULL DEFAULT 0,
  expected_delivery date,
  actual_delivery date,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_assigned ON public.orders(assigned_to);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_select" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "orders_insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "orders_update" ON public.orders FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== PAYMENTS =====
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT public.next_code('PAY','public.seq_payment_code'),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  method public.payment_method NOT NULL DEFAULT 'cash',
  reference text,
  received_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  is_void boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_customer ON public.payments(customer_id);
CREATE INDEX idx_payments_order ON public.payments(order_id);
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_select" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "payments_insert" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "payments_update" ON public.payments FOR UPDATE TO authenticated USING (public.is_manager()) WITH CHECK (public.is_manager());
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== DOCUMENTS =====
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT public.next_code('DOC','public.seq_document_code'),
  name text NOT NULL,
  doc_type text,
  status public.document_status NOT NULL DEFAULT 'required',
  file_path text,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  request_id uuid REFERENCES public.sales_requests(id) ON DELETE CASCADE,
  quotation_id uuid REFERENCES public.quotations(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_documents_customer ON public.documents(customer_id);
GRANT SELECT, INSERT, UPDATE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents_select" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "documents_insert" ON public.documents FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "documents_update" ON public.documents FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ===== TASKS / FOLLOW-UPS =====
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  task_type text NOT NULL DEFAULT 'follow_up',
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  request_id uuid REFERENCES public.sales_requests(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date date,
  priority public.priority_level NOT NULL DEFAULT 'normal',
  status public.task_status NOT NULL DEFAULT 'pending',
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tasks_assigned ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_status ON public.tasks(status);
GRANT SELECT, INSERT, UPDATE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_select" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== COMMENTS =====
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  body text NOT NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_entity ON public.comments(entity_type, entity_id);
GRANT SELECT, INSERT ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_select" ON public.comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert" ON public.comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());

-- ===== NOTIFICATIONS =====
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role public.app_role,
  title text NOT NULL,
  body text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (target_role IS NOT NULL AND public.has_role(auth.uid(), target_role)));
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR (target_role IS NOT NULL AND public.has_role(auth.uid(), target_role)))
  WITH CHECK (user_id = auth.uid() OR (target_role IS NOT NULL AND public.has_role(auth.uid(), target_role)));

-- ===== ACTIVITIES (audit trail, append only) =====
CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_code text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_activities_entity ON public.activities(entity_type, entity_id);
CREATE INDEX idx_activities_created_at ON public.activities(created_at);
GRANT SELECT, INSERT ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activities_select" ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "activities_insert" ON public.activities FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- ===== RULES =====
CREATE TABLE public.pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'الافتراضي',
  min_margin numeric(5,2) NOT NULL DEFAULT 20,
  standard_margin numeric(5,2) NOT NULL DEFAULT 30,
  max_discount numeric(5,2) NOT NULL DEFAULT 10,
  approval_threshold numeric(14,2) NOT NULL DEFAULT 100000,
  costing_sla_hours integer NOT NULL DEFAULT 24,
  approval_sla_hours integer NOT NULL DEFAULT 24,
  followup_sla_hours integer NOT NULL DEFAULT 48,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.pricing_rules TO authenticated;
GRANT ALL ON public.pricing_rules TO service_role;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pricing_rules_select" ON public.pricing_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "pricing_rules_insert" ON public.pricing_rules FOR INSERT TO authenticated WITH CHECK (public.is_manager());
CREATE POLICY "pricing_rules_update" ON public.pricing_rules FOR UPDATE TO authenticated USING (public.is_manager()) WITH CHECK (public.is_manager());

INSERT INTO public.pricing_rules (name) VALUES ('قواعد التسعير الافتراضية');

-- ===== PAYMENT SUMMARY VIEW =====
CREATE OR REPLACE VIEW public.order_financials
WITH (security_invoker = true) AS
SELECT o.id AS order_id,
       o.total_price,
       COALESCE(SUM(p.amount) FILTER (WHERE p.is_void = false), 0) AS paid_amount,
       o.total_price - COALESCE(SUM(p.amount) FILTER (WHERE p.is_void = false), 0) AS remaining_amount
FROM public.orders o
LEFT JOIN public.payments p ON p.order_id = o.id
GROUP BY o.id, o.total_price;
GRANT SELECT ON public.order_financials TO authenticated;
GRANT ALL ON public.order_financials TO service_role;