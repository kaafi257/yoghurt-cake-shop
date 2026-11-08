-- Yoghurt & Cake Shop complete database setup
-- Run this entire script in Supabase Dashboard -> SQL Editor -> New query -> Run

-- 1. Create Role Enum
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'manager', 'employee');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create Sales Table
CREATE TABLE IF NOT EXISTS public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('yoghurt', 'cake')),
  item text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  total numeric(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  payment_method text NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'mobile', 'card')),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Create Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('ingredients', 'packaging', 'rent', 'utilities', 'wages', 'other')),
  description text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'mobile', 'card')),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Create Audit Log Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor uuid DEFAULT auth.uid(),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Helper Functions
CREATE OR REPLACE FUNCTION current_role_name() RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM profiles WHERE id = auth.uid() AND active;
$$;

CREATE OR REPLACE FUNCTION is_active_staff() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND active);
$$;

CREATE OR REPLACE FUNCTION log_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO audit_logs (actor, action, table_name, record_id, details)
  VALUES (
    auth.uid(), TG_OP, TG_TABLE_NAME,
    COALESCE((CASE WHEN TG_OP = 'DELETE' THEN old.id ELSE new.id END)::text, ''),
    to_jsonb(CASE WHEN TG_OP = 'DELETE' THEN old ELSE new END)
  );
  RETURN COALESCE(new, old);
END $$;

-- 7. Audit Triggers
DROP TRIGGER IF EXISTS audit_sales ON public.sales;
CREATE TRIGGER audit_sales AFTER INSERT OR UPDATE OR DELETE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION log_audit();

DROP TRIGGER IF EXISTS audit_expenses ON public.expenses;
CREATE TRIGGER audit_expenses AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION log_audit();

DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION log_audit();

-- Ensure email column exists on profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 8. Row Level Security Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles read own" ON public.profiles;
DROP POLICY IF EXISTS "profiles owner read all" ON public.profiles;
DROP POLICY IF EXISTS "profiles staff read all" ON public.profiles;
CREATE POLICY "profiles staff read all" ON public.profiles FOR SELECT USING (is_active_staff() OR id = auth.uid());

DROP POLICY IF EXISTS "profiles owner update" ON public.profiles;
CREATE POLICY "profiles owner update" ON public.profiles FOR UPDATE USING (current_role_name() = 'owner');

DROP POLICY IF EXISTS "profiles insert own" ON public.profiles;
DROP POLICY IF EXISTS "profiles insert policy" ON public.profiles;
CREATE POLICY "profiles insert policy" ON public.profiles FOR INSERT WITH CHECK (
  id = auth.uid() OR current_role_name() = 'owner'
);

DROP POLICY IF EXISTS "profiles owner delete" ON public.profiles;
CREATE POLICY "profiles owner delete" ON public.profiles FOR DELETE USING (current_role_name() = 'owner');

DROP POLICY IF EXISTS "sales insert" ON public.sales;
CREATE POLICY "sales insert" ON public.sales FOR INSERT WITH CHECK (is_active_staff() AND created_by = auth.uid());

DROP POLICY IF EXISTS "sales select" ON public.sales;
CREATE POLICY "sales select" ON public.sales FOR SELECT USING (
  current_role_name() IN ('owner', 'manager')
  OR (current_role_name() = 'employee' AND created_by = auth.uid())
);

DROP POLICY IF EXISTS "sales owner modify" ON public.sales;
DROP POLICY IF EXISTS "sales staff modify" ON public.sales;
CREATE POLICY "sales staff modify" ON public.sales FOR UPDATE USING (
  current_role_name() IN ('owner', 'manager')
  OR (current_role_name() = 'employee' AND created_by = auth.uid())
);

DROP POLICY IF EXISTS "sales owner delete" ON public.sales;
DROP POLICY IF EXISTS "sales staff delete" ON public.sales;
CREATE POLICY "sales staff delete" ON public.sales FOR DELETE USING (
  current_role_name() IN ('owner', 'manager')
  OR (current_role_name() = 'employee' AND created_by = auth.uid())
);

DROP POLICY IF EXISTS "expenses insert" ON public.expenses;
CREATE POLICY "expenses insert" ON public.expenses FOR INSERT WITH CHECK (is_active_staff() AND created_by = auth.uid());

DROP POLICY IF EXISTS "expenses select" ON public.expenses;
CREATE POLICY "expenses select" ON public.expenses FOR SELECT USING (
  current_role_name() IN ('owner', 'manager')
  OR (current_role_name() = 'employee' AND created_by = auth.uid())
);

DROP POLICY IF EXISTS "expenses owner modify" ON public.expenses;
DROP POLICY IF EXISTS "expenses staff modify" ON public.expenses;
CREATE POLICY "expenses staff modify" ON public.expenses FOR UPDATE USING (
  current_role_name() IN ('owner', 'manager')
  OR (current_role_name() = 'employee' AND created_by = auth.uid())
);

DROP POLICY IF EXISTS "expenses owner delete" ON public.expenses;
DROP POLICY IF EXISTS "expenses staff delete" ON public.expenses;
CREATE POLICY "expenses staff delete" ON public.expenses FOR DELETE USING (
  current_role_name() IN ('owner', 'manager')
  OR (current_role_name() = 'employee' AND created_by = auth.uid())
);

DROP POLICY IF EXISTS "audit owner read" ON public.audit_logs;
CREATE POLICY "audit owner read" ON public.audit_logs FOR SELECT USING (current_role_name() = 'owner');

-- 9. Automatic Profile Creation Trigger for Newly Registered Staff
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  assigned_role public.user_role;
  parsed_role text;
BEGIN
  parsed_role := lower(COALESCE(new.raw_user_meta_data->>'role', 'employee'));
  IF parsed_role = 'owner' THEN
    assigned_role := 'owner'::public.user_role;
  ELSIF parsed_role = 'manager' THEN
    assigned_role := 'manager'::public.user_role;
  ELSE
    assigned_role := 'employee'::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, full_name, role, active, email)
  VALUES (
    new.id,
    COALESCE(NULLIF(TRIM(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
    assigned_role,
    true,
    new.email
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    email = EXCLUDED.email,
    active = true;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Automatically assign owner role when owner registers with auth.users
INSERT INTO public.profiles (id, full_name, role, active, email)
SELECT id, 'Owner (Kaafie)', 'owner'::user_role, true, email
FROM auth.users
WHERE email = 'kaafiebirr95@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'owner', active = true, email = EXCLUDED.email;


