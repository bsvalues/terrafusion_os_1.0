create view _gis_coord_update AS
SELECT  
      g.[prop_id] as prop_id
	   ,[CENTROID_X] as xcoord
      ,[CENTROID_Y] as ycoord
  FROM [pacs_oltp].[CO\FGP].[ParcelUpdates]g
  inner join 
  (sELECT [OBJECTID_1]
      ,[Shape]
      ,[Parcel_ID]
      ,[Prop_ID]
      ,[CENTROID_X]
      ,[CENTROID_Y]
      ,[Shape_Leng]
      ,[OBJECTID]
  FROM [pacs_oltp].[dbo].[_PARCEL_]) sp on g.prop_id=sp.prop_id

GO

