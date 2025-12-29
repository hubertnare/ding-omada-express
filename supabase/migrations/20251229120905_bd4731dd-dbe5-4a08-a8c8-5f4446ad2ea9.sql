-- Add policy for public to view available (active, unsold) vouchers
CREATE POLICY "Anyone can view available vouchers" 
ON public.vouchers 
FOR SELECT 
USING (status = 'active' AND is_sold = false);

-- Add policy for public to update vouchers when purchasing (mark as sold)
CREATE POLICY "Anyone can purchase available vouchers" 
ON public.vouchers 
FOR UPDATE 
USING (status = 'active' AND is_sold = false)
WITH CHECK (is_sold = true AND status = 'sold');