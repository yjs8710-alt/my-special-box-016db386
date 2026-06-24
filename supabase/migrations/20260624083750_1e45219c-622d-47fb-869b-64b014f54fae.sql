CREATE POLICY "Members can view own inquiries"
ON public.guest_inquiries
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Members can delete own inquiries"
ON public.guest_inquiries
FOR DELETE
TO authenticated
USING (user_id = auth.uid());