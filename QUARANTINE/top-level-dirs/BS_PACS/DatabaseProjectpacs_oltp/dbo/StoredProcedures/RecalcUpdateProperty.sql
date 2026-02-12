

create procedure RecalcUpdateProperty
	@szBCPFile varchar(512),
	@lRowsPerUpdate int,
	@dtCalc datetime,
	@tsRowVersion rowversion
with recompile
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_property_val
		from ''' + @szBCPFile + '''
		with
		(
			maxerrors = 0,
			tablock
		)
	'
	exec(@szSQL)
	set @lBCPRowCount = @@rowcount

	declare @lNumPersonalAuto int
	declare @lNumMineral int
	
	/* Move personal & auto to their table */
	insert #recalc_bcp_property_val_personal with(tablock) (
		prop_id, prop_val_yr, sup_num, shared_prop_val, shared_value,
		appraised_val, market, assessed_val, cost_value, income_value, arb_market, dist_market,
		bUpdate_SharedOtherValue, shared_other_val,
		bUpdate_NewValuePersonal, new_val_p,
		bUpdate_TenPercentCap, ten_percent_cap,
		recalc_flag, pp_farm, pp_non_farm, cycle, bMarkInactive, dor_value
	)
	select
		prop_id, prop_val_yr, sup_num, shared_prop_val, shared_value,
		appraised_val, market, assessed_val, cost_value, income_value, arb_market, dist_market,
		bUpdate_SharedOtherValue, shared_other_val,
		bUpdate_NewValuePersonal, new_val_p,
		bUpdate_TenPercentCap, ten_percent_cap,
		recalc_flag, pp_farm, pp_non_farm, cycle, bMarkInactive, dor_value
	from #recalc_bcp_property_val as tpv with(nolock)
	where
		tpv.prop_type_cd in ('P','A')
	order by tpv.prop_id asc, tpv.prop_val_yr asc, tpv.sup_num asc

	set @lNumPersonalAuto = @@rowcount

	/* Move mineral to it's table */
	insert #recalc_bcp_property_val_mineral with(tablock) (
		prop_id, prop_val_yr, sup_num, assessed_val, shared_prop_val, shared_value,
		bUpdate_SharedOtherValue, shared_other_val,
		recalc_flag, cycle, bMarkInactive, dor_value
	)
	select
		prop_id, prop_val_yr, sup_num, assessed_val, shared_prop_val, shared_value,
		bUpdate_SharedOtherValue, shared_other_val,
		recalc_flag, cycle, bMarkInactive, dor_value
	from #recalc_bcp_property_val as tpv with(nolock)
	where
		tpv.prop_type_cd = 'MN'
	order by tpv.prop_id asc, tpv.prop_val_yr asc, tpv.sup_num asc

	set @lNumMineral = @@rowcount

	/* Remove personal, auto, & mineral from the main table */
	delete #recalc_bcp_property_val with(tablock)
	where prop_type_cd in ('P','A','MN')

	/* Update all rows at once if requested */
	if ( @lRowsPerUpdate = 0 )
	begin
		set @lRowsPerUpdate = @lBCPRowCount
	end

	declare @lMinBCPRowID int
	declare @lMaxBCPRowID int

	set @lMinBCPRowID = 1
	set @lMaxBCPRowID = @lRowsPerUpdate

	/* First, do real & mobile home property */

	while ( @lBCPRowCount > 0 )
	begin
		update property_val
		set
			property_val.appraised_val = tpv.appraised_val,
			property_val.market = tpv.market,
			property_val.assessed_val =
				case tpv.bUpdate_AssessedVal
					when 1 then tpv.assessed_val
					else property_val.assessed_val
				end
			,

			property_val.imprv_hstd_val = tpv.imprv_hstd_val,
			property_val.imprv_non_hstd_val = tpv.imprv_non_hstd_val,
			property_val.land_hstd_val = tpv.land_hstd_val,
			property_val.land_non_hstd_val = tpv.land_non_hstd_val,
			property_val.ag_use_val = tpv.ag_use_val,
			property_val.ag_market = tpv.ag_market,
			property_val.ag_loss = tpv.ag_loss,
			property_val.timber_use = tpv.timber_use,
			property_val.timber_market = tpv.timber_market,
			property_val.timber_loss = tpv.timber_loss,

			property_val.cost_value = tpv.cost_value,
			property_val.income_value = tpv.income_value,
			property_val.shared_value = tpv.shared_value,
			property_val.arb_market = tpv.arb_market,
			property_val.dist_market = tpv.dist_market,

			property_val.appr_method = tpv.appr_method,

			property_val.cost_imprv_hstd_val = tpv.cost_imprv_hstd_val,
			property_val.cost_imprv_non_hstd_val = tpv.cost_imprv_non_hstd_val,
			property_val.cost_land_hstd_val = tpv.cost_land_hstd_val,
			property_val.cost_land_non_hstd_val = tpv.cost_land_non_hstd_val,
			property_val.cost_ag_use_val = tpv.cost_ag_use_val,
			property_val.cost_ag_market = tpv.cost_ag_market,
			property_val.cost_ag_loss = tpv.cost_ag_loss,
			property_val.cost_timber_use = tpv.cost_timber_use,
			property_val.cost_timber_market = tpv.cost_timber_market,
			property_val.cost_timber_loss = tpv.cost_timber_loss,

			property_val.income_imprv_hstd_val = tpv.income_imprv_hstd_val,
			property_val.income_imprv_non_hstd_val = tpv.income_imprv_non_hstd_val,
			property_val.income_land_hstd_val = tpv.income_land_hstd_val,
			property_val.income_land_non_hstd_val = tpv.income_land_non_hstd_val,
			property_val.income_ag_use_val = tpv.income_ag_use_val,
			property_val.income_ag_market = tpv.income_ag_market,
			property_val.income_ag_loss = tpv.income_ag_loss,
			property_val.income_timber_use = tpv.income_timber_use,
			property_val.income_timber_market = tpv.income_timber_market,
			property_val.income_timber_loss = tpv.income_timber_loss,

			property_val.shared_imprv_hstd_val = tpv.shared_imprv_hstd_val,
			property_val.shared_imprv_non_hstd_val = tpv.shared_imprv_non_hstd_val,
			property_val.shared_land_hstd_val = tpv.shared_land_hstd_val,
			property_val.shared_land_non_hstd_val = tpv.shared_land_non_hstd_val,
			property_val.shared_ag_use_val = tpv.shared_ag_use_val,
			property_val.shared_ag_market = tpv.shared_ag_market,
			property_val.shared_ag_loss = tpv.shared_ag_loss,
			property_val.shared_timber_use = tpv.shared_timber_use,
			property_val.shared_timber_market = tpv.shared_timber_market,
			property_val.shared_timber_loss = tpv.shared_timber_loss,

			property_val.arb_imprv_hstd_val = tpv.arb_imprv_hstd_val,
			property_val.arb_imprv_non_hstd_val = tpv.arb_imprv_non_hstd_val,
			property_val.arb_land_hstd_val = tpv.arb_land_hstd_val,
			property_val.arb_land_non_hstd_val = tpv.arb_land_non_hstd_val,
			property_val.arb_ag_use_val = tpv.arb_ag_use_val,
			property_val.arb_ag_market = tpv.arb_ag_market,
			property_val.arb_timber_use = tpv.arb_timber_use,
			property_val.arb_timber_market = tpv.arb_timber_market,

			property_val.dist_imprv_hstd_val = tpv.dist_imprv_hstd_val,
			property_val.dist_imprv_non_hstd_val = tpv.dist_imprv_non_hstd_val,
			property_val.dist_land_hstd_val = tpv.dist_land_hstd_val,
			property_val.dist_land_non_hstd_val = tpv.dist_land_non_hstd_val,
			property_val.dist_ag_use_val = tpv.dist_ag_use_val,
			property_val.dist_ag_market = tpv.dist_ag_market,
			property_val.dist_timber_use = tpv.dist_timber_use,
			property_val.dist_timber_market = tpv.dist_timber_market,

			property_val.shared_other_val = tpv.shared_other_val,

			property_val.ag_late_loss = tpv.ag_late_loss,

			property_val.new_val_hs = tpv.new_val_hs,
			property_val.new_val_nhs = tpv.new_val_nhs,

			property_val.shared_prop_val = tpv.shared_prop_val,

			property_val.ten_percent_cap =
				case tpv.bUpdate_TenPercentCap
					when 1 then tpv.ten_percent_cap
					else property_val.ten_percent_cap
				end
			,

			property_val.hscap_qualify_yr =
				case tpv.bUpdate_HSCapQualifyYear
					when 1 then tpv.hscap_qualify_yr
					else property_val.hscap_qualify_yr
				end
			,

			property_val.hscap_base_yr =
				case tpv.bUpdate_HSCapBaseYear
					when 1 then tpv.hscap_base_yr
					else property_val.hscap_base_yr
				end
			,

			property_val.hscap_prevhsval =
				case tpv.bUpdate_HSCapPrevHsVal
					when 1 then tpv.hscap_prevhsval
					else property_val.hscap_prevhsval
				end
			,

			property_val.hscap_newhsval =
				case tpv.bUpdate_HSCapNewHsVal
					when 1 then tpv.hscap_newhsval
					else property_val.hscap_newhsval
				end
			,

			property_val.hscap_override_prevhsval_flag =
				case tpv.bUpdate_HSCapOverridePrevHsVal
					when 1 then tpv.hscap_override_prevhsval_flag
					else property_val.hscap_override_prevhsval_flag
				end
			,

			property_val.hscap_prevhsval_pacsuser =
				case tpv.bUpdate_HSCapPrevHsVal_PacsUserID
					when 1 then tpv.hscap_prevhsval_pacsuser
					else property_val.hscap_prevhsval_pacsuser
				end
			,
			
			property_val.hscap_prevhsval_comment =
				case tpv.bUpdate_HSCapPrevHsVal_Comment
					when 1 then tpv.hscap_prevhsval_comment
					else property_val.hscap_prevhsval_comment
				end
			,

			property_val.hscap_prevhsval_date =
				case tpv.bUpdate_HSCapPrevHsVal_Date
					when 1 then @dtCalc
					else property_val.hscap_prevhsval_date
				end
			,

			property_val.recalc_dt = @dtCalc,
			property_val.recalc_flag = tpv.recalc_flag,
			property_val.timber_78 = tpv.timber_78,
			property_val.prop_inactive_dt = case
				when tpv.bMarkInactive = 1 and property_val.prop_inactive_dt is null
				then @dtCalc
				else property_val.prop_inactive_dt
			end,

			property_val.cycle = tpv.cycle,
			
			property_val.ag_hs_use_val = tpv.ag_hs_use_val,
			property_val.ag_hs_mkt_val = tpv.ag_hs_mkt_val,
			property_val.ag_hs_loss = tpv.ag_hs_loss,
			property_val.timber_hs_use_val = tpv.timber_hs_use_val,
			property_val.timber_hs_mkt_val = tpv.timber_hs_mkt_val,
			property_val.timber_hs_loss = tpv.timber_hs_loss,
			property_val.cost_ag_hs_use_val = tpv.cost_ag_hs_use_val,
			property_val.cost_ag_hs_mkt_val = tpv.cost_ag_hs_mkt_val,
			property_val.cost_ag_hs_loss = tpv.cost_ag_hs_loss,
			property_val.cost_timber_hs_use_val = tpv.cost_timber_hs_use_val,
			property_val.cost_timber_hs_mkt_val = tpv.cost_timber_hs_mkt_val,
			property_val.cost_timber_hs_loss = tpv.cost_timber_hs_loss,
			property_val.shared_ag_hs_use_val = tpv.shared_ag_hs_use_val,
			property_val.shared_ag_hs_mkt_val = tpv.shared_ag_hs_mkt_val,
			property_val.shared_ag_hs_loss = tpv.shared_ag_hs_loss,
			property_val.shared_timber_hs_use_val = tpv.shared_timber_hs_use_val,
			property_val.shared_timber_hs_mkt_val = tpv.shared_timber_hs_mkt_val,
			property_val.shared_timber_hs_loss = tpv.shared_timber_hs_loss,
			property_val.arb_ag_hs_use_val = tpv.arb_ag_hs_use_val,
			property_val.arb_ag_hs_mkt_val = tpv.arb_ag_hs_mkt_val,
			property_val.arb_ag_hs_loss = tpv.arb_ag_hs_loss,
			property_val.arb_timber_hs_use_val = tpv.arb_timber_hs_use_val,
			property_val.arb_timber_hs_mkt_val = tpv.arb_timber_hs_mkt_val,
			property_val.arb_timber_hs_loss = tpv.arb_timber_hs_loss,
			property_val.dist_ag_hs_use_val = tpv.dist_ag_hs_use_val,
			property_val.dist_ag_hs_mkt_val = tpv.dist_ag_hs_mkt_val,
			property_val.dist_ag_hs_loss = tpv.dist_ag_hs_loss,
			property_val.dist_timber_hs_use_val = tpv.dist_timber_hs_use_val,
			property_val.dist_timber_hs_mkt_val = tpv.dist_timber_hs_mkt_val,
			property_val.dist_timber_hs_loss = tpv.dist_timber_hs_loss,
			property_val.new_val_imprv_hs = tpv.new_val_imprv_hs,
			property_val.new_val_imprv_nhs = tpv.new_val_imprv_nhs,
			property_val.new_val_land_hs = tpv.new_val_land_hs,
			property_val.new_val_land_nhs = tpv.new_val_land_nhs,
			property_val.remodel_val_curr_yr = tpv.remodel_val_curr_yr,
			property_val.non_taxed_mkt_val = tpv.non_taxed_mkt_val,
			property_val.dor_value = tpv.dor_value,

			property_val.mktappr_market = tpv.mktappr_market,
			property_val.mktappr_imprv_hstd_val = tpv.mktappr_imprv_hstd_val,
			property_val.mktappr_imprv_non_hstd_val = tpv.mktappr_imprv_non_hstd_val,
			property_val.mktappr_land_hstd_val = tpv.mktappr_land_hstd_val,
			property_val.mktappr_land_non_hstd_val = tpv.mktappr_land_non_hstd_val,
			property_val.mktappr_ag_use_val = tpv.mktappr_ag_use_val,
			property_val.mktappr_ag_market = tpv.mktappr_ag_market,
			property_val.mktappr_ag_loss = tpv.mktappr_ag_loss,
			property_val.mktappr_timber_use = tpv.mktappr_timber_use,
			property_val.mktappr_timber_market = tpv.mktappr_timber_market,
			property_val.mktappr_timber_loss = tpv.mktappr_timber_loss,
			property_val.mktappr_ag_hs_use_val = tpv.mktappr_ag_hs_use_val,
			property_val.mktappr_ag_hs_mkt_val = tpv.mktappr_ag_hs_mkt_val,
			property_val.mktappr_ag_hs_loss = tpv.mktappr_ag_hs_loss,
			property_val.mktappr_timber_hs_use_val = tpv.mktappr_timber_hs_use_val,
			property_val.mktappr_timber_hs_mkt_val = tpv.mktappr_timber_hs_mkt_val,
			property_val.mktappr_timber_hs_loss = tpv.mktappr_timber_hs_loss

		from property_val
		join #recalc_bcp_property_val as tpv with(nolock) on
			property_val.prop_id = tpv.prop_id and
			property_val.prop_val_yr = tpv.prop_val_yr and
			property_val.sup_num = tpv.sup_num
		where
			tpv.lRecalcBCPRowID >= @lMinBCPRowID and tpv.lRecalcBCPRowID <= @lMaxBCPRowID
			and tsRowVersion <= @tsRowVersion

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end

	set @lMinBCPRowID = 1
	set @lMaxBCPRowID = @lRowsPerUpdate

	while ( @lNumPersonalAuto > 0 )
	begin
		update property_val
		set
			property_val.land_hstd_val = 0,
			property_val.land_non_hstd_val = 0,
			property_val.imprv_hstd_val = 0,
			property_val.imprv_non_hstd_val = 0,

			property_val.ag_market = 0,
			property_val.ag_use_val = 0,
			property_val.ag_loss = 0,

			property_val.timber_market = 0,
			property_val.timber_use = 0,
			property_val.timber_loss = 0,

			property_val.shared_prop_val = tpv.shared_prop_val,
			property_val.shared_value = tpv.shared_value,

			property_val.appraised_val = tpv.appraised_val,
			property_val.market = tpv.market,
			property_val.assessed_val = tpv.assessed_val,

			property_val.cost_value = tpv.cost_value,
			property_val.income_value = tpv.income_value,
			property_val.arb_market = tpv.arb_market,
			property_val.dist_market = tpv.dist_market,

			property_val.shared_other_val =
				case tpv.bUpdate_SharedOtherValue
					when 1 then tpv.shared_other_val
					else property_val.shared_other_val
				end
			,
			property_val.new_val_p =
				case tpv.bUpdate_NewValuePersonal
					when 1 then tpv.new_val_p
					else property_val.new_val_p
				end
			,
			property_val.ten_percent_cap =
				case tpv.bUpdate_TenPercentCap
					when 1 then tpv.ten_percent_cap
					else property_val.ten_percent_cap
				end
			,

			property_val.recalc_dt = @dtCalc,
			property_val.recalc_flag = tpv.recalc_flag,
			property_val.prop_inactive_dt = case
				when tpv.bMarkInactive = 1 and property_val.prop_inactive_dt is null
				then @dtCalc
				else property_val.prop_inactive_dt
			end,
			property_val.cycle = tpv.cycle,
			property_val.pp_farm = tpv.pp_farm,
			property_val.pp_non_farm = tpv.pp_non_farm,
			property_val.dor_value = tpv.dor_value

		from property_val
		join #recalc_bcp_property_val_personal as tpv with(nolock) on
			property_val.prop_id = tpv.prop_id and
			property_val.prop_val_yr = tpv.prop_val_yr and
			property_val.sup_num = tpv.sup_num
		where
			tpv.lRecalcBCPRowID >= @lMinBCPRowID and tpv.lRecalcBCPRowID <= @lMaxBCPRowID
			and tsRowVersion <= @tsRowVersion

		/* Explicitly *not* minus @@rowcount */
		set @lNumPersonalAuto = @lNumPersonalAuto - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end

	set @lMinBCPRowID = 1
	set @lMaxBCPRowID = @lRowsPerUpdate

	while ( @lNumMineral > 0 )
	begin
		update property_val
		set
			property_val.land_hstd_val = 0,
			property_val.land_non_hstd_val = 0,
			property_val.imprv_hstd_val = 0,
			property_val.imprv_non_hstd_val = 0,

			property_val.ag_market = 0,
			property_val.ag_use_val = 0,
			property_val.ag_loss = 0,

			property_val.timber_market = 0,
			property_val.timber_use = 0,
			property_val.timber_loss = 0,

			property_val.ten_percent_cap = 0,

			property_val.shared_prop_val = tpv.shared_prop_val,
			property_val.shared_value = tpv.shared_value,

			property_val.cost_value = isnull(tpv.assessed_val, 0),
			property_val.income_value = isnull(tpv.assessed_val, 0),

			property_val.shared_other_val =
				case tpv.bUpdate_SharedOtherValue
					when 1 then tpv.shared_other_val
					else property_val.shared_other_val
				end
			,
			property_val.appraised_val =
				case tpv.bUpdate_SharedOtherValue
					when 1 then tpv.shared_other_val
					else isnull(tpv.assessed_val, 0)
				end
			,
			property_val.assessed_val =
				case tpv.bUpdate_SharedOtherValue
					when 1 then tpv.shared_other_val
					else isnull(tpv.assessed_val, 0)
				end
			,
			property_val.market =
				case tpv.bUpdate_SharedOtherValue
					when 1 then tpv.shared_other_val
					else isnull(tpv.assessed_val, 0)
				end
			,

			property_val.recalc_dt = @dtCalc,
			property_val.recalc_flag = tpv.recalc_flag,
			property_val.prop_inactive_dt = case
				when tpv.bMarkInactive = 1 and property_val.prop_inactive_dt is null
				then @dtCalc
				else property_val.prop_inactive_dt
			end,
			property_val.cycle = tpv.cycle,
			property_val.dor_value = tpv.dor_value
			
		from property_val
		join #recalc_bcp_property_val_mineral as tpv with(nolock) on
			property_val.prop_id = tpv.prop_id and
			property_val.prop_val_yr = tpv.prop_val_yr and
			property_val.sup_num = tpv.sup_num
		where
			tpv.lRecalcBCPRowID >= @lMinBCPRowID and tpv.lRecalcBCPRowID <= @lMaxBCPRowID
			and tsRowVersion <= @tsRowVersion

		/* Explicitly *not* minus @@rowcount */
		set @lNumMineral = @lNumMineral - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end

GO

