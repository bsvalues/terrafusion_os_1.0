
create procedure sp_CreateChangeLogInsertTriggerSQL
	@szTableName sysname
as

set nocount on
	declare @error_string varchar(255)
	declare @szTriggerName varchar(200)
	
	set @szTriggerName = 'tr_' + @szTableName + '_insert_ChangeLog'

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
		@szSelectColumns varchar(8000),
		@szTemp varchar(8000),
		@szFetchInto varchar(8000),
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

	set @szInsertKeysSQL = ''
	/* For each column in the primary key */
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
			set @error_string = 'Not all column IDs exist in pacs_columns:' + @szColName
			raiserror(@error_string, 18, 1)
			return
		end

		if ( @szDataType = 'int' )
		begin
			set @szInsertKeysSQL =
				@szInsertKeysSQL + char(13) + char(10) +
				'          ' + @szInsertKeys + convert(varchar(12), @iColumnID) +
				', convert(varchar(24), @' + @szColName + '), @' + @szColName + ')'
		end
		else if ( @szDataType in ('int','numeric','decimal','bigint','float','money','real','smallint','smallmoney','tinyint') )
		begin
			set @szInsertKeysSQL =
				@szInsertKeysSQL + char(13) + char(10) +
				'          ' + @szInsertKeys + convert(varchar(12), @iColumnID) +
				', convert(varchar(24), @' + @szColName + '), case when @' + @szColName + ' > @tvar_intMin and @' + @szColName + ' < @tvar_intMax then convert(int, round(@' + @szColName + ', 0, 1)) else 0 end)'
		end
		else
		begin
			set @szInsertKeysSQL =
				@szInsertKeysSQL + char(13) + char(10) +
				'          ' + @szInsertKeys + convert(varchar(12), @iColumnID) +
				', convert(varchar(24), @' + @szColName + '), 0)'
		end

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
		set @szGetPropIDKeySQL = 'set @tvar_key_prop_id = @prop_id'
		
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
          chg_of_owner_id = @chg_of_owner_id
     if ( @tvar_key_prop_id is null )
     begin
          set @tvar_key_prop_id = 0
     end
'
		set @szInsertKeysSQL =
			@szInsertKeysSQL + char(13) + char(10) +
			'          ' + @szInsertKeys + '4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)'
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
			'          ' + @szInsertKeys + '4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)'
	end

	print 'if object_id(''' + @szTriggerName + ''') is not null'
	print 'begin'
	print '     drop trigger ' + @szTriggerName
	print 'end'
	print 'go'
	print ''

	print 'create trigger ' + @szTriggerName
	print 'on ' + @szTableName
	print 'for insert'
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
	set @szFetchInto = ''
	set @szSelectColumns = ''
	while ( @@fetch_status = 0 )
	begin
		set @szTemp = 'declare @' + @szColName + ' ' + @szDataType

		if ( @lIndex > 0 )
		begin
			set @szFetchInto = @szFetchInto + ', '
			set @szSelectColumns = @szSelectColumns + ', '
		end
		set @szFetchInto = @szFetchInto + '@' + @szColName

		if exists (
			select *
			from #tmp_special_case_future_year
			where
				szTableName = @szTableName and
				szColumnName = @szColName
		)
		begin
			set @szSelectColumns = @szSelectColumns + 'case ' + @szColName + ' when 0 then @tvar_lFutureYear else ' + @szColName + ' end'
		end
		else
		begin
			set @szSelectColumns = @szSelectColumns + @szColName
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

		print @szTemp

		set @lIndex = @lIndex + 1
		fetch next from curColumns into @szColName, @szDataType, @iLength, @iPrecision, @lScale
	end

	print ''

	close curColumns
	deallocate curColumns

	/* The trigger must process each row one at a time */
	print 'declare curRows cursor'
	print 'for'
	print '     select ' + @szSelectColumns + ' from inserted'
	print 'for read only'
	print ''
	print 'open curRows'
	print 'fetch next from curRows into ' + @szFetchInto
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
		print '     set @tvar_szRefID = ''Case ID: '' + convert(varchar(12), @case_id) + ''-'' + convert(varchar(4), @prop_val_yr)'
	end
	else if ( @szTableName = '_arb_protest' )
	begin
		print '     set @tvar_szRefID = ''Case ID: '' + convert(varchar(12), @case_id) + ''-'' + convert(varchar(4), @prop_val_yr)'
	end
	else if ( @szTableName = '_arb_protest_reason' )
	begin
		print '     set @tvar_szRefID = ''Case ID: '' + convert(varchar(12), @case_id) + ''-'' + convert(varchar(4), @prop_val_yr)'
	end
	else if ( @szTableName = 'account' )
	begin
		print '     set @tvar_szRefID = @file_as_name'
	end
	else if ( @szTableName = 'address' )
	begin
		print '     select @tvar_szRefID = account.file_as_name'
		print '     from account with(nolock)'
		print '     where acct_id = @acct_id'
	end
	else if ( @szTableName = 'agent_assoc' )
	begin
		print '     select @tvar_szRefID = ''Agent: '' + a_account.file_as_name + '' Owner: '' + o_account.file_as_name'
		print '     from account as a_account with(nolock)'
		print '     join account as o_account with(nolock) on o_account.acct_id = @owner_id'
		print '     where a_account.acct_id = @agent_id'
	end
	else if ( @szTableName = 'arb_protest' )
	begin
		print '     set @tvar_szRefID = ''Case ID: '' + convert(varchar(12), @case_id) + ''-'' + convert(varchar(4), @prop_val_yr)'
	end
	else if ( @szTableName = 'building_permit' )
	begin
		print '     set @tvar_szRefID = ''Permit: '' + convert(varchar(12), @bldg_permit_id)'
	end
	else if ( @szTableName = 'buyer_assoc' )
	begin
		print '     select @tvar_szRefID = file_as_name'
		print '     from account with(nolock)'
		print '     where acct_id = @buyer_id'
	end
	else if ( @szTableName = 'chg_of_owner_prop_assoc' )
	begin
		print '     set @tvar_szRefID = convert(varchar(12), @prop_id)'
	end
	else if ( @szTableName = 'entity' )
	begin
		print '     set @tvar_szRefID = @entity_cd'
	end
	else if ( @szTableName = 'entity_exmpt' )
	begin
		print '     select @tvar_szRefID = entity.entity_cd + ''-'' + convert(varchar(4), @exmpt_tax_yr)'
		print '     from entity with(nolock)'
		print '     where entity_id = @entity_id'
	end
	else if ( @szTableName = 'entity_prop_assoc' )
	begin
		print '     select @tvar_szRefID = entity.entity_cd'
		print '     from entity with(nolock)'
		print '     where entity_id = @entity_id'
	end
	else if ( @szTableName = 'imprv' )
	begin
		print '     set @tvar_szRefID = @imprv_type_cd'
	end
	else if ( @szTableName = 'imprv_adj' )
	begin
		print '     select @tvar_szRefID = imprv_type_cd + ''-'' + @imprv_adj_type_cd'
		print '     from imprv with(nolock)'
		print '     where prop_id = @prop_id'
		print '     and prop_val_yr = @prop_val_yr'
		print '     and sup_num = @sup_num'
		print '     and imprv_id = @imprv_id'
		print '     and sale_id = @sale_id'
	end
	else if ( @szTableName = 'imprv_adj_type' )
	begin
		print '     set @tvar_szRefID = @imprv_adj_type_cd + convert(varchar(4), @imprv_adj_type_year)'
	end
	else if ( @szTableName = 'imprv_attr' )
	begin
		print '     select @tvar_szRefID = id.imprv_det_class_cd + ''-'' + id.imprv_det_meth_cd + ''-'' + id.imprv_det_type_cd + ''-'' + a.imprv_attr_desc'
		print '     from imprv_detail as id with(nolock)'
		print '     join attribute as a with(nolock) on a.imprv_attr_id = @i_attr_val_id'
		print '     where id.prop_id = @prop_id'
		print '     and id.prop_val_yr = @prop_val_yr'
		print '     and id.sup_num = @sup_num'
		print '     and id.imprv_id = @imprv_id'
		print '     and id.imprv_det_id = @imprv_det_id'
		print '     and id.sale_id = @sale_id'
	end
	else if ( @szTableName = 'imprv_det_adj' )
	begin
		print '     select @tvar_szRefID = id.imprv_det_class_cd + ''-'' + id.imprv_det_meth_cd + ''-'' + id.imprv_det_type_cd + ''-'' + @imprv_adj_type_cd'
		print '     from imprv_detail as id with(nolock)'
		print '     where id.prop_id = @prop_id'
		print '     and id.prop_val_yr = @prop_val_yr'
		print '     and id.sup_num = @sup_num'
		print '     and id.imprv_id = @imprv_id'
		print '     and id.imprv_det_id = @imprv_det_id'
		print '     and id.sale_id = @sale_id'
	end
	else if ( @szTableName = 'imprv_detail' )
	begin
		print '     select @tvar_szRefID = id.imprv_det_class_cd + ''-'' + id.imprv_det_meth_cd + ''-'' + id.imprv_det_type_cd'
		print '     from imprv_detail as id with(nolock)'
		print '     where id.prop_id = @prop_id'
		print '     and id.prop_val_yr = @prop_val_yr'
		print '     and id.sup_num = @sup_num'
		print '     and id.imprv_id = @imprv_id'
		print '     and id.imprv_det_id = @imprv_det_id'
		print '     and id.sale_id = @sale_id'
	end
	else if ( @szTableName = 'imprv_sched' )
	begin
		print '     set @tvar_szRefID = @imprv_det_meth_cd + ''-'' + @imprv_det_type_cd + ''-'' + @imprv_det_class_cd + ''-'' + @imprv_det_sub_class_cd + ''-'' + convert(varchar(4), @imprv_yr)'
	end
	else if ( @szTableName = 'imprv_sched_area_type' )
	begin
		print '     set @tvar_szRefID = @imprv_sched_area_type_cd'
	end
	else if ( @szTableName = 'imprv_sched_attr' )
	begin
		print '     set @tvar_szRefID = @imprv_det_meth_cd + ''-'' + @imprv_det_type_cd + ''-'' + @imprv_det_class_cd + ''-'' + @imprv_det_sub_class_cd + ''-'' + convert(varchar(12), @imprv_attr_id) + ''-'' + convert(varchar(4), @imprv_yr)'
	end
	else if ( @szTableName = 'imprv_sched_detail' )
	begin
		print '     set @tvar_szRefID = @imprv_det_meth_cd + ''-'' + @imprv_det_type_cd + ''-'' + @imprv_det_class_cd + ''-'' + @imprv_det_sub_class_cd + ''-'' + convert(varchar(4), @imprv_yr) + ''-'' + convert(varchar(24), @range_max)'
	end
	else if ( @szTableName = 'income_sched' )
	begin
		print '     set @tvar_szRefID = @prop_type + ''-'' + @class_cd + ''-'' + @econ_area + ''-'' + @level_cd + ''-'' + convert(varchar(4), @income_yr)'
	end
	else if ( @szTableName = 'land_adj' )
	begin
		print '     select @tvar_szRefID = ld.land_type_cd + ''-'' + @land_seg_adj_type'
		print '     from land_detail as ld with(nolock)'
		print '     where ld.prop_id = @prop_id'
		print '     and ld.prop_val_yr = @prop_val_yr'
		print '     and ld.sup_num = @sup_num'
		print '     and ld.land_seg_id = @land_seg_id'
		print '     and ld.sale_id = @sale_id'
	end
	else if ( @szTableName = 'land_adj_type' )
	begin
		print '     set @tvar_szRefID = @land_adj_type_cd + ''-'' + convert(varchar(4), @land_adj_type_year)'
	end
	else if ( @szTableName = 'land_detail' )
	begin
		print '     set @tvar_szRefID = @land_type_cd'
	end
	else if ( @szTableName = 'land_sched' )
	begin
		print '     set @tvar_szRefID = convert(varchar(12), @ls_id) + ''-'' + convert(varchar(4), @ls_year)'
	end
	else if ( @szTableName = 'land_sched_detail' )
	begin
		print '     set @tvar_szRefID = convert(varchar(12), @ls_detail_id) + ''-'' + convert(varchar(12), @ls_id) + ''-'' + convert(varchar(4), @ls_year)'
	end
	else if ( @szTableName = 'lease_prop_assoc' )
	begin
		print '     set @tvar_szRefID = convert(varchar(12), @lease_id)'
	end
	else if ( @szTableName = 'mortgage_assoc' )
	begin
		print '     select @tvar_szRefID = ''Mortgage: '' + a.file_as_name'
		print '     from account as a with(nolock)'
		print '     where a.acct_id = @mortgage_co_id'
	end
	else if ( @szTableName = 'ms_comm_cost_mult' )
	begin
		print '     set @tvar_szRefID = convert(varchar(4), @ms_year) + ''-'' + @cost_class + ''-'' + @cost_section'
	end
	else if ( @szTableName = 'ms_comm_local_mult' )
	begin
		print '     set @tvar_szRefID = convert(varchar(4), @ms_year) + ''-'' + @local_class'
	end
	else if ( @szTableName = 'ms_manuf_mult' )
	begin
		print '     set @tvar_szRefID = convert(varchar(4), @ms_year)'
	end
	else if ( @szTableName = 'ms_mult' )
	begin
		print '     set @tvar_szRefID = convert(varchar(4), @ms_year)'
	end
	else if ( @szTableName = 'ms_multi_mult' )
	begin
		print '     set @tvar_szRefID = convert(varchar(4), @ms_year)'
	end
	else if ( @szTableName = 'neighborhood' )
	begin
		print '     set @tvar_szRefID = @hood_cd + ''-'' + convert(varchar(4), @hood_yr)'
	end
	else if ( @szTableName = 'owner' )
	begin
		print '     select @tvar_szRefID = a.file_as_name'
		print '     from account as a with(nolock)'
		print '     where a.acct_id = @owner_id'
	end
	else if ( @szTableName = 'pers_prop_rendition' )
	begin
		print '     set @tvar_szRefID = convert(varchar(4), @rendition_year)'
	end
	else if ( @szTableName = 'pers_prop_seg' )
	begin
		print '     set @tvar_szRefID = @pp_type_cd'
	end
	else if ( @szTableName = 'pp_schedule' )
	begin
		print '     set @tvar_szRefID = convert(varchar(4), @year) + ''-'' + @value_method + ''-'' + @table_code + ''-'' + @segment_type'
	end
	else if ( @szTableName = 'pp_schedule_adj' )
	begin
		print '     select @tvar_szRefID = convert(varchar(4), @year) + ''-'' + pps.value_method + ''-'' + pps.table_code + ''-'' + pps.segment_type + '':'' + @pp_sched_adj_cd'
		print '     from pp_schedule as pps with(nolock)'
		print '     where pps.pp_sched_id = @pp_sched_id'
		print '     and pps.year = @year'
	end
	else if ( @szTableName = 'pp_schedule_area' )
	begin
		print '     select @tvar_szRefID = convert(varchar(4), @year) + ''-'' + pps.value_method + ''-'' + pps.table_code + ''-'' + pps.segment_type + '':'' + convert(varchar(24), @area_max)'
		print '     from pp_schedule as pps with(nolock)'
		print '     where pps.pp_sched_id = @pp_sched_id'
		print '     and pps.year = @year'
	end
	else if ( @szTableName = 'pp_schedule_class' )
	begin
		print '     select @tvar_szRefID = convert(varchar(4), @year) + ''-'' + pps.value_method + ''-'' + pps.table_code + ''-'' + pps.segment_type + '':'' + @pp_class_cd'
		print '     from pp_schedule as pps with(nolock)'
		print '     where pps.pp_sched_id = @pp_sched_id'
		print '     and pps.year = @year'
	end
	else if ( @szTableName = 'pp_schedule_deprec' )
	begin
		print '     select @tvar_szRefID = convert(varchar(4), @year) + ''-'' + pps.value_method + ''-'' + pps.table_code + ''-'' + pps.segment_type + '':'' + @pp_sched_deprec_type_cd + ''-'' + @pp_sched_deprec_deprec_cd'
		print '     from pp_schedule as pps with(nolock)'
		print '     where pps.pp_sched_id = @pp_sched_id'
		print '     and pps.year = @year'
	end
	else if ( @szTableName = 'pp_schedule_order' )
	begin
		print '     select @tvar_szRefID = convert(varchar(4), @year) + ''-'' + pps.value_method + ''-'' + pps.table_code + ''-'' + pps.segment_type'
		print '     from pp_schedule as pps with(nolock)'
		print '     where pps.pp_sched_id = @pp_sched_id'
		print '     and pps.year = @year'
	end
	else if ( @szTableName = 'pp_schedule_quality_density' )
	begin
		print '     select @tvar_szRefID = convert(varchar(4), @year) + ''-'' + pps.value_method + ''-'' + pps.table_code + ''-'' + pps.segment_type + '':'' + @quality_cd + ''-'' + @density_cd'
		print '     from pp_schedule as pps with(nolock)'
		print '     where pps.pp_sched_id = @pp_sched_id'
		print '     and pps.year = @year'
	end
	else if ( @szTableName = 'pp_schedule_unit_count' )
	begin
		print '     select @tvar_szRefID = convert(varchar(4), @year) + ''-'' + pps.value_method + ''-'' + pps.table_code + ''-'' + pps.segment_type + '':'' + convert(varchar(24), @unit_count_max)'
		print '     from pp_schedule as pps with(nolock)'
		print '     where pps.pp_sched_id = @pp_sched_id'
		print '     and pps.year = @year'
	end
	else if ( @szTableName = 'prop_building_permit_assoc' )
	begin
		print '     set @tvar_szRefID = ''Permit: '' + convert(varchar(12), @bldg_permit_id)'
	end
	else if ( @szTableName = 'prop_group_assoc' )
	begin
		print '     set @tvar_szRefID = @prop_group_cd'
	end
	else if ( @szTableName = 'property_assoc' )
	begin
		print '     set @tvar_szRefID = ''LINKED'''
	end
	else if ( @szTableName = 'property_exemption' )
	begin
		print '     select @tvar_szRefID = @exmpt_type_cd + '' - Owner: '' + a.file_as_name'
		print '     from account as a with(nolock)'
		print '     where a.acct_id = @owner_id'
	end
	else if ( @szTableName = 'property_freeze' )
	begin
		print '     select @tvar_szRefID = ''Entity: '' + ltrim(rtrim(e.entity_cd)) + ''; Exemption: '' + ltrim(rtrim(@exmpt_type_cd)) + ''; Owner: '' + a.file_as_name'
		print '     from entity as e with (nolock)'
		print '     cross join account as a with (nolock)'
		print '     where e.entity_id = @entity_id'
		print '     and a.acct_id = @owner_id'
	end
	else if ( @szTableName = 'seller_assoc' )
	begin
		print '     select @tvar_szRefID = a.file_as_name'
		print '     from account as a with(nolock)'
		print '     where a.acct_id = @seller_id'
	end
	else if ( @szTableName = 'shared_prop' )
	begin
		print '     set @tvar_szRefID = @shared_cad_code'
	end
	else if ( @szTableName = 'shared_prop_value' )
	begin
		print '     set @tvar_szRefID = @shared_cad_code + ''-'' + convert(varchar(12), @shared_value_id)'
	end
	else if ( @szTableName = 'tax_rate' )
	begin
		print '     select @tvar_szRefID = e.entity_cd + ''-'' + convert(varchar(4), @tax_rate_yr)'
		print '     from entity as e with(nolock)'
		print '     where entity_id = @entity_id'
	end
	else if ( @szTableName = 'imprv_entity_assoc' )
	begin
		print '     select @tvar_szRefID = entity.entity_cd + '' - '' + convert(varchar(12), @imprv_id)'
		print '     from entity with(nolock)'
		print '     where entity_id = @entity_id'
	end
	else if ( @szTableName = 'land_entity_assoc' )
	begin
		print '     select @tvar_szRefID = entity.entity_cd + '' - '' + convert(varchar(12), @land_seg_id)'
		print '     from entity with(nolock)'
		print '     where entity_id = @entity_id'
	end
	else if ( @szTableName = 'pers_prop_entity_assoc' )
	begin
		print '     select @tvar_szRefID = entity.entity_cd + '' - '' + convert(varchar(12), @pp_seg_id)'
		print '     from entity with(nolock)'
		print '     where entity_id = @entity_id'
	end
	else if ( @szTableName = 'imprv_owner_assoc' )
	begin
		print '     set @tvar_szRefID = ''Property ID: '' + convert(varchar(12), @prop_id) + '' - Owner ID: '' + convert(varchar(12), @owner_id) + '' - Segment ID: '' + convert(varchar(12), @imprv_id)'
	end
	else if ( @szTableName = 'land_owner_assoc' )
	begin
		print '     set @tvar_szRefID = ''Property ID: '' + convert(varchar(12), @prop_id) + '' - Owner ID: '' + convert(varchar(12), @owner_id) + '' - Segment ID: '' + convert(varchar(12), @land_seg_id)'
	end
	else if ( @szTableName = 'pers_prop_owner_assoc' )
	begin
		print '     set @tvar_szRefID = ''Property ID: '' + convert(varchar(12), @prop_id) + '' - Owner ID: '' + convert(varchar(12), @owner_id) + '' - Segment ID: '' + convert(varchar(12), @pp_seg_id)'
	end
	else if ( @szTableName = 'imprv_exemption_assoc' )
	begin
		print '     select @tvar_szRefID = @exmpt_type_cd + '' - '' + entity.entity_cd + '' - '' + convert(varchar(12), @imprv_id)'
		print '     from entity with(nolock)'
		print '     where entity_id = @entity_id'
	end
	else if ( @szTableName = 'land_exemption_assoc' )
	begin
		print '     select @tvar_szRefID = @exmpt_type_cd + '' - '' + entity.entity_cd + '' - '' + convert(varchar(12), @land_seg_id)'
		print '     from entity with(nolock)'
		print '     where entity_id = @entity_id'
	end
	else if ( @szTableName = 'pers_prop_exemption_assoc' )
	begin
		print '     select @tvar_szRefID = @exmpt_type_cd + '' - '' + entity.entity_cd + '' - '' + convert(varchar(12), @pp_seg_id)'
		print '     from entity with(nolock)'
		print '     where entity_id = @entity_id'
	end
	else if ( @szTableName = 'forms_maintenance' )
	begin
		print '     set @tvar_szRefID = ''Form Type: '' + @form_type'
	end
	else if ( @szTableName = 'legal_build_rules' )
	begin
		print '     set @tvar_szRefID = ''Type/Field: '' + @abs_subdv_ind + ''/'' + (select szFieldDesc from legal_build_rules_field_code with(nolock) where lFieldCode = @field_cd)'
	end
	else if ( @szTableName = 'reportquestions' )
	begin
		print '     set @tvar_szRefID = ''Report/Question: '' + @report + ''/'' + @questionid'
	end
	else if ( @szTableName = 'fin_event_fund_assoc' )
	begin
		print '     set @tvar_szRefID = cast(@year as varchar) + ''-'' + cast(@tax_district_id as varchar) + ''-'' + @levy_cd + ''-'' + cast(@fund_id as varchar) + ''-'' + @event_cd'
	end
	else if ( @szTableName = 'fin_event_assessment_assoc' )
	begin
		print '     set @tvar_szRefID = cast(@year as varchar) + ''-'' + cast(@agency_id as varchar) + ''-'' + @event_cd'
	end
	else if ( @szTableName = 'fin_event_escrow_assoc' )
	begin
		print '     set @tvar_szRefID = cast(@year as varchar) + ''-'' + @escrow_type_cd + ''-'' + @event_cd'
	end
	else if ( @szTableName = 'fin_event_overpmt_credit_assoc' )
	begin
		print '     set @tvar_szRefID = @event_cd'
	end
	else if ( @szTableName = 'fin_event_fee_type_assoc' )
	begin
		print '     set @tvar_szRefID = @fee_type_cd + ''-'' + @event_cd'
	end
	else if ( @szTableName = 'fin_event_refund_type_assoc' )
	begin
		print '     set @tvar_szRefID = cast(@year as varchar) + ''-'' + @refund_type_cd + ''-'' + @event_cd'
	end
	else if ( @szTableName = 'fin_event_reet_rate_assoc' )
	begin
		print '     set @tvar_szRefID = cast(@reet_rate_id as varchar) + ''-'' + cast(@tax_district_id as varchar) + ''-'' + @uga_indicator_cd + ''-'' + @description + ''-'' + @event_cd'
	end
	else if ( @szTableName = 'sale_additional_codes' )
	begin
		print '     set @tvar_szRefID = cast(@chg_of_owner_id as varchar) + ''-'' + @sale_cd'
	end
	else if ( @szTableName = 'reet' )
	begin
		print '     set @tvar_szRefID = cast(@reet_id as varchar)'
	end
	else if ( @szTableName = 'mh_movement' )
	begin
		print '     set @tvar_szRefID = ''MHM '' + cast(@mhm_id as varchar) + '' - Property '' + cast(@prop_id as varchar)'
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
			set @error_string = 'Not all column IDs exist in pacs_columns:' + @szColName
			raiserror(@error_string, 18, 1)
			return
		end
		
		print '     if exists ('
		print '          select chg_log_audit'
		print '          from chg_log_columns with(nolock)'
		print '          where'
		print '               chg_log_tables = ''' + @szTableName + ''' and'
		print '               chg_log_columns = ''' + @szColName + ''' and'
		print '               chg_log_audit = 1'
		print '     )'
		print '     begin'
		print '          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )'
		print '          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, ''I'', ' + convert(varchar(12), @iTableID) + ', ' + convert(varchar(12), @iColumnID) + ', null, convert(varchar(255), @' + @szColName + '), @tvar_szRefID )'
		print '          set @tvar_lChangeID = @@identity'
		if ( @szInsertKeysSQL <> '' )
		begin
			print @szInsertKeysSQL
		end
		print '     end'
		print ''

		fetch next from curColumns into @szColName
	end

	close curColumns
	deallocate curColumns

	print '     fetch next from curRows into ' + @szFetchInto
	print 'end'
	print ''
	print 'close curRows'
	print 'deallocate curRows'
	print ''
	print 'go'

set nocount off

GO

