

create procedure ChangeLogSelectLandAdjType
	@szLandAdjType varchar(24),
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

	from change_log_keys as land_type with(nolock)
	join change_log_keys as land_year with(nolock) on
		land_year.lChangeID = land_type.lChangeID and
		land_year.iColumnID = 2531 and
		land_year.lKeyValue = @lYear
	join change_log as cl with(nolock) on
		cl.lChangeID = land_type.lChangeID

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
		land_type.iColumnID = 2527 and
		land_type.szKeyValue = @szLandAdjType

	order by cl.dtChange desc

GO

