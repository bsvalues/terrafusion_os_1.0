




/****** Object:  View dbo.appr_card_imprv_features_vw    Script Date: 2/1/00 10:59:48 AM ******/
CREATE VIEW dbo.appr_card_imprv_features_vw
AS
SELECT imprv_attr.imprv_id, imprv_attr.prop_id, 
    imprv_attr.imprv_det_id, imprv_attr.imprv_attr_id, 
    imprv_attr.prop_val_yr, imprv_attr.sup_num, 
    imprv_attr.i_attr_val_id, imprv_attr.i_attr_val_cd, 
    imprv_attr.imprv_attr_val, attribute.imprv_attr_desc, 
    imprv_attr.sale_id, imprv_attr.i_attr_unit
FROM imprv_attr LEFT OUTER JOIN
    attribute ON imprv_attr.i_attr_val_id = attribute.imprv_attr_id

GO

