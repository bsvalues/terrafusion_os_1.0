
create view chg_log_report_vw

as

	select
		lReportPacsUserID,

		chg_id,
		chg_pacs_user_id,
		chg_sql_account,
		chg_client_machine,
		chg_dt_tm,
		chg_type,
		chg_before_val,
		chg_after_val,
		ref_id,
		
		chg_table,
		chg_column,
		chg_column_desc,

		pacs_user_name,

		chg_acct_id,
		chg_by_prop_id,
		prop_val_yr,
		sup_num,
		chg_of_owner_id,
		chg_bldg_permit_id,
		chg_arb_case_id,
		chg_arb_yr,

		str_chg_dt_tm
	from change_log_report with(nolock)

GO

