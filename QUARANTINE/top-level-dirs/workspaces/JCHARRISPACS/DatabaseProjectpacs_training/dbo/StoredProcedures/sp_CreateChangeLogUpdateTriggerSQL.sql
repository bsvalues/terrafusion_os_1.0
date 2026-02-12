
create procedure sp_CreateChangeLogUpdateTriggerSQL
	@szTableName sysname
as

set nocount on

	declare @szTriggerName varchar(200)
	
	set @szTriggerName = 'tr_' + @szTableName + '_update_ChangeLog'

	declare @lTableID int
	set @lTableID = object_id(@szTableName)

	declare @iTableID smallint
	declare @iColumnID smallint
	select @iTableID = iTableID
	from pacs_tables
	where
		szTableName = @szTableName

	if ( @iTableID is null )
	begin
		print 'Table does not exist in pacs_tables'
		return
	end

	declare
		@szSelectColumnsDeleted varchar(8000),
		@szSelectColumnsInserted varchar(8000),
		@szTemp varchar(8000),
		@szFetchIntoOld varchar(8000),
		@szFetchIntoNew varchar(8000),
		@lIndex int,
		@szColName varchar(200),
		@szDataType varchar(200),
		@iLength smallint,
		@iPrecision smallint,
		@lScale int

	/* Get the table's primary key, if any */
	declare @szPKName varchar(200)
	declare @lIndexID int

	exec sp_GetPrimaryKeyName @szTableName, @szPKName output
	if ( @szPKName is not null )
	begin
		select @lIndexID = indid
		from sysindexes
		where
			id = @lTableID and
			name = @szPKName
	end

	/* Build the change_log_keys insert statements for later use */
	declare @szInsertKeys varchar(8000)
	declare @szInsertKeysSQL varchar(8000)
	declare @szJoinClause varchar(8000)

	set @szInsertKeys = 'insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, '
	
	declare curColumns cursor
	for
		select sc.name, st.name
		from sysindexkeys as sik
		join syscolumns as sc on
			sik.id = sc.id and
			sik.colid = sc.colid
		join systypes as st on
			sc.xtype = st.xtype and
			sc.xusertype = st.xusertype
		where
			sik.id = @lTableID and
			sik.indid = @lIndexID
		order by
			sc.colid asc
	for read only

	open curColumns
	fetch next from curColumns into @szColName, @szDataType

	set @lIndex = 0
	set @szInsertKeysSQL = ''
	set @szJoinClause = ''
	/* For each column in the primary key */
	while ( @@fetch_status = 0 )
	begin
		if ( @lIndex > 0 )
		begin
			set @szJoinClause = @szJoinClause + ' and' + char(13) + char(10)
		end
		set @szJoinClause = @szJoinClause + '     d.' + @szColName + ' = i.' + @szColName

		set @iColumnID = null
		select @iColumnID = iColumnID
		from pacs_columns
		where szColumnName = @szColName

		if ( @iColumnID is null )
		begin
			close curColumns
			deallocate curColumns
			raiserror('Not all column IDs exist in pacs_columns', 18, 1)
			return
		end

		if ( @szDataType = 'int' )
		begin
			set @szInsertKeysSQL =
				@szInsertKeysSQL + char(13) + char(10) +
				'               ' + @szInsertKeys + convert(varchar(12), @iColumnID) +
				', convert(varchar(24), @new_' + @szColName + '), @new_' + @szColName + ')'
		end
		else if ( @szDataType in ('int','numeric','decimal','bigint','float','money','real','smallint','smallmoney','tinyint') )
		begin
			set @szInsertKeysSQL =
				@szInsertKeysSQL + char(13) + char(10) +
				'               ' + @szInsertKeys + convert(varchar(12), @iColumnID) +
				', convert(varchar(24), @new_' + @szColName + '), case when @new_' + @szColName + ' > @tvar_intMin and @new_' + @szColName + ' < @tvar_intMax then convert(int, round(@new_' + @szColName + ', 0, 1)) else 0 end)'
		end
		else
		begin
			set @szInsertKeysSQL =
				@szInsertKeysSQL + char(13) + char(10) +
				'               ' + @szInsertKeys + convert(varchar(12), @iColumnID) +
				', convert(varchar(24), @new_' + @szColName + '), 0)'
		end

		set @lIndex = @lIndex + 1

		fetch next from curColumns into @szColName, @szDataType
	end

	close curColumns
	deallocate curColumns

	declare @szGetPropIDKeySQL varchar(8000)

	/*
		Check to see if we must add a prop_id row to change_log_keys
		where prop_id is not actually part of the primary key
	*/
	if ( @szTableName in ('arb_protest', 'mh_movement') )
	begin
		set @szGetPropIDKeySQL = 'set @tvar_key_prop_id = @new_prop_id'
		
		set @szInsertKeysSQL =
			@szInsertKeysSQL + char(13) + char(10) +
			'          ' + @szInsertKeys + '4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)'
	end
	else if ( @szTableName in ('buyer_assoc','chg_of_owner','sale','sale_conf') )
	begin
		set @szGetPropIDKeySQL = 
'     set @tvar_key_prop_id = null
     select @tvar_key_prop_id = prop_id
     from chg_of_owner_prop_assoc with(nolock)
     where
          chg_of_owner_id = @new_chg_of_owner_id
     if ( @tvar_key_prop_id is null )
     begin
          set @tvar_key_prop_id = 0
     end
'
		set @szInsertKeysSQL =
			@szInsertKeysSQL + char(13) + char(10) +
			'     ' + @szInsertKeys + '4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)'
	end
	else
	begin
		set @szGetPropIDKeySQL = ''
	end

	/* Check to see if we must add a year row to change_log_keys where year is not actually part of the key */
	if ( @szTableName = 'situs' or
             @szTableName = 'property'
        )
	begin
		set @szInsertKeysSQL =
			@szInsertKeysSQL + char(13) + char(10) +
			'               ' + @szInsertKeys + '4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)'
	end

	print 'if object_id(''' + @szTriggerName + ''') is not null'
	print 'begin'
	print '     drop trigger ' + @szTriggerName
	print 'end'
	print 'go'
	print ''

	print 'create trigger ' + @szTriggerName
	print 'on ' + @szTableName
	print 'for update'
	print 'not for replication'
	print 'as'
	print ''

	/* Triggers can still be fired even when the statement affects no rows */
	print 'if ( @@rowcount = 0 )'
	print 'begin'
	print '     return'
	print 'end'
	print ''

	print 'set nocount on'
	print ''

	/* Check to see if changes are not being logged for this particular machine, pacs user, etc */
	print 'declare @tvar_lLogChanges int'
	print 'declare @tvar_lPacsUserID int'
	print 'exec GetMachineLogChanges @tvar_lLogChanges output, @tvar_lPacsUserID output'
	print 'if ( @tvar_lLogChanges = 0 )'
	print 'begin'
	print '     return'
	print 'end'
	print ''

	print 'declare @tvar_dtNow datetime'
	print 'set @tvar_dtNow = getdate()'
	print ''

	print 'declare @tvar_lChangeID int'
	print ''

	print 'declare @tvar_lFutureYear int'
	print 'declare @tvar_key_year int'
	print 'select @tvar_lFutureYear = future_yr, @tvar_key_year = appr_yr'
	print 'from pacs_system with(nolock)'
	print 'if ( @tvar_lFutureYear is null )'
	print 'begin'
	print '     set @tvar_lFutureYear = 0'
	print 'end'
	print ''

	print 'declare @tvar_intMin numeric(28,0)'
	print 'declare @tvar_intMax numeric(28,0)'
	print 'set @tvar_intMin = -2147483649'
	print 'set @tvar_intMax = 2147483648'
	print ''

	print 'declare @tvar_szRefID varchar(255)'
	print ''

	print 'declare @tvar_key_prop_id int'
	print ''

	declare curColumns cursor
	for
		select
			sc.name, st.name, sc.length, sc.prec, sc.scale
		from syscolumns as sc
		join systypes as st on
			sc.xtype = st.xtype and
			sc.xusertype = st.xusertype
		where
			sc.id = @lTableID and
			not sc.name = 'tsRowVersion'
		order by
			sc.colid asc
	for read only

	open curColumns
	fetch next from curColumns into @szColName, @szDataType, @iLength, @iPrecision, @lScale

	set @lIndex = 0
	set @szFetchIntoOld = ''
	set @szFetchIntoNew = ''
	set @szSelectColumnsDeleted = ''
	set @szSelectColumnsInserted = ''
	while ( @@fetch_status = 0 )
	begin
		set @szTemp = @szColName + ' ' + @szDataType

		if ( @lIndex > 0 )
		begin
			set @szFetchIntoOld = @szFetchIntoOld + ', '
			set @szFetchIntoNew = @szFetchIntoNew + ', '
			set @szSelectColumnsDeleted = @szSelectColumnsDeleted + ', '
			set @szSelectColumnsInserted = @szSelectColumnsInserted + ', '
		end
		set @szFetchIntoOld = @szFetchIntoOld + '@old_' + @szColName
		set @szFetchIntoNew = @szFetchIntoNew + '@new_' + @szColName

		if exists (
			select *
			from #tmp_special_case_future_year
			where
				szTableName = @szTableName and
				szColumnName = @szColName
		)
		begin
			set @szSelectColumnsDeleted = @szSelectColumnsDeleted + 'case d.' + @szColName + ' when 0 then @tvar_lFutureYear else d.' + @szColName + ' end'
			set @szSelectColumnsInserted = @szSelectColumnsInserted + 'case i.' + @szColName + ' when 0 then @tvar_lFutureYear else i.' + @szColName + ' end'
		end
		else
		begin
			set @szSelectColumnsDeleted = @szSelectColumnsDeleted + 'd.' + @szColName
			set @szSelectColumnsInserted = @szSelectColumnsInserted + 'i.' + @szColName
		end

		if (
			@szDataType = 'char' or
			@szDataType = 'varchar' or
			@szDataType = 'binary' or
			@szDataType = 'varbinary' or
			@szDataType = 'nchar' or
			@szDataType = 'nvarchar'
		)
		begin
			set @szTemp = @szTemp + '(' + convert(varchar(16), @iLength) + ')'
		end
		else if (
			@szDataType = 'numeric' or
			@szDataType = 'decimal'
		)
		begin
			set @szTemp = @szTemp + '(' + convert(varchar(16), @iPrecision) + ',' + convert(varchar(16), @lScale) + ')'
		end
		else if ( @szDataType = 'float' )
		begin
			set @szTemp = @szTemp + '(' + convert(varchar(16), @iPrecision) + ')'
		end

		print 'declare @old_' + @szTemp
		print 'declare @new_' + @szTemp

		set @lIndex = @lIndex + 1
		fetch next from curColumns into @szColName, @szDataType, @iLength, @iPrecision, @lScale
	end

	print ''

	close curColumns
	deallocate curColumns

	/* The trigger must process each row one at a time */
	print 'declare curRows cursor'
	print 'for'
	print '     select ' + @szSelectColumnsDeleted + ', ' 
    print '            ' + @szSelectColumnsInserted
	print 'from deleted as d'
	print 'join inserted as i on '
	print @szJoinClause
	print 'for read only'
	print ''
	print 'open curRows'
	print 'fetch next from curRows into ' + @szFetchIntoOld + ', '
    print '                             ' + @szFetchIntoNew
	print ''
	print 'while ( @@fetch_status = 0 )'
	print 'begin'

	if ( @szGetPropIDKeySQL <> '' )
	begin
		print @szGetPropIDKeySQL
		print ''
	end

	if ( @szTableName = '_arb_inquiry')
	begin
		print '     set @tvar_szRefID = ''Case ID: '' + convert(varchar(12), @new_case_id) + ''-'' + convert(varchar(4), @new_prop_val_yr)'
	end
	else if ( @szTableName = '_arb_protest' )
	begin
		print '     set @tvar_szRefID = ''Case ID: '' + convert(varchar(12), @new_case_id) + ''-'' + convert(varchar(4), @new_prop_val_yr)'
	end
	else if ( @szTableName = '_arb_protest_reason' )
	begin
		print '     set @tvar_szRefID = ''Case ID: '' + convert(varchar(12), @new_case_id) + ''-'' + convert(varchar(4), @new_prop_val_yr)'
	end
	else if ( @szTableName = 'account' )
	begin
		print '     set @tvar_szRefID = @new_file_as_name'
	end
	else if ( @szTableName = 'address' )
	begin
		print '     select @tvar_szRefID = account.file_as_name'
		print '     from account with(nolock)'
		print '     where acct_id = @new_acct_id'
	end
	else if ( @szTableName = 'agent_assoc' )
	begin
		print '     select @tvar_szRefID = ''Agent: '' + a_account.file_as_name + '' Owner: '' + o_account.file_as_name'
		print '     from account as a_account with(nolock)'
		print '     join account as o_account with(nolock) on o_account.acct_id = @new_owner_id'
		print '     where a_account.acct_id = @new_agent_id'
	end
	else if ( @szTableName = 'arb_protest' )
	begin
		print '     set @tvar_szRefID = ''Case ID: '' + convert(varchar(12), @new_case_id) + ''-'' + convert(varchar(4), @new_prop_val_yr)'
	end
	else if ( @szTableName = 'building_permit' )
	begin
		print '     set @tvar_szRefID = ''Permit: '' + convert(varchar(12), @new_bldg_permit_id)'
	end
	else if ( @szTableName = 'buyer_assoc' )
	begin
		print '     select @tvar_szRefID = file_as_name'
		print '     from account with(nolock)'
		print '     where acct_id = @new_buyer_id'
	end
	else if ( @szTableName = 'chg_of_owner_prop_assoc' )
	begin
		print '     set @tvar_szRefID = convert(varchar(12), @new_prop_id)'
	end
	else if ( @szTableName = 'entity' )
	begin
		print '     set @tvar_szRefID = @new_entity_cd'
	end
	else if ( @szTableName = 'entity_exmpt' )
	begin
		print '     select @tvar_szRefID = entity.entity_cd + ''-'' + convert(varchar(4), @new_exmpt_tax_yr)'
		print '     from entity with(nolock)'
		print '     where entity_id = @new_entity_id'
	end
	else if ( @szTableName = 'entity_prop_assoc' )
	begin
		print '     select @tvar_szRefID = entity.entity_cd'
		print '     from entity with(nolock)'
		print '     where entity_id = @new_entity_id'
	end
	else if ( @szTableName = 'imprv' )
	begin
		print '     set @tvar_szRefID = @new_imprv_type_cd'
	end
	else if ( @szTableName = 'imprv_adj' )
	begin
		print '     select @tvar_szRefID = imprv_type_cd + ''-'' + @new_imprv_adj_type_cd'
		print '     from imprv with(nolock)'
		print '     where prop_id = @new_prop_id'
		print '     and prop_val_yr = @new_prop_val_yr'
		print '     and sup_num = @new_sup_num'
		print '     and imprv_id = @new_imprv_id'
		print '     and sale_id = @new_sale_id'
	end
	else if ( @szTableName = 'imprv_adj_type' )
	begin
		print '     set @tvar_szRefID = @new_imprv_adj_type_cd + convert(varchar(4), @new_imprv_adj_type_year)'
	end
	else if ( @szTableName = 'imprv_attr' )
	begin
		print '     select @tvar_szRefID = id.imprv_det_class_cd + ''-'' + id.imprv_det_meth_cd + ''-'' + id.imprv_det_type_cd + ''-'' + a.imprv_attr_desc'
		print '     from imprv_detail as id with(nolock)'
		print '     join attribute as a with(nolock) on a.imprv_attr_id = @new_i_attr_val_id'
		print '     where id.prop_id = @new_prop_id'
		print '     and id.prop_val_yr = @new_prop_val_yr'
		print '     and id.sup_num = @new_sup_num'
		print '     and id.imprv_id = @new_imprv_id'
		print '     and id.imprv_det_id = @new_imprv_det_id'
		print '     and id.sale_id = @new_sale_id'
	end
	else if ( @szTableName = 'imprv_det_adj' )
	begin
		print '     select @tvar_szRefID = id.imprv_det_class_cd + ''-'' + id.imprv_det_meth_cd + ''-'' + id.imprv_det_type_cd + ''-'' + @new_imprv_adj_type_cd'
		print '     from imprv_detail as id with(nolock)'
		print '     where id.prop_id = @new_prop_id'
		print '     and id.prop_val_yr = @new_prop_val_yr'
		print '     and id.sup_num = @new_sup_num'
		print '     and id.imprv_id = @new_imprv_id'
		print '     and id.imprv_det_id = @new_imprv_det_id'
		print '     and id.sale_id = @new_sale_id'
	end
	else if ( @szTableName = 'imprv_detail' )
	begin
		print '     select @tvar_szRefID = id.imprv_det_class_cd + ''-'' + id.imprv_det_meth_cd + ''-'' + id.imprv_det_type_cd'
		print '     from imprv_detail as id with(nolock)'
		print '     where id.prop_id = @new_prop_id'
		print '     and id.prop_val_yr = @new_prop_val_yr'
		print '     and id.sup_num = @new_sup_num'
		print '     and id.imprv_id = @new_imprv_id'
		print '     and id.imprv_det_id = @new_imprv_det_id'
		print '     and id.sale_id = @new_sale_id'
	end
	else if ( @szTableName = 'imprv_sched' )
	begin
		print '     set @tvar_szRefID = @new_imprv_det_meth_cd + ''-'' + @new_imprv_det_type_cd + ''-'' + @new_imprv_det_class_cd + ''-'' + @new_imprv_det_sub_class_cd + ''-'' + convert(varchar(4), @new_imprv_yr)'
	end
	else if ( @szTableName = 'imprv_sched_area_type' )
	begin
		print '     set @tvar_szRefID = @new_imprv_sched_area_type_cd'
	end
	else if ( @szTableName = 'imprv_sched_attr' )
	begin
		print '     set @tvar_szRefID = @new_imprv_det_meth_cd + ''-'' + @new_imprv_det_type_cd + ''-'' + @new_imprv_det_class_cd + ''-'' + @new_imprv_det_sub_class_cd + ''-'' + convert(varchar(12), @new_imprv_attr_id) + ''-'' + convert(varchar(4), @new_imprv_yr)'
	end
	else if ( @szTableName = 'imprv_sched_detail' )
	begin
		print '     set @tvar_szRefID = @new_imprv_det_meth_cd + ''-'' + @new_imprv_det_type_cd + ''-'' + @new_imprv_det_class_cd + ''-'' + @new_imprv_det_sub_class_cd + ''-'' + convert(varchar(4), @new_imprv_yr) + ''-'' + convert(varchar(24), @new_range_max)'
	end
	else if ( @szTableName = 'income_sched' )
	begin
		print '     set @tvar_szRefID = @new_prop_type + ''-'' + @new_class_cd + ''-'' + @new_econ_area + ''-'' + @new_level_cd + ''-'' + convert(varchar(4), @new_income_yr)'
	end
	else if ( @szTableName = 'land_adj' )
	begin
		print '     select @tvar_szRefID = ld.land_type_cd + ''-'' + @new_land_seg_adj_type'
		print '     from land_detail as ld with(nolock)'
		print '     where ld.prop_id = @new_prop_id'
		print '     and ld.prop_val_yr = @new_prop_val_yr'
		print '     and ld.sup_num = @new_sup_num'
		print '     and ld.land_seg_id = @new_land_seg_id'
		print '     and ld.sale_id = @new_sale_id'
	end
	else if ( @szTableName = 'land_adj_type' )
	begin
		print '     set @tvar_szRefID = @new_land_adj_type_cd + ''-'' + convert(varchar(4), @new_land_adj_type_year)'
	end
	else if ( @szTableName = 'land_detail' )
	begin
		print '     set @tvar_szRefID = @new_land_type_cd'
	end
	else if ( @szTableName = 'land_sched' )
	begin
		print '     set @tvar_szRefID = convert(varchar(12), @new_ls_id) + ''-'' + convert(varchar(4), @new_ls_year)'
	end
	else if ( @szTableName = 'land_sched_detail' )
	begin
		print '     set @tvar_szRefID = convert(varchar(12), @new_ls_detail_id) + ''-'' + convert(varchar(12), @new_ls_id) + ''-'' + convert(varchar(4), @new_ls_year)'
	end
	else if ( @szTableName = 'lease_prop_assoc' )
	begin
		print '     set @tvar_szRefID = convert(varchar(12), @new_lease_id)'
	end
	else if ( @szTableName = 'mortgage_assoc' )
	begin
		print '     select @tvar_szRefID = ''Mortgage: '' + a.file_as_name'
		print '     from account as a with(nolock)'
		print '     where a.acct_id = @new_mortgage_co_id'
	end
	else if ( @szTableName = 'ms_comm_cost_mult' )
	begin
		print '     set @tvar_szRefID = convert(varchar(4), @new_ms_year) + ''-'' + @new_cost_class + ''-'' + @new_cost_section'
	end
	else if ( @szTableName = 'ms_comm_local_mult' )
	begin
		print '     set @tvar_szRefID = convert(varchar(4), @new_ms_year) + ''-'' + @new_local_class'
	end
	else if ( @szTableName = 'ms_manuf_mult' )
	begin
		print '     set @tvar_szRefID = convert(varchar(4), @new_ms_year)'
	end
	else if ( @szTableName = 'ms_mult' )
	begin
		print '     set @tvar_szRefID = convert(varchar(4), @new_ms_year)'
	end
	else if ( @szTableName = 'ms_multi_mult' )
	begin
		print '     set @tvar_szRefID = convert(varchar(4), @new_ms_year)'
	end
	else if ( @szTableName = 'neighborhood' )
	begin
		print '     set @tvar_szRefID = @new_hood_cd + ''-'' + convert(varchar(4), @new_hood_yr)'
	end
	else if ( @szTableName = 'owner' )
	begin
		print '     select @tvar_szRefID = a.file_as_name'
		print '     from account as a with(nolock)'
		print '     where a.acct_id = @new_owner_id'
	end
	else if ( @szTableName = 'pers_prop_rendition' )
	begin
		print '     set @tvar_szRefID = convert(varchar(4), @new_rendition_year)'
	end
	else if ( @szTableName = 'pers_prop_seg' )
	begin
		print '     set @tvar_szRefID = @new_pp_type_cd'
	end
	else if ( @szTableName = 'pp_schedule' )
	begin
		print '     set @tvar_szRefID = convert(varchar(4), @new_year) + ''-'' + @new_value_method + ''-'' + @new_table_code + ''-'' + @new_segment_type'
	end
	else if ( @szTableName = 'pp_schedule_adj' )
	begin
		print '     select @tvar_szRefID = convert(varchar(4), @new_year) + ''-'' + pps.value_method + ''-'' + pps.table_code + ''-'' + pps.segment_type + '':'' + @new_pp_sched_adj_cd'
		print '     from pp_schedule as pps with(nolock)'
		print '     where pps.pp_sched_id = @new_pp_sched_id'
		print '     and pps.year = @new_year'
	end
	else if ( @szTableName = 'pp_schedule_area' )
	begin
		print '     select @tvar_szRefID = convert(varchar(4), @new_year) + ''-'' + pps.value_method + ''-'' + pps.table_code + ''-'' + pps.segment_type + '':'' + convert(varchar(24), @new_area_max)'
		print '     from pp_schedule as pps with(nolock)'
		print '     where pps.pp_sched_id = @new_pp_sched_id'
		print '     and pps.year = @new_year'
	end
	else if ( @szTableName = 'pp_schedule_class' )
	begin
		print '     select @tvar_szRefID = convert(varchar(4), @new_year) + ''-'' + pps.value_method + ''-'' + pps.table_code + ''-'' + pps.segment_type + '':'' + @new_pp_class_cd'
		print '     from pp_schedule as pps with(nolock)'
		print '     where pps.pp_sched_id = @new_pp_sched_id'
		print '     and pps.year = @new_year'
	end
	else if ( @szTableName = 'pp_schedule_deprec' )
	begin
		print '     select @tvar_szRefID = convert(varchar(4), @new_year) + ''-'' + pps.value_method + ''-'' + pps.table_code + ''-'' + pps.segment_type + '':'' + @new_pp_sched_deprec_type_cd + ''-'' + @new_pp_sched_deprec_deprec_cd'
		print '     from pp_schedule as pps with(nolock)'
		print '     where pps.pp_sched_id = @new_pp_sched_id'
		print '     and pps.year = @new_year'
	end
	else if ( @szTableName = 'pp_schedule_order' )
	begin
		print '     select @tvar_szRefID = convert(varchar(4), @new_year) + ''-'' + pps.value_method + ''-'' + pps.table_code + ''-'' + pps.segment_type'
		print '     from pp_schedule as pps with(nolock)'
		print '     where pps.pp_sched_id = @new_pp_sched_id'
		print '     and pps.year = @new_year'
	end
	else if ( @szTableName = 'pp_schedule_quality_density' )
	begin
		print '     select @tvar_szRefID = convert(varchar(4), @new_year) + ''-'' + pps.value_method + ''-'' + pps.table_code + ''-'' + pps.segment_type + '':'' + @new_quality_cd + ''-'' + @new_density_cd'
		print '     from pp_schedule as pps with(nolock)'
		print '     where pps.pp_sched_id = @new_pp_sched_id'
		print '     and pps.year = @new_year'
	end
	else if ( @szTableName = 'pp_schedule_unit_count' )
	begin
		print '     select @tvar_szRefID = convert(varchar(4), @new_year) + ''-'' + pps.value_method + ''-'' + pps.table_code + ''-'' + pps.segment_type + '':'' + convert(varchar(24), @new_unit_count_max)'
		print '     from pp_schedule as pps with(nolock)'
		print '     where pps.pp_sched_id = @new_pp_sched_id'
		print '     and pps.year = @new_year'
	end
	else if ( @szTableName = 'prop_building_permit_assoc' )
	begin
		print '     set @tvar_szRefID = ''Permit: '' + convert(varchar(12), @new_bldg_permit_id)'
	end
	else if ( @szTableName = 'prop_group_assoc' )
	begin
		print '     set @tvar_szRefID = @new_prop_group_cd'
	end
	else if ( @szTableName = 'property_assoc' )
	begin
		print '     set @tvar_szRefID = ''LINKED'''
	end
	else if ( @szTableName = 'property_exemption' )
	begin
		print '     select @tvar_szRefID = @new_exmpt_type_cd + '' - Owner: '' + a.file_as_name'
		print '     from account as a with(nolock)'
		print '     where a.acct_id = @new_owner_id'
	end
	else if ( @szTableName = 'property_freeze' )
	begin
		print '     select @tvar_szRefID = ''Entity: '' + ltrim(rtrim(e.entity_cd)) + ''; Exemption: '' + ltrim(rtrim(@new_exmpt_type_cd)) + ''; Owner: '' + a.file_as_name'
		print '     from entity as e with (nolock)'
		print '     cross join account as a with (nolock)'
		print '     where e.entity_id = @new_entity_id'
		print '     and a.acct_id = @new_owner_id'
	end
	else if ( @szTableName = 'seller_assoc' )
	begin
		print '     select @tvar_szRefID = a.file_as_name'
		print '     from account as a with(nolock)'
		print '     where a.acct_id = @new_seller_id'
	end
	else if ( @szTableName = 'shared_prop' )
	begin
		print '     set @tvar_szRefID = @new_shared_cad_code'
	end
	else if ( @szTableName = 'shared_prop_value' )
	begin
		print '     set @tvar_szRefID = @new_shared_cad_code + ''-'' + convert(varchar(12), @new_shared_value_id)'
	end
	else if ( @szTableName = 'tax_rate' )
	begin
		print '     select @tvar_szRefID = e.entity_cd + ''-'' + convert(varchar(4), @new_tax_rate_yr)'
		print '     from entity as e with(nolock)'
		print '     where entity_id = @new_entity_id'
	end
	else if ( @szTableName = 'imprv_entity_assoc' )
	begin
		print '     select @tvar_szRefID = entity.entity_cd + '' - '' + convert(varchar(12), @new_imprv_id)'
		print '     from entity with(nolock)'
		print '     where entity_id = @new_entity_id'
	end
	else if ( @szTableName = 'land_entity_assoc' )
	begin
		print '     select @tvar_szRefID = entity.entity_cd + '' - '' + convert(varchar(12), @new_land_seg_id)'
		print '     from entity with(nolock)'
		print '     where entity_id = @new_entity_id'
	end
	else if ( @szTableName = 'pers_prop_entity_assoc' )
	begin
		print '     select @tvar_szRefID = entity.entity_cd + '' - '' + convert(varchar(12), @new_pp_seg_id)'
		print '     from entity with(nolock)'
		print '     where entity_id = @new_entity_id'
	end
	else if ( @szTableName = 'imprv_owner_assoc' )
	begin
		print '     set @tvar_szRefID = ''Property ID: '' + convert(varchar(12), @new_prop_id) + '' - Owner ID: '' + convert(varchar(12), @new_owner_id) + '' - Segment ID: '' + convert(varchar(12), @new_imprv_id)'
	end
	else if ( @szTableName = 'land_owner_assoc' )
	begin
		print '     set @tvar_szRefID = ''Property ID: '' + convert(varchar(12), @new_prop_id) + '' - Owner ID: '' + convert(varchar(12), @new_owner_id) + '' - Segment ID: '' + convert(varchar(12), @new_land_seg_id)'
	end
	else if ( @szTableName = 'pers_prop_owner_assoc' )
	begin
		print '     set @tvar_szRefID = ''Property ID: '' + convert(varchar(12), @new_prop_id) + '' - Owner ID: '' + convert(varchar(12), @new_owner_id) + '' - Segment ID: '' + convert(varchar(12), @new_pp_seg_id)'
	end
	else if ( @szTableName = 'imprv_exemption_assoc' )
	begin
		print '     select @tvar_szRefID = @new_exmpt_type_cd + '' - '' + entity.entity_cd + '' - '' + convert(varchar(12), @new_imprv_id)'
		print '     from entity with(nolock)'
		print '     where entity_id = @new_entity_id'
	end
	else if ( @szTableName = 'land_exemption_assoc' )
	begin
		print '     select @tvar_szRefID = @new_exmpt_type_cd + '' - '' + entity.entity_cd + '' - '' + convert(varchar(12), @new_land_seg_id)'
		print '     from entity with(nolock)'
		print '     where entity_id = @new_entity_id'
	end
	else if ( @szTableName = 'pers_prop_exemption_assoc' )
	begin
		print '     select @tvar_szRefID = @new_exmpt_type_cd + '' - '' + entity.entity_cd + '' - '' + convert(varchar(12), @new_pp_seg_id)'
		print '     from entity with(nolock)'
		print '     where entity_id = @new_entity_id'
	end
	else if ( @szTableName = 'forms_maintenance' )
	begin
		print '     set @tvar_szRefID = ''Form Type: '' + @new_form_type'
	end
	else if ( @szTableName = 'legal_build_rules' )
	begin
		print '     set @tvar_szRefID = ''Type/Field: '' + @new_abs_subdv_ind + ''/'' + (select szFieldDesc from legal_build_rules_field_code with(nolock) where lFieldCode = @new_field_cd)'
	end
	else if ( @szTableName = 'reportquestions' )
	begin
		print '     set @tvar_szRefID = ''Report/Question: '' + @new_report + ''/'' + @new_questionid'
	end
	else if ( @szTableName = 'fin_event_fund_assoc' )
	begin
		print '     set @tvar_szRefID = cast(@old_year as varchar) + ''-'' + cast(@old_tax_district_id as varchar) + ''-'' + @old_levy_cd + ''-'' + cast(@old_fund_id as varchar) + ''-'' + @old_event_cd'
	end
	else if ( @szTableName = 'fin_event_assessment_assoc' )
	begin
		print '     set @tvar_szRefID = cast(@old_year as varchar) + ''-'' + cast(@old_agency_id as varchar) + ''-'' + @old_event_cd'
	end
	else if ( @szTableName = 'fin_event_escrow_assoc' )
	begin
		print '     set @tvar_szRefID = cast(@old_year as varchar) + ''-'' + @old_escrow_type_cd + ''-'' + @old_event_cd'
	end
	else if ( @szTableName = 'fin_event_overpmt_credit_assoc' )
	begin
		print '     set @tvar_szRefID = @old_event_cd'
	end
	else if ( @szTableName = 'fin_event_fee_type_assoc' )
	begin
		print '     set @tvar_szRefID = @old_fee_type_cd + ''-'' + @old_event_cd'
	end
	else if ( @szTableName = 'fin_event_refund_type_assoc' )
	begin
		print '     set @tvar_szRefID = cast(@old_year as varchar) + ''-'' + @old_refund_type_cd + ''-'' + @old_event_cd'
	end
	else if ( @szTableName = 'fin_event_reet_rate_assoc' )
	begin
		print '     set @tvar_szRefID = cast(@old_reet_rate_id as varchar) + ''-'' + cast(@old_tax_district_id as varchar) + ''-'' + @old_uga_indicator_cd + ''-'' + @old_description + ''-'' + @old_event_cd'
	end
	else if ( @szTableName = 'sale_additional_codes' )
	begin
		print '     set @tvar_szRefID = cast(@old_chg_of_owner_id as varchar) + ''-'' + @old_sale_cd'
	end
	else if ( @szTableName = 'reet' )
	begin
		print '     set @tvar_szRefID = cast(@old_reet_id as varchar)'
	end
	else if ( @szTableName = 'mh_movement' )
	begin
		print '     set @tvar_szRefID = ''MHM '' + cast(@old_mhm_id as varchar) + '' - Property '' + cast(@old_prop_id as varchar)'
	end
	else
	begin
		print '     set @tvar_szRefID = null'
	end
	print ''

	declare curColumns cursor
	for
		select
			sc.name
		from syscolumns as sc
		where
			sc.id = @lTableID and
			not sc.name = 'tsRowVersion'
		order by
			sc.colid asc
	for read only

	open curColumns
	fetch next from curColumns into @szColName

	while ( @@fetch_status = 0 )
	begin
		set @iColumnID = null
		select @iColumnID = iColumnID
		from pacs_columns
		where szColumnName = @szColName

		if ( @iColumnID is null )
		begin
			close curColumns
			deallocate curColumns
			raiserror('Not all column IDs exist in pacs_columns', 18, 1)
			return
		end
		
		print '     if ('
		print '          @old_' + @szColName + ' <> @new_' + @szColName
		print '          or'
		print '          ( @old_' + @szColName + ' is null and @new_' + @szColName + ' is not null ) '
		print '          or'
		print '          ( @old_' + @szColName + ' is not null and @new_' + @szColName + ' is null ) '
		print '     )'
		print '     begin'
		print '          if exists ('
		print '               select chg_log_audit'
		print '               from chg_log_columns with(nolock)'
		print '               where'
		print '                    chg_log_tables = ''' + @szTableName + ''' and'
		print '                    chg_log_columns = ''' + @szColName + ''' and'
		print '                    chg_log_audit = 1'
		print '          )'
		print '          begin'
		print '               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )'
		print '               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, ''U'', ' + convert(varchar(12), @iTableID) + ', ' + convert(varchar(12), @iColumnID) + ', convert(varchar(255), @old_' + @szColName + '), convert(varchar(255), @new_' + @szColName + '), @tvar_szRefID )'
		print '               set @tvar_lChangeID = @@identity'
		if ( @szInsertKeysSQL <> '' )
		begin
			print @szInsertKeysSQL
		end
		print '          end'
		print '     end'
		print ''

		fetch next from curColumns into @szColName
	end

	close curColumns
	deallocate curColumns

	print '     fetch next from curRows into ' + @szFetchIntoOld + ', '
    print '                                  ' + @szFetchIntoNew
	print 'end'
	print ''
	print 'close curRows'
	print 'deallocate curRows'
	print ''
	print 'go'

set nocount off

GO

