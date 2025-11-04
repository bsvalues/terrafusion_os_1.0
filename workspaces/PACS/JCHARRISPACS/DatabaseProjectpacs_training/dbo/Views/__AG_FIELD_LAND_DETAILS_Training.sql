


CREATE VIEW __AG_FIELD_LAND_DETAILS_Training AS SELECT        property_val.prop_id, property_val.prop_val_yr, land_detail.land_type_cd, land_detail.land_soil_code, land_detail.size_acres, land_detail.sale_id AS Expr1, property_val.prop_inactive_dt
FROM            property_val INNER JOIN
                         land_detail ON property_val.prop_val_yr = land_detail.prop_val_yr AND property_val.sup_num = land_detail.sup_num AND property_val.prop_id = land_detail.prop_id
WHERE        (property_val.prop_val_yr = (select appr_yr from pacs_oltp.dbo.pacs_system))
 AND (property_val.prop_inactive_dt IS NULL) 
 AND (land_detail.sale_id = 0)

GO

