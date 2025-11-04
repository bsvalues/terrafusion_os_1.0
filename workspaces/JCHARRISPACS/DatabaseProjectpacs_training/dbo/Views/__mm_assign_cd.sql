
create view [dbo].[__mm_assign_cd] as 
SELECT  mm.[prop_id]
      ,[mobile_assignment_group_id]
      ,[abs_subdv]
      ,[map_id]
      ,[neighborhood]
      ,[region]
      ,[state_cd]
      ,[subset]
      ,[group_codes]
      ,[entities]
      ,[property_use_cd]
	,[CENTROID_X]
      ,[CENTROID_Y]
      ,[Shape_Leng]
	  ,[Shape]
  FROM [pacs_oltp].[dbo].[MM_assignment_group_prop_view] mm

  inner join 
  (sELECT [OBJECTID_1]
      ,[Shape]
      ,[Parcel_ID]
      ,[Prop_ID]
      ,[CENTROID_X]
      ,[CENTROID_Y]
      ,[Shape_Leng]
      ,[OBJECTID]
  FROM [pacs_oltp].[dbo].[_PARCEL_]) sp on mm.prop_id=sp.prop_id

GO

