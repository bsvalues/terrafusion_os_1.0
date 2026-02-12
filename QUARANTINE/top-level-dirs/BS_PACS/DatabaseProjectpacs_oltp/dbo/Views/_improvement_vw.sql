

CREATE VIEW _improvement_vw
AS
SELECT dbo.imprv_detail.prop_id, dbo.imprv_detail.prop_val_yr, 
    dbo.imprv_detail.imprv_id, dbo.imprv.imprv_type_cd, 
    dbo.imprv.imprv_homesite, dbo.imprv_detail.imprv_det_id, 
    dbo.imprv.imprv_val, dbo.imprv_detail.imprv_det_type_cd, 
    dbo.imprv_detail.imprv_det_meth_cd, 
    dbo.imprv_detail.imprv_det_class_cd, 
    dbo.imprv_detail.imprv_det_desc, 
    dbo.imprv_detail.imprv_det_area, 
    dbo.imprv_detail.condition_cd, dbo.imprv_detail.length, 
    dbo.imprv_detail.width, dbo.imprv_detail.height, 
    dbo.imprv_detail.unit_price, dbo.imprv_detail.yr_new, 
    dbo.imprv_detail.yr_built, dbo.imprv_detail.depreciation_yr, 
    dbo.imprv_detail.economic_pct, dbo.imprv_detail.physical_pct, 
    dbo.imprv_detail.functional_pct, 
    dbo.imprv_detail.percent_complete, 
    dbo.imprv_detail.imprv_det_val, dbo.account.file_as_name, 
    dbo.property.geo_id, dbo.owner.owner_id, 
    dbo.property_val.abs_subdv_cd, dbo.imprv_detail.sup_num, 
    dbo.imprv_detail.sale_id
FROM dbo.account INNER JOIN
    dbo.owner ON 
    dbo.account.acct_id = dbo.owner.owner_id INNER JOIN
    dbo.imprv INNER JOIN
    dbo.imprv_detail ON 
    dbo.imprv.prop_id = dbo.imprv_detail.prop_id AND 
    dbo.imprv.prop_val_yr = dbo.imprv_detail.prop_val_yr AND 
    dbo.imprv.imprv_id = dbo.imprv_detail.imprv_id AND 
    dbo.imprv.sup_num = dbo.imprv_detail.sup_num AND 
    dbo.imprv.sale_id = dbo.imprv_detail.sale_id INNER JOIN
    dbo.property ON 
    dbo.imprv.prop_id = dbo.property.prop_id INNER JOIN
    dbo.property_val ON 
    dbo.imprv.prop_id = dbo.property_val.prop_id AND 
    dbo.imprv.prop_val_yr = dbo.property_val.prop_val_yr AND 
    dbo.imprv.sup_num = dbo.property_val.sup_num AND 
    dbo.property.prop_id = dbo.property_val.prop_id ON 
    dbo.owner.prop_id = dbo.property_val.prop_id AND 
    dbo.owner.owner_tax_yr = dbo.property_val.prop_val_yr AND 
    dbo.owner.sup_num = dbo.property_val.sup_num

GO

