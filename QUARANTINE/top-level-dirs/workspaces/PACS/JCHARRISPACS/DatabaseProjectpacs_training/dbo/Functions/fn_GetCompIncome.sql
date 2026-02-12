/* RK 3/30/05 added check to only do this if valuation method = income approach per Os */
/* RK 4/06/05 changed that income valuation method must be set to use income module values per Os */
/* RK 4/06/05 return active income valuation or the oldest income valuation per Roy */

create function fn_GetCompIncome (
@prop_id	int,
@prop_val_yr	numeric(4),
@sup_num	int)

returns int

AS

BEGIN


declare @income_id	int
--declare @appr_method	char(5)

set @income_id = 0
--set @appr_method = ''

--select top 1 @appr_method = rtrim(appr_method)
--from property_val 
--where prop_id = @prop_id
--and   sup_num = @sup_num
--and   prop_val_yr = @prop_val_yr

--if (@appr_method = 'I')
--begin

	select top 1 @income_id = income_id
	From income_prop_vw
	where prop_id = @prop_id
	and   sup_num = @sup_num
	and   prop_val_yr = @prop_val_yr
	and   active_valuation = 'T'

	if (@@ROWCOUNT = 0)
	begin

		select @income_id = min(income_id)
		from income_prop_vw
		where prop_id = @prop_id
		and   sup_num = @sup_num
		and   prop_val_yr = @prop_val_yr
	end
--end

return (@income_id)

end

GO

