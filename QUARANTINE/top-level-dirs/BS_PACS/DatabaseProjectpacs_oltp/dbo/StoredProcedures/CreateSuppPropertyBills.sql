





CREATE PROCEDURE CreateSuppPropertyBills
   @input_prop_id	int,
   @input_sup_num	int,
   @input_year		numeric(4),
   @input_user_id 	int,
   @input_batch_id	int
AS

declare @input_sup_group	int
declare @tax_year    		numeric(4)

select @tax_year = tax_yr from pacs_system

if (@input_year <= @tax_year)
begin

	select @input_sup_group = sup_group_id
	from supplement
	where sup_num    = @input_sup_num
	and   sup_tax_yr = @input_year

	exec CreateSuppBills @input_year, @input_sup_num, @input_user_id, @input_sup_group, @input_batch_id, @input_prop_id

end

update property_val
set accept_create_id = @input_user_id,
      accept_create_dt = GetDate()
where prop_id = @input_prop_id
and    sup_num = @input_sup_num
and    prop_val_yr = @input_year

GO

