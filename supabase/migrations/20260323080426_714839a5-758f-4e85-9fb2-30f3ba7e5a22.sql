CREATE TABLE public.public_record_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id TEXT NOT NULL,
  building_main_purpose TEXT,
  building_total_area TEXT,
  building_floors TEXT,
  building_approval_date TEXT,
  land_category TEXT,
  land_area TEXT,
  land_use_zone TEXT,
  land_address TEXT,
  building_register_url TEXT,
  land_register_url TEXT,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.public_record_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public_record_summary"
  ON public.public_record_summary
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can do everything on public_record_summary"
  ON public.public_record_summary
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_public_record_summary_updated_at
  BEFORE UPDATE ON public.public_record_summary
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_public_record_summary_property_id ON public.public_record_summary (property_id);