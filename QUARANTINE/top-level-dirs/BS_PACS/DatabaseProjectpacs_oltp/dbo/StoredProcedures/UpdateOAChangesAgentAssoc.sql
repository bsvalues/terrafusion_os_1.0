

/*
 * This stored procedure is only called from the agent_assoc
 * triggers.  This is used to update the oa_changes table so that
 * agent transfer exports will work properly.
 */
CREATE PROCEDURE UpdateOAChangesAgentAssoc

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
	 * Update rows that already exist for the agent and prop_id combination.
	 * You never, know, they might get deleted and added back.
	 */

	SET @strSQL = 'UPDATE oa_changes '
	SET @strSQL = @strSQL + 'SET change_type = ''' + @Mode + ''', '
	SET @strSQL = @strSQL + 'prop_id = ' + @table + '.prop_id, '
	SET @strSQL = @strSQL + 'update_dt = GETDATE() '
	SET @strSQL = @strSQL + 'FROM oa_changes, ' + @table + ' '
	SET @strSQL = @strSQL + 'WHERE oa_changes.prop_id = ' + @table + '. prop_id '
	SET @strSQL = @strSQL + 'AND oa_changes.acct_id = ' + @table + '.agent_id '

	exec(@strSQL)


	/*
	 * Insert a row into oa_changes as long as there isn't one in
	 * there already for the same prop_id
	 */

	SET @strSQL = 'INSERT INTO oa_changes '
	SET @strSQL = @strSQL + '(acct_id, acct_type, change_type, prop_id, '
	SET @strSQL = @strSQL + 'owner_tax_yr, sup_num, update_dt) '

	SET @strSQL = @strSQL + 'SELECT ' + @table + '.agent_id, '
	SET @strSQL = @strSQL + '''A'', '
	SET @strSQL = @strSQL + '''' + @Mode + ''', '
	SET @strSQL = @strSQL + @table + '.prop_id, '
	SET @strSQL = @strSQL + @table + '.owner_tax_yr, '
	SET @strSQL = @strSQL + 'psa.sup_num, '
	SET @strSQL = @strSQL + 'GETDATE() '

	SET @strSQL = @strSQL + 'FROM ' + @table + ' '
	SET @strSQL = @strSQL + 'INNER JOIN prop_supp_assoc as psa '
	SET @strSQL = @strSQL + 'ON ' + @table + '.prop_id = psa.prop_id '
	SET @strSQL = @strSQL + 'AND ' + @table + '.owner_tax_yr = psa.owner_tax_yr '
	SET @strSQL = @strSQL + 'WHERE ' + @table + '.agent_id '
	SET @strSQL = @strSQL + 'NOT IN (SELECT acct_id FROM oa_changes '
	SET @strSQL = @strSQL + 'WHERE oa_changes.prop_id = ' + @table + '.prop_id)'

	exec(@strSQL)

GO

