
create view change_log_build_report_vw
as
	select
		chg_id = cl.lChangeID,
		chg_pacs_user_id = cl.lPacsUserID,
		chg_sql_account = cl.szSQLAccount,
		chg_client_machine = cl.szMachineName,
		chg_dt_tm = cl.dtChange,
		chg_type = cl.szChangeType,
		chg_before_val = cl.szOldValue,
		chg_after_val = cl.szNewValue,
		ref_id = cl.szRefID,
		chg_table = pacs_tables.szTableName,
		chg_column = pacs_columns.szColumnName,
		chg_column_desc = chg_log_columns.chg_log_description,
		chg_log_module = chg_log_columns.chg_log_module,
		pacs_user.pacs_user_name,
		chg_acct_id = isnull(change_log_acctid_vw.acct_id, 0),
		chg_by_prop_id = isnull(change_log_propid_vw.prop_id, 0),
		prop_val_yr = isnull(change_log_propvalyr_vw.prop_val_yr, 0),
		sup_num = isnull(change_log_supnum_vw.sup_num, 0),
		chg_of_owner_id = isnull(change_log_chgofownerid_vw.chg_of_owner_id, 0),
		chg_bldg_permit_id = isnull(change_log_bldgpermitid_vw.bldg_permit_id, 0),
		chg_arb_case_id = isnull(change_log_arbcaseid_vw.arb_case_id, 0),
		chg_arb_yr = isnull(change_log_arbyr_vw.arb_yr, 0),
		str_chg_dt_tm = convert(varchar(50), cl.dtChange)
	from change_log as cl with(nolock)
	join pacs_tables with(nolock) on
		cl.iTableID = pacs_tables.iTableID
	join pacs_columns with(nolock) on
		cl.iColumnID = pacs_columns.iColumnID
	left outer join chg_log_columns with(nolock) on
		pacs_tables.szTableName = chg_log_columns.chg_log_tables and
		pacs_columns.szColumnName = chg_log_columns.chg_log_columns
	left outer join pacs_user with(nolock) on
		cl.lPacsUserID = pacs_user.pacs_user_id
	left outer join change_log_acctid_vw with(nolock) on
		cl.lChangeID = change_log_acctid_vw.lChangeID
	left outer join change_log_propid_vw with(nolock) on
		cl.lChangeID = change_log_propid_vw.lChangeID
	left outer join change_log_propvalyr_vw with(nolock) on
		cl.lChangeID = change_log_propvalyr_vw.lChangeID
	left outer join change_log_supnum_vw with(nolock) on
		cl.lChangeID = change_log_supnum_vw.lChangeID
	left outer join change_log_chgofownerid_vw with(nolock) on
		cl.lChangeID = change_log_chgofownerid_vw.lChangeID
	left outer join change_log_bldgpermitid_vw with(nolock) on
		cl.lChangeID = change_log_bldgpermitid_vw.lChangeID
	left outer join change_log_arbcaseid_vw with(nolock) on
		cl.lChangeID = change_log_arbcaseid_vw.lChangeID
	left outer join change_log_arbyr_vw with(nolock) on
		cl.lChangeID = change_log_arbyr_vw.lChangeID

GO

