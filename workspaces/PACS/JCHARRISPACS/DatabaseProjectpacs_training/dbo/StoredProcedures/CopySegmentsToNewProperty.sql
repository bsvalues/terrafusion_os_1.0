
-- This stored procedure copies all property segments for the specified property to a new property.
-- 
-- History:
-- TrentN	05/01/2004	Created

CREATE PROCEDURE CopySegmentsToNewProperty
	@old_prop_id 		int,
	@old_sup_num 		int,
	@old_prop_val_yr 	numeric(4,0),
	@old_owner_id 		int,
	@new_prop_id 		int,
	@new_sup_num 		int,
	@new_prop_val_yr 	numeric(4,0),
	@new_owner_id 		int
AS

declare @seg_id 		int
declare @sale_id int

/* copy land segments */
DECLARE land_segment_cursor SCROLL CURSOR
FOR SELECT 
	land_seg_id, sale_id
FROM    land_detail
WHERE 	prop_id = @old_prop_id AND 
	prop_val_yr = @old_prop_val_yr AND 
	sup_num = @old_sup_num

OPEN land_segment_cursor
FETCH NEXT FROM land_segment_cursor INTO
	@seg_id, @sale_id

declare @next_land_seg_id	int

WHILE (@@FETCH_STATUS = 0)
BEGIN
	exec @next_land_seg_id = dbo.CopySegmentLandToNewProperty @seg_id, @old_prop_id, @old_sup_num, @old_prop_val_yr, @new_prop_id, @new_sup_num, @new_prop_val_yr, @sale_id, @sale_id

	UPDATE  land_owner_assoc
	SET	prop_id = @new_prop_id,
		sup_num = @new_sup_num,
		prop_val_yr = @new_prop_val_yr,
		owner_id = @new_owner_id,
		land_seg_id = @next_land_seg_id 
	WHERE	prop_id = @old_prop_id AND 
		sup_num = @old_sup_num AND
		prop_val_yr = @old_prop_val_yr AND 
		owner_id = @old_owner_id AND 
		land_seg_id = @seg_id AND
		sale_id = @sale_id

	FETCH NEXT FROM land_segment_cursor INTO
		@seg_id, @sale_id
END

CLOSE land_segment_cursor
DEALLOCATE land_segment_cursor

/* copy improvement segments */
DECLARE imprv_segment_cursor SCROLL CURSOR
FOR SELECT 
	imprv_id, sale_id
FROM    imprv
WHERE 	prop_id = @old_prop_id AND 
	prop_val_yr = @old_prop_val_yr AND 
	sup_num = @old_sup_num

OPEN imprv_segment_cursor
FETCH NEXT FROM imprv_segment_cursor INTO
	@seg_id, @sale_id

declare @next_imprv_id	int

WHILE (@@FETCH_STATUS = 0)
BEGIN
	exec @next_imprv_id = dbo.CopySegmentImprvToNewProperty @seg_id, @old_prop_id, @old_sup_num, @old_prop_val_yr, @new_prop_id, @new_sup_num, @new_prop_val_yr, @sale_id, @sale_id

	UPDATE  imprv_owner_assoc
	SET	prop_id = @new_prop_id,
		sup_num = @new_sup_num,
		prop_val_yr = @new_prop_val_yr,
		owner_id = @new_owner_id,
		imprv_id = @next_imprv_id 
	WHERE	prop_id = @old_prop_id AND 
		sup_num = @old_sup_num AND
		prop_val_yr = @old_prop_val_yr AND 
		owner_id = @old_owner_id AND 
		imprv_id = @seg_id and
		sale_id = @sale_id

	FETCH NEXT FROM imprv_segment_cursor INTO
		@seg_id, @sale_id
END

CLOSE imprv_segment_cursor
DEALLOCATE imprv_segment_cursor


/* copy personal property segments */
DECLARE pp_segment_cursor SCROLL CURSOR
FOR SELECT 
	pp_seg_id
FROM    pers_prop_seg
WHERE 	prop_id = @old_prop_id AND 
	prop_val_yr = @old_prop_val_yr AND 
	sup_num = @old_sup_num

OPEN pp_segment_cursor
FETCH NEXT FROM pp_segment_cursor INTO
	@seg_id

declare @next_pp_seg_id		int

WHILE (@@FETCH_STATUS = 0)
BEGIN
	exec @next_pp_seg_id = dbo.CopySegmentPersPropToNewProperty @seg_id, @old_prop_id, @old_sup_num, @old_prop_val_yr, @new_prop_id, @new_sup_num, @new_prop_val_yr

	UPDATE  pers_prop_owner_assoc
	SET	prop_id = @new_prop_id,
		sup_num = @new_sup_num,
		prop_val_yr = @new_prop_val_yr,
		owner_id = @new_owner_id,
		pp_seg_id = @next_pp_seg_id 
	WHERE	prop_id = @old_prop_id AND 
		sup_num = @old_sup_num AND
		prop_val_yr = @old_prop_val_yr AND 
		owner_id = @old_owner_id AND 
		pp_seg_id = @seg_id

	FETCH NEXT FROM pp_segment_cursor INTO
		@seg_id
END

CLOSE pp_segment_cursor
DEALLOCATE pp_segment_cursor

GO

