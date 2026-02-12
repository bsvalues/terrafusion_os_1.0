

create procedure RecalcRowUpdatePropertyRealMobile
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,

	@appraised_val numeric(14,0),
	@market numeric(14,0),
	@bUpdate_AssessedVal bit,
	@assessed_val numeric(14,0),

	@imprv_hstd_val numeric(14,0),
	@imprv_non_hstd_val numeric(14,0),
	@land_hstd_val numeric(14,0),
	@land_non_hstd_val numeric(14,0),
	@ag_use_val numeric(14,0),
	@ag_market numeric(14,0),
	@ag_loss numeric(14,0),
	@timber_use numeric(14,0),
	@timber_market numeric(14,0),
	@timber_loss numeric(14,0),

	@cost_value numeric(14,0),
	@income_value numeric(14,0),
	@shared_value numeric(14,0),
	@arb_market numeric(14,0),
	@dist_market numeric(14,0),
	@mktappr_market numeric(14,0),

	@appr_method char(1),

	@cost_imprv_hstd_val numeric(14,0),
	@cost_imprv_non_hstd_val numeric(14,0),
	@cost_land_hstd_val numeric(14,0),
	@cost_land_non_hstd_val numeric(14,0),
	@cost_ag_use_val numeric(14,0),
	@cost_ag_market numeric(14,0),
	@cost_ag_loss numeric(14,0),
	@cost_timber_use numeric(14,0),
	@cost_timber_market numeric(14,0),
	@cost_timber_loss numeric(14,0),

	@income_imprv_hstd_val numeric(14,0),
	@income_imprv_non_hstd_val numeric(14,0),
	@income_land_hstd_val numeric(14,0),
	@income_land_non_hstd_val numeric(14,0),
	@income_ag_use_val numeric(14,0),
	@income_ag_market numeric(14,0),
	@income_ag_loss numeric(14,0),
	@income_timber_use numeric(14,0),
	@income_timber_market numeric(14,0),
	@income_timber_loss numeric(14,0),

	@shared_imprv_hstd_val numeric(14,0),
	@shared_imprv_non_hstd_val numeric(14,0),
	@shared_land_hstd_val numeric(14,0),
	@shared_land_non_hstd_val numeric(14,0),
	@shared_ag_use_val numeric(14,0),
	@shared_ag_market numeric(14,0),
	@shared_ag_loss numeric(14,0),
	@shared_timber_use numeric(14,0),
	@shared_timber_market numeric(14,0),
	@shared_timber_loss numeric(14,0),

	@arb_imprv_hstd_val numeric(14,0),
	@arb_imprv_non_hstd_val numeric(14,0),
	@arb_land_hstd_val numeric(14,0),
	@arb_land_non_hstd_val numeric(14,0),
	@arb_ag_use_val numeric(14,0),
	@arb_ag_market numeric(14,0),
	@arb_timber_use numeric(14,0),
	@arb_timber_market numeric(14,0),

	@dist_imprv_hstd_val numeric(14,0),
	@dist_imprv_non_hstd_val numeric(14,0),
	@dist_land_hstd_val numeric(14,0),
	@dist_land_non_hstd_val numeric(14,0),
	@dist_ag_use_val numeric(14,0),
	@dist_ag_market numeric(14,0),
	@dist_timber_use numeric(14,0),
	@dist_timber_market numeric(14,0),

	@bUpdate_SharedOtherValue bit,
	@shared_other_val numeric(14,2),

	@ag_late_loss numeric(14,0),

	@new_val_hs numeric(14,0),
	@new_val_nhs numeric(14,0),

	@shared_prop_val numeric(14,0),

	@bUpdate_TenPercentCap bit,
	@ten_percent_cap numeric(14,0),

	@bUpdate_HSCapQualifyYear bit,
	@hscap_qualify_yr numeric(4,0),

	@bUpdate_HSCapBaseYear bit,
	@hscap_base_yr numeric(4,0),

	@bUpdate_HSCapPrevHsVal bit,
	@hscap_prevhsval numeric(14,0),

	@bUpdate_HSCapNewHsVal bit,
	@hscap_newhsval numeric(14,0),

	@bUpdate_HSCapOverridePrevHsVal bit,
	@hscap_override_prevhsval_flag char(1),

	@bUpdate_HSCapPrevHsVal_PacsUserID bit,
	@hscap_prevhsval_pacsuser numeric(14,0),

	@bUpdate_HSCapPrevHsVal_Comment bit,
	@hscap_prevhsval_comment varchar(128),

	@bUpdate_HSCapPrevHsVal_Date bit,

	@recalc_flag char(1),
	@timber_78 numeric(14,0),
	@bMarkInactive bit,
	@cycle int,
	
	@ag_hs_use_val numeric(14,0),
	@ag_hs_mkt_val numeric(14,0),
	@ag_hs_loss numeric(14,0),
	@timber_hs_use_val numeric(14,0),
	@timber_hs_mkt_val numeric(14,0),
	@timber_hs_loss numeric(14,0),
	@cost_ag_hs_use_val numeric(14,0),
	@cost_ag_hs_mkt_val numeric(14,0),
	@cost_ag_hs_loss numeric(14,0),
	@cost_timber_hs_use_val numeric(14,0),
	@cost_timber_hs_mkt_val numeric(14,0),
	@cost_timber_hs_loss numeric(14,0),
	@shared_ag_hs_use_val numeric(14,0),
	@shared_ag_hs_mkt_val numeric(14,0),
	@shared_ag_hs_loss numeric(14,0),
	@shared_timber_hs_use_val numeric(14,0),
	@shared_timber_hs_mkt_val numeric(14,0),
	@shared_timber_hs_loss numeric(14,0),
	@arb_ag_hs_use_val numeric(14,0),
	@arb_ag_hs_mkt_val numeric(14,0),
	@arb_ag_hs_loss numeric(14,0),
	@arb_timber_hs_use_val numeric(14,0),
	@arb_timber_hs_mkt_val numeric(14,0),
	@arb_timber_hs_loss numeric(14,0),
	@dist_ag_hs_use_val numeric(14,0),
	@dist_ag_hs_mkt_val numeric(14,0),
	@dist_ag_hs_loss numeric(14,0),
	@dist_timber_hs_use_val numeric(14,0),
	@dist_timber_hs_mkt_val numeric(14,0),
	@dist_timber_hs_loss numeric(14,0),
	@new_val_imprv_hs numeric(14,0),
	@new_val_imprv_nhs numeric(14,0),
	@new_val_land_hs numeric(14,0),
	@new_val_land_nhs numeric(14,0),
	@remodel_val_curr_yr numeric(14,0),
	@non_taxed_mkt_val numeric(14,0),
	@dor_value numeric(14,0),

	@mktappr_imprv_hstd_val numeric(14,0),
	@mktappr_imprv_non_hstd_val numeric(14,0),
	@mktappr_land_hstd_val numeric(14,0),
	@mktappr_land_non_hstd_val numeric(14,0),
	@mktappr_ag_use_val numeric(14,0),
	@mktappr_ag_market numeric(14,0),
	@mktappr_ag_loss numeric(14,0),
	@mktappr_timber_use numeric(14,0),
	@mktappr_timber_market numeric(14,0),
	@mktappr_timber_loss numeric(14,0),
	@mktappr_ag_hs_use_val numeric(14,0),
	@mktappr_ag_hs_mkt_val numeric(14,0),
	@mktappr_ag_hs_loss numeric(14,0),
	@mktappr_timber_hs_use_val numeric(14,0),
	@mktappr_timber_hs_mkt_val numeric(14,0),
	@mktappr_timber_hs_loss numeric(14,0)

as

set nocount on

	update property_val with(rowlock)
	set
		appraised_val = @appraised_val,
		market = @market,
		assessed_val =
			case @bUpdate_AssessedVal
				when 1 then @assessed_val
				else assessed_val
			end
		,

		imprv_hstd_val = @imprv_hstd_val,
		imprv_non_hstd_val = @imprv_non_hstd_val,
		land_hstd_val = @land_hstd_val,
		land_non_hstd_val = @land_non_hstd_val,
		ag_use_val = @ag_use_val,
		ag_market = @ag_market,
		ag_loss = @ag_loss,
		timber_use = @timber_use,
		timber_market = @timber_market,
		timber_loss = @timber_loss,

		cost_value = @cost_value,
		income_value = @income_value,
		shared_value = @shared_value,
		arb_market = @arb_market,
		dist_market = @dist_market,
		mktappr_market = @mktappr_market,

		appr_method = @appr_method,

		cost_imprv_hstd_val = @cost_imprv_hstd_val,
		cost_imprv_non_hstd_val = @cost_imprv_non_hstd_val,
		cost_land_hstd_val = @cost_land_hstd_val,
		cost_land_non_hstd_val = @cost_land_non_hstd_val,
		cost_ag_use_val = @cost_ag_use_val,
		cost_ag_market = @cost_ag_market,
		cost_ag_loss = @cost_ag_loss,
		cost_timber_use = @cost_timber_use,
		cost_timber_market = @cost_timber_market,
		cost_timber_loss = @cost_timber_loss,

		income_imprv_hstd_val = @income_imprv_hstd_val,
		income_imprv_non_hstd_val = @income_imprv_non_hstd_val,
		income_land_hstd_val = @income_land_hstd_val,
		income_land_non_hstd_val = @income_land_non_hstd_val,
		income_ag_use_val = @income_ag_use_val,
		income_ag_market = @income_ag_market,
		income_ag_loss = @income_ag_loss,
		income_timber_use = @income_timber_use,
		income_timber_market = @income_timber_market,
		income_timber_loss = @income_timber_loss,

		shared_imprv_hstd_val = @shared_imprv_hstd_val,
		shared_imprv_non_hstd_val = @shared_imprv_non_hstd_val,
		shared_land_hstd_val = @shared_land_hstd_val,
		shared_land_non_hstd_val = @shared_land_non_hstd_val,
		shared_ag_use_val = @shared_ag_use_val,
		shared_ag_market = @shared_ag_market,
		shared_ag_loss = @shared_ag_loss,
		shared_timber_use = @shared_timber_use,
		shared_timber_market = @shared_timber_market,
		shared_timber_loss = @shared_timber_loss,

		arb_imprv_hstd_val = @arb_imprv_hstd_val,
		arb_imprv_non_hstd_val = @arb_imprv_non_hstd_val,
		arb_land_hstd_val = @arb_land_hstd_val,
		arb_land_non_hstd_val = @arb_land_non_hstd_val,
		arb_ag_use_val = @arb_ag_use_val,
		arb_ag_market = @arb_ag_market,
		arb_timber_use = @arb_timber_use,
		arb_timber_market = @arb_timber_market,

		dist_imprv_hstd_val = @dist_imprv_hstd_val,
		dist_imprv_non_hstd_val = @dist_imprv_non_hstd_val,
		dist_land_hstd_val = @dist_land_hstd_val,
		dist_land_non_hstd_val = @dist_land_non_hstd_val,
		dist_ag_use_val = @dist_ag_use_val,
		dist_ag_market = @dist_ag_market,
		dist_timber_use = @dist_timber_use,
		dist_timber_market = @dist_timber_market,

		mktappr_imprv_hstd_val = @mktappr_imprv_hstd_val,
		mktappr_imprv_non_hstd_val = @mktappr_imprv_non_hstd_val,
		mktappr_land_hstd_val = @mktappr_land_hstd_val,
		mktappr_land_non_hstd_val = @mktappr_land_non_hstd_val,
		mktappr_ag_use_val = @mktappr_ag_use_val,
		mktappr_ag_market = @mktappr_ag_market,
		mktappr_ag_loss = @mktappr_ag_loss,
		mktappr_timber_use = @mktappr_timber_use,
		mktappr_timber_market = @mktappr_timber_market,
		mktappr_timber_loss = @mktappr_timber_loss,
		mktappr_ag_hs_use_val = @mktappr_ag_hs_use_val,
		mktappr_ag_hs_mkt_val = @mktappr_ag_hs_mkt_val,
		mktappr_ag_hs_loss = @mktappr_ag_hs_loss,
		mktappr_timber_hs_use_val = @mktappr_timber_hs_use_val,
		mktappr_timber_hs_mkt_val = @mktappr_timber_hs_mkt_val,
		mktappr_timber_hs_loss = @mktappr_timber_hs_loss,

		shared_other_val = @shared_other_val,

		ag_late_loss = @ag_late_loss,

		new_val_hs = @new_val_hs,
		new_val_nhs = @new_val_nhs,

		shared_prop_val = @shared_prop_val,

		ten_percent_cap =
			case @bUpdate_TenPercentCap
				when 1 then @ten_percent_cap
				else ten_percent_cap
			end
		,

		hscap_qualify_yr =
			case @bUpdate_HSCapQualifyYear
				when 1 then @hscap_qualify_yr
				else hscap_qualify_yr
			end
		,

		hscap_base_yr =
			case @bUpdate_HSCapBaseYear
				when 1 then @hscap_base_yr
				else hscap_base_yr
			end
		,

		hscap_prevhsval =
			case @bUpdate_HSCapPrevHsVal
				when 1 then @hscap_prevhsval
				else hscap_prevhsval
			end
		,

		hscap_newhsval =
			case @bUpdate_HSCapNewHsVal
				when 1 then @hscap_newhsval
				else hscap_newhsval
			end
		,

		hscap_override_prevhsval_flag =
			case @bUpdate_HSCapOverridePrevHsVal
				when 1 then @hscap_override_prevhsval_flag
				else hscap_override_prevhsval_flag
			end
		,

		hscap_prevhsval_pacsuser =
			case @bUpdate_HSCapPrevHsVal_PacsUserID
				when 1 then @hscap_prevhsval_pacsuser
				else hscap_prevhsval_pacsuser
			end
		,
		
		hscap_prevhsval_comment =
			case @bUpdate_HSCapPrevHsVal_Comment
				when 1 then @hscap_prevhsval_comment
				else hscap_prevhsval_comment
			end
		,

		hscap_prevhsval_date =
			case @bUpdate_HSCapPrevHsVal_Date
				when 1 then getdate()
				else hscap_prevhsval_date
			end
		,

		recalc_dt = getdate(),
		recalc_flag = @recalc_flag,
		timber_78 = @timber_78,
		prop_inactive_dt = case
			when @bMarkInactive = 1 and prop_inactive_dt is null
			then getdate()
			else prop_inactive_dt
		end,

		cycle = @cycle,
		
		ag_hs_use_val = @ag_hs_use_val,
		ag_hs_mkt_val = @ag_hs_mkt_val,
		ag_hs_loss = @ag_hs_loss,
		timber_hs_use_val = @timber_hs_use_val,
		timber_hs_mkt_val = @timber_hs_mkt_val,
		timber_hs_loss = @timber_hs_loss,
		cost_ag_hs_use_val = @cost_ag_hs_use_val,
		cost_ag_hs_mkt_val = @cost_ag_hs_mkt_val,
		cost_ag_hs_loss = @cost_ag_hs_loss,
		cost_timber_hs_use_val = @cost_timber_hs_use_val,
		cost_timber_hs_mkt_val = @cost_timber_hs_mkt_val,
		cost_timber_hs_loss = @cost_timber_hs_loss,
		shared_ag_hs_use_val = @shared_ag_hs_use_val,
		shared_ag_hs_mkt_val = @shared_ag_hs_mkt_val,
		shared_ag_hs_loss = @shared_ag_hs_loss,
		shared_timber_hs_use_val = @shared_timber_hs_use_val,
		shared_timber_hs_mkt_val = @shared_timber_hs_mkt_val,
		shared_timber_hs_loss = @shared_timber_hs_loss,
		arb_ag_hs_use_val = @arb_ag_hs_use_val,
		arb_ag_hs_mkt_val = @arb_ag_hs_mkt_val,
		arb_ag_hs_loss = @arb_ag_hs_loss,
		arb_timber_hs_use_val = @arb_timber_hs_use_val,
		arb_timber_hs_mkt_val = @arb_timber_hs_mkt_val,
		arb_timber_hs_loss = @arb_timber_hs_loss,
		dist_ag_hs_use_val = @dist_ag_hs_use_val,
		dist_ag_hs_mkt_val = @dist_ag_hs_mkt_val,
		dist_ag_hs_loss = @dist_ag_hs_loss,
		dist_timber_hs_use_val = @dist_timber_hs_use_val,
		dist_timber_hs_mkt_val = @dist_timber_hs_mkt_val,
		dist_timber_hs_loss = @dist_timber_hs_loss,
		new_val_imprv_hs = @new_val_imprv_hs,
		new_val_imprv_nhs = @new_val_imprv_nhs,
		new_val_land_hs = @new_val_land_hs,
		new_val_land_nhs = @new_val_land_nhs,
		remodel_val_curr_yr = @remodel_val_curr_yr,
		non_taxed_mkt_val = @non_taxed_mkt_val,
		dor_value = @dor_value
	where
		prop_id = @lPropID and
		prop_val_yr = @lYear and
		sup_num = @lSupNum

GO

