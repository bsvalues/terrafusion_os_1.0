

CREATE VIEW dbo.LAND_DETAIL_VW
AS
SELECT
	ld.prop_id,
	ld.prop_val_yr,
	ld.land_seg_id,
	ld.sup_num,
	ld.sale_id,
	ld.ls_mkt_id,
	ld.ls_ag_id,
	ld.land_type_cd,
	ld.land_seg_desc,
	ld.land_seg_sl_lock,
	ld.state_cd,
	ld.land_seg_homesite,
	ld.size_acres,
	ld.size_square_feet,
	ld.effective_front,
	ld.effective_depth,
	ld.width_back,
	ld.width_front,
	ld.depth_left,
	ld.depth_right,
	ld.mkt_unit_price,
	ld.land_seg_mkt_val,
	ld.ag_loss,
	ld.ag_use_cd,
	ld.ag_unit_price,
	ld.ag_apply,
	ld.ag_val,
	ld.ag_val_type,
	ld.ag_timb_conv_dt,
	ld.land_seg_comment,
	ld.ag_apply_yr,
	ld.land_seg_orig_val,
	ld.land_seg_up,
	sc.state_cd_desc,
	lt.land_type_desc,
	ld.land_new_val,
	dbo.land_sched.ls_code,
	ld.oa_mkt_val,
	ld.oa_ag_val,
	ld.mkt_val_source,
	ld.land_adj_factor,
	ld.late_ag_apply,
	ld.num_lots,
	ld.new_ag,
	ld.new_ag_prev_val,
	ld.ref_id1,
	ld.size_useable_acres,
	ld.size_useable_square_feet,
	ls2.ls_code as market_class,
	hs_pct_override,
	hs_pct,
	ld.land_soil_code
FROM
	dbo.state_code sc
INNER JOIN
	dbo.land_detail ld
ON
	sc.state_cd = ld.state_cd
INNER JOIN
	dbo.land_type lt
ON
	ld.land_type_cd = lt.land_type_cd
LEFT OUTER JOIN
	dbo.land_sched
ON
	ld.ls_ag_id = dbo.land_sched.ls_id
AND	ld.prop_val_yr = dbo.land_sched.ls_year
LEFT OUTER JOIN
	dbo.land_sched ls2
ON	ld.ls_mkt_id = ls2.ls_id
AND	ld.prop_val_yr = ls2.ls_year

GO

