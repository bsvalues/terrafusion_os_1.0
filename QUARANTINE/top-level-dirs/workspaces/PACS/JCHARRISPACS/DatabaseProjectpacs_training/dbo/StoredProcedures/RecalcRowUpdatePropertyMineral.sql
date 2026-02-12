

create procedure RecalcRowUpdatePropertyMineral
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,

	@assessed_val numeric(14,0),
	@shared_prop_val numeric(14,0),
	@shared_value numeric(14,0),

	@bUpdate_SharedOtherValue bit,
	@shared_other_val numeric(14,2),

	@recalc_flag char(1),
	@bMarkInactive bit,
	
	@cycle int,
	@dor_value numeric(14,0)
	
as

set nocount on

	update property_val with(rowlock)
	set
		land_hstd_val = 0,
		land_non_hstd_val = 0,
		imprv_hstd_val = 0,
		imprv_non_hstd_val = 0,

		ag_market = 0,
		ag_use_val = 0,
		ag_loss = 0,

		timber_market = 0,
		timber_use = 0,
		timber_loss = 0,

		ten_percent_cap = 0,

		shared_prop_val = @shared_prop_val,
		shared_value = @shared_value,

		cost_value = isnull(@assessed_val, 0),
		income_value = isnull(@assessed_val, 0),

		shared_other_val =
			case @bUpdate_SharedOtherValue
				when 1 then @shared_other_val
				else shared_other_val
			end
		,
		appraised_val =
			case @bUpdate_SharedOtherValue
				when 1 then @shared_other_val
				else isnull(@assessed_val, 0)
			end
		,
		assessed_val =
			case @bUpdate_SharedOtherValue
				when 1 then @shared_other_val
				else isnull(@assessed_val, 0)
			end
		,
		market =
			case @bUpdate_SharedOtherValue
				when 1 then @shared_other_val
				else isnull(@assessed_val, 0)
			end
		,

		recalc_dt = getdate(),
		recalc_flag = @recalc_flag,
		prop_inactive_dt = case
			when @bMarkInactive = 1 and prop_inactive_dt is null
			then getdate()
			else prop_inactive_dt
		end,
		
		cycle = @cycle,
		dor_value = @dor_value

	where
		prop_id = @lPropID and
		prop_val_yr = @lYear and
		sup_num = @lSupNum

GO

