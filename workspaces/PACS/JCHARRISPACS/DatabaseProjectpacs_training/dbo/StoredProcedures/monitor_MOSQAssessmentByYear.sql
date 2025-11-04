

CREATE procedure [dbo].[monitor_MOSQAssessmentByYear]  


/*********


This monitor was written for Benton to provide them a list of Mosquito Assessment properties for a specified assessment year.





**********/

@year	int


as  


SET NOCOUNT ON   
select distinct p.geo_id as parcel_number, p.prop_id, ---(select min(prop_val_yr) from property_val with(nolock) where prop_id = p.prop_id) as eff_yr, 
	isnull(s.situs_display, '') as prop_street,
	a.file_as_name as owner_name, 
		(ad.addr_line1 + ' ' + ad.addr_line2 + ' ' + ad.addr_line3 + ' ' + 
			ad.addr_city + ' ' + ad.addr_state + ' ' + ad.addr_zip + ' ' + ad.country_cd) own_street,
			ta.tax_area_number, ld.land_type_cd, lt.land_type_desc, ld.size_acres, pv.property_use_cd, pu.property_use_desc, 
			pv.legal_acreage, wpoe.exmpt_type_cd, pv.prop_val_yr, (pv.imprv_hstd_val + pv.imprv_non_hstd_val) imprv_value
from property p with(nolock)
join property_val pv with(nolock)
	on pv.prop_id = p.prop_id
join land_detail ld with(nolock)
	on ld.prop_id = pv.prop_id
	and ld.prop_val_yr = pv.prop_val_yr
	and ld.sup_num = pv.sup_num
	and ld.sale_id = 0
join prop_supp_assoc psa with(nolock)
	on psa.prop_id = pv.prop_id
	and psa.owner_tax_yr = pv.prop_val_yr
	and psa.sup_num = pv.sup_num
left join situs s with(nolock)
	on s.prop_id = p.prop_id
	and s.primary_situs = 'Y'
join owner o with(nolock)
	on o.prop_id = pv.prop_id
	and o.owner_tax_yr = pv.prop_val_yr
	and o.sup_num = pv.sup_num
join account a with(nolock)
	on a.acct_id = o.owner_id
left join address ad with(nolock)
	on ad.acct_id = a.acct_id
	and ad.primary_addr = 'Y'
join property_tax_area pta with(nolock)
	on pta.prop_id = pv.prop_id
	and pta.year = pv.prop_val_yr
	and pta.sup_num = pv.sup_num
join tax_area ta with(nolock)
	on ta.tax_area_id = pta.tax_area_id
join property_special_assessment psaa
on pv.prop_id = psaa.prop_id
and pv.sup_num = psaa.sup_num
and pv.prop_val_yr = psaa.year
left join land_type lt with(nolock)
	on lt.land_type_cd = ld.land_type_cd
left join property_use pu with(nolock)
	on pu.property_use_cd = pv.property_use_cd
left join wash_prop_owner_exemption wpoe with(nolock)
	on wpoe.prop_id = pv.prop_id
	and wpoe.year = pv.prop_val_yr
	and wpoe.sup_num = pv.sup_num
where pv.prop_val_yr = @year
--and isnull(s.primary_situs, 'N') = 'Y'
--and isnull(ad.primary_addr, 'N') = 'Y'
and pv.prop_inactive_dt is NULL
and psaa.agency_id = 526
--and prop_type_cd = 'R'
order by parcel_number



select * from property_special_assessment

GO

