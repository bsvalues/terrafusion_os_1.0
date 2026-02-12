/****** Script for SelectTopNRows command from SSMS  ******/

create view parcel_coords as
SELECT  [Parcel_ID]
      ,[Shape_Area]
      ,[XCoord]
      ,[YCoord]
      ,[Geometry]
      ,[Prop_ID]
      ,[Shape]
      ,[CENTROID_X]
      ,[CENTROID_Y]
      ,[Shape_Leng]
  FROM [Benton_spatial_data].[dbo].[spatial_parcel]

GO

