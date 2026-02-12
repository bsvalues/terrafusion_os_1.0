
create procedure ChangeLogSelectIncomeYear
	@lIncomeID int,
	@lYear int
as

	select distinct
		cl.lChangeID,
		cl.dtChange,
		pacs_user.pacs_user_name,
		cl.szMachineName,
		cl.szChangeType,
		change_log_income.income_id,
		change_log_year.income_yr,
		change_log_supnm.sup_num,
		cl.szRefID,
		chg_log_columns.chg_log_description,
		cl.szOldValue,
		cl.szNewValue
		
	from change_log_income with(nolock)
	left outer join change_log_year with(nolock) on
		change_log_year.lChangeID = change_log_income.lChangeID
	left outer join change_log_supnum with(nolock) on
		change_log_supnum.lChangeID = change_log_income.lChangeID
	join change_log as cl with(nolock) on
		cl.lChangeID = change_log_income.lChangeID

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
		change_log_income.lKeyValue = @lIncomeID and
		change_log_year.lKeyValue = @lYear

	order by cl.dtChange desc

GO

