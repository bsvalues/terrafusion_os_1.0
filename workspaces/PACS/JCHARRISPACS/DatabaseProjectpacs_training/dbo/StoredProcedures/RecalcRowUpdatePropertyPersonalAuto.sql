

create procedure RecalcRowUpdatePropertyPersonalAuto
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,

	@shared_prop_val numeric(14,0),
	@shared_value numeric(14,0),

	@appraised_val numeric(14,0),
	@market numeric(14,0),
	@assessed_val numeric(14,0),

	@cost_value numeric(14,0),
	@income_value numeric(14,0),
	@arb_market numeric(14,0),
	@dist_market numeric(14,0),

	@bUpdate_SharedOtherValue bit,
	@shared_other_val numeric(14,2),

	@bUpdate_NewValuePersonal bit,
	@new_val_p numeric(14,0),

	@bUpdate_TenPercentCap bit,
	@ten_percent_cap numeric(14,0),

	@recalc_flag char(1),
	@bMarkInactive bit,
	
	@pp_farm numeric(14,0),
	@pp_non_farm numeric(14,0),
	
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

		shared_prop_val = @shared_prop_val,
		shared_value = @shared_value,

		appraised_val = @appraised_val,
		market = @market,
		assessed_val = @assessed_val,

		cost_value = @cost_value,
		income_value = @income_value,
		arb_market = @arb_market,
		dist_market = @dist_market,

		shared_other_val =
			case @bUpdate_SharedOtherValue
				when 1 then @shared_other_val
				else shared_other_val
			end
		,
		new_val_p =
			case @bUpdate_NewValuePersonal
				when 1 then @new_val_p
				else new_val_p
			end
		,
		ten_percent_cap =
			case @bUpdate_TenPercentCap
				when 1 then @ten_percent_cap
				else ten_percent_cap
			end
		,

		recalc_dt = getdate(),
		recalc_flag = @recalc_flag,
		prop_inactive_dt = case
			when @bMarkInactive = 1 and prop_inactive_dt is null
			then getdate()
			else prop_inactive_dt
		end,

		pp_farm = @pp_farm,
		pp_non_farm = @pp_non_farm,
		
		cycle = @cycle,
		dor_value = @dor_value
		
	where
		prop_id = @lPropID and
		prop_val_yr = @lYear and
		sup_num = @lSupNum

GO

