
CREATE view change_log_arbitration_vw

as

select
		change_log_arbitrationid_vw.arbitration_id,
		change_log_propvalyr_vw.prop_val_yr,
		cl.lChangeID,
		cl.dtChange,
		pacs_user.pacs_user_name,
		cl.szMachineName,
		cl.szChangeType,
		chg_log_columns.chg_log_description,
		cl.szOldValue,
		cl.szNewValue

	from change_log_arbitrationid_vw with(nolock)
	join change_log_propvalyr_vw with(nolock) on
		change_log_propvalyr_vw.lChangeID = change_log_arbitrationid_vw.lChangeID
	join change_log as cl with(nolock) on
		cl.lChangeID = change_log_arbitrationid_vw.lChangeID

	left outer join pacs_user with(nolock) on
		pacs_user.pacs_user_id = cl.lPacsUserID

	join pacs_tables with(nolock) on
		cl.iTableID = pacs_tables.iTableID
	join pacs_columns with(nolock) on
		cl.iColumnID = pacs_columns.iColumnID
	left outer join chg_log_columns with(nolock) on
		pacs_tables.szTableName = chg_log_columns.chg_log_tables and
		pacs_columns.szColumnName = chg_log_columns.chg_log_columns

GO

