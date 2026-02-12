













CREATE PROCEDURE DeleteBills
   @input_tax_yr        int,
   @input_sup_num       int,
   @input_entity_id     int
 
AS

if (@input_sup_num <> 0)
begin
	delete from bill
	where sup_tax_yr = @input_tax_yr
	and   sup_num    = @input_sup_num
	and   entity_id  = @input_entity_id
end
else
begin
	delete from bill
	where sup_tax_yr = @input_tax_yr
	and   bill_type   = 'L'
	and   entity_id  = @input_entity_id
end

if (@input_sup_num = 0)
begin
	update tax_rate
	set bills_created_dt = NULL
	where entity_id = @input_entity_id
	and      tax_rate_yr = @input_tax_yr
end

GO

