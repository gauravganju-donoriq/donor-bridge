-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'readonly');
CREATE TYPE public.eligibility_status AS ENUM ('eligible', 'ineligible', 'pending_review');
CREATE TYPE public.submission_status AS ENUM ('pending', 'approved', 'rejected', 'linked_to_donor');
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE public.sex_type AS ENUM ('male', 'female');

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create donors table
CREATE TABLE public.donors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_initial TEXT,
  chosen_name TEXT,
  birth_date DATE NOT NULL,
  assigned_sex sex_type NOT NULL,
  pronouns TEXT,
  ethnicity TEXT,
  height_inches INTEGER,
  weight_pounds INTEGER,
  bmi DECIMAL(5,2),
  cell_phone TEXT,
  home_phone TEXT,
  work_phone TEXT,
  email TEXT,
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  alcohol_use BOOLEAN DEFAULT false,
  tobacco_use BOOLEAN DEFAULT false,
  cmv_positive TEXT DEFAULT 'unknown',
  social_security_encrypted TEXT,
  eligibility_status eligibility_status DEFAULT 'pending_review',
  ineligibility_reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create webform_submissions table
CREATE TABLE public.webform_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id TEXT UNIQUE NOT NULL,
  status submission_status DEFAULT 'pending',
  linked_donor_id UUID REFERENCES public.donors(id),
  reviewer_id UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_notes TEXT,
  -- Form fields from PreScreenForm
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  street_address TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  birth_date DATE,
  assigned_sex TEXT,
  height_feet INTEGER,
  height_inches INTEGER,
  weight INTEGER,
  ethnicity TEXT[],
  has_chronic_illness BOOLEAN,
  chronic_illness_details TEXT,
  takes_medications BOOLEAN,
  medication_details TEXT,
  had_surgery BOOLEAN,
  surgery_details TEXT,
  has_tattoos_piercings BOOLEAN,
  tattoo_piercing_details TEXT,
  has_been_pregnant BOOLEAN,
  pregnancy_details TEXT,
  has_blood_disorder BOOLEAN,
  blood_disorder_details TEXT,
  has_received_transfusion BOOLEAN,
  transfusion_details TEXT,
  has_been_incarcerated BOOLEAN,
  incarceration_details TEXT,
  has_traveled_internationally BOOLEAN,
  travel_details TEXT,
  acknowledge_info_accurate BOOLEAN,
  acknowledge_health_screening BOOLEAN,
  acknowledge_time_commitment BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID REFERENCES public.donors(id) ON DELETE CASCADE NOT NULL,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  appointment_type TEXT,
  status appointment_status DEFAULT 'scheduled',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create activity_logs table
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sequence for donor IDs
CREATE SEQUENCE public.donor_id_seq START 1;

-- Create sequence for submission IDs
CREATE SEQUENCE public.submission_id_seq START 1;

-- Function to generate donor ID
CREATE OR REPLACE FUNCTION public.generate_donor_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.donor_id := 'D-' || LPAD(nextval('public.donor_id_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate submission ID
CREATE OR REPLACE FUNCTION public.generate_submission_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.submission_id := 'WF-' || LPAD(nextval('public.submission_id_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for donor ID generation
CREATE TRIGGER set_donor_id
  BEFORE INSERT ON public.donors
  FOR EACH ROW
  WHEN (NEW.donor_id IS NULL)
  EXECUTE FUNCTION public.generate_donor_id();

-- Trigger for submission ID generation
CREATE TRIGGER set_submission_id
  BEFORE INSERT ON public.webform_submissions
  FOR EACH ROW
  WHEN (NEW.submission_id IS NULL)
  EXECUTE FUNCTION public.generate_submission_id();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update triggers for timestamp columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_donors_updated_at
  BEFORE UPDATE ON public.donors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Security definer function for role checking (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user has any admin role (admin or staff)
CREATE OR REPLACE FUNCTION public.is_admin_or_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'staff')
  )
$$;

-- Handle new user signup - create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webform_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins and staff can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for donors
CREATE POLICY "Admins and staff can view all donors"
  ON public.donors FOR SELECT
  USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins and staff can insert donors"
  ON public.donors FOR INSERT
  WITH CHECK (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins and staff can update donors"
  ON public.donors FOR UPDATE
  USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins can delete donors"
  ON public.donors FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for webform_submissions
CREATE POLICY "Anyone can submit webform"
  ON public.webform_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins and staff can view submissions"
  ON public.webform_submissions FOR SELECT
  USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins and staff can update submissions"
  ON public.webform_submissions FOR UPDATE
  USING (public.is_admin_or_staff(auth.uid()));

-- RLS Policies for appointments
CREATE POLICY "Admins and staff can view all appointments"
  ON public.appointments FOR SELECT
  USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins and staff can insert appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins and staff can update appointments"
  ON public.appointments FOR UPDATE
  USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins can delete appointments"
  ON public.appointments FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for activity_logs
CREATE POLICY "Admins and staff can view all logs"
  ON public.activity_logs FOR SELECT
  USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admins and staff can insert logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (public.is_admin_or_staff(auth.uid()));