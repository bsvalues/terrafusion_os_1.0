


CREATE PROCEDURE MMUndo

	@input_mmid int,
	@input_mm_year int,
	@input_batch_id int,
	@input_user_id int

AS

DECLARE @seq_num int
DECLARE @prop_id int
DECLARE @type varchar(5)
DECLARE @field_name varchar(30)
DECLARE @field_type varchar(10)
DECLARE @adj_type varchar(1)
DECLARE @updated_table varchar(50)
DECLARE @updated_column varchar(50)
DECLARE @updated_id int
DECLARE @old_value varchar(3000)
DECLARE @new_value varchar(3000)
DECLARE @save_value varchar(3000)
DECLARE @bIsNumeric bit
DECLARE @strSQL varchar(5000)
DECLARE @strAdjTypeField varchar(30)
DECLARE @strAdjCode varchar(5)
DECLARE @parent_id int
DECLARE @errno int

SET @errno = 0

SET XACT_ABORT ON
SET NOCOUNT ON

BEGIN TRANSACTION

DECLARE undoCursor CURSOR FAST_FORWARD
FOR SELECT mpi.seq_num, mpi.prop_id, mpi.type, mpi.field_name, field_type, 
			mpi.updated_table, mpi.updated_column, mpi.updated_id, 
			mpi.old_value, mpi.new_value
	FROM mm_prop_info as mpi
	WITH (NOLOCK)
	INNER JOIN mm_detail as md
	WITH (NOLOCK)
	ON mpi.mm_id = md.mm_id
	AND mpi.seq_num = md.seq_num

	/*
	 * Must do LEFT OUTER JOIN because adjustments are not stored here
	 */

	LEFT OUTER JOIN mm_table_field
	WITH (NOLOCK)
	ON mpi.type = mm_table_field.type
	AND mpi.field_name = mm_table_field.field_name
	WHERE mpi.mm_id = @input_mmid
	ORDER BY mpi.seq_num DESC, mpi.old_value

OPEN undoCursor

FETCH NEXT FROM undoCursor INTO @seq_num, @prop_id, @type, @field_name, @field_type,
		@updated_table, @updated_column, @updated_id, @old_value, @new_value

WHILE @@FETCH_STATUS = 0 AND @errno = 0
BEGIN
	/*
	 * First check to see if this was a newly inserted adjustment.  If it was,
	 * it will need to be deleted.
	 */

	IF RIGHT(@updated_table, 3) = 'adj'
	BEGIN
		SET @field_type = 'NUMBER'
	END

	IF @old_value = 'MM_INSERTED'
	BEGIN
		SET @strSQL = 'DELETE FROM ' + @updated_table + ' WHERE '
	END
	ELSE IF @new_value = 'MM_DELETED'
	BEGIN
		IF @updated_table = 'imprv_det_adj'
		BEGIN
			SELECT @parent_id = imprv_id
			FROM imprv_detail
			WHERE prop_id = @prop_id
			AND prop_val_yr = @input_mm_year
			AND sup_num = 0
			AND sale_id = 0
			AND imprv_det_id = @updated_id
		END
		ELSE
		BEGIN
			SET @parent_id = 0
		END

		IF @updated_table = 'land_adj'
		BEGIN
			SELECT @adj_type = land_adj_type_usage
			FROM land_adj_type
			WHERE land_adj_type_year = @input_mm_year
			AND land_adj_type_cd = LEFT(@field_name, CHARINDEX(' (', @field_name) - 1)
		END
		ELSE IF @updated_table = 'imprv_adj' OR @updated_table = 'imprv_det_adj'
		BEGIN
			SELECT @adj_type = imprv_adj_type_usage
			FROM imprv_adj_type
			WHERE imprv_adj_type_year = @input_mm_year
			AND imprv_adj_type_cd = LEFT(@field_name, CHARINDEX(' (', @field_name) - 1)
		END

		IF @updated_table = 'prop_group_assoc' -- HS31672 HM
		BEGIN
			SET @strSQL = 'IF NOT EXISTS( SELECT * FROM ' + @updated_table + ' WHERE prop_id = ' + CONVERT( varchar(12) , @prop_id ) + ' AND '
			SET @strSQL = @strSQL + @updated_column + ' = ''' + @old_value + ''' ) '
			SET @strSQL = @strSQL + 'BEGIN '
			SET @strSQL = @strSQL + 'INSERT INTO ' + @updated_table + ' '
			SET @strSQL = @strSQL + '( prop_id, ' + @updated_column + ' ) Values ( '
			SET @strSQL = @strSQL + CONVERT( varchar(12) , @prop_id ) + ' , '''
			SET @strSQL = @strSQL + @old_value + ''' ) '
			SET @strSQL = @strSQL + 'END '
		END
		ELSE
		BEGIN
		SET @strAdjCode = LEFT(@field_name, CHARINDEX(' (', @field_name) - 1)
		exec MMUpdateAdjustments @prop_id, @input_mm_year, 'I', @parent_id, @type, @updated_id, @strAdjCode, @adj_type, '', @old_value, @updated_column, ''
		END
	END
	ELSE
	BEGIN
		SET @strSQL = 'UPDATE ' + @updated_table + ' '
		SET @strSQL = @strSQL + 'SET ' + @updated_column + ' = '

		/*
		 * Check for field type here to determine whether or not to put quotes
		 * around field and what to CONVERT it to.
		 */

		IF @old_value IS NOT NULL
		BEGIN
			/*
			 * Need to determine if a value is numeric or not.  Previously,
			 * ISNUMERIC was used, but it failed on things like 1D1.  The
			 * easiest way to determine if the value is a number is to
			 * replace all digits with nothing and see if there's anything
			 * left.  In this situation, there may be a '.'.  So as long
			 * as the value wasn't just a '.', it should be numeric.
			 */

			SET @bIsNumeric = 0

			SET @save_value = @old_value
			SET @save_value = REPLACE(@save_value, '0', '')
			SET @save_value = REPLACE(@save_value, '1', '')
			SET @save_value = REPLACE(@save_value, '2', '')
			SET @save_value = REPLACE(@save_value, '3', '')

			SET @save_value = REPLACE(@save_value, '4', '')
			SET @save_value = REPLACE(@save_value, '5', '')
			SET @save_value = REPLACE(@save_value, '6', '')
			SET @save_value = REPLACE(@save_value, '7', '')
			SET @save_value = REPLACE(@save_value, '8', '')
			SET @save_value = REPLACE(@save_value, '9', '')

			IF (@save_value = '' AND @old_value <> '') OR (@save_value = '.' AND @old_value <> '.')
			BEGIN
				SET @bIsNumeric = 1
			END

	
			IF @field_type = 'STRING' OR @field_type = 'DATE'
			BEGIN
--				SET @strSQL = @strSQL + '''' + @old_value + ''' '
				SET @strSQL = @strSQL + QUOTENAME(@old_value, '''') + ' '
			END
			ELSE IF @field_type = 'CODE' AND @bIsNumeric = 0
			BEGIN
				SET @strSQL = @strSQL + '''' + @old_value + ''' '
			END
			ELSE IF @field_type = 'NUMBER' AND @bIsNumeric = 1
			BEGIN
				SET @strSQL = @strSQL + @old_value + ' '
			END
			ELSE IF @bIsNumeric = 0
			BEGIN
				SET @strSQL = @strSQL + '''' + @old_value + ''' '
			END
			ELSE IF @bIsNumeric = 1
			BEGIN
				SET @strSQL = @strSQL + @old_value + ' '
			END
		END
		ELSE
		BEGIN
			/*
			 * This is NOT for adjustments
			 */

			IF @field_name = 'Economic Pct' OR @field_name = 'Functional Pct' OR @field_name = 'Percent Complete'
			BEGIN
				SET @strSQL = @strSQL + '100 '
			END
			ELSE
			BEGIN
				SET @strSQL = @strSQL + 'NULL '
			END
		END
	
		SET @strSQL = @strSQL + 'WHERE ' + @updated_column + ' '

		/*
		 * Check for field type here to determine whether or not to put quotes
		 * around field and what to CONVERT it to.
		 *
		 * NOTE: Only UNDO what was done.  So if someone has changed the value
		 *       between the time Mass Update was run and the Undo was run,
		 *		 leave it alone.
		 */
	
		IF @new_value IS NOT NULL
		BEGIN
			SET @strSQL = @strSQL + ' = '
			SET @bIsNumeric = 0

			SET @save_value = @new_value
			SET @save_value = REPLACE(@save_value, '0', '')
			SET @save_value = REPLACE(@save_value, '1', '')
			SET @save_value = REPLACE(@save_value, '2', '')
			SET @save_value = REPLACE(@save_value, '3', '')
			SET @save_value = REPLACE(@save_value, '4', '')
			SET @save_value = REPLACE(@save_value, '5', '')
			SET @save_value = REPLACE(@save_value, '6', '')
			SET @save_value = REPLACE(@save_value, '7', '')
			SET @save_value = REPLACE(@save_value, '8', '')
			SET @save_value = REPLACE(@save_value, '9', '')

			IF (@save_value = '' AND @new_value <> '') OR (@save_value = '.' AND @new_value <> '.')
			BEGIN
				SET @bIsNumeric = 1
			END

			IF @field_type = 'STRING' OR @field_type = 'DATE'
			BEGIN
--				SET @strSQL = @strSQL + '''' + @new_value + ''' '
				SET @strSQL = @strSQL + QUOTENAME(@new_value, '''') + ' '
			END
			ELSE IF @field_type = 'CODE' AND @bIsNumeric = 0
			BEGIN
				SET @strSQL = @strSQL + '''' + @new_value + ''' '
			END
			ELSE IF @field_type = 'NUMBER' AND @bIsNumeric = 1
			BEGIN
				SET @strSQL = @strSQL + @new_value + ' '
			END
			ELSE IF @bIsNumeric = 0
			BEGIN
				SET @strSQL = @strSQL + '''' + @new_value + ''' '
			END
			ELSE IF @bIsNumeric = 1
			BEGIN
				SET @strSQL = @strSQL + @new_value + ' '
			END
		END
		ELSE
		BEGIN
			SET @strSQL = @strSQL + 'IS NULL '
		END
		SET @strSQL = @strSQL + 'AND '
	END

	IF ( @updated_table <> 'building_permit' AND @updated_table <> 'prop_group_assoc' )
	BEGIN
		SET @strSQL = @strSQL + 'prop_id = ' + CONVERT(varchar(20), @prop_id) + ' '
	END

	IF @updated_table <> 'property' AND @updated_table <> 'building_permit' AND @updated_table <> 'prop_group_assoc'
	BEGIN
		SET @strSQL = @strSQL + 'AND prop_val_yr = ' + CONVERT(varchar(4), @input_mm_year) + ' '
		SET @strSQL = @strSQL + 'AND sup_num = 0 '

		IF @updated_table <> 'property_val'
		BEGIN
			SET @strSQL = @strSQL + 'AND sale_id = 0 '
		END
	END

	IF( @updated_table = 'prop_group_assoc' AND @old_value = 'MM_INSERTED'  )
	BEGIN
		SET @strSQL = @strSQL + 'prop_id = ' + CONVERT(varchar(20), @prop_id) + ' '
		IF LEN( @new_value ) > 0
		BEGIN
			SET @strSQL = @strSQL + 'AND ' + @updated_column + ' = ''' + @new_value + ''' '
		END
	END

	/*
	 * Make sure to use the table's unique id.  This does not include property and
	 * property_val.
	 */

	IF @updated_table <> 'property' AND @updated_table <> 'property_val' AND @updated_table <> 'prop_group_assoc'
	BEGIN
		IF @updated_table = 'land_detail' OR @updated_table = 'land_adj'
		BEGIN
			SET @strSQL = @strSQL + 'AND land_seg_id = '
			SET @strAdjTypeField = 'land_seg_adj_type'
		END
		IF @updated_table = 'imprv' OR @updated_table = 'imprv_adj'
		BEGIN
			SET @strSQL = @strSQL + 'AND imprv_id = '
			SET @strAdjTypeField = 'imprv_adj_type_cd'
		END
		IF @updated_table = 'imprv_detail' OR @updated_table = 'imprv_det_adj'
		BEGIN
			SET @strSQL = @strSQL + 'AND imprv_det_id = '
			SET @strAdjTypeField = 'imprv_adj_type_cd'
		END
		IF @updated_table = 'building_permit'
		BEGIN
			SET @strSQL = @strSQL + 'bldg_permit_id = '
		END

		SET @strSQL = @strSQL + CONVERT(varchar(10), @updated_id) + ' '
	END

	IF RIGHT(@updated_table, 3) = 'adj'
	BEGIN
		SET @strSQL = @strSQL + 'AND ' + @strAdjTypeField + ' = '''
		SET @strSQL = @strSQL + LEFT(@field_name, CHARINDEX(' (', @field_name) - 1) + ''' '
	END

--	print @strSQL

	IF @strSQL <> ''
	BEGIN
		exec(@strSQL)
	END

	SELECT @errno = @@ERROR

	IF @@ROWCOUNT > 0 AND @input_batch_id > 0 AND @errno = 0
	BEGIN
		exec UpdateDailyBatchPropAssoc @input_batch_id, @prop_id
	END

	FETCH NEXT FROM undoCursor INTO @seq_num, @prop_id, @type, @field_name, @field_type,
					@updated_table, @updated_column, @updated_id, @old_value, @new_value
END

CLOSE undoCursor
DEALLOCATE undoCursor


IF @errno = 0
BEGIN
	UPDATE mm_config
	SET mm_undo_dt = getdate(),
		mm_undo_user_id = @input_user_id
	WHERE mm_id = @input_mmid
END

COMMIT TRANSACTION

SET XACT_ABORT OFF

GO

