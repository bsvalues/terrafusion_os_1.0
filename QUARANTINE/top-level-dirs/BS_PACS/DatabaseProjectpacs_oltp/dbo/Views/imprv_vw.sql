

CREATE VIEW dbo.imprv_vw
AS
SELECT imprv.prop_id, 
    imprv.prop_val_yr, imprv.imprv_id, imprv.sup_num, 
    imprv.sale_id, imprv_type.imprv_type_cd, 
    imprv_type.imprv_type_desc, imprv_type.mobile_home,
    imprv.imprv_sl_locked, imprv.primary_imprv, imprv.imprv_state_cd, 
    imprv.imprv_homesite, imprv.imprv_desc, 
    imprv.imprv_val, imprv.misc_cd, imprv.imp_new_yr, 
    imprv.imp_new_val, imprv.original_val, 
    imprv.base_val, imprv.living_area_up, imprv.err_flag, 
    imprv.imprv_image_url, imprv.imprv_cmnt, 
    imprv.mbl_hm_make, imprv.mbl_hm_model, 
    imprv.mbl_hm_sn, imprv.mbl_hm_sn_2, imprv.mbl_hm_sn_3, 
    imprv.mbl_hm_hud_num, imprv.mbl_hm_hud_num_2, imprv.mbl_hm_hud_num_3, 
    imprv.mbl_hm_title_num
FROM imprv INNER JOIN
    imprv_type ON 
    imprv.imprv_type_cd = imprv_type.imprv_type_cd

GO

