

-- This stored procedure deletes all land data for an land segment (specified as a parameter).:
-- The following tables have data deleted:
-- 	land_detail
--	land_owner_assoc
--	land_exemption_assoc
--	land_adj
--	land_entity_assoc
-- 
-- History:
-- TrentN	05/01/2004	Created

CREATE PROCEDURE DeleteSegmentLand
	@seg_id int,
	@old_prop_id int,
	@old_sup_num int,
	@old_prop_val_yr numeric(4,0)
AS

-- user_land_detail
delete from user_land_detail
where land_seg_id = @seg_id and 
	prop_val_yr = @old_prop_val_yr and
	sup_num = @old_sup_num and
	prop_id = @old_prop_id

-- land_detail_characteristic
delete land_detail_characteristic
where land_seg_id = @seg_id and
	prop_val_yr = @old_prop_val_yr and
	sup_num = @old_sup_num and
	prop_id = @old_prop_id

-- land_adj
DELETE FROM land_adj 
WHERE land_seg_id 	= @seg_id AND 
      prop_id 		= @old_prop_id AND
      sup_num		= @old_sup_num AND 
      prop_val_yr 	= @old_prop_val_yr

-- land_entity_assoc
DELETE FROM land_entity_assoc 
WHERE land_seg_id 	= @seg_id AND 
      prop_id 		= @old_prop_id AND
      sup_num		= @old_sup_num AND 
      prop_val_yr 	= @old_prop_val_yr

-- land_exemption_assoc
DELETE FROM land_exemption_assoc 
WHERE land_seg_id 	= @seg_id AND 
      prop_id 		= @old_prop_id AND
      sup_num		= @old_sup_num AND 
      prop_val_yr 	= @old_prop_val_yr

-- land_owner_assoc
DELETE FROM land_owner_assoc 
WHERE land_seg_id 	= @seg_id AND 
      prop_id 		= @old_prop_id AND
      sup_num		= @old_sup_num AND 
      prop_val_yr 	= @old_prop_val_yr

-- property_exemption_dor_detail
delete property_exemption_dor_detail
where exmpt_tax_yr = @old_prop_val_yr and
	owner_tax_yr = @old_prop_val_yr and
	sup_num = @old_sup_num and
	prop_id = @old_prop_id and
	item_type = 'L' and
	item_id = @seg_id

-- land_detail
DELETE FROM land_detail
WHERE land_seg_id 	= @seg_id AND 
      prop_id 		= @old_prop_id AND
      sup_num		= @old_sup_num AND 
      prop_val_yr 	= @old_prop_val_yr

GO

