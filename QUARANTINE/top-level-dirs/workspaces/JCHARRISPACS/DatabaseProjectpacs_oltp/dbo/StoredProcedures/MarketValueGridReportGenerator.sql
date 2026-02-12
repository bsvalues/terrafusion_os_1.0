
create procedure MarketValueGridReportGenerator
	@dataset_id bigint,
	@use_time_adj bit,
	@time_adj_base_month_year datetime,
	@time_adj_pct numeric(5,2)
as

set nocount on

	update t
	set
		t.hood_cd = pv.hood_cd,
		t.cycle = pv.cycle,
		t.improv_sum_la = pp.living_area_highvalueimprov,
		t.improv_class_cd = pp.class_cd_highvalueimprov,
		t.actual_year_built = t.year - pp.actual_age,
		t.effective_year_built = pp.eff_yr_blt,
		t.sale_date = sale.sl_dt,
		t.adj_sale_price = sale.adjusted_sl_price,
		t.prior_year_mkt_val = isnull(pvprev.market, 0),
		
		t.indicated_value_land = dtValues.mkt_land,
		t.indicated_value_improv = dtValues.mkt_imprv,
		t.cost_value_land = dtValues.cost_land,
		t.cost_value_improv = dtValues.cost_imprv

	from ##mkt_value_grid_report_detail as t
	join property_val as pv with(nolock) on
		pv.prop_val_yr = t.year and
		pv.sup_num = t.sup_num and
		pv.prop_id = t.prop_id
	join property_profile as pp with(nolock) on
		pp.prop_val_yr = t.year and
		pp.prop_id = t.prop_id
	join sale with(nolock) on
		sale.chg_of_owner_id = t.chg_of_owner_id
	left outer join prop_supp_assoc as psaprev with(nolock) on
		psaprev.owner_tax_yr = (t.year - 1) and
		psaprev.prop_id = t.prop_id
	left outer join property_val as pvprev with(nolock) on
		pvprev.prop_val_yr = psaprev.owner_tax_yr and
		pvprev.sup_num = psaprev.sup_num and
		pvprev.prop_id = psaprev.prop_id
	join (
		select
			t.chg_of_owner_id,
			
			mkt_imprv = sum(
				isnull(mktappr_imprv_hstd_val, 0) +
				isnull(mktappr_imprv_non_hstd_val, 0)
			),
			mkt_land = sum(
				isnull(mktappr_land_hstd_val, 0) +
				isnull(mktappr_land_non_hstd_val, 0) +
				isnull(mktappr_ag_market, 0) +
				isnull(mktappr_timber_market, 0) +
				isnull(mktappr_ag_hs_mkt_val, 0) +
				isnull(mktappr_timber_hs_mkt_val, 0)
			),
			
			cost_imprv = sum(
				isnull(cost_imprv_hstd_val, 0) +
				isnull(cost_imprv_non_hstd_val, 0)
			),
			cost_land = sum(
				isnull(cost_land_hstd_val, 0) +
				isnull(cost_land_non_hstd_val, 0) +
				isnull(cost_ag_market, 0) +
				isnull(cost_timber_market, 0) +
				isnull(cost_ag_hs_mkt_val, 0) +
				isnull(cost_timber_hs_mkt_val, 0)
			)
		from ##mkt_value_grid_report_detail as t
		join chg_of_owner_prop_assoc as coopa with(nolock) on
			coopa.chg_of_owner_id = t.chg_of_owner_id
		join prop_supp_assoc as psa with(nolock) on
			psa.owner_tax_yr = t.year and
			psa.prop_id = coopa.prop_id
		join property_val as pv with(nolock) on
			pv.prop_val_yr = psa.owner_tax_yr and
			pv.sup_num = psa.sup_num and
			pv.prop_id = psa.prop_id
		where t.dataset_id = @dataset_id
		group by
			t.chg_of_owner_id
	) as dtValues on
		dtValues.chg_of_owner_id = t.chg_of_owner_id
	where t.dataset_id = @dataset_id

	-- Adjust the sale prices with the time adjustments
	if ( @use_time_adj = 1 )
	begin
		update t
		set
			t.adj_sale_price =
				t.adj_sale_price *
				(
					1.0 + (datediff(month, @time_adj_base_month_year, t.sale_date) * @time_adj_pct / 100.0)
				)
		from ##mkt_value_grid_report_detail as t
		where t.dataset_id = @dataset_id
	end

	-- Set the ratios
	update t
	set
		t.imv_ratio = case
			when t.adj_sale_price <> 0 then -- Yes this check is necessary since the price can be adjusted to zero via time adjustments
				(t.indicated_value_land + t.indicated_value_improv) / t.adj_sale_price
			else
				0
		end,
		t.cost_ratio = case
			when t.adj_sale_price <> 0 then
				(t.cost_value_land + t.cost_value_improv) / t.adj_sale_price
			else
				0
		end
	from ##mkt_value_grid_report_detail as t
	where t.dataset_id = @dataset_id

GO

