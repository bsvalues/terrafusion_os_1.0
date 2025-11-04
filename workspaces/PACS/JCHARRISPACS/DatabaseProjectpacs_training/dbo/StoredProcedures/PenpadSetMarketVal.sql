

create procedure PenpadSetMarketVal
	@lRunID int,
	@bCheckIn bit
as

set nocount on

	declare @lYear numeric(4,0)
	exec GetApprYear @lYear output

	if ( @bCheckIn = 1 )
	begin
		update penpad_checkout set
			penpad_checkout.market_val_check_in = property_val.market
		from penpad_checkout
		join prop_supp_assoc on
			penpad_checkout.prop_id = prop_supp_assoc.prop_id and
			prop_supp_assoc.owner_tax_yr = @lYear
		join property_val on
			penpad_checkout.prop_id = property_val.prop_id and
			property_val.prop_val_yr = @lYear and
			prop_supp_assoc.sup_num = property_val.sup_num
		where
			penpad_checkout.run_id = @lRunID

		/* Mark the run as having been recalculated */
		update penpad_run set
			recalc_flag = 'T'
		where
			run_id = @lRunID
	end
	else
	begin
		update penpad_checkout set
			penpad_checkout.market_val_check_out = property_val.market
		from penpad_checkout
		join prop_supp_assoc on
			penpad_checkout.prop_id = prop_supp_assoc.prop_id and
			prop_supp_assoc.owner_tax_yr = @lYear
		join property_val on
			penpad_checkout.prop_id = property_val.prop_id and
			property_val.prop_val_yr = @lYear and
			prop_supp_assoc.sup_num = property_val.sup_num
		where
			penpad_checkout.run_id = @lRunID
	end

set nocount off

GO

