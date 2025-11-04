create view ParcelUpdate as
SELECT  
      g.[prop_id]
	  ,[owner_name]
      ,[geo_id]
      ,[legal_desc]
      ,[owner_address]
      ,[situs_address]
      ,[tax_code_area]
      ,[appraised_val]
      ,[neighborhood_name]
      ,[neighborhood_code]
      ,[legal_acres]
      ,[year_blt]
      ,[primary_use]
      ,[cycle]
	   ,[CENTROID_X]
      ,[CENTROID_Y]
      ,[Shape_Leng]
	  ,[Shape]
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

