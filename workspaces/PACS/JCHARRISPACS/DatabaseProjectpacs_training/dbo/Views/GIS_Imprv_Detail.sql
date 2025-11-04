


create view  GIS_Imprv_Detail as
SELECT row_number() over (partition by imprv_detail.prop_id order by "imprv_id" ASC) as "num", imprv_detail.prop_id,  imprv_det_type_cd as main_area_Type,RTRIM(imprv_det_class_cd) as quality,[condition_cd],


 [imprv_det_cost_unit_price] as cost, imprv_det_area,imprv_det_area_type,[prop_val_yr],[imprv_id],[imprv_det_meth_cd]  
       ,rtrim([imprv_det_val]) as imprv_det_val ,[imprv_det_val_source],[imprv_det_desc],[calc_area],[sketch_area] ,[yr_new],
	   rtrim([yr_built]) as yr_built ,
	   rtrim([depreciation_yr]) as dep_yr ,    
      [imprv_det_adj_factor],
	  rtrim([imprv_det_adj_amt])as imprv_det_adj_amt,[imprv_det_calc_val],[imprv_det_adj_val],[imprv_det_flat_val] ,[economic_pct],[physical_pct]  ,[functional_pct]
      ,[percent_complete]  ,[new_value_flag],[new_value],[new_value_override] ,[use_up_for_pct_base] ,[ref_id1] ,[dep_pct],[add_factor]  ,[size_adj_pct] ,[imprv_det_sub_class_cd]
	  ,rtrim([depreciated_replacement_cost_new]) as rcn ,rtrim([load_factor]) as load_factor
	   ,rtrim([actual_age]) as actual_age ,[net_rentable_area],[recalc_error_validate_flag] ,[recalc_error_validate_date],[recalc_error_validate_user_id]
 
 		  
        
		FROM [pacs_oltp].[dbo].[imprv_detail]
		
		                    

  where prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system) and sale_id=0 and imprv_det_desc like 'Main Area' 
--GROUP BY prop_id,  prop_id,   __AAPARCEL_.CENTROID_X, __AAPARCEL_.CENTROID_Y

GO

