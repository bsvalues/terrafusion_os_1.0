
--Description:
--  This stored procedure deletes all of the segments for the specified property.  This
--  is done when a suspended UDI child property is restored to the parent.  Previously,
--  copies of all of the parent's segments had been made and placed on the child during
--  the suspend process.  These segments should now be removed.
--
--  The following tables must have data deleted:
-- 	imprv
--	imprv_detail
--	imprv_det_adj
--	imprv_mass_adj
--	imprv_adj
--	imprv_owner_assoc
--	imprv_entity_assoc
--	imprv_exemption_assoc
--  imprv_sketch_notes
-- 	land_detail
--	land_owner_assoc
--	land_exemption_assoc
--	land_adj
--	land_mass_adj
--	land_entity_assoc
-- 	pers_prop_seg
--	pers_prop_entity_assoc
--	pers_prop_exemption_assoc
--	pers_prop_owner_assoc
--	pers_prop_sub_seg
--
--Revision History
--1.0 TrentN - Creation

CREATE  PROCEDURE DeletePropertySegments 
	@prop_id      	int,
	@sup_num 	int,
	@prop_val_yr    int
AS


/* delete imprv_entity_assoc */
delete from imprv_entity_assoc
where   prop_id = @prop_id
and	sup_num = @sup_num
and	prop_val_yr = @prop_val_yr
and	sale_id = 0

/* delete imprv_owner_assoc */
DELETE FROM imprv_owner_assoc
WHERE	prop_id = @prop_id AND 
	sup_num = @sup_num AND
	prop_val_yr = @prop_val_yr AND 
	sale_id = 0

/* delete imprv_exemption_assoc */
delete from imprv_exemption_assoc
where   prop_id = @prop_id
and	sup_num = @sup_num
and	prop_val_yr = @prop_val_yr
and	sale_id = 0

/* delete imprv detail adjustments */
delete from imprv_det_adj
where prop_id = @prop_id
and    sup_num = @sup_num
and    prop_val_yr = @prop_val_yr
and    sale_id = 0

/* delete imprv adjustments */
delete from imprv_adj
where prop_id = @prop_id
and  sup_num = @sup_num
and  prop_val_yr = @prop_val_yr
and  sale_id = 0

/* delete from imprv_sketch_note */
delete from imprv_sketch_note
where prop_id = @prop_id
and   sup_num = @sup_num
and   prop_val_yr  = @prop_val_yr
and   sale_id = 0

/* delete from imprv_attr */
delete from imprv_attr
where prop_id = @prop_id
and   sup_num = @sup_num
and   prop_val_yr = @prop_val_yr
and   sale_id = 0

/* delete from imprv_detail */
delete from imprv_detail
where prop_id = @prop_id
and   sup_num = @sup_num
and   prop_val_yr  = @prop_val_yr
and   sale_id = 0

/* delete from imprv */
delete from imprv
where prop_id = @prop_id
and   sup_num = @sup_num
and   prop_val_yr  = @prop_val_yr
and   sale_id = 0

/* delete land_entity_assoc */
delete from land_entity_assoc
where   prop_id = @prop_id
and	sup_num = @sup_num
and	prop_val_yr = @prop_val_yr
and	sale_id = 0

/* delete land_owner_assoc */
DELETE FROM land_owner_assoc
WHERE	prop_id = @prop_id AND 
	sup_num = @sup_num AND
	prop_val_yr = @prop_val_yr AND 
	sale_id = 0

/* delete land_exemption_assoc */
delete from land_exemption_assoc
where   prop_id = @prop_id
and	sup_num = @sup_num
and	prop_val_yr = @prop_val_yr
and	sale_id = 0

/* delete from land_adj */
delete from land_adj
where prop_id = @prop_id
and   sup_num = @sup_num
and   prop_val_yr = @prop_val_yr
and   sale_id = 0

/* delete from land detail */
delete from land_detail
where prop_id = @prop_id
and   sup_num = @sup_num
and   prop_val_yr  = @prop_val_yr
and   sale_id = 0

/* delete pers_prop_entity_assoc */
delete from pers_prop_entity_assoc
where   prop_id = @prop_id
and	sup_num = @sup_num
and	prop_val_yr = @prop_val_yr
and	sale_id = 0

/* delete pers_prop_owner_assoc */
DELETE FROM pers_prop_owner_assoc
WHERE	prop_id = @prop_id AND 
	sup_num = @sup_num AND
	prop_val_yr = @prop_val_yr AND 
	sale_id = 0

/* delete pers_prop_exemption_assoc */
delete from pers_prop_exemption_assoc
where   prop_id = @prop_id
and	sup_num = @sup_num
and	prop_val_yr = @prop_val_yr
and	sale_id = 0

/* delete pers prop segs schedule assocation records*/
delete from pp_seg_sched_assoc
where prop_id = @prop_id
and   sup_num = @sup_num
and   prop_val_yr  = @prop_val_yr 
and   sale_id = 0

/* delete pers prop sub segs */
delete from pers_prop_sub_seg
where prop_id = @prop_id
and   sup_num = @sup_num
and   prop_val_yr  = @prop_val_yr 

/* delete pers prop segs */
delete from pers_prop_seg
where prop_id = @prop_id
and   sup_num = @sup_num
and   prop_val_yr  = @prop_val_yr 
and   sale_id = 0

GO

