

CREATE VIEW __ag_field_land_details_VW 
AS SELECT        property_val.prop_id, property_val.prop_val_yr, land_detail.land_type_cd, land_detail.land_soil_code, land_detail.size_acres, land_detail.sale_id AS Expr1, property_val.prop_inactive_dt
 ,coords.XCoord,coords.YCoord

FROM            property_val INNER JOIN
                         land_detail ON property_val.prop_val_yr = land_detail.prop_val_yr AND property_val.sup_num = land_detail.sup_num AND property_val.prop_id = land_detail.prop_id
						


LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],

	  [Shape].STCentroid().STX as XCoord,
	[Shape].STCentroid().STY as YCoord 

		FROM [Benton_spatial_data].[dbo].[parcel]) as coords
		ON property_val.prop_id = coords.Prop_ID AND coords.order_id = 1
WHERE        (property_val.prop_val_yr = (select appr_yr from pacs_oltp.dbo.pacs_system))
 AND (property_val.prop_inactive_dt IS NULL) 
 AND (land_detail.sale_id = 0)

GO

