create view __Subdivision as
SELECT        property_val.prop_id, abs_subdv.abs_subdv_cd,   property_val.map_id, abs_subdv.abs_subdv_desc, abs_subdv.bActive, abs_subdv.cInCounty, abs_subdv.changed_flag, abs_subdv.sys_flag, 
                         abs_subdv.abs_subdv_ind, abs_subdv.abs_imprv_pct, abs_subdv.abs_land_pct, XCoord,YCoord,x,y
FROM            property_val INNER JOIN
                         abs_subdv ON property_val.abs_subdv_cd = abs_subdv.abs_subdv_cd AND property_val.prop_val_yr = abs_subdv.abs_subdv_yr

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

property_val.prop_id = coords.Prop_ID AND coords.order_id = 1

WHERE 

property_val.prop_val_yr = 
(select appr_yr  from pacs_system)  
and property_val.prop_inactive_dt is null

GO

