

create procedure ChangeLogSelectSubdivision
	@szSubdivision varchar(24),
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

	from change_log_keys as chg_sub with(nolock)
	join change_log_keys as chg_year with(nolock) on
		chg_year.lChangeID = chg_sub.lChangeID and
		chg_year.iColumnID = 27 and
		chg_year.lKeyValue = @lYear
	join change_log as cl with(nolock) on
		cl.lChangeID = chg_sub.lChangeID

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
		chg_sub.iColumnID = 24 and
		chg_sub.szKeyValue = @szSubdivision

	order by cl.dtChange desc

GO

