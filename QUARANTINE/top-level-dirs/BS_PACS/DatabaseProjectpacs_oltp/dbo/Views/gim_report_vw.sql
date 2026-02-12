
CREATE VIEW dbo.gim_report_vw AS

SELECT 
gsv.sale_id,
gsv.monthly_income,
gsv.annual_income,
gsv.sale_price,
gsv.grm,
gsv.gim,
gsv.sale_date,
pp.prop_id,
pp.prop_val_yr,
pp.class_cd,
pp.condition_cd,
pp.living_area,
pp.yr_blt,
pp.eff_yr_blt,
pp.state_cd,
pv.mapsco,
pv.rgn_cd as region_cd,
pv.subset_cd,
pv.hood_cd,
hood.hood_name,
en.entity_cd as school_cd,
acc.file_as_name as school_name,
prop.geo_id,
situs.situs_display as situs,
inc.num_units

FROM dbo.gim_sales_vw gsv

LEFT OUTER JOIN dbo.chg_of_owner_prop_assoc spa
ON gsv.sale_id = spa.chg_of_owner_id

LEFT OUTER JOIN dbo.property_profile pp
ON spa.prop_id = pp.prop_id

LEFT OUTER JOIN dbo.property_val pv
ON (pp.prop_id = pv.prop_id) AND (pp.prop_val_yr = pv.prop_val_yr)

LEFT OUTER JOIN dbo.neighborhood hood
ON (pv.hood_cd = hood.hood_cd) AND (pv.prop_val_yr = hood.hood_yr)

LEFT OUTER JOIN dbo.entity en
ON pp.school_id = en.entity_id

LEFT OUTER JOIN dbo.account acc
ON en.entity_id = acc.acct_id

LEFT OUTER JOIN dbo.property prop
ON pp.prop_id = prop.prop_id

LEFT OUTER JOIN dbo.situs situs
ON (pp.prop_id = situs.prop_id) AND (situs.primary_situs = 'Y')

LEFT OUTER JOIN dbo.income_prop_assoc ipa
ON (pv.prop_id = ipa.prop_id) AND (pv.prop_val_yr = ipa.prop_val_yr) AND (pv.sup_num = ipa.sup_num)

LEFT OUTER JOIN dbo.income inc
ON (ipa.income_id = inc.income_id) AND (ipa.sup_num = inc.sup_num) AND (ipa.prop_val_yr = inc.income_yr)

GO

