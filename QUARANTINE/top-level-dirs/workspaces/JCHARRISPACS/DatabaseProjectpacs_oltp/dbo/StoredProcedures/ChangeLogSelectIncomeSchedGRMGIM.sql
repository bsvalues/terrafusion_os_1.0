
create procedure ChangeLogSelectIncomeSchedGRMGIM
	@lYear int,
	@szPropType varchar(5),
	@szClass varchar(10),
	@szEcon varchar(10),
	@szLevel varchar(10)

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

	from change_log_keys as chg_level with(nolock)
	join change_log_keys as chg_year with(nolock) on
		chg_year.lChangeID = chg_level.lChangeID and
		chg_year.iColumnID = 5550 and
		chg_year.lKeyValue = @lYear
	join change_log_keys as chg_proptype with(nolock) on
		chg_proptype.lChangeID = chg_level.lChangeID and
		chg_proptype.iColumnID = 4079 and
		chg_proptype.szKeyValue = @szPropType
	join change_log_keys as chg_class with(nolock) on
		chg_class.lChangeID = chg_level.lChangeID and
		chg_class.iColumnID = 762 and
		chg_class.szKeyValue = @szClass
	join change_log_keys as chg_econ with(nolock) on
		chg_econ.lChangeID = chg_level.lChangeID and
		chg_econ.iColumnID = 1409 and
		chg_econ.szKeyValue = @szEcon
	join change_log as cl with(nolock) on
		cl.lChangeID = chg_level.lChangeID

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
		chg_level.iColumnID = 2811 and
		chg_level.szKeyValue = @szLevel

	order by cl.dtChange desc

GO

