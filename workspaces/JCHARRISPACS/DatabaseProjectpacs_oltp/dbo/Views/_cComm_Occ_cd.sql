
create view [dbo].[_cComm_Occ_cd] as 
SELECT ia.[prop_val_yr],pv.cycle
      ,ia.[sup_num]
      ,[sale_id]
      ,ia.[prop_id]
      ,[imprv_id]
      ,[imprv_det_id]
      ,[section_id]
      ,[occupancy_id]
      ,[occupancy_code]
      ,[occupancy_description]
      ,[occupancy_pct]
      ,[class]
      ,[height]
      ,[quality_rank]

      ,[occupancy_name]
  FROM [pacs_oltp].[dbo].[imprv_detail_cms_occupancy]ia
  left join 
  property_val pv on pv.prop_id=ia.prop_id
  and pv.prop_val_yr=ia.prop_val_yr
  and pv.sup_num=ia.sup_num
  

    where pv.prop_val_yr= (select appr_yr  from [pacs_oltp].[dbo].pacs_system) and sale_id=0 and pv.sup_num=0 and pv.hood_cd like '6%'

GO

