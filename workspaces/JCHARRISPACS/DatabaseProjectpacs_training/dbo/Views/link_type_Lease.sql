
create view [dbo].[link_type_Lease] as
SELECT distinct pv.[prop_val_yr]
      ,pv.[sup_num]
      ,pa.[prop_id]
      ,[owner_id]
      ,[owner_desc]
      ,[link_type_cd]
  FROM [pacs_oltp].[dbo].[prop_linked_owner] as pa
   left join property_val as pv 
   on pv.prop_val_yr = pa.prop_val_yr and pv.sup_num=pa.sup_num
 where pv.prop_val_yr=(select appr_yr from [pacs_oltp].[dbo].pacs_system) and link_type_cd=--'owner'
--'Life'
'Lease'
--'NULL'


 --SELECT distinct      [link_type_cd]  FROM [pacs_oltp].[dbo].[prop_linked_owner] as pa   left join property_val as pv on pv.prop_val_yr = pa.prop_val_yr and pv.sup_num=pa.sup_num where pv.prop_val_yr=2019

GO

