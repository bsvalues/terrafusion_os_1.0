

create procedure ChangeLogSelectLandSched
	@lLandSchedID int,
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

	from change_log_keys as land_sched_id with(nolock)
	join change_log_keys as land_sched_year with(nolock) on
		land_sched_year.lChangeID = land_sched_id.lChangeID and
		land_sched_year.iColumnID = 2951 and
		land_sched_year.lKeyValue = @lYear
	join change_log as cl with(nolock) on
		cl.lChangeID = land_sched_id.lChangeID

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
		land_sched_id.iColumnID = 2932 and
		land_sched_id.lKeyValue = @lLandSchedID

	order by cl.dtChange desc

GO

