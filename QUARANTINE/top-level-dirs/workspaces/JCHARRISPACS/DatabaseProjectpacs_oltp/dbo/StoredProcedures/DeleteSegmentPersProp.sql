
-- This stored procedure deletes all pers_prop data for an personal property segment (specified as a parameter).
-- The following tables have data deleted:
-- 	pers_prop_seg
--	pers_prop_entity_assoc
--	pers_prop_exemption_assoc
--	pers_prop_owner_assoc
--	pers_prop_sub_seg
-- 
-- History:
-- TrentN	05/01/2004	Created

CREATE PROCEDURE DeleteSegmentPersProp
	@seg_id int,
	@old_prop_id int,
	@old_sup_num int,
	@old_prop_val_yr numeric(4,0)
AS


-- pers_prop_exemption_assoc
DELETE FROM pers_prop_exemption_assoc 
WHERE pp_seg_id 	= @seg_id AND 
      prop_id 		= @old_prop_id AND
      sup_num		= @old_sup_num AND 
      prop_val_yr 	= @old_prop_val_yr

-- pers_prop_entity_assoc
DELETE FROM pers_prop_entity_assoc 
WHERE pp_seg_id 	= @seg_id AND 
      prop_id 		= @old_prop_id AND
      sup_num		= @old_sup_num AND 
      prop_val_yr 	= @old_prop_val_yr

-- pers_prop_owner_assoc
DELETE FROM pers_prop_owner_assoc 
WHERE pp_seg_id 	= @seg_id AND 
      prop_id 		= @old_prop_id AND
      sup_num		= @old_sup_num AND 
      prop_val_yr 	= @old_prop_val_yr

-- pers_prop_sub_seg
DELETE FROM pers_prop_sub_seg 
WHERE pp_seg_id 	= @seg_id AND 
      prop_id 		= @old_prop_id AND
      sup_num		= @old_sup_num AND 
      prop_val_yr 	= @old_prop_val_yr

-- pers_prop_seg
DELETE FROM pers_prop_seg
WHERE pp_seg_id 	= @seg_id AND 
      prop_id 		= @old_prop_id AND
      sup_num		= @old_sup_num AND 
      prop_val_yr 	= @old_prop_val_yr

GO

