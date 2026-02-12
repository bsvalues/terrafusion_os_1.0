
create procedure ChangeLogSelectIncomeSchedImprvEcon
	@lYear int,
	@szEconomicArea varchar(10),
	@szImprvDetailTypeCode varchar(10),
	@szImprvDetailMethodCode varchar(10)

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
	join change_log_keys as chg_year with(nolock) on
		chg_year.lChangeID = chg_method.lChangeID and
		chg_year.iColumnID = 5550 and
		chg_year.lKeyValue = @lYear
	join change_log_keys as chg_economicarea with(nolock) on
		chg_economicarea.lChangeID = chg_method.lChangeID and
		chg_economicarea.iColumnID = 9941 and
		chg_economicarea.szKeyValue = @szEconomicArea
	join change_log_keys as chg_imprvdetailtypecode with(nolock) on
		chg_imprvdetailtypecode.lChangeID = chg_method.lChangeID and
		chg_imprvdetailtypecode.iColumnID = 2263 and
		chg_imprvdetailtypecode.szKeyValue = @szImprvDetailTypeCode
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
		chg_method.szKeyValue = @szImprvDetailMethodCode

	order by cl.dtChange desc

GO

