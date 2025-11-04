
create view comparable_grid_exclude_tax_district_vw
with schemabinding
as

select
	prop_val_yr = psa.owner_tax_yr,
	psa.sup_num,
	psa.prop_id,
	l64Dummy = count_big(*) -- Not actually used, just a requirement to make yr/sup/pid unique so we can create a unique index
from dbo.prop_supp_assoc as psa
join dbo.property_tax_area as pta on
		psa.owner_tax_yr = pta.year and
		psa.sup_num = pta.sup_num and
		psa.prop_id = pta.prop_id
join dbo.tax_area_fund_assoc as tafa on
		tafa.year = pta.year and
		tafa.tax_area_id = pta.tax_area_id
join dbo.comparable_grid_exclude_tax_district as excludedTaxDistricts on
	excludedTaxDistricts.tax_district_id = tafa.tax_district_id
group by
	psa.owner_tax_yr,
	psa.sup_num,
	psa.prop_id

GO

CREATE UNIQUE CLUSTERED INDEX [idx_comparable_grid_exclude_tax_district_vw]
    ON [dbo].[comparable_grid_exclude_tax_district_vw]([prop_val_yr] ASC, [sup_num] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90);


GO

