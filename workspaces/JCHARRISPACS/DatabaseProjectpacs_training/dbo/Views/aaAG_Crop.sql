
create view [dbo].[aaAG_Crop] as
SELECT  distinct id.[prop_id]
      ,id.[prop_val_yr]
      ,id.[imprv_id]
      ,[imprv_det_id]
      ,id.[sup_num]
      ,id.[sale_id]
	 , id.yr_built as 'Year_Planted'
      ,[imprv_det_class_cd] as crop_class_cd
      ,[imprv_det_meth_cd] as crop_det_meth_cd
      ,[imprv_det_type_cd] as crop
	  
 

      ,[imprv_det_val] as crop_imprv_det_val
      ,[imprv_det_val_source]
      
      ,[imprv_det_sub_class_cd]
      ,[num_units]
	  ,imprv.permanent_crop_planted_acres as crop_planted_acres
	  ,imprv.permanent_crop_land_acres as crop_land_acres
      ,[permanent_crop_acres] as crop_acres
      ,[permanent_crop_irrigation_acres]as irrigation_acres
      ,[permanent_crop_age_group]as age_group
      ,[permanent_crop_trellis]as trellis
      ,[permanent_crop_irrigation_system_type]as irrigation_system_type
      ,[permanent_crop_irrigation_sub_class]as irrigation_sub_class
      ,[permanent_crop_density]as density
      ,[imprv_det_cost_unit_price]
    --  ,[imprv_det_ms_val]
     -- ,[imprv_det_ms_unit_price]
      --,imprv.[recalc_error_validate_flag]as imprv_recalc_error_validate_flag
    --  ,imprv.[recalc_error_validate_date]as imprv_recalc_error_validate_date
     -- ,imprv.[recalc_error_validate_user_id] as imprv_recalc_error_validate_user_id
	 -- ,id.[recalc_error_validate_flag] as imprv_detail_recalc_error_validate_flag
     -- ,id.[recalc_error_validate_date] as imprv_detail_recalc_error_validate_date
     -- ,id.[recalc_error_validate_user_id]as imprv_detail_recalc_error_validate_user_id


	 

  FROM [pacs_oltp].[dbo].[imprv_detail]id
 left join 
   pacs_oltp.dbo.imprv ON id.prop_val_yr = imprv.prop_val_yr AND id.sup_num = imprv.sup_num AND id.sale_id = imprv.sale_id AND id.prop_id = imprv.prop_id AND 
                         id.imprv_id = imprv.imprv_id
	

 
where 
id.prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)
and id.sale_id=0

and imprv.imprv_type_cd='permc'
and id.imprv_det_meth_cd not like 'irr'
and id.imprv_det_meth_cd not like 'trl'
--and id.prop_id=12090
--and imprv_det_type_cd like'AG-HAYSTOR '
--and imprv_det_type_cd like '%V16-Merlot'
and permanent_crop_acres is not null

GO

