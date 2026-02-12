


create view dbo.comp_sales_land_mult_prop_vw
as
select
	coopa.chg_of_owner_id,
	count(pv.prop_id) as prop_count,
	sum(pv.land_hstd_val + pv.land_non_hstd_val + pv.ag_market + pv.timber_market) as total_land_market,
	sum(pv.land_hstd_val) as total_land_hs,
	sum(pv.land_non_hstd_val) as total_land_nhs,
	sum(pv.ag_market) as total_ag_market,
	sum(pv.timber_market) as total_timber_market,
	pv.prop_val_yr,
	max(isnull(pv.land_hstd_val, 0) + isnull(pv.land_non_hstd_val, 0) + isnull(pv.ag_market, 0) + isnull(pv.timber_market, 0)) as max_land_market,
	sum(isnull(pp.land_acres, 0)) as total_acres,
	sum(isnull(pp.land_sqft, 0)) as total_square_feet,
	sum(isnull(pp.land_useable_acres, isnull(pp.land_acres, 0))) as total_useable_acres,
	sum(isnull(pp.land_useable_sqft, isnull(pp.land_sqft, 0))) as total_useable_square_feet,
	sum(isnull(pp.land_front_feet, 0)) as total_front_feet,
	sum(isnull(pp.num_imprv, 0)) as total_num_units

from chg_of_owner_prop_assoc as coopa with(nolock)
join prop_supp_assoc as psa with(nolock) on
	coopa.prop_id = psa.prop_id
join property_val as pv with(nolock) on
	psa.owner_tax_yr = pv.prop_val_yr and
	psa.sup_num = pv.sup_num and
	psa.prop_id = pv.prop_id
join property_profile as pp with(nolock) on
	psa.owner_tax_yr = pp.prop_val_yr and
	psa.prop_id = pp.prop_id

group by
	coopa.chg_of_owner_id,
	pv.prop_val_yr

GO

