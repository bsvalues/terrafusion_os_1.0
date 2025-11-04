
CREATE  VIEW income_values_vw

AS

-- income_values_vw
--
-- This view is used to access total values based on properties that share income valuations
-- The key fields of this view are:
-- income_id, prop_val_yr, and sup_num
--
-- The other fields represent total values as summed from all properties sharing the same income valution
--
-- See HS 46465 for more information

SELECT
	-- uniquely identifying fields
	ipa.income_id,
	ipa.prop_val_yr,
	ipa.sup_num,

	-- number of props sharing income valuation,
	COUNT(*) as property_count,

	-- the "primary" property ID (one with highest value)
	(select top 1 prop_id from income_prop_assoc ipa2 where ipa2.income_id = ipa.income_id and ipa2.prop_val_yr = ipa.prop_val_yr and ipa2.sup_num = ipa.sup_num order by income_value desc ) as primary_prop_id,

	-- totaled fields from the property profile table
	SUM(pp.land_sqft) AS land_sqft,
	SUM(pp.land_acres) AS land_acres,
	SUM(pp.living_area) AS living_area,
	SUM(pp.num_imprv) AS num_imprv,
	SUM(pp.land_front_feet) AS land_front_feet,
	AVG(pp.imprv_unit_price) AS imprv_unit_price,
	SUM(pp.imprv_add_val) AS imprv_add_val,
	AVG(pp.land_unit_price) AS land_unit_price,
	SUM(pp.percent_complete) / (COUNT(*) * 100) AS percent_complete,
	AVG(pp.main_land_unit_price) AS main_land_unit_price,
	SUM(pp.main_land_total_adj) AS main_land_total_adj,
	AVG(pp.size_adj_pct) AS size_adj_pct,


	-- totaled fields from the property_val table
	SUM(pv.income_value) AS income_market_value_total,
	SUM(pv.imprv_hstd_val) as imprv_hstd_val,
	SUM(pv.imprv_non_hstd_val) AS imprv_non_hstd_val,
	SUM(pv.land_hstd_val) AS land_hstd_val,
	SUM(pv.land_non_hstd_val) AS land_non_hstd_val,
	SUM(pv.ag_market) AS ag_market,
	SUM(pv.timber_market) AS timber_market,
	SUM(pv.market) AS market,
	SUM(pv.cost_value) AS cost_value,
	SUM(pv.land_hstd_val + pv.land_non_hstd_val) AS income_land_value_total,
	SUM(pv.imprv_hstd_val + pv.imprv_non_hstd_val) AS income_imprv_value_total,
	SUM(pv.ag_hs_mkt_val) as ag_hs_mkt_val,
	SUM(pv.timber_hs_mkt_val) as timber_hs_mkt_val


FROM
	income_prop_assoc ipa
	with (nolock)

INNER JOIN
	property_val pv with (nolock) ON ipa.prop_id = pv.prop_id AND ipa.prop_val_yr = pv.prop_val_yr AND ipa.sup_num = pv.sup_num
INNER JOIN
	income_prop_vw i with (nolock) ON i.income_id = ipa.income_id and i.sup_num = ipa.sup_num and i.income_yr = ipa.prop_val_yr and i.prop_id = pv.prop_id
INNER JOIN
	property_profile pp with (nolock) ON pp.prop_id = pv.prop_id AND pp.prop_val_yr = pv.prop_val_yr AND pp.sup_num = pv.sup_num
GROUP BY
	ipa.income_id,ipa.prop_val_yr,ipa.sup_num

GO

