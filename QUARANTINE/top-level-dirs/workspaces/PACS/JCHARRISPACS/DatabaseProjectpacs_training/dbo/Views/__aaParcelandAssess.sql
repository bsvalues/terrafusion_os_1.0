create view __aaParcelandAssess as
SELECT  
      [Prop_ID]      
      ,[owner_name]
      ,[geo_id]
      ,[legal_desc]
      ,[owner_addr]
      ,[situs_addr]
      ,[tax_code_a]
      ,[appraised_]
      ,[neighborho]
      ,[neighbor_1]
      ,[legal_acre]
      ,[year_blt]
      ,[primary_us]
      ,[cycle]
      ,[Shape_Leng]
	  ,[CENTROID_X]
      ,[CENTROID_Y]
  FROM [Benton_spatial_data].[dbo].[PARCELSANDASSESS]

GO

