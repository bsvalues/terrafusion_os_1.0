
create procedure SalesCaptureInformation
	@input_sale_id int
as

set nocount on

exec SetMachineLogChanges 0

declare @prop_id	int
declare @sup_num	int
declare @sup_tax_yr	numeric(4)

DECLARE property CURSOR FAST_FORWARD
FOR select coopa.prop_id,
	   psa.sup_num,
	   coopa.sup_tax_yr
    from chg_of_owner_prop_assoc as coopa
    with (nolock)
    join prop_supp_assoc as psa
    with (nolock)
    on coopa.sup_tax_yr = psa.owner_tax_yr
    and coopa.prop_id = psa.prop_id
    where coopa.chg_of_owner_id = @input_sale_id

open property
fetch next from property into @prop_id, @sup_num, @sup_tax_yr

while (@@FETCH_STATUS = 0)
begin
	exec CopyLand @prop_id, @sup_num, @sup_tax_yr, 0,
		      @prop_id, @sup_num, @sup_tax_yr, @input_sale_id

	exec CopyImprovement @prop_id, @sup_num, @sup_tax_yr, 0,
		      	     @prop_id, @sup_num, @sup_tax_yr, @input_sale_id

	fetch next from property into @prop_id, @sup_num, @sup_tax_yr
end

close 	   property
deallocate property

exec SetMachineLogChanges 1

exec ImportSalesInformation @input_sale_id, 'T'

GO

