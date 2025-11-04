
-- This stored procedure copies all property segments for the specified property to a new property that have
-- an owner_assoc entry in any of land_owner_assoc, imprv_owner_assoc, or pers_prop_owner_assoc.  After the
-- copy is complete, the old owner_assoc entries are set to the new property.
-- 
-- History:
-- TrentN	05/19/2004	Created

CREATE PROCEDURE CopyAssociatedSegmentsToNewProperty
	@old_prop_id 	 	int,
	@old_sup_num 	 	int,
	@old_prop_val_yr 	numeric(4,0),
	@old_owner_id 		int,
	@new_prop_id 		int,
	@new_sup_num 		int,
	@new_prop_val_yr 	numeric(4,0),
	@new_owner_id		int
AS

declare @seg_id 		int
declare @sale_id int

/* copy land segments with an owner_assoc entry */
DECLARE land_owner_assoc_cursor SCROLL CURSOR
FOR SELECT 
	land_seg_id, sale_id
FROM    land_owner_assoc
WHERE 	prop_id = @old_prop_id AND 
	prop_val_yr = @old_prop_val_yr AND 
	sup_num = @old_sup_num AND 
	owner_id = @old_owner_id

OPEN land_owner_assoc_cursor
FETCH NEXT FROM land_owner_assoc_cursor INTO
	@seg_id, @sale_id

declare @next_land_seg_id	int

WHILE (@@FETCH_STATUS = 0)
BEGIN
	exec @next_land_seg_id = dbo.CopySegmentLandToNewProperty @seg_id, @old_prop_id, @old_sup_num, @old_prop_val_yr, @new_prop_id, @new_sup_num, @new_prop_val_yr, @sale_id, @sale_id

	INSERT INTO land_owner_assoc (prop_id, sup_num, prop_val_yr, land_seg_id, sale_id, owner_id, owner_pct)
	       (SELECT	@new_prop_id,
			@new_sup_num,
			@new_prop_val_yr,
			@next_land_seg_id,
			@sale_id,
			@new_owner_id,
			owner_pct
		FROM 	land_owner_assoc WITH (NOLOCK)
		WHERE 	prop_id = @old_prop_id AND 
			sup_num = @old_sup_num AND
			prop_val_yr = @old_prop_val_yr AND 
			owner_id = @old_owner_id AND 
			land_seg_id = @seg_id AND
			sale_id = @sale_id
		)

	FETCH NEXT FROM land_owner_assoc_cursor INTO
		@seg_id, @sale_id
END

CLOSE land_owner_assoc_cursor
DEALLOCATE land_owner_assoc_cursor

/* copy improvement segments with an owner_assoc entry */
DECLARE imprv_owner_assoc_cursor SCROLL CURSOR
FOR SELECT 
	imprv_id, sale_id
FROM    imprv_owner_assoc
WHERE 	prop_id = @old_prop_id AND 
	prop_val_yr = @old_prop_val_yr AND 
	sup_num = @old_sup_num AND 
	owner_id = @old_owner_id

OPEN imprv_owner_assoc_cursor
FETCH NEXT FROM imprv_owner_assoc_cursor INTO
	@seg_id, @sale_id

declare @next_imprv_id	int

WHILE (@@FETCH_STATUS = 0)
BEGIN
	exec @next_imprv_id = dbo.CopySegmentImprvToNewProperty @seg_id, @old_prop_id, @old_sup_num, @old_prop_val_yr, @new_prop_id, @new_sup_num, @new_prop_val_yr, @sale_id, @sale_id

	INSERT INTO imprv_owner_assoc (prop_id, sup_num, prop_val_yr, imprv_id, sale_id, owner_id, owner_pct)
	       (SELECT	@new_prop_id,
			@new_sup_num,
			@new_prop_val_yr,
			@next_imprv_id,
			@sale_id,
			@new_owner_id,
			owner_pct
		FROM 	imprv_owner_assoc WITH (NOLOCK)
		WHERE 	prop_id = @old_prop_id AND 
			sup_num = @old_sup_num AND
			prop_val_yr = @old_prop_val_yr AND 
			owner_id = @old_owner_id AND 
			imprv_id = @seg_id AND
			sale_id = @sale_id
		)

	FETCH NEXT FROM imprv_owner_assoc_cursor INTO
		@seg_id, @sale_id
END

CLOSE imprv_owner_assoc_cursor
DEALLOCATE imprv_owner_assoc_cursor


/* copy personal property segments with an owner_assoc entry */
DECLARE pers_prop_owner_assoc_cursor SCROLL CURSOR
FOR SELECT 
	pp_seg_id
FROM    pers_prop_owner_assoc
WHERE 	prop_id = @old_prop_id AND 
	prop_val_yr = @old_prop_val_yr AND 
	sup_num = @old_sup_num AND 
	owner_id = @old_owner_id

OPEN pers_prop_owner_assoc_cursor
FETCH NEXT FROM pers_prop_owner_assoc_cursor INTO
	@seg_id

declare @next_pp_seg_id		int

WHILE (@@FETCH_STATUS = 0)
BEGIN
	exec @next_pp_seg_id = dbo.CopySegmentPersPropToNewProperty @seg_id, @old_prop_id, @old_sup_num, @old_prop_val_yr, @new_prop_id, @new_sup_num, @new_prop_val_yr

	INSERT INTO pers_prop_owner_assoc (prop_id, sup_num, prop_val_yr, pp_seg_id, sale_id, owner_id, owner_pct)
	       (SELECT	@new_prop_id,
			@new_sup_num,
			@new_prop_val_yr,
			@next_pp_seg_id,
			0,
			@new_owner_id,
			owner_pct
		FROM 	pers_prop_owner_assoc WITH (NOLOCK)
		WHERE 	prop_id = @old_prop_id AND 
			sup_num = @old_sup_num AND
			prop_val_yr = @old_prop_val_yr AND 
			owner_id = @old_owner_id AND 
			pp_seg_id = @seg_id
		)

	FETCH NEXT FROM pers_prop_owner_assoc_cursor INTO
		@seg_id
END

CLOSE pers_prop_owner_assoc_cursor
DEALLOCATE pers_prop_owner_assoc_cursor

GO

