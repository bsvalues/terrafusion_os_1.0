create view __bpp_sub__ as
SELECT pv.prop_id,pv.sub_type,
CASE WHEN rtrim(pp_type_cd)= 'supples' then 'supples' else null end as 'supplies',
CASE WHEN rtrim(pp_type_cd)='AG M&E'then 'AG M&E' else null end as 'Ag_MandE',
CASE WHEN rtrim(pp_type_cd)='BPP EQUIPM'then 'BPP EQUIPM'else null end as 'BPP EQUIPM',
CASE WHEN rtrim(pp_type_cd)='INFO'then 'BPP EQUIPM' else null end as 'INFO',
CASE WHEN rtrim(pp_type_cd)='CONV' then 'CONV' else null end as 'conv',
CASE WHEN rtrim(pp_type_cd)='INDUSTRIAL'then 'INDUSTRIAL' else null end as 'Industrial',
CASE WHEN rtrim(pp_type_cd)='TITLE'then 'TITLE'else null end as 'Title',
CASE WHEN rtrim(pp_type_cd)='LEASED'then 'LEASED'else null end as 'Leased',
CASE WHEN rtrim(pp_type_cd)='BOATHOUSES'then'BOATHOUSES'else null end as 'Boasthouses'

FROM [pacs_oltp].[dbo].[pers_prop_seg]pps
inner join 
property_val pv on pv.prop_id=pps.prop_id and pv.prop_val_yr=pps.prop_val_yr
where pps.prop_val_yr=2018
 and  pp_active_flag='t'
  and farm_asset=0
  and pps.sup_num=0
  and sub_type='ppb'
group by pv.prop_id,pp_type_cd,pv.sub_type

GO

