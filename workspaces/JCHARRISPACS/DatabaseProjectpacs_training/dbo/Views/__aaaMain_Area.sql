Create view __aaaMain_Area as
SELECT  [prop_id]
      ,[prop_val_yr],[imprv_id]
	 , [imprv_det_id] 
	  ,[sup_num] 
	   ,[sale_id] 
	   ,[imprv_det_class_cd]
	   ,[imprv_det_meth_cd] 
	    ,[imprv_det_type_cd] 
		,[seq_num] ,[imprv_det_val]
		 ,[imprv_det_val_source]
      ,[imprv_det_desc] 
	  ,[imprv_det_area] 
	  ,[imprv_det_area_type] 
	  ,[calc_area] 
	  ,[sketch_area]
	   ,  imprv_det_calc_val
	   , depreciated_replacement_cost_new 
	    ,physical_pct, economic_pct
		,functional_pct,new_value,
		new_value_flag
  ,add_factor
  ,depreciation_yr
  , yr_new,use_up_for_pct_base
  ,stories_multiplier
  , imprv_det_adj_factor
  ,imprv_det_adj_val
  ,dep_pct_override
  ,physical_pct_override
  ,functional_pct_override
  ,economic_pct_override
  ,size_adj_pct,size_adj_pct_override,imprv_det_cost_unit_price, imprv_det_ms_unit_price, imprv_det_orig_up, imprv_det_orig_val, load_factor

 
  FROM [pacs_oltp].[dbo].[imprv_detail]
	 where --prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)
			--and sale_id=0
			--and
			imprv_det_desc='Main Area' 
			--as id on imprv_fix.prop_id = id.prop_id AND imprv_fix.imprv_id = id.imprv_id AND 			imprv_items.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system) 

GO

