

create procedure ChangeLogSelectARB
	@lCaseID int,
	@lYear int,
	@bProtest bit = null
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

	from change_log_arbcaseid_vw with(nolock)
	join change_log_arbyr_vw with(nolock) on
		change_log_arbyr_vw.lChangeID = change_log_arbcaseid_vw.lChangeID
	join change_log as cl with(nolock) on
		cl.lChangeID = change_log_arbcaseid_vw.lChangeID

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
		change_log_arbcaseid_vw.arb_case_id = @lCaseID and
		change_log_arbyr_vw.arb_yr = @lYear and
		(
			@bProtest is null or							/* Both */
			(@bProtest = 1 and cl.iTableID in (23,38, 1075, 1083)) or		/* ARB Protest */
			(@bProtest = 0 and cl.iTableID = 9)				/* ARB Inquiry */
		)

	order by cl.dtChange desc

GO

