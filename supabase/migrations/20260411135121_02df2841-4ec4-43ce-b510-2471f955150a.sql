
-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  program TEXT NOT NULL DEFAULT '',
  year_of_study INTEGER NOT NULL DEFAULT 1,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. USER ROLES TABLE
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 3. STUDY GROUPS TABLE
-- ============================================
CREATE TABLE public.study_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  meeting_location TEXT NOT NULL DEFAULT '',
  faculty TEXT NOT NULL DEFAULT '',
  leader_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view groups"
  ON public.study_groups FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create groups"
  ON public.study_groups FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = leader_id);

CREATE POLICY "Leaders can update their groups"
  ON public.study_groups FOR UPDATE TO authenticated
  USING (auth.uid() = leader_id);

CREATE POLICY "Leaders can delete their groups"
  ON public.study_groups FOR DELETE TO authenticated
  USING (auth.uid() = leader_id);

CREATE TRIGGER update_study_groups_updated_at
  BEFORE UPDATE ON public.study_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 4. GROUP MEMBERS TABLE
-- ============================================
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view group members"
  ON public.group_members FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON public.group_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Leaders can remove members"
  ON public.group_members FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.study_groups
      WHERE id = group_id AND leader_id = auth.uid()
    )
  );

-- ============================================
-- 5. STUDY SESSIONS TABLE
-- ============================================
CREATE TABLE public.study_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE NOT NULL,
  session_date DATE NOT NULL,
  session_time TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sessions"
  ON public.study_sessions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Group leaders can create sessions"
  ON public.study_sessions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.study_groups
      WHERE id = group_id AND leader_id = auth.uid()
    )
  );

CREATE POLICY "Group leaders can update sessions"
  ON public.study_sessions FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.study_groups
      WHERE id = group_id AND leader_id = auth.uid()
    )
  );

CREATE POLICY "Group leaders can delete sessions"
  ON public.study_sessions FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.study_groups
      WHERE id = group_id AND leader_id = auth.uid()
    )
  );

-- ============================================
-- 6. GROUP POSTS TABLE
-- ============================================
CREATE TABLE public.group_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'general' CHECK (post_type IN ('announcement', 'question', 'general')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view posts"
  ON public.group_posts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Group members can create posts"
  ON public.group_posts FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_posts.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can delete their own posts"
  ON public.group_posts FOR DELETE TO authenticated
  USING (auth.uid() = author_id);
