

create  FUNCTION fn_GetCertifiedMarket ( @input_prop_id int, @input_yr int )
RETURNS numeric(14,0)
AS
BEGIN
	declare @market	numeric(14,0) 

	set @market = 0

	select @market = pv.market
	from property_val pv
	where prop_id = @input_prop_id
	and   prop_val_yr = @input_yr
	and   sup_num = 0
	and   prop_inactive_dt is null

	return (@market)
END

GO

