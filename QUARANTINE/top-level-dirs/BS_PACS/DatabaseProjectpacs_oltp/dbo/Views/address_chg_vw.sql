

create view address_chg_vw

as

	select
		chg_id = cl.lChangeID,
		chg_dt_tm = cl.dtChange,
		chg_pacs_user_id = cl.lPacsUserID,
		pacs_user.pacs_user_name,
		chg_column_desc = chg_log_columns.chg_log_description,
		chg_before_val = cl.szOldValue,
		chg_after_val = cl.szNewValue,
		chg_by_acct_id = cla.acct_id,
		account.file_as_name,
		address.addr_line1,
		address.addr_line2,
		address.addr_line3,
		address.addr_city,
		address.addr_state,
		address.addr_zip,
		IsNull(address.is_international, 0) as is_international,
		country.country_name
	from change_log_acctid_vw as cla with(nolock)
	join change_log as cl with(nolock) on
		cla.lChangeID = cl.lChangeID
	join account with(nolock) on
		cla.acct_id = account.acct_id
	join address with(nolock) on
		cla.acct_id = address.acct_id
	left outer join country on 
		country.country_cd = address.country_cd

	left outer join pacs_user with(nolock) on
		cl.lPacsUserID = pacs_user.pacs_user_id

	join pacs_tables with(nolock) on
		cl.iTableID = pacs_tables.iTableID
	join pacs_columns with(nolock) on
		cl.iColumnID = pacs_columns.iColumnID

	left outer join chg_log_columns with(nolock) on
		pacs_tables.szTableName = chg_log_columns.chg_log_tables and
		pacs_columns.szColumnName = chg_log_columns.chg_log_columns
	where
		cl.iTableID in (61,66)
		and isnull(ltrim(rtrim(cl.szOldValue)), '') <> isnull(ltrim(rtrim(cl.szNewValue)), '')

GO

