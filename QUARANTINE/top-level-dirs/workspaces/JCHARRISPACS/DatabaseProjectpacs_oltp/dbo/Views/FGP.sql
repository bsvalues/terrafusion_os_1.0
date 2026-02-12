

CREATE VIEW [dbo].[FGP] AS select distinct

a.file_as_name 											as 'owner_name',
pv.prop_id 												as 'prop_id',
p.geo_id 												as 'geo_id',
pv.legal_desc 											as 'legal_desc',
concat(rtrim(ltrim(ad.addr_line1))+
' ',rtrim(ltrim(ad.addr_line2))+' ',
rtrim(ltrim(ad.addr_line3))+' ',
rtrim(ltrim(ad.addr_city)) + 
', ',rtrim(ltrim(ad.addr_state)) +' ',
rtrim(ltrim(ad.addr_zip))) 								as 'owner_address',
concat(rtrim(ltrim(s.situs_num))+' ',
rtrim(ltrim(s.situs_street_prefx))+' ',
rtrim(ltrim(s.situs_street))+' ',
rtrim(ltrim(s.situs_city)) + ', ',
rtrim(ltrim(s.situs_state)) +' ',
rtrim(ltrim(s.situs_zip))) 								as 'situs_address',
ta.tax_area_number 										as 'tax_code_area',
pv.imprv_hstd_val + pv.imprv_non_hstd_val				as 'ImpVal',
pv.land_hstd_val + pv.land_non_hstd_val					as 'LandVal',
pv.market												as 'MarketValue',
pv.appraised_val										as 'appraised_val',
pv.ag_use_val											as 'ag_use_val',
hood.hood_name 											as 'neighborhood_name',
pv.hood_cd 												as 'neighborhood_code',
pv.legal_acreage 										as 'legal_acres',
pp.land_sqft											as 'land_sqft',
pp.yr_blt 												as 'year_blt',
pp.property_use_cd 										as 'primary_use',
pv.cycle												as 'cycle'

from property_val as pv
inner join [owner] as o with (nolock)
      on pv.prop_id = o.prop_id
      and pv.prop_val_yr = o.owner_tax_yr
      and pv.sup_num = o.sup_num
inner join property as p with (nolock)
      on pv.prop_id = p.prop_id
      and p.prop_type_cd = 'r'
inner join property_tax_area as pta with (nolock)
      on pv.prop_id = pta.prop_id
      and pv.sup_num = pta.sup_num
      and pv.prop_val_yr = pta.year
inner join [account] as a with (nolock)
      on o.owner_id = a.acct_id
inner join property_profile pp with (nolock)
              on pv.prop_id = pp.prop_id
              and pv.prop_val_yr = pp.prop_val_yr
left outer join [address] as ad with (nolock)
     on o.owner_id = ad.acct_id
      and ad.primary_addr = 'y'
left outer join [situs] as s with (nolock)
      on pv.prop_id = s.prop_id
      and s.primary_situs = 'y'
left outer join neighborhood as hood with (nolock)
      on pv.hood_cd = hood.hood_cd
      and pv.prop_val_yr = hood.hood_yr
left outer join tax_area as ta with (nolock)
      on pta.tax_area_id = ta.tax_area_id
LEFT Join 
	[pacs_oltp].[dbo].situs 
		on pv.prop_id=situs.prop_id
where pv.prop_val_yr = (select appr_yr  from [pacs_oltp].[dbo].pacs_system) 
and pv.prop_inactive_dt is null
and situs.primary_situs= 'Y'
and pv.sup_num=0

GO

