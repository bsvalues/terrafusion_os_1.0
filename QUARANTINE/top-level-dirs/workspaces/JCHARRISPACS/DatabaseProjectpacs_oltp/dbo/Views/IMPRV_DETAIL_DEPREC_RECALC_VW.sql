

CREATE VIEW dbo.IMPRV_DETAIL_DEPREC_RECALC_VW
AS
SELECT imprv_detail.prop_id, 
    imprv_detail.prop_val_yr, imprv_detail.imprv_id, 
    imprv_detail.imprv_det_id, imprv_detail.sup_num, 
    imprv_detail.sale_id, imprv_detail.imprv_det_class_cd, 
    imprv_detail.imprv_det_meth_cd, 
    imprv_detail.imprv_det_type_cd, 
    imprv_sched.imprv_sched_deprec_cd, 
    depreciation_detail.deprec_year_max, 
    depreciation_detail.deprec_year_pct, 
    depreciation.prop_type_cd, imprv_detail.condition_cd, 
    depreciation.type_cd
FROM imprv_detail LEFT OUTER JOIN
    imprv_sched INNER JOIN
    depreciation INNER JOIN
    depreciation_detail ON 
    depreciation.type_cd = depreciation_detail.type_cd AND 
    depreciation.deprec_cd = depreciation_detail.deprec_cd AND 
    depreciation.year = depreciation_detail.year AND 
    depreciation.prop_type_cd = depreciation_detail.prop_type_cd ON
     imprv_sched.imprv_sched_deprec_cd = depreciation.deprec_cd
     AND imprv_sched.imprv_yr = depreciation.year ON 
    imprv_detail.imprv_det_class_cd = imprv_sched.imprv_det_class_cd
     AND 
    imprv_detail.imprv_det_meth_cd = imprv_sched.imprv_det_meth_cd
     AND 
    imprv_detail.imprv_det_type_cd = imprv_sched.imprv_det_type_cd
     AND imprv_detail.prop_val_yr = imprv_sched.imprv_yr AND 
    imprv_detail.condition_cd = depreciation.type_cd

GO

