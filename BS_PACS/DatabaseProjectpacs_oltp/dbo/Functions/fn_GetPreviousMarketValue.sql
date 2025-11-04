

create  FUNCTION fn_GetPreviousMarketValue ( @input_prop_id int, @input_yr int, @input_sup_num int )
RETURNS numeric(14,0)
AS
BEGIN
	declare @market	numeric(14,0) 

	set @market = 0

	select @market = isnull(pv.market, 0)
	from property_val pv with (nolock),
		prop_supp_assoc psa with (nolock)
	where pv.prop_id = psa.prop_id
		and pv.sup_num = psa.sup_num
		and pv.prop_val_yr = psa.owner_tax_yr
		and psa.owner_tax_yr = (@input_yr - 1)
		and psa.prop_id = @input_prop_id
		and pv.prop_inactive_dt is null

	return (@market)
END

GO

