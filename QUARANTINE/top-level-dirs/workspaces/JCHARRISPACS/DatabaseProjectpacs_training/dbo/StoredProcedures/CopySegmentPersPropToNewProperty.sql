
-- This stored procedure copies a personal property segment (specified as a parameter) to a new personal property segment.
-- The following tables have data that is copied to have the next personal property segment ID and the specified
-- new property ID, new supplement number, and new property value year:
-- 	pers_prop_seg
--	pers_prop_entity_assoc
--	pers_prop_exemption_assoc
--	pers_prop_owner_assoc - James - not sure why this is listed here, it isn't copied
--	pers_prop_sub_seg
-- 
-- History:
-- TrentN	05/01/2004	Created

CREATE PROCEDURE CopySegmentPersPropToNewProperty
	@seg_id int,
	@old_prop_id int,
	@old_sup_num int,
	@old_prop_val_yr numeric(4,0),
	@new_prop_id int,
	@new_sup_num int,
	@new_prop_val_yr numeric(4,0)
AS

	declare @new_seg_id int

	exec @new_seg_id = dbo.LayerCopyPersonal
		-- From
		@old_prop_val_yr,
		@old_sup_num,
		@old_prop_id,
		-- To
		@new_prop_val_yr,
		@new_sup_num,
		@new_prop_id,

		1, -- Assign new IDs
		@seg_id, -- One segment
		0, 0, 1 -- Skip entity/exemption/owner assoc

	return(@new_seg_id)

GO

