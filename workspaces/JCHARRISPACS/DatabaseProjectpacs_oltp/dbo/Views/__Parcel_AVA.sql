create view __Parcel_AVA as 
SELECT [Prop_ID]
      ,[Shape]
      ,[Parcel_ID]
      ,[CENTROID_X]
      ,[CENTROID_Y]     
      ,[AVA]
  FROM [Benton_spatial_data].[dbo].[PARCEL_AVA]

GO

