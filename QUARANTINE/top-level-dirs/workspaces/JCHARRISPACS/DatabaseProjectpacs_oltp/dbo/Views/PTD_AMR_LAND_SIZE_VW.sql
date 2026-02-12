







CREATE VIEW dbo.PTD_AMR_LAND_SIZE_VW
AS
SELECT prop_supp_assoc.prop_id, 
    prop_supp_assoc.owner_tax_yr, land_detail.size_acres, 
    land_detail.size_square_feet, land_detail.effective_front, 
    land_detail.ag_apply, 
    land_sched.ls_method AS ls_ag_method, 
    land_sched1.ls_method AS ls_mkt_method
FROM prop_supp_assoc INNER JOIN
    land_detail ON 
    prop_supp_assoc.prop_id = land_detail.prop_id AND 
    prop_supp_assoc.owner_tax_yr = land_detail.prop_val_yr AND 
    prop_supp_assoc.sup_num = land_detail.sup_num LEFT OUTER
     JOIN
    land_sched land_sched1 ON 
    land_detail.ls_mkt_id = land_sched1.ls_id AND 
    land_detail.prop_val_yr = land_sched1.ls_year LEFT OUTER JOIN
    land_sched ON land_detail.ls_ag_id = land_sched.ls_id AND 
    land_detail.prop_val_yr = land_sched.ls_year

GO

