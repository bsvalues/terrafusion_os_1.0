--Declare @quality as int
--declare @sub_quality as int ;
create view __new_quality_points as
SELECT 
      nq.[prop_id],
   quality + sub_quality  as new_class_cd ,
   XCoord,
   ycoord
   
FROM [pacs_oltp].[dbo].[__new_quality]nq
LEFT JOIN 

(SELECT 
[Parcel_ID],
ROW_NUMBER() 
over 
(partition by prop_id 
ORDER BY [OBJECTID] DESC) 
AS order_id,
[Prop_ID],
--Geometry,
[Geometry].STCentroid().STX as XCoord,
[Geometry].STCentroid().STY as YCoord ,

      [CENTROID_X] as x
      ,[CENTROID_Y] as y

FROM 
--[Benton_spatial_data].[dbo].[spatial_coords]
[Benton_spatial_data].[dbo].[parcel]
) as coords
 
ON 

nq.prop_id = coords.Prop_ID AND coords.order_id = 1

GO

