
-- This stored procedure deletes all owner association data for a specified property owner.:
-- The following tables have data deleted:
-- 	imprv_owner_assoc
--	land_owner_assoc
--	pers_prop_owner_assoc
-- 
-- History:
-- TrentN	06/09/2004	Created

CREATE PROCEDURE DeleteOwnerAssocRecords
	@prop_id int,
	@sup_num int,
	@prop_val_yr numeric(4,0),
	@owner_id int
AS


-- imprv_owner_assoc
DELETE FROM imprv_owner_assoc 
WHERE prop_id 		= @prop_id AND
      sup_num		= @sup_num AND 
      prop_val_yr 	= @prop_val_yr AND 
      owner_id		= @owner_id

-- land_owner_assoc
DELETE FROM land_owner_assoc 
WHERE prop_id 		= @prop_id AND
      sup_num		= @sup_num AND 
      prop_val_yr 	= @prop_val_yr AND 
      owner_id		= @owner_id

-- pers_prop_owner_assoc
DELETE FROM pers_prop_owner_assoc 
WHERE prop_id 		= @prop_id AND
      sup_num		= @sup_num AND 
      prop_val_yr 	= @prop_val_yr AND 
      owner_id		= @owner_id

GO

