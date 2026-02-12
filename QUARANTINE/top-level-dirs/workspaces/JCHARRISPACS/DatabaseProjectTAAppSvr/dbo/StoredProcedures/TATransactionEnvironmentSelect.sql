
create procedure TATransactionEnvironmentSelect
	@lEnvironmentID tinyint = null,
	@bEnabled bit = null
as

	select
		te.lEnvironmentID, te.szEnvironmentName, te.szEnvironmentPath,
		te.szSQLServerName, te.szSQLServerDBName, te.szSQLServerLogin, te.szSQLServerPassword,
		te.szVersion,
		te.szSQLLoginNonPrivy, te.szSQLPasswordNonPrivy,
		dss.szSQLDSSServerName, dss.szSQLDSSServerDBName, dss.szSQLDSSServerLogin, dss.szSQLDSSServerPassword,
		dss.szSQLDSSLoginNonPrivy, dss.szSQLDSSPasswordNonPrivy,
		te.szType
	from tb_ta_transaction_environment as te with(nolock)
	left outer join tb_ta_transaction_environment_sqldss as dss with(nolock) on
		dss.lEnvironmentID = te.lEnvironmentID
	where
		(@lEnvironmentID is null or te.lEnvironmentID = @lEnvironmentID)
		and
		(@bEnabled is null or te.bEnabled = @bEnabled)
	order by te.lEnvironmentID

GO

