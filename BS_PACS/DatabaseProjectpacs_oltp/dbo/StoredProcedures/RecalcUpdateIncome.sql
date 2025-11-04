
create procedure RecalcUpdateIncome
	@lRowsPerUpdate int,
	@tsRowVersion rowversion
with recompile
as

set nocount on

	declare @lBCPRowCount int

	select @lBCPRowCount = count(lRecalcBCPRowID)
	from #recalc_bcp_income

	set @lBCPRowCount = isnull(@lBCPRowCount, 0)

	/* Update all rows at once if requested */
	if ( @lRowsPerUpdate = 0 )
	begin
		set @lRowsPerUpdate = @lBCPRowCount
	end

	declare @lMinBCPRowID int
	declare @lMaxBCPRowID int

	set @lMinBCPRowID = 1
	set @lMaxBCPRowID = @lRowsPerUpdate

	while ( @lBCPRowCount > 0 )
	begin
		update income
		set
			income.gba = ti.gba,
			income.nra = ti.nra,
			income.dc_la = ti.dc_la,
			income.dc_va = ti.dc_va,
			income.dc_be = ti.dc_be,
			income.dc_or = ti.dc_or,
			income.dc_vr = ti.dc_vr,
			income.dc_larate = ti.dc_larate,
			income.dc_varate = ti.dc_varate,
			income.dc_li = ti.dc_li,
			income.dc_vi = ti.dc_vi,
			income.dc_gpi = ti.dc_gpi,
			income.dc_gpivr = ti.dc_gpivr,
			income.dc_gpivi = ti.dc_gpivi,
			income.dc_gpiclr = ti.dc_gpiclr,
			income.dc_gpicli = ti.dc_gpicli,
			income.dc_gpirer = ti.dc_gpirer,
			income.dc_gpire = ti.dc_gpire,
			income.dc_gpisir = ti.dc_gpisir,
			income.dc_gpisi = ti.dc_gpisi,
			income.dc_egi = ti.dc_egi,
			income.dc_expoei = ti.dc_expoei,
			income.dc_mgmtr = ti.dc_mgmtr,
			income.dc_mgmti = ti.dc_mgmti,
			income.dc_rrr = ti.dc_rrr,
			income.dc_rri = ti.dc_rri,
			income.dc_tir = ti.dc_tir,
			income.dc_tii = ti.dc_tii,
			income.dc_lcr = ti.dc_lcr,
			income.dc_lci = ti.dc_lci,
			income.dc_exp = ti.dc_exp,
			income.dc_noi = ti.dc_noi,
			income.dc_capr = ti.dc_capr,
			income.dc_capi = ti.dc_capi,
			income.dc_ind = ti.dc_ind,
			income.dc_gpirsf = ti.dc_gpirsf,
			income.dc_gpivrsf = ti.dc_gpivrsf,
			income.dc_gpiclrsf = ti.dc_gpiclrsf,
			income.dc_gpirersf = ti.dc_gpirersf,
			income.dc_gpisirsf = ti.dc_gpisirsf,
			income.dc_egirsf = ti.dc_egirsf,
			income.dc_egipctrev = ti.dc_egipctrev,
			income.dc_expoersf = ti.dc_expoersf,
			income.dc_exptaxrsf = ti.dc_exptaxrsf,
			income.dc_expmgmtrsf = ti.dc_expmgmtrsf,
			income.dc_rrrsf = ti.dc_rrrsf,
			income.dc_exptirsf = ti.dc_exptirsf,
			income.dc_explcrsf = ti.dc_explcrsf,
			income.dc_exprsf = ti.dc_exprsf,
			income.dc_exppctrev = ti.dc_exppctrev,
			income.dc_noirsf = ti.dc_noirsf,
			income.dc_noipctrev = ti.dc_noipctrev,
			income.sch_la = ti.sch_la,
			income.sch_va = ti.sch_va,
			income.sch_be = ti.sch_be,
			income.sch_or = ti.sch_or,
			income.sch_vr = ti.sch_vr,
			income.sch_larate = ti.sch_larate,
			income.sch_varate = ti.sch_varate,
			income.sch_li = ti.sch_li,
			income.sch_vi = ti.sch_vi,
			income.sch_gpi = ti.sch_gpi,
			income.sch_gpivr = ti.sch_gpivr,
			income.sch_gpivi = ti.sch_gpivi,
			income.sch_gpiclr = ti.sch_gpiclr,
			income.sch_gpicli = ti.sch_gpicli,
			income.sch_gpirer = ti.sch_gpirer,
			income.sch_gpire = ti.sch_gpire,
			income.sch_gpisir = ti.sch_gpisir,
			income.sch_gpisi = ti.sch_gpisi,
			income.sch_egi = ti.sch_egi,
			income.sch_expoei = ti.sch_expoei,
			income.sch_mgmtr = ti.sch_mgmtr,
			income.sch_mgmti = ti.sch_mgmti,
			income.sch_rrr = ti.sch_rrr,
			income.sch_rri = ti.sch_rri,
			income.sch_tir = ti.sch_tir,
			income.sch_tii = ti.sch_tii,
			income.sch_lcr = ti.sch_lcr,
			income.sch_lci = ti.sch_lci,
			income.sch_exp = ti.sch_exp,
			income.sch_noi = ti.sch_noi,
			income.sch_capr = ti.sch_capr,
			income.sch_capi = ti.sch_capi,
			income.sch_ind = ti.sch_ind,
			income.sch_gpirsf = ti.sch_gpirsf,
			income.sch_gpivrsf = ti.sch_gpivrsf,
			income.sch_gpiclrsf = ti.sch_gpiclrsf,
			income.sch_gpirersf = ti.sch_gpirersf,
			income.sch_gpisirsf = ti.sch_gpisirsf,
			income.sch_egirsf = ti.sch_egirsf,
			income.sch_egipctrev = ti.sch_egipctrev,
			income.sch_expoersf = ti.sch_expoersf,
			income.sch_exptaxrsf = ti.sch_exptaxrsf,
			income.sch_expmgmtrsf = ti.sch_expmgmtrsf,
			income.sch_rrrsf = ti.sch_rrrsf,
			income.sch_exptirsf = ti.sch_exptirsf,
			income.sch_explcrsf = ti.sch_explcrsf,
			income.sch_exprsf = ti.sch_exprsf,
			income.sch_exppctrev = ti.sch_exppctrev,
			income.sch_noirsf = ti.sch_noirsf,
			income.sch_noipctrev = ti.sch_noipctrev,
			income.pf_la = ti.pf_la,
			income.pf_va = ti.pf_va,
			income.pf_be = ti.pf_be,
			income.pf_or = ti.pf_or,
			income.pf_vr = ti.pf_vr,
			income.pf_larate = ti.pf_larate,
			income.pf_varate = ti.pf_varate,
			income.pf_li = ti.pf_li,
			income.pf_vi = ti.pf_vi,
			income.pf_gpi = ti.pf_gpi,
			income.pf_gpivr = ti.pf_gpivr,
			income.pf_gpivi = ti.pf_gpivi,
			income.pf_gpiclr = ti.pf_gpiclr,
			income.pf_gpicli = ti.pf_gpicli,
			income.pf_gpirer = ti.pf_gpirer,
			income.pf_gpire = ti.pf_gpire,
			income.pf_gpisir = ti.pf_gpisir,
			income.pf_gpisi = ti.pf_gpisi,
			income.pf_egi = ti.pf_egi,
			income.pf_expoei = ti.pf_expoei,
			income.pf_mgmtr = ti.pf_mgmtr,
			income.pf_mgmti = ti.pf_mgmti,
			income.pf_rrr = ti.pf_rrr,
			income.pf_rri = ti.pf_rri,
			income.pf_tir = ti.pf_tir,
			income.pf_tii = ti.pf_tii,
			income.pf_lcr = ti.pf_lcr,
			income.pf_lci = ti.pf_lci,
			income.pf_exp = ti.pf_exp,
			income.pf_noi = ti.pf_noi,
			income.pf_capr = ti.pf_capr,
			income.pf_capi = ti.pf_capi,
			income.pf_ind = ti.pf_ind,
			income.pf_gpirsf = ti.pf_gpirsf,
			income.pf_gpivrsf = ti.pf_gpivrsf,
			income.pf_gpiclrsf = ti.pf_gpiclrsf,
			income.pf_gpirersf = ti.pf_gpirersf,
			income.pf_gpisirsf = ti.pf_gpisirsf,
			income.pf_egirsf = ti.pf_egirsf,
			income.pf_egipctrev = ti.pf_egipctrev,
			income.pf_expoersf = ti.pf_expoersf,
			income.pf_exptaxrsf = ti.pf_exptaxrsf,
			income.pf_expmgmtrsf = ti.pf_expmgmtrsf,
			income.pf_rrrsf = ti.pf_rrrsf,
			income.pf_exptirsf = ti.pf_exptirsf,
			income.pf_explcrsf = ti.pf_explcrsf,
			income.pf_exprsf = ti.pf_exprsf,
			income.pf_exppctrev = ti.pf_exppctrev,
			income.pf_noirsf = ti.pf_noirsf,
			income.pf_noipctrev = ti.pf_noipctrev,
			income.income_value = ti.income_value,
			income.recalc_flag = ti.recalc_flag,
			income.dc_tax = ti.dc_tax,
			income.sch_tax = ti.sch_tax,
			income.pf_tax = ti.pf_tax,
			income.land_ratio = ti.land_ratio,
			income.land_size = ti.land_size,
			income.land_excess_value = ti.land_excess_value,
			income.lu_rent_loss_area = ti.lu_rent_loss_area,
			income.lu_rent_sf = ti.lu_rent_sf,
			income.lu_rent_num_year = ti.lu_rent_num_year,
			income.lu_rent_total = ti.lu_rent_total,
			income.lu_lease_pct = ti.lu_lease_pct,
			income.lu_lease_total = ti.lu_lease_total,
			income.lu_tfo_sf = ti.lu_tfo_sf,
			income.lu_tfo_total = ti.lu_tfo_total,
			income.lu_disc_rate = ti.lu_disc_rate,
			income.lu_num_year = ti.lu_num_year,
			income.lu_cost = ti.lu_cost,
			income.dc_ind_rsf = ti.dc_ind_rsf,
			income.sch_ind_rsf = ti.sch_ind_rsf,
			income.pf_ind_rsf = ti.pf_ind_rsf,
			income.dc_ind_runit = ti.dc_ind_runit,
			income.sch_ind_runit = ti.sch_ind_runit,
			income.pf_ind_runit = ti.pf_ind_runit,
			income.dc_ocr_runit = ti.dc_ocr_runit,
			income.sch_ocr_runit = ti.sch_ocr_runit,
			income.pf_ocr_runit = ti.pf_ocr_runit,
			income.num_units = ti.num_units,
			income.non_income_land_value = ti.non_income_land_value,
			income.other_land_value = ti.other_land_value,
			income.schil_indicated_land_value = ti.schil_indicated_land_value,
			income.non_income_imprv_value = ti.non_income_imprv_value,
			income.non_income_land_imps_value = ti.non_income_land_imps_value,
			income.schil_indicated_imprv_value = ti.schil_indicated_imprv_value,
			income.schil_method_value = ti.schil_method_value,
			income.num_designated_units = ti.num_designated_units,
			income.gba_designated_units = ti.gba_designated_units,
			income.schil_base_indicated_value = ti.schil_base_indicated_value,
			income.schil_indicated_value = ti.schil_indicated_value,
			income.sch_base_indicated_value = ti.sch_base_indicated_value,
			income.pf_base_indicated_value = ti.pf_base_indicated_value,
			income.dc_base_indicated_value = ti.dc_base_indicated_value,
			income.override_sch_tax = case ti.bOverrideSCHTax when 1 then 'T' else 'F' end,
			income.DC_indicated_imprv_value = ti.DC_indicated_imprv_value,
			income.SCH_indicated_imprv_value = ti.SCH_indicated_imprv_value,
			income.PF_indicated_imprv_value = ti.PF_indicated_imprv_value
		from income
		join #recalc_bcp_income as ti with(nolock) on
			income.income_id = ti.income_id and
			income.income_yr = ti.income_yr and
			income.sup_num = ti.sup_num and
			ti.lRecalcBCPRowID >= @lMinBCPRowID and ti.lRecalcBCPRowID <= @lMaxBCPRowID
		where tsRowVersion <= @tsRowVersion

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end

GO

