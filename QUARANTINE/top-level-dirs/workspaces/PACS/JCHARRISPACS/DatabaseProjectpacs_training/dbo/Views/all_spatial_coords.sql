create view all_spatial_coords as 
SELECT  sp.[Prop_ID]
,sp.[Parcel_ID]
		[OBJECTID]
      ,pt.[Shape]
	  ,Geometry
      ,[Entity]
      
   
      ,pt.[CENTROID_X]
      ,pt.[CENTROID_Y]
	  ,XCoord
	  ,YCoord
	 
  FROM [Spatial].[dbo].[PARCEL_TEST] pt
  inner join 
  Benton_spatial_data.dbo.spatial_parcel sp on sp.Prop_ID=pt.Prop_ID
  --where sp.CENTROID_X is not null and sp.Prop_ID <> 0


--and pt.prop_id=309698

GO

