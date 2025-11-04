create view __aAPPRest_Pers_prop as 
SELECT pps.prop_id as  ParcelID,
pv.sub_type, pv.appraised_val,pv.cycle,pv.prop_inactive_dt,pv.business_close_dt,pv.business_sold_dt,pv.business_start_dt,pv.rendered_yr, r.[filing_status],[rendition_year],r.[comment],
CASE WHEN rtrim(pp_type_cd)= 'supplies' then 'supplies' else null end as 'supplies',
CASE WHEN rtrim(pp_type_cd)='AG M&E'then 'AG M&E' else null end as 'Ag_MandE',
CASE WHEN rtrim(pp_type_cd)='BPP EQUIPM'then 'BPP EQUIPM'else null end as 'BPP_EQUIPM',
CASE WHEN rtrim(pp_type_cd)='INFO'then 'INFO' else null end as 'INFO',
CASE WHEN rtrim(pp_type_cd)='CONV' then 'CONV' else null end as 'conv',
CASE WHEN rtrim(pp_type_cd)='INDUSTRIAL'then 'INDUSTRIAL' else null end as 'Industrial',
CASE WHEN rtrim(pp_type_cd)='TITLE'then 'TITLE'else null end as 'Title',
CASE WHEN rtrim(pp_type_cd)='LEASED'then 'LEASED'else null end as 'Leased',
CASE WHEN rtrim(pp_type_cd)='BOATHOUSES'then'BOATHOUSES'else null end as 'Boasthouses'
,a.file_as_name,o.linked_cd

FROM [pacs_oltp].[dbo].[pers_prop_seg]pps
inner join
(Select * from 
 property_val where sub_type='ppb') pv on pv.prop_id=pps.prop_id and pv.prop_val_yr=pps.prop_val_yr
inner join
(Select * from 
[pacs_oltp].[dbo].[pers_prop_rendition] where pers_prop_rendition.rendition_year = 2019)  r on r.prop_id=pps.prop_id and r.rendition_year=pv.prop_val_yr
INNER JOIN 
owner o WITH (nolock) ON
	pv.prop_id = o.prop_id 
	AND pv.prop_val_yr = o.owner_tax_yr
	AND pv.sup_num = o.sup_num
INNER JOIN 
account a WITH (nolock) ON
	o.owner_id = a.acct_id
where pps.prop_val_yr=2019 
and pv.prop_inactive_dt is null
and   pp_active_flag='t'
  and farm_asset=0
  and pps.sup_num=0
  --and sub_type='ppb'
  and pp_type_cd like '%bpp%'
or pp_type_cd like '%supplies%'
or pp_type_cd like 'INFO'
or pp_type_cd like'CONV'
or pp_type_cd like 'INDUSTRIAL'
or pp_type_cd like'TITLE'
or pp_type_cd like'LEASED'
or pp_type_cd like'BOATHOUSES'
and rendition_year=(select appr_yr from pacs_oltp.dbo.pacs_system)






group by pps.prop_id,pp_type_cd
,pv.sub_type, pv.appraised_val,a.file_as_name,o.linked_cd,pv.cycle,pv.udi_parent_prop_id,pv.prop_inactive_dt,pv.business_close_dt,pv.business_sold_dt,pv.business_start_dt,pv.rendered_yr, r.[filing_status],[rendition_year],r.[comment]

GO

