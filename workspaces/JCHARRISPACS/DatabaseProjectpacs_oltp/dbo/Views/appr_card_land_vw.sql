


CREATE VIEW dbo.appr_card_land_vw
AS
SELECT land_detail.prop_id, land_detail.prop_val_yr, 
    land_detail.land_seg_id, land_detail.sup_num, 
    land_detail.land_type_cd, land_detail.state_cd, 
    land_detail.land_seg_homesite, land_detail.size_acres, 
    land_detail.size_square_feet, land_detail.effective_front, 
    land_detail.effective_depth, land_detail.mkt_unit_price, 
    land_detail.land_seg_mkt_val, land_detail.mkt_calc_val, 
    land_detail.mkt_val_source, land_detail.ag_unit_price, 
    land_detail.ag_apply, land_detail.ag_val, 
    land_detail.land_adj_factor, land_detail.land_mass_adj_factor, 
    land_type.land_type_desc, land_detail.ag_use_cd, 
    land_detail.sale_id, land_detail.land_seg_comment, 
	land_sched1.ls_method, land_sched.ls_code, 
    land_sched1.ls_code AS mkt_ls_code,
    hs_pct_override,
    hs_pct
FROM land_detail LEFT OUTER JOIN
    land_sched ON 
    land_detail.prop_val_yr = land_sched.ls_year AND 
    land_detail.ls_ag_id = land_sched.ls_id LEFT OUTER JOIN
    land_sched land_sched1 ON 
    land_detail.prop_val_yr = land_sched1.ls_year AND 
    land_detail.ls_mkt_id = land_sched1.ls_id LEFT OUTER JOIN
    land_type ON 
    land_detail.land_type_cd = land_type.land_type_cd

GO

