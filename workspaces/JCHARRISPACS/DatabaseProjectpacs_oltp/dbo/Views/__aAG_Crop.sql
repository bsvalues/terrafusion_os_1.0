create view __aAG_Crop as 
SELECT  id.[prop_id]
      ,id.[prop_val_yr]
      ,id.[imprv_id]
      ,[imprv_det_id]
      ,id.[sup_num]
      ,id.[sale_id]
      ,[imprv_det_class_cd] as crop_class_cd
      ,[imprv_det_meth_cd] as crop_det_meth_cd
      ,[imprv_det_type_cd] as crop
     -- ,[seq_num]
	  , wpov.taxable_classified + wpov.taxable_non_classified as taxable_value

      ,[imprv_det_val] as crop_imprv_det_val
      ,[imprv_det_val_source]
      ,[imprv_det_desc]
      ,[imprv_det_area]
      ,[imprv_det_area_type]
      ,[condition_cd]
      ,[cubic_area]
      ,[calc_area]
      ,[sketch_area]
      ,[override_area]
      ,[override_cubic_area]
      ,[override_perimeter]
      ,[perimeter]
      ,[length]
      ,[width]
      ,[height]
      ,[unit_price]
      ,[yr_new]
      ,[yr_built]
      ,[depreciation_yr]
      ,[depreciation_yr_override]
      ,[imprv_det_orig_val]
      ,[imprv_det_orig_up]
      ,[effective_tax_yr]
      ,[imprv_det_adj_factor]
      ,[imprv_det_adj_amt]
      ,[imprv_det_calc_val]
      ,[imprv_det_adj_val]
      ,[imprv_det_flat_val]
      ,imprv.[economic_pct]
      ,imprv.[physical_pct]
      ,id.[physical_pct_source]
      ,imprv.[functional_pct]
      ,[economic_pct_override]
      ,[physical_pct_override]
      ,[functional_pct_override]
      ,imprv.[economic_cmnt]
      ,imprv.[physical_cmnt]
      ,imprv.[functional_cmnt]
      ,imprv.[percent_complete]
      ,id.[percent_complete_override]
      ,imprv.[percent_complete_cmnt]
      ,[new_value_flag]
      ,[new_value]
      ,[new_value_override]
      ,[sketch_cmds]
      ,[use_up_for_pct_base]
      ,imprv.[ref_id1]
      ,[reserved1]
      ,[can_close_sketch]

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
	 , [size_acres]
      ,[size_square_feet]
      ,[effective_front]
      ,[effective_depth]
      ,[mkt_unit_price]
      ,[land_seg_mkt_val]
      ,[mkt_calc_val]
      ,[mkt_adj_val]
      ,[mkt_flat_val]
      ,ld.[ag_loss]
      ,[mkt_val_source]
      ,[ag_use_cd]
      ,[ag_unit_price]
      ,[ag_apply]
      ,[ag_val]
      ,[ag_calc_val]
      ,[ag_adj_val]
      ,[ag_flat_val]
      
      ,[ag_val_source]
 
      ,[ag_apply_yr]
      ,[land_seg_orig_val]

      
      ,[land_adj_amt]
      ,[land_adj_factor]
      ,[land_mass_adj_factor]
      
      ,[num_lots]
      ,[new_ag]
      ,[new_ag_prev_val]
      ,[new_ag_prev_val_override]
      ,[appraisal_cd]

      ,[land_class_code]
      ,[land_influence_code]
      ,[size_useable_acres]
      ,[size_useable_square_feet]

      ,[assessment_yr_qualified]
      ,[current_use_effective_acres]

	 

  FROM [pacs_oltp].[dbo].[imprv_detail]id
 left join 
   pacs_oltp.dbo.imprv ON id.prop_val_yr = imprv.prop_val_yr AND id.sup_num = imprv.sup_num AND id.sale_id = imprv.sale_id AND id.prop_id = imprv.prop_id AND 
                         id.imprv_id = imprv.imprv_id
	INNER JOIN  wash_prop_owner_val wpov 
	on id.prop_id = wpov.prop_id	AND id.prop_val_yr = wpov.year	AND id.sup_num = wpov.sup_num	
	
left join 
 __aLand_Detail ld on id.prop_val_yr = ld.prop_val_yr AND id.sup_num = ld.sup_num AND id.sale_id = ld.sale_id AND id.prop_id = ld.prop_id and ld.ag_use_cd is not null
 
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

