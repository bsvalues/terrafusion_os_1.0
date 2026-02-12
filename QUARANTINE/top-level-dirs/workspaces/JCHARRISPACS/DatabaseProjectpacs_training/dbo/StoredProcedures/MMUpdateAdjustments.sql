
CREATE PROCEDURE MMUpdateAdjustments

	@input_prop_id		int,
	@input_year			int,
	@input_action		varchar(1),
	@input_parent_id	int,
	@input_table_type	varchar(5),
	@input_table_id		int,
	@input_adj_code		varchar(10),
	@input_adj_usage	varchar(1),
	@input_adj_old_value	varchar(10),
	@input_adj_new_value	varchar(10),
	@input_adj_value_field	varchar(30),
	@input_adj_value_field2	varchar(30)

AS

SET NOCOUNT ON

declare @strSQL varchar(3000)
declare @strWhere varchar(500)
declare @strPropID varchar(10)
declare @strYear varchar(4)
declare @strIDField varchar(20)
declare @strMainTable varchar(20)
declare @strUpdateTable varchar(20)
declare @strAdjTypeField varchar(50)
declare @strSeqField varchar(20)
declare @id int

SET @strPropID = CONVERT(varchar(10), @input_prop_id)
SET @strYear = CONVERT(varchar(4), @input_year)

SET @strSQL = 'DECLARE adjustCursor CURSOR FAST_FORWARD '
SET @strSQL = @strSQL + 'FOR SELECT DISTINCT('

IF @input_table_type = 'I'
BEGIN
	SET @strIDField = 'imprv_id'
	SET @strMainTable = 'imprv'
	SET @strUpdateTable = 'imprv_adj'
	SET @strAdjTypeField = 'imprv_adj_type_cd'
	SET @strSeqField = 'imprv_adj_seq'
END
IF @input_table_type = 'ID'
BEGIN
	SET @strIDField = 'imprv_det_id'
	SET @strMainTable = 'imprv_detail'
	SET @strUpdateTable = 'imprv_det_adj'
	SET @strAdjTypeField = 'imprv_adj_type_cd'
	SET @strSeqField = 'imprv_det_adj_seq'
END
IF @input_table_type = 'L'
BEGIN
	SET @strIDField = 'land_seg_id'
	SET @strMainTable = 'land_detail'
	SET @strUpdateTable = 'land_adj'
	SET @strAdjTypeField = 'land_seg_adj_type'
	SET @strSeqField = 'land_seg_adj_seq'
END
SET @strSQL = @strSQL + @strIDField + ') '
SET @strSQL = @strSQL + 'FROM ' + @strMainTable + ' '
SET @strSQL = @strSQL + 'WITH (NOLOCK) '
SET @strSQL = @strSQL + 'WHERE prop_id = ' + @strPropID + ' '
SET @strSQL = @strSQL + 'AND prop_val_yr = ' + @strYear + ' '
SET @strSQL = @strSQL + 'AND sup_num = 0 '
SET @strSQL = @strSQL + 'AND sale_id = 0 '

IF @input_table_type = 'ID'
BEGIN
	SET @strSQL = @strSQL + 'AND imprv_id = ' + CONVERT(varchar(10), @input_parent_id) + ' '
END
IF @input_table_id > 0
BEGIN
	SET @strSQL = @strSQL + 'AND ' + @strIDField + ' = ' + CONVERT(varchar(10), @input_table_id) + ' '
END

exec(@strSQL)

OPEN adjustCursor

FETCH NEXT FROM adjustCursor INTO @id

WHILE @@FETCH_STATUS = 0
BEGIN
	SET @strSQL = 'declare @test_id int '
	SET @strSQL = @strSQL + 'SELECT TOP 1 @test_id = prop_id '
	SET @strSQL = @strSQL + 'FROM ' + @strUpdateTable + ' '
	SET @strSQL = @strSQL + 'WITH (NOLOCK) '
	SET @strWhere = 'WHERE prop_id = ' + @strPropID + ' '
	SET @strWhere = @strWhere + 'AND prop_val_yr = ' + @strYear + ' '
	SET @strWhere = @strWhere + 'AND sup_num = 0 '
	SET @strWhere = @strWhere + 'AND sale_id = 0 '
	SET @strWhere = @strWhere + 'AND ' + @strIDField + ' = ' + CONVERT(varchar(10), @id) + ' '
	SET @strWhere = @strWhere + 'AND ' + @strAdjTypeField + ' = ''' + @input_adj_code + ''' '

	IF @input_table_type = 'ID'
	BEGIN
		SET @strWhere = @strWhere + 'AND imprv_id = ' + CONVERT(varchar(10), @input_parent_id) + ' '
	END

	exec(@strSQL + @strWhere)

	IF @@ROWCOUNT > 0
	BEGIN
		IF @input_adj_old_value <> ''
		BEGIN
			SET @strWhere = @strWhere + 'AND ' + @input_adj_value_field + ' = '
			SET @strWhere = @strWhere + @input_adj_old_value
		END

		-- Do not update with value unless the usage is user-defined

		IF @input_action = 'I' AND @input_adj_usage = 'U'
		BEGIN
			SET @strSQL = 'UPDATE ' + @strUpdateTable + ' '
			SET @strSQL = @strSQL + 'SET ' + @input_adj_value_field + ' = '
			IF @input_table_type <> 'L'
			BEGIN
				SET @strSQL = @strSQL + @input_adj_new_value + ', '
				SET @strSQL = @strSQL + @input_adj_value_field2 + ' = NULL '
			END
			ELSE
			BEGIN
				SET @strSQL = @strSQL + @input_adj_new_value + ' '
			END
		END
		IF @input_action = 'D'
		BEGIN
			SET @strSQL = 'DELETE FROM ' + @strUpdateTable + ' '
		END
	END
	ELSE
	BEGIN
		SET @strWhere = ''

		IF @input_action = 'I'
		BEGIN
			SET @strSQL = 'declare @next_id int '
			SET @strSQL = @strSQL + 'exec dbo.GetUniqueID ''' + @strUpdateTable + ''', @next_id output, 1, 0 '

			SET @strSQL = @strSQL + 'INSERT INTO ' + @strUpdateTable + ' '
			SET @strSQL = @strSQL + '(prop_id, prop_val_yr, '
			IF @input_table_type = 'ID'
			BEGIN
				SET @strSQL = @strSQL + 'imprv_id, '
			END

			SET @strSQL = @strSQL + @strIDField + ', '
			SET @strSQL = @strSQL + @strSeqField + ', '
			SET @strSQL = @strSQL + 'sup_num, sale_id, ' + @strAdjTypeField

			-- Only set the value for the adjustment if it's user-defined

			IF @input_adj_usage = 'U'
			BEGIN
				SET @strSQL = @strSQL + ', ' + @input_adj_value_field
			END

			SET @strSQL = @strSQL + ') VALUES ('
			SET @strSQL = @strSQL + @strPropID + ',' + @strYear + ','

			IF @input_table_type = 'ID'
			BEGIN
				SET @strSQL = @strSQL + CONVERT(varchar(10), @input_parent_id) + ','
			END

			SET @strSQL = @strSQL + CONVERT(varchar(10), @id) + ',@next_id,0,0,'
			SET @strSQL = @strSQL + '''' + @input_adj_code + ''''

			IF @input_adj_usage = 'U'
			BEGIN
				SET @strSQL = @strSQL + ',' + @input_adj_new_value
			END
			SET @strSQL = @strSQL + ')'
		END
	END

	IF LEN(@strSQL) > 0
	BEGIN
		exec(@strSQL + @strWhere)
	END

	FETCH NEXT FROM adjustCursor INTO @id	
END

CLOSE adjustCursor
DEALLOCATE adjustCursor

return @@ERROR

GO

