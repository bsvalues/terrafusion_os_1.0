

create procedure sp_CreateChangeLogTriggerSQL
	@szTableName sysname,
	@szType char(1)
as

set nocount on

	create table #tmp_special_case_future_year
	(
		szTableName sysname not null,
		szColumnName sysname not null
	)
	insert #tmp_special_case_future_year values ('prop_supp_assoc', 'owner_tax_yr')
	insert #tmp_special_case_future_year values ('property_val', 'prop_val_yr')
	insert #tmp_special_case_future_year values ('entity_prop_assoc', 'tax_yr')
	insert #tmp_special_case_future_year values ('property_exemption', 'exmpt_tax_yr')
	insert #tmp_special_case_future_year values ('property_exemption', 'owner_tax_yr')
	insert #tmp_special_case_future_year values ('property_freeze', 'exmpt_tax_yr')
	insert #tmp_special_case_future_year values ('property_freeze', 'owner_tax_yr')
	insert #tmp_special_case_future_year values ('property_special_entity_exemption', 'exmpt_tax_yr')
	insert #tmp_special_case_future_year values ('property_special_entity_exemption', 'owner_tax_yr')
	insert #tmp_special_case_future_year values ('owner', 'owner_tax_yr')
	insert #tmp_special_case_future_year values ('imprv', 'prop_val_yr')
	insert #tmp_special_case_future_year values ('imprv_detail', 'prop_val_yr')
	insert #tmp_special_case_future_year values ('imprv_adj', 'prop_val_yr')
	insert #tmp_special_case_future_year values ('imprv_det_adj', 'prop_val_yr')
	insert #tmp_special_case_future_year values ('imprv_attr', 'prop_val_yr')
	insert #tmp_special_case_future_year values ('land_detail', 'prop_val_yr')
	insert #tmp_special_case_future_year values ('land_adj', 'prop_val_yr')
	insert #tmp_special_case_future_year values ('pers_prop_seg', 'prop_val_yr')
	insert #tmp_special_case_future_year values ('pp_seg_sched_assoc', 'prop_val_yr')
	insert #tmp_special_case_future_year values ('agent_assoc', 'owner_tax_yr')
	insert #tmp_special_case_future_year values ('shared_prop', 'shared_year')
	insert #tmp_special_case_future_year values ('shared_prop_value', 'shared_year')
	insert #tmp_special_case_future_year values ('income', 'income_yr')
	insert #tmp_special_case_future_year values ('income_prop_assoc', 'prop_val_yr')
	insert #tmp_special_case_future_year values ('imprv_sched', 'imprv_yr')
	insert #tmp_special_case_future_year values ('imprv_sched_detail', 'imprv_yr')
	insert #tmp_special_case_future_year values ('imprv_sched_attr', 'imprv_yr')
	insert #tmp_special_case_future_year values ('imprv_attr_val', 'imprv_yr')
	insert #tmp_special_case_future_year values ('slope_intercept_deprec', 'sid_year')
	insert #tmp_special_case_future_year values ('slope_intercept_eif_detail', 'sid_year')
	insert #tmp_special_case_future_year values ('slope_intercept_size_detail', 'sid_year')
	insert #tmp_special_case_future_year values ('slope_intercept_std_detail', 'sid_year')
	insert #tmp_special_case_future_year values ('land_sched', 'ls_year')
	insert #tmp_special_case_future_year values ('land_sched_detail', 'ls_year')
	insert #tmp_special_case_future_year values ('land_sched_si_detail', 'ls_year')
	insert #tmp_special_case_future_year values ('land_sched_ff_detail', 'ls_year')
	insert #tmp_special_case_future_year values ('pp_schedule', 'year')
	insert #tmp_special_case_future_year values ('pp_schedule_class', 'year')
	insert #tmp_special_case_future_year values ('pp_schedule_area', 'year')
	insert #tmp_special_case_future_year values ('pp_schedule_adj', 'year')
	insert #tmp_special_case_future_year values ('pp_schedule_deprec', 'year')
	insert #tmp_special_case_future_year values ('pp_schedule_quality_density', 'year')
	insert #tmp_special_case_future_year values ('pp_schedule_order', 'year')
	insert #tmp_special_case_future_year values ('pp_schedule_unit_count', 'year')
	insert #tmp_special_case_future_year values ('ms_comm_cost_mult', 'ms_year')
	insert #tmp_special_case_future_year values ('ms_comm_local_mult', 'ms_year')
	insert #tmp_special_case_future_year values ('ms_manuf_mult', 'ms_year')
	insert #tmp_special_case_future_year values ('ms_mult', 'ms_year')
	insert #tmp_special_case_future_year values ('ms_multi_mult', 'ms_year')
	insert #tmp_special_case_future_year values ('neighborhood', 'hood_yr')
	insert #tmp_special_case_future_year values ('abs_subdv', 'abs_subdv_yr')
	insert #tmp_special_case_future_year values ('depreciation', 'year')
	insert #tmp_special_case_future_year values ('depreciation_detail', 'year')
	insert #tmp_special_case_future_year values ('imprv_adj_type', 'imprv_adj_type_year')
	insert #tmp_special_case_future_year values ('land_adj_type', 'land_adj_type_year')
	insert #tmp_special_case_future_year values ('next_statement_id', 'statement_yr')
	insert #tmp_special_case_future_year values ('next_supp_id', 'sup_year')
	insert #tmp_special_case_future_year values ('next_arb_protest_id', 'arb_protest_year')
	insert #tmp_special_case_future_year values ('tax_rate', 'tax_rate_yr')
	insert #tmp_special_case_future_year values ('entity_exmpt', 'exmpt_tax_yr')

	print ''
	print 'set quoted_identifier on'
	print 'set ansi_nulls on'
	print 'go'
	print ''

	if ( @szType = 'I' )
	begin
		exec sp_CreateChangeLogInsertTriggerSQL @szTableName
	end
	else if ( @szType = 'U' )
	begin
		exec sp_CreateChangeLogUpdateTriggerSQL @szTableName
	end
	else if ( @szType = 'D' )
	begin
		exec sp_CreateChangeLogDeleteTriggerSQL @szTableName
	end
	else
	begin
		print 'Valid values for parameter 2 are I, U, and D'
	end

	drop table #tmp_special_case_future_year

set nocount off

GO

