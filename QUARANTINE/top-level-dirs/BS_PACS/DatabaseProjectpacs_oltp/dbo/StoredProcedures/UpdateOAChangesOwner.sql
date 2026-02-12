
/*
 * This stored procedure is ONLY going to be called from the owner
 * triggers.  This is used to update the oa_changes table so that
 * ownership transfer exports will work properly.
 */
CREATE PROCEDURE UpdateOAChangesOwner

	@Mode as varchar(1)

AS

	declare @strSQL as varchar(2000)
	declare @table as varchar(20)


	IF @Mode = 'U' or @Mode = 'D'
	BEGIN
		SET @table = '#DeletedTable'
	END
	ELSE
	BEGIN
		SET @table = '#InsertedTable'
	END

	/*
	 * First update any rows that already exist in oa_changes
	 */

	SET @strSQL = 'UPDATE oa_changes '
	SET @strSQL = @strSQL + 'SET change_type = ''' + @Mode + ''', '
	SET @strSQL = @strSQL + 'prop_id = ' + @table + '.prop_id, '
	SET @strSQL = @strSQL + 'owner_tax_yr = ' + @table + '.owner_tax_yr, '
	SET @strSQL = @strSQL + 'sup_num = ' + @table + '.sup_num, '
	SET @strSQL = @strSQL + 'update_dt = GETDATE() '
	SET @strSQL = @strSQL + 'FROM ' + @table + ', oa_changes '
	SET @strSQL = @strSQL + 'WHERE ' + @table + '.owner_id = oa_changes.acct_id '
	SET @strSQL = @strSQL + 'AND ' + @table + '.prop_id = oa_changes.prop_id '
	SET @strSQL = @strSQL + 'AND ' + @table + '.owner_tax_yr = oa_changes.owner_tax_yr '
	SET @strSQL = @strSQL + 'AND ' + @table + '.sup_num = oa_changes.sup_num '

	exec(@strSQL)


	/*
	 * Insert a row into oa_changes as long as there isn't one in
	 * there already for the same prop_id.
	 */

	SET @strSQL = 'INSERT INTO oa_changes '
	SET @strSQL = @strSQL + '(acct_id, acct_type, change_type, prop_id, '
	SET @strSQL = @strSQL + 'owner_tax_yr, sup_num'
	SET @strSQL = @strSQL + ', update_dt) '

	SET @strSQL = @strSQL + 'SELECT ' + @table + '.owner_id, '
	SET @strSQL = @strSQL + '''O'', '
	SET @strSQL = @strSQL + '''' + @Mode + ''', '
	SET @strSQL = @strSQL + @table + '.prop_id, '
	SET @strSQL = @strSQL + @table + '.owner_tax_yr, '
	SET @strSQL = @strSQL + @table + '.sup_num, '
	SET @strSQL = @strSQL + 'GETDATE() '

	SET @strSQL = @strSQL + 'FROM ' + @table + ' '
	SET @strSQL = @strSQL + 'WHERE ' + @table + '.owner_id '
	SET @strSQL = @strSQL + 'NOT IN (SELECT acct_id FROM oa_changes as oa '
	SET @strSQL = @strSQL + 'WHERE oa.prop_id = ' + @table + '.prop_id '
	SET @strSQL = @strSQL + 'AND oa.owner_tax_yr = ' + @table + '.owner_tax_yr '
	SET @strSQL = @strSQL + 'AND oa.sup_num = ' + @table + '.sup_num) '
	SET @strSQL = @strSQL + 'AND ' + @table + '.prop_id '
	SET @strSQL = @strSQL + 'NOT IN (SELECT prop_id FROM oa_changes as oaa '
	SET @strSQL = @strSQL + 'WHERE oaa.prop_id = ' + @table + '.prop_id '
	SET @strSQL = @strSQL + 'AND oaa.owner_tax_yr = ' + @table + '.owner_tax_yr '
	SET @strSQL = @strSQL + 'AND oaa.sup_num = ' + @table + '.sup_num)'

	exec(@strSQL)

GO

