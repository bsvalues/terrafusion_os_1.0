

CREATE VIEW dbo.appr_card_imprv_vw
AS
SELECT 	imprv.prop_val_yr, imprv.sup_num, imprv.imprv_type_cd, 
    	imprv.imprv_homesite, imprv.imprv_state_cd, 
    	imprv.imprv_desc, imprv.imprv_adj_factor, 
    	imprv.economic_pct, imprv.physical_pct, imprv.functional_pct, 
    	imprv.percent_complete, imprv.imprv_cmnt, imprv_type.imprv_type_desc, 
    	imprv_detail.imprv_det_type_cd, imprv_detail.imprv_det_desc, 
    	imprv_detail.imprv_det_meth_cd, 
    	imprv_detail.imprv_det_class_cd, 
	imprv_detail.imprv_det_sub_class_cd AS imprv_det_sub_class_cd,
    	imprv_detail.imprv_det_area, imprv_detail.unit_price, 
    	imprv_detail.yr_built, 
    	imprv_detail.physical_pct AS imprv_det_physical_pct, 
    	imprv_detail.economic_pct AS imprv_det_economic_pct, 
    	imprv_detail.functional_pct AS imprv_det_functional_pct, 
    	imprv_detail.percent_complete AS imprv_det_percent_complete,
     	imprv_detail.imprv_det_val, imprv_detail.depreciation_yr, 
    	imprv_detail.condition_cd, imprv_detail.imprv_det_val_source, 
    	imprv_detail.imprv_det_flat_val, 
    	imprv_detail.imprv_det_calc_val, 
    	imprv_detail.physical_pct_override, 
    	imprv_detail.physical_pct_source, 
    	imprv_detail.economic_pct_override, 
    	imprv_detail.functional_pct_override, 
    	imprv_detail.imprv_det_adj_factor, imprv.prop_id, 
    	imprv_detail.sketch_cmds, imprv.imprv_id, 
    	imprv_det_type.imprv_det_typ_desc, 
    	imprv_detail.percent_complete_override, imprv.imprv_val, 
    	imprv_detail.imprv_det_id, imprv.sale_id, imprv.calc_val, 
    	imprv.flat_val, imprv.imprv_val_source,
	    imprv_detail.depreciation_yr_override,
	    imprv.effective_yr_blt,
	    imprv_detail.num_units AS num_units, 
        imprv_detail.dep_pct as imprv_det_dep_pct,
		hs_pct_override,
		hs_pct 
FROM 	imprv_det_type 
	RIGHT OUTER JOIN imprv_detail ON 
		imprv_det_type.imprv_det_type_cd = imprv_detail.imprv_det_type_cd
     	RIGHT OUTER JOIN imprv ON 
		imprv_detail.prop_id = imprv.prop_id AND 
    		imprv_detail.prop_val_yr = imprv.prop_val_yr AND 
    		imprv_detail.imprv_id = imprv.imprv_id AND 
    		imprv_detail.sup_num = imprv.sup_num AND 
    		imprv_detail.sale_id = imprv.sale_id 
	LEFT OUTER JOIN imprv_type ON 
		imprv.imprv_type_cd = imprv_type.imprv_type_cd

GO

