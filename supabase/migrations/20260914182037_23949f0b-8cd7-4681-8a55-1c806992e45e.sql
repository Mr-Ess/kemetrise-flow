CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  staff_count int;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (id) DO NOTHING;

  IF COALESCE(NEW.raw_user_meta_data->>'account_type','staff') = 'customer' THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO staff_count FROM public.user_roles;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN staff_count = 0 THEN 'admin'::app_role ELSE 'sales'::app_role END)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_staff());
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "customers_select" ON public.customers;
CREATE POLICY "customers_select" ON public.customers FOR SELECT TO authenticated USING (public.is_staff());
DROP POLICY IF EXISTS "customers_insert" ON public.customers;
CREATE POLICY "customers_insert" ON public.customers FOR INSERT TO authenticated WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "customers_update" ON public.customers;
CREATE POLICY "customers_update" ON public.customers FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "products_select" ON public.products_services;
CREATE POLICY "products_select" ON public.products_services FOR SELECT TO authenticated USING (public.is_staff());
DROP POLICY IF EXISTS "templates_select" ON public.request_templates;
CREATE POLICY "templates_select" ON public.request_templates FOR SELECT TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "requests_select" ON public.sales_requests;
CREATE POLICY "requests_select" ON public.sales_requests FOR SELECT TO authenticated USING (public.is_staff());
DROP POLICY IF EXISTS "requests_insert" ON public.sales_requests;
CREATE POLICY "requests_insert" ON public.sales_requests FOR INSERT TO authenticated WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "requests_update" ON public.sales_requests;
CREATE POLICY "requests_update" ON public.sales_requests FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "attachments_select" ON public.sales_request_attachments;
CREATE POLICY "attachments_select" ON public.sales_request_attachments FOR SELECT TO authenticated USING (public.is_staff());
DROP POLICY IF EXISTS "attachments_insert" ON public.sales_request_attachments;
CREATE POLICY "attachments_insert" ON public.sales_request_attachments FOR INSERT TO authenticated WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "quotations_select" ON public.quotations;
CREATE POLICY "quotations_select" ON public.quotations FOR SELECT TO authenticated USING (public.is_staff());
DROP POLICY IF EXISTS "quotations_insert" ON public.quotations;
CREATE POLICY "quotations_insert" ON public.quotations FOR INSERT TO authenticated WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "quotations_update" ON public.quotations;
CREATE POLICY "quotations_update" ON public.quotations FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "orders_select" ON public.orders;
CREATE POLICY "orders_select" ON public.orders FOR SELECT TO authenticated USING (public.is_staff());
DROP POLICY IF EXISTS "orders_insert" ON public.orders;
CREATE POLICY "orders_insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "orders_update" ON public.orders;
CREATE POLICY "orders_update" ON public.orders FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "payments_select" ON public.payments;
CREATE POLICY "payments_select" ON public.payments FOR SELECT TO authenticated USING (public.is_staff());
DROP POLICY IF EXISTS "payments_insert" ON public.payments;
CREATE POLICY "payments_insert" ON public.payments FOR INSERT TO authenticated WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "documents_select" ON public.documents;
CREATE POLICY "documents_select" ON public.documents FOR SELECT TO authenticated USING (public.is_staff());
DROP POLICY IF EXISTS "documents_insert" ON public.documents;
CREATE POLICY "documents_insert" ON public.documents FOR INSERT TO authenticated WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "documents_update" ON public.documents;
CREATE POLICY "documents_update" ON public.documents FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
CREATE POLICY "tasks_select" ON public.tasks FOR SELECT TO authenticated USING (public.is_staff());
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT TO authenticated WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "comments_select" ON public.comments;
CREATE POLICY "comments_select" ON public.comments FOR SELECT TO authenticated USING (public.is_staff());
DROP POLICY IF EXISTS "comments_insert" ON public.comments;
CREATE POLICY "comments_insert" ON public.comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND public.is_staff());

DROP POLICY IF EXISTS "activities_select" ON public.activities;
CREATE POLICY "activities_select" ON public.activities FOR SELECT TO authenticated USING (public.is_staff());
DROP POLICY IF EXISTS "activities_insert" ON public.activities;
CREATE POLICY "activities_insert" ON public.activities FOR INSERT TO authenticated WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "pricing_rules_select" ON public.pricing_rules;
CREATE POLICY "pricing_rules_select" ON public.pricing_rules FOR SELECT TO authenticated USING (public.is_staff());