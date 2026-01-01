-- Drop existing purchase policy
DROP POLICY IF EXISTS "Anyone can purchase available vouchers" ON public.vouchers;

-- Create updated policy that allows setting all purchase-related fields
CREATE POLICY "Anyone can purchase available vouchers" 
ON public.vouchers 
FOR UPDATE 
USING ((status = 'active'::voucher_status) AND (is_sold = false))
WITH CHECK (
  (is_sold = true) AND 
  (status = 'sold'::voucher_status)
);