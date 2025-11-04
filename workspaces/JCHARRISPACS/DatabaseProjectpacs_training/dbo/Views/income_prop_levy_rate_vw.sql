create view [dbo].[income_prop_levy_rate_vw]

as

select ipa.prop_val_yr, ipa.sup_num, ipa.prop_id, 
		ipa.income_id, sum(isnull(levy.levy_rate,0)) as levy_rate

from tax_area_fund_assoc as tafa 
with (nolock)
join property_tax_area as pta 
with (nolock) 
on pta.[year] = tafa.[year]
and pta.tax_area_id = tafa.tax_area_id
join income_prop_assoc as ipa 
with (nolock)
on pta.[year] = ipa.prop_val_yr
and pta.sup_num = ipa.sup_num
and pta.prop_id = ipa.prop_id
join fund as f 
with (nolock) 
on f.[year] = tafa.[year]
and f.tax_district_id = tafa.tax_district_id
and f.levy_cd = tafa.levy_cd
and f.fund_id = tafa.fund_id
and f.begin_date is not null
and year(isnull(f.end_date, '1/1/9999')) > f.[year]
join levy 
with (nolock) 
on levy.[year] = tafa.[year]
and levy.tax_district_id = tafa.tax_district_id
and levy.levy_cd = tafa.levy_cd
group by ipa.prop_val_yr, ipa.sup_num, ipa.prop_id, ipa.income_id

GO

