
CREATE TABLE public.site_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  suggestion TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  emailed BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.site_suggestions ENABLE ROW LEVEL SECURITY;

-- Anyone (anon) can submit a suggestion
CREATE POLICY "Anyone can submit suggestions"
  ON public.site_suggestions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(name) BETWEEN 1 AND 200
    AND char_length(email) BETWEEN 3 AND 320
    AND char_length(suggestion) BETWEEN 1 AND 5000
  );

-- No SELECT/UPDATE/DELETE policies = nobody can read via RLS (only service role)
