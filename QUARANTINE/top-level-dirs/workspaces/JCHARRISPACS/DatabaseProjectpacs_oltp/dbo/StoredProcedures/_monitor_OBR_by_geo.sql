


CREATE procedure [dbo].[_monitor_OBR_by_geo]


/* 

This monitor mimics the Outstanding Balances Report by prints the geo_id and includes the situs address.
The inputs are district_type (SA for assessment agency or TD for tax district), district ID and the as of date.
{CALL _monitor_OBR_by_geo('SA', 524, '1/31/2020')} ---This will run the report for the Kiona Irrigation assessment as of 1/31/2020

*/


@district_type		varchar(5),
@district_id		int,
@asof_date			datetime

as


IF @district_type = 'TD' 

begin

select td.tax_district_desc, p.geo_id, a.file_as_name, pv.legal_desc, s.situs_display, b.display_year, SUM(ct.base_amount - ct.base_amount_pd) base_due
from property p with(nolock)
join account a with(nolock)
	on a.acct_id = p.col_owner_id
join property_val pv with(nolock)
	on pv.prop_id = p.prop_id
	and pv.prop_val_yr = (select MAX(prop_val_yr) from property_val where prop_id = pv.prop_id)
join prop_supp_assoc psa with(nolock)
	on psa.prop_id = pv.prop_id
	and psa.owner_tax_yr = pv.prop_val_yr
	and psa.sup_num = pv.sup_num
left join situs s with(nolock)
	on s.prop_id = p.prop_id
	and s.primary_situs = 'Y'
join bill b with(nolock)
	on b.prop_id = p.prop_id
join levy_bill lb with(nolock)
	on lb.bill_id = b.bill_id
join tax_district td with(nolock)
	on td.tax_district_id = lb.tax_district_id
join coll_transaction ct with(nolock)
	on ct.trans_group_id = b.bill_id
join batch ba with(nolock)
	on ba.batch_id = ct.batch_id
where td.tax_district_id = @district_id
and ba.balance_dt <= @asof_date
and b.year < (select tax_yr from pacs_system)
group by td.tax_district_desc, p.geo_id, a.file_as_name, pv.legal_desc, s.situs_display, b.display_year
having SUM(ct.base_amount - ct.base_amount_pd) > 0
order by p.geo_id, b.display_year

end

else 

begin

select td.assessment_description, p.geo_id, a.file_as_name, pv.legal_desc, s.situs_display, b.display_year, SUM(ct.base_amount - ct.base_amount_pd) base_due
from property p with(nolock)
join account a with(nolock)
	on a.acct_id = p.col_owner_id
join property_val pv with(nolock)
	on pv.prop_id = p.prop_id
	and pv.prop_val_yr = (select MAX(prop_val_yr) from property_val where prop_id = pv.prop_id)
join prop_supp_assoc psa with(nolock)
	on psa.prop_id = pv.prop_id
	and psa.owner_tax_yr = pv.prop_val_yr
	and psa.sup_num = pv.sup_num
left join situs s with(nolock)
	on s.prop_id = p.prop_id
	and s.primary_situs = 'Y'
join bill b with(nolock)
	on b.prop_id = p.prop_id
join assessment_bill lb with(nolock)
	on lb.bill_id = b.bill_id
join special_assessment_agency td with(nolock)
	on td.agency_id = lb.agency_id
join coll_transaction ct with(nolock)
	on ct.trans_group_id = b.bill_id
join batch ba with(nolock)
	on ba.batch_id = ct.batch_id
where td.agency_id = @district_id
and ba.balance_dt <= @asof_date
----- 5/21/2021 change below line from < to < = --- pmo
and b.year < = (select tax_yr from pacs_system) 
group by td.assessment_description, p.geo_id, a.file_as_name, pv.legal_desc, s.situs_display, b.display_year
having SUM(ct.base_amount - ct.base_amount_pd) > 0
order by p.geo_id, b.display_year

end

GO

