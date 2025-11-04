

/*
 * This procedure is only called from Account and Address
 * triggers.
 */
CREATE PROCEDURE UpdateOAAccountChanges
	
	@Mode as varchar(1),
	@SourceTable as varchar(20)

AS

	declare @strSQL as varchar(2000)
	declare @table as varchar(20)

	IF @Mode = 'I'
	BEGIN
		SET @table = '#InsertedTable'
	END
	ELSE
	BEGIN
		SET @table = '#DeletedTable'
	END

	SET @strSQL = ''

	/*
	 * First do updates where there are already oa_changes records...
	 */

	SET @strSQL = 'UPDATE oa_changes '
	SET @strSQL = @strSQL + 'SET prop_id = 0, '
	SET @strSQL = @strSQL + 'owner_tax_yr = 0, '
	SET @strSQL = @strSQL + 'sup_num = 0, '
	SET @strSQL = @strSQL + 'change_type = ''' + @Mode + ''', '
	SET @strSQL = @strSQL + 'update_dt = GETDATE() '

	SET @strSQL = @strSQL + 'FROM ' + @table + ', oa_changes '
	SET @strSQL = @strSQL + 'WHERE ' + @table + '.acct_id = oa_changes.acct_id '
	
	exec(@strSQL)

	
	SET @strSQL = 'INSERT INTO oa_changes '
	SET @strSQL = @strSQL + '(acct_id, acct_type, change_type, update_dt) '
	SET @strSQL = @strSQL + 'SELECT ' + @table + '.acct_id, '
	SET @strSQL = @strSQL + 'CASE WHEN EXISTS(SELECT owner_id '
	SET @strSQL = @strSQL + 'FROM owner '
	SET @strSQL = @strSQL + 'WHERE owner_id = ' + @table + '.acct_id) '
	SET @strSQL = @strSQL + 'THEN ''O'' '
	SET @strSQL = @strSQL + 'WHEN EXISTS(SELECT agent_id '
	SET @strSQL = @strSQL + 'FROM agent '
	SET @strSQL = @strSQL + 'WHERE agent_id = ' + @table + '.acct_id) '
	SET @strSQL = @strSQL + 'THEN ''A'' '
	SET @strSQL = @strSQL + 'END, '
	SET @strSQL = @strSQL + '''' + @Mode + ''', '
	SET @strSQL = @strSQL + 'GETDATE() '
	SET @strSQL = @strSQL + 'FROM ' + @table + ' '
	SET @strSQL = @strSQL + 'WHERE ' + @table + '.acct_id NOT IN '
	SET @strSQL = @strSQL + '(SELECT oa.acct_id '
	SET @strSQL = @strSQL + 'FROM oa_changes as oa '
	SET @strSQL = @strSQL + 'WHERE oa.acct_id = ' + @table + '.acct_id) '
	SET @strSQL = @strSQL + 'AND CASE WHEN EXISTS(SELECT owner_id '
	SET @strSQL = @strSQL + 'FROM owner '
	SET @strSQL = @strSQL + 'WHERE owner_id = acct_id) '
	SET @strSQL = @strSQL + 'THEN ''O'' ' 
	SET @strSQL = @strSQL + 'WHEN EXISTS(SELECT agent_id '
	SET @strSQL = @strSQL + 'FROM agent '
	SET @strSQL = @strSQL + 'WHERE agent_id = acct_id) '
	SET @strSQL = @strSQL + 'THEN ''A'' '
	SET @strSQL = @strSQL + 'END IS NOT NULL'
	
	exec(@strSQL)

GO

