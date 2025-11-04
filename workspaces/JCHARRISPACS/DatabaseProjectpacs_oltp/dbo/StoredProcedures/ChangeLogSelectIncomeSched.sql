

create procedure ChangeLogSelectIncomeSched
	@szPropType varchar(24),
	@szClassCode varchar(24),
	@szEconArea varchar(24),
	@szLevelCode varchar(24),
	@lYear int
as

	select
		cl.lChangeID,
		cl.dtChange,
		pacs_user.pacs_user_name,
		cl.szMachineName,
		cl.szChangeType,
		0,
		0,
		0,
		cl.szRefID,
		chg_log_columns.chg_log_description,
		cl.szOldValue,
		cl.szNewValue

	from change_log_keys as chg_proptype with(nolock)
	join change_log_keys as chg_classcode with(nolock) on
		chg_classcode.lChangeID = chg_proptype.lChangeID and
		chg_classcode.iColumnID = 762 and
		chg_classcode.szKeyValue = @szClassCode
	join change_log_keys as chg_econarea with(nolock) on
		chg_econarea.lChangeID = chg_proptype.lChangeID and
		chg_econarea.iColumnID = 1408 and
		chg_econarea.szKeyValue = @szEconArea
	join change_log_keys as chg_levelcode with(nolock) on
		chg_levelcode.lChangeID = chg_proptype.lChangeID and
		chg_levelcode.iColumnID = 2811 and
		chg_levelcode.szKeyValue = @szLevelCode
	join change_log_keys as chg_year with(nolock) on
		chg_year.lChangeID = chg_proptype.lChangeID and
		chg_year.iColumnID = 2357 and
		chg_year.lKeyValue = @lYear
	join change_log as cl with(nolock) on
		cl.lChangeID = chg_proptype.lChangeID

	left outer join pacs_user with(nolock) on
		pacs_user.pacs_user_id = cl.lPacsUserID

	join pacs_tables with(nolock) on
		cl.iTableID = pacs_tables.iTableID
	join pacs_columns with(nolock) on
		cl.iColumnID = pacs_columns.iColumnID
	left outer join chg_log_columns with(nolock) on
		pacs_tables.szTableName = chg_log_columns.chg_log_tables and
		pacs_columns.szColumnName = chg_log_columns.chg_log_columns
		
	where
		chg_proptype.iColumnID = 4078 and
		chg_proptype.szKeyValue = @szPropType

	order by cl.dtChange desc

GO

