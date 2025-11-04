

CREATE VIEW __ag_field_imprv_VW 
AS SELECT        property_val.prop_id, property_val.prop_val_yr, imprv_detail.imprv_det_type_cd, imprv_detail.imprv_det_class_cd, imprv_detail.imprv_det_meth_cd, imprv_detail.permanent_crop_acres, 
                         imprv_detail.permanent_crop_irrigation_acres as prmnt_crp_irri_ac, imprv_detail.permanent_crop_age_group as prmnt_crp_age_grp, imprv_detail.permanent_crop_trellis as prmnt_crp_trls, imprv_detail.permanent_crop_irrigation_system_type as prmnt_crp_irri_type, 
                         imprv_detail.permanent_crop_irrigation_sub_class as prmnt_crp_irri_sub_cls, imprv_detail.permanent_crop_density as prmnt_crp_dns, imprv.imprv_type_cd, imprv.sale_id, property_val.prop_inactive_dt
						 ,coords.XCoord,coords.YCoord

FROM            property_val INNER JOIN
                         imprv_detail ON property_val.prop_id = imprv_detail.prop_id 
						 INNER JOIN
                         imprv ON property_val.prop_val_yr = imprv.prop_val_yr AND property_val.sup_num = imprv.sup_num AND property_val.prop_id = imprv.prop_id AND imprv_detail.prop_val_yr = imprv.prop_val_yr AND 
                         imprv_detail.sup_num = imprv.sup_num AND imprv_detail.sale_id = imprv.sale_id AND imprv_detail.prop_id = imprv.prop_id AND imprv_detail.imprv_id = imprv.imprv_id
LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],

	  [Shape].STCentroid().STX as XCoord,
	[Shape].STCentroid().STY as YCoord 

		FROM [Benton_spatial_data].[dbo].[parcel]) as coords
		ON property_val.prop_id = coords.Prop_ID AND coords.order_id = 1


WHERE        (property_val.prop_val_yr = (select appr_yr from pacs_oltp.dbo.pacs_system)) AND (imprv.sale_id = 0) AND (imprv.imprv_type_cd = 'PERMC') AND (property_val.prop_inactive_dt IS NULL)

GO

