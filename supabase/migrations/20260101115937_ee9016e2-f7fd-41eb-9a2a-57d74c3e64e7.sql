-- Fix UPDATE policy interaction: make admin UPDATE policy permissive so it doesn't block public purchase updates
DROP POLICY IF EXISTS "Admins can update vouchers" ON public.vouchers;

CREATE POLICY "Admins can update vouchers"
ON public.vouchers
AS PERMISSIVE
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));