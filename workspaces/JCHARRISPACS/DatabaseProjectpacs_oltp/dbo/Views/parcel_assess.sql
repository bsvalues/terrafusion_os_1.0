create view parcel_assess as 
SELECT  sp.[Prop_ID]

,sp.[Parcel_ID]
      ,[Shape_Area]
      ,[XCoord]
      ,[YCoord]
      ,[Geometry]
     
      ,sp.[Shape]
      ,sp.[CENTROID_X]
      ,sp.[CENTROID_Y]
      ,sp.[Shape_Leng]
	  ,owner_name
	  ,owner_addr
	  ,situs_addr
	  ,legal_desc
	  ,tax_code_a
	  ,appraised_
	  ,neighborho
	  ,neighbor_1
	  ,legal_acre
	  ,year_blt
	  ,primary_us
	  ,cycle
  FROM [Benton_spatial_data].[dbo].[spatial_parcel]sp
  inner join 
  Benton_spatial_data.dbo.PARCELSANDASSESS pa on pa.prop_id=sp.Prop_ID
  where sp.Prop_ID >'0'

GO

