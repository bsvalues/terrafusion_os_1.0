
create procedure ChangeLogReportPopulate
	@lPacsUserID int,
	@szFilter varchar(4096)
as

	declare @szSQL varchar(8000)

	delete change_log_report
	where lReportPacsUserID = @lPacsUserID

	set @szSQL = '
		insert change_log_report (
			lReportPacsUserID, chg_id, chg_pacs_user_id, chg_sql_account, chg_client_machine,
			chg_dt_tm, chg_type, chg_before_val, chg_after_val, ref_id, chg_table, chg_column,
			chg_column_desc, pacs_user_name, chg_acct_id, chg_by_prop_id, prop_val_yr, sup_num,
			chg_of_owner_id, chg_bldg_permit_id, chg_arb_case_id, chg_arb_yr, str_chg_dt_tm
		)
		select ' + convert(varchar(12), @lPacsUserID) + ',
			chg_id, chg_pacs_user_id, chg_sql_account, chg_client_machine,
			chg_dt_tm, chg_type, chg_before_val, chg_after_val, ref_id, chg_table, chg_column,
			chg_column_desc, pacs_user_name, chg_acct_id, chg_by_prop_id, prop_val_yr, sup_num,
			chg_of_owner_id, chg_bldg_permit_id, chg_arb_case_id, chg_arb_yr, str_chg_dt_tm
		from change_log_build_report_vw with(nolock)
		where ' + @szFilter + '
		option (maxdop 1)
		'

	exec(@szSQL)

	declare updateCursor cursor fast_forward for
		select 
			chg_log_tables, chg_log_columns, ltrim(rtrim(lookup_table)), ltrim(rtrim(key_field)), ltrim(rtrim(display_field))
		from change_log_display_config with (nolock)

	declare 
		@chg_log_tables varchar(50), 
		@chg_log_columns varchar(50), 
		@lookup_table varchar(50), 
		@key_field varchar(50), 
		@display_field varchar(50)

	open updateCursor
	fetch next from updateCursor 
	into @chg_log_tables, @chg_log_columns, @lookup_table, @key_field, @display_field

	while @@fetch_status = 0
	begin
		set @szSQL = '
			update change_log_report 
			set chg_before_val = ' + @lookup_table + '.' + @display_field + '
			from change_log_report
			join ' + @lookup_table + ' with (nolock) on
				change_log_report.chg_before_val = convert(varchar, ' + @lookup_table + '.' + @key_field + ')
			where change_log_report.lReportPacsUserID = ' + convert(varchar(12), @lPacsUserID) + '
				and change_log_report.chg_column = ''' + @chg_log_columns + '''
				and change_log_report.chg_table = ''' + @chg_log_tables + ''''

		--print @szSQL
		exec(@szSQL)

		set @szSQL = '
			update change_log_report 
			set chg_after_val = ' + @lookup_table + '.' + @display_field + '
			from change_log_report
			join ' + @lookup_table + ' with (nolock) on
				change_log_report.chg_after_val = convert(varchar, ' + @lookup_table + '.' + @key_field + ')
			where change_log_report.lReportPacsUserID = ' + convert(varchar(12), @lPacsUserID) + '
				and change_log_report.chg_column = ''' + @chg_log_columns + '''
				and change_log_report.chg_table = ''' + @chg_log_tables + ''''

		--print @szSQL
		exec(@szSQL)

		fetch next from updateCursor 
		into @chg_log_tables, @chg_log_columns, @lookup_table, @key_field, @display_field
	end

	close updateCursor
	deallocate updateCursor

GO

