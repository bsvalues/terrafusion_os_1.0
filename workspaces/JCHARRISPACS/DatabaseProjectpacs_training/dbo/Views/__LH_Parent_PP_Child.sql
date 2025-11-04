
create view __LH_Parent_PP_Child as

SELECT [parent_prop_id]
      ,[child_prop_id]
      ,pa.[prop_val_yr]
      ,pa.[sup_num]
      ,[lOrder]
      ,[link_type_cd]
      ,[link_sub_type_cd]
  FROM [pacs_oltp].[dbo].[property_assoc] pa
  left join property_val pv on pv.prop_val_yr = pa.prop_val_yr and pv.prop_id=pa.parent_prop_id and pv.sup_num=pa.sup_num
 where pv.prop_val_yr=2019
 and pv.sub_type='LH'
  
  
  
  
  --and parent_prop_id=90233
  --and child_prop_id=--90233
 -- 70804

GO

