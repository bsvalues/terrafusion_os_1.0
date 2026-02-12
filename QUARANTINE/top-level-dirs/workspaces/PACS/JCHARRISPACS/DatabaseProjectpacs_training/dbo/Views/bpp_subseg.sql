create view bpp_subseg as
SELECT prop_id,
Sum(case when pp_type_cd='supples'then (pp_subseg_val) else null end) as 'supples',
Sum(case when pp_type_cd='AG M&E'then (pp_subseg_val) else null end) as 'Ag_MandE',
Sum(case when pp_type_cd='BPP EQUIPM'then (pp_subseg_val)else null end) as 'BPP EQUIPM',
Sum(case when pp_type_cd='INFO'then (pp_subseg_val)else null end) as 'INFO',
Sum(case when pp_type_cd='CONV' then (pp_subseg_val)else null end) as 'conv',
Sum(case when pp_type_cd='INDUSTRIAL'then (pp_subseg_val)else null end) as 'Industrial',
Sum(case when pp_type_cd='TITLE'then (pp_subseg_val)else null end) as 'Title',
Sum(case when pp_type_cd='LEASED'then (pp_subseg_val)else null end) as 'Leased',
Sum(case when pp_type_cd='BOATHOUSES'then(pp_subseg_val)else null end) as 'Boasthouses'

FROM [pacs_oltp].[dbo].[pers_prop_seg]pps
--where pps.prop_val_yr=2018
group by prop_id

GO

