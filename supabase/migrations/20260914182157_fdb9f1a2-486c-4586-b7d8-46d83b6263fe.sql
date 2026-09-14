-- ===== ENUMS =====
CREATE TYPE public.payment_intent_status AS ENUM ('pending','submitted','under_review','confirmed','rejected','cancelled');
CREATE TYPE public.exec_step_status AS ENUM ('pending','in_progress','blocked','done','skipped');
CREATE TYPE public.change_request_status AS ENUM ('open','in_review','accepted','rejected');

CREATE SEQUENCE IF NOT EXISTS public.payint_seq;
CREATE SEQUENCE IF NOT EXISTS public.portal_seq;

-- ===== PAYMENT GATEWAYS (configurable) =====
CREATE TABLE public.payment_gateways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  method payment_method NOT NULL DEFAULT 'other',
  instructions text,
  account_ref text,
  mode text NOT NULL DEFAULT 'manual',
  requires_reference boolean NOT NULL DEFAULT true,
  requires_receipt boolean NOT NULL DEFAULT false,
  auto_confirm boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_gateways TO authenticated;
GRANT ALL ON public.payment_gateways TO service_role;
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gateways_select" ON public.payment_gateways FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "gateways_insert" ON public.payment_gateways FOR INSERT TO authenticated WITH CHECK (public.is_manager());
CREATE POLICY "gateways_update" ON public.payment_gateways FOR UPDATE TO authenticated USING (public.is_manager()) WITH CHECK (public.is_manager());
CREATE TRIGGER trg_gateways_updated BEFORE UPDATE ON public.payment_gateways FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.payment_gateways (key, name, method, instructions, account_ref, requires_reference, requires_receipt, sort_order) VALUES
 ('instapay','إنستاباي','instapay','حوّل المبلغ إلى العنوان التالي على إنستاباي ثم أدخل رقم العملية.','kemetrise@instapay',true,true,1),
 ('vodafone_cash','فودافون كاش','vodafone_cash','حوّل المبلغ إلى المحفظة ثم أدخل رقم العملية.','01000000000',true,true,2),
 ('bank_transfer','تحويل بنكي','bank_transfer','حوّل المبلغ إلى الحساب البنكي وأرفق صورة الإيصال.','EG000000000000000000000000',true,true,3),
 ('card','بطاقة ائتمان / خصم','card','ادفع بالبطاقة مباشرة داخل النظام.','',false,false,4);

-- ===== PAYMENT INTENTS =====
CREATE TABLE public.payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL DEFAULT public.next_code('PI','payint_seq'),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  gateway_key text NOT NULL,
  method payment_method NOT NULL DEFAULT 'other',
  amount numeric NOT NULL CHECK (amount > 0),
  status payment_intent_status NOT NULL DEFAULT 'pending',
  reference text,
  receipt_path text,
  payer_name text,
  note text,
  review_notes text,
  source text NOT NULL DEFAULT 'portal',
  payment_id uuid REFERENCES public.payments(id),
  created_by uuid REFERENCES auth.users(id),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_intents TO authenticated;
GRANT ALL ON public.payment_intents TO service_role;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intents_select" ON public.payment_intents FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "intents_insert" ON public.payment_intents FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "intents_update" ON public.payment_intents FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER trg_intents_updated BEFORE UPDATE ON public.payment_intents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_intents_order ON public.payment_intents(order_id);

-- ===== CUSTOMER PORTAL ACCOUNTS =====
CREATE TABLE public.customer_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_users TO authenticated;
GRANT ALL ON public.customer_users TO service_role;
ALTER TABLE public.customer_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_users_select" ON public.customer_users FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff());
CREATE POLICY "customer_users_insert" ON public.customer_users FOR INSERT TO authenticated WITH CHECK (public.is_staff());

CREATE TABLE public.portal_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL DEFAULT public.next_code('PL','portal_seq'),
  token text NOT NULL UNIQUE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  request_id uuid REFERENCES public.sales_requests(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_links TO authenticated;
GRANT ALL ON public.portal_links TO service_role;
ALTER TABLE public.portal_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portal_links_select" ON public.portal_links FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "portal_links_insert" ON public.portal_links FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "portal_links_update" ON public.portal_links FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ===== CUSTOMER CHANGE REQUESTS ON QUOTATIONS =====
CREATE TABLE public.quotation_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  request_id uuid REFERENCES public.sales_requests(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  message text NOT NULL,
  requested_price numeric,
  requested_delivery_days int,
  status change_request_status NOT NULL DEFAULT 'open',
  response text,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotation_change_requests TO authenticated;
GRANT ALL ON public.quotation_change_requests TO service_role;
ALTER TABLE public.quotation_change_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qcr_select" ON public.quotation_change_requests FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "qcr_insert" ON public.quotation_change_requests FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "qcr_update" ON public.quotation_change_requests FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER trg_qcr_updated BEFORE UPDATE ON public.quotation_change_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== ORDER EXECUTION =====
CREATE TABLE public.order_execution_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  seq int NOT NULL DEFAULT 1,
  name text NOT NULL,
  status exec_step_status NOT NULL DEFAULT 'pending',
  planned_start date,
  planned_end date,
  actual_start date,
  actual_end date,
  assigned_to uuid REFERENCES auth.users(id),
  delay_days int NOT NULL DEFAULT 0,
  delay_reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_execution_steps TO authenticated;
GRANT ALL ON public.order_execution_steps TO service_role;
ALTER TABLE public.order_execution_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "steps_select" ON public.order_execution_steps FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "steps_insert" ON public.order_execution_steps FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "steps_update" ON public.order_execution_steps FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "steps_delete" ON public.order_execution_steps FOR DELETE TO authenticated USING (public.is_manager());
CREATE TRIGGER trg_steps_updated BEFORE UPDATE ON public.order_execution_steps FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_steps_order ON public.order_execution_steps(order_id, seq);

CREATE TABLE public.order_daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  step_id uuid REFERENCES public.order_execution_steps(id) ON DELETE SET NULL,
  log_date date NOT NULL DEFAULT current_date,
  progress_note text NOT NULL,
  hours numeric NOT NULL DEFAULT 0,
  delay_days int NOT NULL DEFAULT 0,
  delay_reason text,
  is_customer_visible boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_daily_logs TO authenticated;
GRANT ALL ON public.order_daily_logs TO service_role;
ALTER TABLE public.order_daily_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_select" ON public.order_daily_logs FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "logs_insert" ON public.order_daily_logs FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "logs_update" ON public.order_daily_logs FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE INDEX idx_logs_order ON public.order_daily_logs(order_id, log_date DESC);

-- auto-create execution plan when an order is created
CREATE OR REPLACE FUNCTION public.seed_order_execution()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  d date := COALESCE(NEW.expected_delivery, current_date + 14);
  start_d date := current_date;
  total int := GREATEST((d - current_date), 5);
BEGIN
  INSERT INTO public.order_execution_steps (order_id, seq, name, planned_start, planned_end) VALUES
    (NEW.id, 1, 'تأكيد الأمر وتجهيز الملف', start_d, start_d + (total * 0.1)::int),
    (NEW.id, 2, 'توفير الخامات', start_d + (total * 0.1)::int, start_d + (total * 0.3)::int),
    (NEW.id, 3, 'التنفيذ / الإنتاج', start_d + (total * 0.3)::int, start_d + (total * 0.7)::int),
    (NEW.id, 4, 'مراجعة الجودة', start_d + (total * 0.7)::int, start_d + (total * 0.85)::int),
    (NEW.id, 5, 'التغليف والتجهيز للتسليم', start_d + (total * 0.85)::int, start_d + (total * 0.95)::int),
    (NEW.id, 6, 'التسليم للعميل', start_d + (total * 0.95)::int, d);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.seed_order_execution() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_seed_execution AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.seed_order_execution();