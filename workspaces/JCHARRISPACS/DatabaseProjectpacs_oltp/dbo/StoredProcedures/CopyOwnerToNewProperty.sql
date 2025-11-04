
-- This stored procedure copies an owner for a specific property to a new property.
-- 
-- History:
-- TrentN	05/04/2004	Created

CREATE PROCEDURE CopyOwnerToNewProperty
        @owner_id		int,
	@old_prop_id 		int,
	@old_sup_num 		int,
	@old_prop_val_yr 	numeric(4,0),
	@new_prop_id 		int,
	@new_sup_num 		int,
	@new_prop_val_yr 	numeric(4,0)
AS

	exec dbo.LayerCopyTableOwner
		@old_prop_val_yr,
		@old_sup_num,
		@old_prop_id,
		@new_prop_val_yr,
		@new_sup_num,
		@new_prop_id,
		@owner_id, -- Copy from specific owner
		1 -- Copy roll_* columns

GO

