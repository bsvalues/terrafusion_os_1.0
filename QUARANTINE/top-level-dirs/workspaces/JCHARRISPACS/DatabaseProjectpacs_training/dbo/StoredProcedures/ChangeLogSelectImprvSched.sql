
create procedure ChangeLogSelectImprvSched
	@szMethod varchar(24),
	@szType varchar(24),
	@szClass varchar(24),
	@szSubClass varchar(10),
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

	from change_log_keys as chg_method with(nolock)
	join change_log_keys as chg_type with(nolock) on
		chg_type.lChangeID = chg_method.lChangeID and
		chg_type.iColumnID = 2263 and
		chg_type.szKeyValue = @szType
	join change_log_keys as chg_class with(nolock) on
		chg_class.lChangeID = chg_method.lChangeID and
		chg_class.iColumnID = 2252 and
		chg_class.szKeyValue = @szClass
	join change_log_keys as chg_subClass with(nolock) on
		chg_subClass.lChangeID = chg_method.lChangeID and
		chg_subClass.iColumnID = 6106 and
		chg_subClass.szKeyValue = @szSubClass
	join change_log_keys as chg_year with(nolock) on
		chg_year.lChangeID = chg_method.lChangeID and
		chg_year.iColumnID = 2332 and
		chg_year.lKeyValue = @lYear
	join change_log as cl with(nolock) on
		cl.lChangeID = chg_method.lChangeID

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
		chg_method.iColumnID = 2257 and
		chg_method.szKeyValue = @szMethod

	order by cl.dtChange desc

GO

