
create procedure AccountIDReassign
	--Set these to the current account ID range to be moved
	@lAcctIDFrom_Begin int,
	@lAcctIDFrom_End int,
	-- Set this to the first new account ID to be assigned
	@lAcctIDTo_Begin int,
	-- Values & outcomes:
	--          0 = Do not update next_acct_id
	--Default   1 = Update next_acct_id = last new ID assigned + 1
	@bSetNextAcctID bit = 1
as

declare @lAcctIDTo_End int

if ( @lAcctIDTo_Begin = 0 )
begin
	raiserror('Acct ID reassignment script - You did not specify the new beginning acct ID (seed)', 20, 1) with log
end

if exists (
	select lRunID
	from cnv_acct_id_reassign
	where dtComplete is null
)
begin
	raiserror('Acct ID reassignment script - Another instance of this script is running or a former run failed and the run/detail data has not been cleaned up', 20, 1) with log
end

begin transaction

declare @lNumAccounts int

select @lNumAccounts = next_account_id -- If you don't understand why this is here ask James before deciding to remove
from next_account_id with(tablock, updlock, holdlock)

select @lNumAccounts = count(*)
from account with(tablockx)
where
	acct_id >= @lAcctIDFrom_Begin and
	acct_id <= @lAcctIDFrom_End

if ( @lNumAccounts = 0 )
begin
	raiserror('Acct ID reassignment script - No accounts exist within the input range', 20, 1) with log
end

declare @lLastAcctID int
set @lLastAcctID = @lAcctIDTo_Begin + @lNumAccounts - 1

if exists (
	select top 1 acct_id
	from account with(tablockx)
	where
		acct_id >= @lAcctIDTo_Begin and
		acct_id <= @lLastAcctID
)
begin
	raiserror('Acct ID reassignment script - One or more accounts already exist within the destination range', 20, 1) with log
end

declare @lRunID int

insert cnv_acct_id_reassign (
	dtRun, szMachine, lAcctIDFrom_Begin, lAcctIDFrom_End, lAcctIDTo_Begin, bSetNextAcctID
) values (
	getdate(), host_name(), @lAcctIDFrom_Begin, @lAcctIDFrom_End, @lAcctIDTo_Begin, @bSetNextAcctID
)
set @lRunID = scope_identity()

insert cnv_acct_id_reassign_detail with(tablockx) (lRunID, lAcctID_Old, lAcctID_New)
select @lRunID, acct_id, 0
from account with(tablockx)
where
	acct_id >= @lAcctIDFrom_Begin and
	acct_id <= @lAcctIDFrom_End
order by acct_id asc

set rowcount 1

set nocount on
-- Determine the new account IDs
while ( @lAcctIDTo_Begin <= @lLastAcctID )
begin
	update cnv_acct_id_reassign_detail with(tablockx)
	set lAcctID_New = @lAcctIDTo_Begin
	where
		lRunID = @lRunID and
		lAcctID_New = 0

	set @lAcctIDTo_Begin = @lAcctIDTo_Begin + 1
end

set nocount off

set rowcount 0

if ( @bSetNextAcctID = 1 )
begin
	update next_account_id set next_account_id = @lLastAcctID + 1
end

commit transaction


-- Disable all triggers & constraints
declare @szSQL varchar(8000)
declare curTables insensitive cursor
for
	select name
	from sysobjects
	where
	xtype = 'U' and
	objectproperty(id, 'IsMSShipped') = 0 and
	name not in ('qe_macro_detail','profile_run_list')
for read only

declare @szTable sysname

open curTables
fetch next from curTables into @szTable

while ( @@fetch_status = 0 )
begin
	set @szSQL = 'alter table ' + @szTable + ' nocheck constraint all'
	exec(@szSQL)
	set @szSQL = 'alter table ' + @szTable + ' disable trigger all'
	exec(@szSQL)

	fetch next from curTables into @szTable
end

close curTables
deallocate curTables


create table #table_col_update
(
	szTableName sysname,
	szColumnName sysname,
	primary key clustered (szTableName, szColumnName)
	with fillfactor = 100
)


set nocount on


insert #table_col_update values ('_arb_inquiry', 'inq_by_id')
insert #table_col_update values ('_arb_protest', 'prot_by_id')
insert #table_col_update values ('abs_subdv_worksheet_entity_assoc', 'entity_id')
insert #table_col_update values ('account', 'acct_id')
insert #table_col_update values ('account', 'ref_acct_id')
insert #table_col_update values ('account_event_assoc', 'acct_id')
insert #table_col_update values ('account_group_assoc', 'acct_id')
insert #table_col_update values ('address', 'acct_id')
insert #table_col_update values ('ag_rollback', 'owner_id')
insert #table_col_update values ('ag_rollback_entity', 'entity_id')
insert #table_col_update values ('ag_rollback_entity', 'owner_id')
insert #table_col_update values ('ag_rollback_year', 'owner_id')
insert #table_col_update values ('agent', 'agent_id')
insert #table_col_update values ('agent_assoc', 'agent_id')
insert #table_col_update values ('agent_assoc', 'owner_id')
insert #table_col_update values ('appr_notice_config_maint_omit_entity', 'entity_id')
insert #table_col_update values ('appr_notice_prop_list', 'notice_owner_id')
insert #table_col_update values ('appr_notice_prop_list', 'owner_id')
insert #table_col_update values ('appr_notice_prop_list_bill', 'entity_id')
insert #table_col_update values ('appr_notice_prop_list_bill', 'owner_id')
insert #table_col_update values ('appr_notice_prop_list_entity_exemption', 'entity_id')
insert #table_col_update values ('appr_notice_prop_list_entity_exemption', 'owner_id')
insert #table_col_update values ('appr_notice_prop_list_exemption', 'owner_id')
insert #table_col_update values ('appr_notice_prop_list_shared_cad', 'owner_id')
insert #table_col_update values ('appr_notice_selection_criteria_omit_entity', 'entity_id')
insert #table_col_update values ('appraisal_totals', 'entity_id')
insert #table_col_update values ('appraisal_totals_cad_state_cd', 'entity_id')
insert #table_col_update values ('appraisal_totals_criteria_entity', 'entity_id')
insert #table_col_update values ('appraisal_totals_exemptions', 'entity_id')
insert #table_col_update values ('appraisal_totals_freezes', 'entity_id')
insert #table_col_update values ('appraisal_totals_new_ag', 'entity_id')
insert #table_col_update values ('appraisal_totals_new_annex', 'entity_id')
insert #table_col_update values ('appraisal_totals_new_ave_hs', 'entity_id')
insert #table_col_update values ('appraisal_totals_new_deannex', 'entity_id')
insert #table_col_update values ('appraisal_totals_new_exemptions', 'entity_id')
insert #table_col_update values ('appraisal_totals_new_value', 'entity_id')
insert #table_col_update values ('appraisal_totals_state_cd', 'entity_id')
insert #table_col_update values ('appraisal_totals_transfers', 'entity_id')
insert #table_col_update values ('arb_listing', 'owner_id')
insert #table_col_update values ('arb_protest', 'inquiry_by_id')
insert #table_col_update values ('attorney', 'attorney_id')
insert #table_col_update values ('batch_journal_collections', 'entity_id')
insert #table_col_update values ('batch_journal_collections_detail', 'entity_id')
insert #table_col_update values ('bill', 'entity_id')
insert #table_col_update values ('bill', 'owner_id')
insert #table_col_update values ('bill_adj_trans', 'entity_id')
insert #table_col_update values ('bill_adj_trans', 'owner_id')
insert #table_col_update values ('buyer_assoc', 'buyer_id')
insert #table_col_update values ('certified_mailer', 'acct_id')
insert #table_col_update values ('certified_mailer', 'owner_id')
insert #table_col_update values ('certified_mailer', 'prot_by_id')
insert #table_col_update values ('cnv_udi_child', 'owner_id')
insert #table_col_update values ('collections_entity_cv', 'entity_id')
insert #table_col_update values ('collections_entity_cv', 'owner_id')
insert #table_col_update values ('collections_exemption_cv', 'owner_id')
insert #table_col_update values ('collections_owner_cv', 'acct_id')
insert #table_col_update values ('collections_property_cv', 'owner_id')
insert #table_col_update values ('collections_sp_ent_ex_cv', 'entity_id')
insert #table_col_update values ('collections_sp_ent_ex_cv', 'owner_id')
insert #table_col_update values ('collector', 'collector_id')
insert #table_col_update values ('curr_delq_entity_list', 'entity_id')
insert #table_col_update values ('delq_notice', 'agent_id')
insert #table_col_update values ('delq_notice', 'owner_id')
insert #table_col_update values ('delq_notice', 'payee_id')
insert #table_col_update values ('delq_notice_bill', 'entity_id')
insert #table_col_update values ('delq_roll', 'entity_id')
insert #table_col_update values ('delq_roll', 'owner_id')
insert #table_col_update values ('delq_roll_bill', 'entity_id')
insert #table_col_update values ('delq_roll_bill', 'owner_id')
insert #table_col_update values ('delq_roll_params_entity', 'entity_id')
insert #table_col_update values ('delq_roll_totals', 'entity_id')
insert #table_col_update values ('effective_tax_rate', 'entity_id')
insert #table_col_update values ('entity', 'collector_id')
insert #table_col_update values ('entity', 'entity_id')
insert #table_col_update values ('entity_attorney', 'entity_attorney_id')
insert #table_col_update values ('entity_attorney', 'entity_id')
insert #table_col_update values ('entity_curr_delq', 'entity_id')
insert #table_col_update values ('entity_exmpt', 'entity_id')
insert #table_col_update values ('entity_prop_assoc', 'entity_id')
insert #table_col_update values ('entity_tax_statement_group_assoc', 'entity_id')
insert #table_col_update values ('entity_tax_statement_run_print_history', 'print_indiv_agent_id')
insert #table_col_update values ('entity_tax_statement_run_print_history', 'print_indiv_mort_id')
insert #table_col_update values ('entity_tax_statement_run_print_history', 'print_indiv_taxserver_id')
insert #table_col_update values ('escrow', 'payee_id')
insert #table_col_update values ('escrow', 'owner_id')
insert #table_col_update values ('escrow_trans', 'owner_id')
insert #table_col_update values ('etr_annex_deannex', 'entity_id')
insert #table_col_update values ('etr_annex_deannex', 'owner_id')
insert #table_col_update values ('etr_average_hs', 'entity_id')
insert #table_col_update values ('etr_deannex_rpt', 'entity_id')
insert #table_col_update values ('etr_deannex_rpt', 'owner_id')
insert #table_col_update values ('etr_new_ag', 'entity_id')
insert #table_col_update values ('etr_new_ag', 'owner_id')
insert #table_col_update values ('etr_new_ex', 'entity_id')
insert #table_col_update values ('etr_new_ex', 'owner_id')
insert #table_col_update values ('fee_acct_assoc', 'acct_id')
insert #table_col_update values ('fee_prop_entity_assoc', 'entity_id')
insert #table_col_update values ('fee_type', 'entity_id')
insert #table_col_update values ('fiscal_month_to_date_recap', 'entity_id')
insert #table_col_update values ('fiscal_month_to_date_recap_delq', 'entity_id')
insert #table_col_update values ('fiscal_month_to_date_recap_refund', 'entity_id')
insert #table_col_update values ('fiscal_range_recap', 'entity_id')
insert #table_col_update values ('fiscal_year_to_date_recap', 'entity_id')
insert #table_col_update values ('fiscal_year_to_date_recap_delq', 'entity_id')
insert #table_col_update values ('fiscal_year_to_date_recap_refund', 'entity_id')
insert #table_col_update values ('fiscal_year_totals', 'entity_id')
insert #table_col_update values ('gain_loss_report', 'entity_id')
insert #table_col_update values ('hs_cap_report', 'entity_id')
insert #table_col_update values ('imprv_entity_assoc', 'entity_id')
insert #table_col_update values ('imprv_exemption_assoc', 'entity_id')
insert #table_col_update values ('imprv_exemption_assoc', 'owner_id')
insert #table_col_update values ('imprv_owner_assoc', 'owner_id')
insert #table_col_update values ('installment_agreement', 'ia_acct_id')
insert #table_col_update values ('installment_agreement_bill', 'entity_id')
insert #table_col_update values ('installment_agreement_bill', 'owner_id')
insert #table_col_update values ('land_entity_assoc', 'entity_id')
insert #table_col_update values ('land_exemption_assoc', 'entity_id')
insert #table_col_update values ('land_exemption_assoc', 'owner_id')
insert #table_col_update values ('land_owner_assoc', 'owner_id')
insert #table_col_update values ('lawsuit_contact', 'acct_id')
insert #table_col_update values ('lease_entity_assoc', 'entity_id')
insert #table_col_update values ('levy_group_entity_assoc', 'levy_entity_id')
insert #table_col_update values ('levy_roll_log', 'entity_id')
insert #table_col_update values ('litigation', 'owner_id')
insert #table_col_update values ('litigation_owner_history', 'owner_id')
insert #table_col_update values ('mh_lien', 'entity_id')
insert #table_col_update values ('mh_lien_export_run_detail', 'entity_id')
insert #table_col_update values ('mh_lien_export_run_detail', 'owner_id')
insert #table_col_update values ('mh_lien_release_run_detail', 'entity_id')
insert #table_col_update values ('mh_lien_release_run_detail', 'owner_id')
insert #table_col_update values ('mh_movement_tax_due', 'entity_id')
insert #table_col_update values ('mineral_entity_cv', 'entity_id')
insert #table_col_update values ('mineral_entity_cv', 'owner_id')
insert #table_col_update values ('mineral_exemption_cv', 'owner_id')
insert #table_col_update values ('mineral_owner_cv', 'acct_id')
insert #table_col_update values ('mineral_property_cv', 'owner_id')
insert #table_col_update values ('mineral_sp_ent_ex_cv', 'entity_id')
insert #table_col_update values ('mineral_sp_ent_ex_cv', 'owner_id')
insert #table_col_update values ('mineral_import_entity', 'entity_id')
insert #table_col_update values ('mineral_import_entity', 'owner_id')
insert #table_col_update values ('mineral_import_entity_map', 'entity_id')
insert #table_col_update values ('mineral_import_exemption', 'owner_id')
insert #table_col_update values ('mineral_import_owner', 'acct_id')
insert #table_col_update values ('mineral_import_property', 'owner_id')
insert #table_col_update values ('mineral_import_special_entity_exemption', 'entity_id')
insert #table_col_update values ('mineral_import_special_entity_exemption', 'owner_id')
insert #table_col_update values ('month_to_date_recap', 'entity_id')
insert #table_col_update values ('month_to_date_recap_date_range', 'entity_id')
insert #table_col_update values ('month_to_date_recap_delq', 'entity_id')
insert #table_col_update values ('month_to_date_recap_refund', 'entity_id')
insert #table_col_update values ('monthly_as_of_recap_escrow_tax_cert', 'entity_id')
insert #table_col_update values ('monthly_as_of_recap_ins', 'entity_id')
insert #table_col_update values ('monthly_as_of_recap_mno', 'entity_id')
insert #table_col_update values ('monthly_as_of_recap_params', 'entity_id')
insert #table_col_update values ('monthly_as_of_recap_summary', 'entity_id')
insert #table_col_update values ('monthly_report', 'entity_id')
insert #table_col_update values ('monthly_report_detail', 'entity_id')
insert #table_col_update values ('mortgage_assoc', 'mortgage_co_id')
insert #table_col_update values ('mortgage_co', 'mortgage_co_id')
insert #table_col_update values ('mortgage_co', 'taxserver_id')
insert #table_col_update values ('mortgage_payment', 'mortgage_co_id')
insert #table_col_update values ('mortgage_payment', 'owner_id')
insert #table_col_update values ('mortgage_payment_run', 'payee_id')
insert #table_col_update values ('mortgage_prop_tax_due', 'entity_id')
insert #table_col_update values ('mortgage_prop_tax_due', 'mortgage_co_id')
insert #table_col_update values ('mortgage_prop_tax_due', 'owner_id')
insert #table_col_update values ('oa_change_entity', 'entity_id')
insert #table_col_update values ('oa_change_info', 'current_account_id')
insert #table_col_update values ('oa_changes', 'acct_id')
insert #table_col_update values ('oa_mt_change_info', 'current_account_id')
insert #table_col_update values ('owner', 'owner_id')
insert #table_col_update values ('owner_jan1', 'owner_id')
insert #table_col_update values ('owner_links', 'child_owner_id')
insert #table_col_update values ('owner_links', 'main_owner_id')
insert #table_col_update values ('pacs_user', 'mru_acct_id1')
insert #table_col_update values ('pacs_user', 'mru_acct_id2')
insert #table_col_update values ('pacs_user', 'mru_acct_id3')
insert #table_col_update values ('pacs_user', 'mru_acct_id4')
insert #table_col_update values ('pacs_user', 'mru_acct_id5')
insert #table_col_update values ('pacs_user', 'mru_acct_id6')
insert #table_col_update values ('pacs_user', 'mru_acct_id7')
insert #table_col_update values ('pacs_user', 'mru_acct_id8')
insert #table_col_update values ('payment', 'payee_id')
insert #table_col_update values ('pers_prop_entity_assoc', 'entity_id')
insert #table_col_update values ('pers_prop_exemption_assoc', 'entity_id')
insert #table_col_update values ('pers_prop_exemption_assoc', 'owner_id')
insert #table_col_update values ('pers_prop_owner_assoc', 'owner_id')
insert #table_col_update values ('phone', 'acct_id')
insert #table_col_update values ('pp_rendition_penalty_report', 'owner_id')
insert #table_col_update values ('pp_rendition_prop_penalty', 'owner_id')
insert #table_col_update values ('pp_rendition_prop_penalty_distribution', 'owner_id')
insert #table_col_update values ('prelim_entity_prop_assoc', 'entity_id')
insert #table_col_update values ('prelim_owner', 'owner_id')
insert #table_col_update values ('prelim_prop_owner_entity_val', 'entity_id')
insert #table_col_update values ('prelim_prop_owner_entity_val', 'owner_id')
insert #table_col_update values ('prelim_property_entity_exemption', 'entity_id')
insert #table_col_update values ('prelim_property_entity_exemption', 'owner_id')
insert #table_col_update values ('prelim_property_exemption', 'owner_id')
insert #table_col_update values ('prelim_property_freeze', 'entity_id')
insert #table_col_update values ('prelim_property_freeze', 'owner_id')
insert #table_col_update values ('prelim_property_owner_entity_cad_state_cd', 'entity_id')
insert #table_col_update values ('prelim_property_owner_entity_cad_state_cd', 'owner_id')
insert #table_col_update values ('prelim_property_owner_entity_state_cd', 'entity_id')
insert #table_col_update values ('prelim_property_owner_entity_state_cd', 'owner_id')
insert #table_col_update values ('profile_prop_list_sales', 'sl_city_id')
insert #table_col_update values ('profile_prop_list_sales', 'sl_school_id')
insert #table_col_update values ('prop_owner_entity_val', 'entity_id')
insert #table_col_update values ('prop_owner_entity_val', 'owner_id')
insert #table_col_update values ('prop_owner_entity_val_preview', 'entity_id')
insert #table_col_update values ('prop_owner_entity_val_preview', 'owner_id')
insert #table_col_update values ('prop_tax_cert_info', 'entity_id')
insert #table_col_update values ('prop_tax_cert_info', 'owner_id')
insert #table_col_update values ('prop_tax_due', 'entity_id')
insert #table_col_update values ('prop_tax_due', 'owner_id')
insert #table_col_update values ('property', 'col_agent_id')
insert #table_col_update values ('property', 'col_owner_id')
insert #table_col_update values ('property_entity_exemption', 'entity_id')
insert #table_col_update values ('property_entity_exemption', 'owner_id')
insert #table_col_update values ('property_entity_exemption_preview', 'entity_id')
insert #table_col_update values ('property_entity_exemption_preview', 'owner_id')
insert #table_col_update values ('property_exemption', 'owner_id')
insert #table_col_update values ('property_freeze', 'entity_id')
insert #table_col_update values ('property_freeze', 'owner_id')
insert #table_col_update values ('property_owner_entity_cad_state_cd', 'entity_id')
insert #table_col_update values ('property_owner_entity_cad_state_cd', 'owner_id')
insert #table_col_update values ('property_owner_entity_state_cd', 'entity_id')
insert #table_col_update values ('property_owner_entity_state_cd', 'owner_id')
insert #table_col_update values ('property_profile', 'city_id')
insert #table_col_update values ('property_profile', 'school_id')
insert #table_col_update values ('property_special_entity_exemption', 'entity_id')
insert #table_col_update values ('property_special_entity_exemption', 'owner_id')
insert #table_col_update values ('property_val', 'last_owner_id')
insert #table_col_update values ('PropMortAssoc_dPropMort', 'dMortID')
insert #table_col_update values ('ProtestNotice', 'acct_id')
insert #table_col_update values ('ProtestNotice', 'owner_id')
insert #table_col_update values ('ptd_ag_timber_report', 'entity_id')
insert #table_col_update values ('ptd_comp_avg_value_change_entity', 'entity_id')
insert #table_col_update values ('ptd_mt_state_report', 'entity_id')
insert #table_col_update values ('ptd_mt_state_report_acreage_detail', 'entity_id')
insert #table_col_update values ('ptd_mt_state_report_top_ten', 'entity_id')
insert #table_col_update values ('ptd_mt_state_report_top_ten', 'owner_id')
insert #table_col_update values ('ptd_mt_state_report_tvb', 'entity_id')
insert #table_col_update values ('recap_balance', 'entity_id')
insert #table_col_update values ('recap_fiscal', 'entity_id')
insert #table_col_update values ('recap_fiscal_balance', 'entity_id')
insert #table_col_update values ('recap_fiscal_totals', 'entity_id')
insert #table_col_update values ('recap_self_balance', 'entity_id')
insert #table_col_update values ('refund', 'payee_id')
insert #table_col_update values ('refund_trans', 'fiscal_entity_id')
insert #table_col_update values ('report_refund_due', 'entity_id')
insert #table_col_update values ('sale', 'sl_city_id')
insert #table_col_update values ('sale', 'sl_school_id')
insert #table_col_update values ('sales_ratio_report', 'city_id')
insert #table_col_update values ('sales_ratio_report', 'school_id')
insert #table_col_update values ('seller_assoc', 'seller_id')
insert #table_col_update values ('special_group_owner_assoc', 'owner_id')
insert #table_col_update values ('supp_roll_entity_info', 'entity_id')
insert #table_col_update values ('supp_roll_entity_info', 'owner_id')
insert #table_col_update values ('supp_roll_entity_list', 'entity_id')
insert #table_col_update values ('supp_roll_info', 'owner_id')
insert #table_col_update values ('tax_rate', 'entity_id')
insert #table_col_update values ('tax_summary_report', 'owner_id')
insert #table_col_update values ('taxserver', 'taxserver_id')
insert #table_col_update values ('tnt_export_entity', 'entity_id')
insert #table_col_update values ('transfer_appraisal_entity', 'entity_id')
insert #table_col_update values ('transfer_appraisal_entity_info', 'entity_id')
insert #table_col_update values ('transfer_appraisal_entity_info', 'owner_id')
insert #table_col_update values ('transfer_appraisal_info', 'mortgage_co_id')
insert #table_col_update values ('transfer_appraisal_info', 'entity_agent_id')
insert #table_col_update values ('transfer_appraisal_info', 'jan1_owner_id')
insert #table_col_update values ('transfer_appraisal_info', 'owner_id')
insert #table_col_update values ('transfer_appraisal_info_totals', 'entity_id')
insert #table_col_update values ('transfer_delq_tax', 'entity_id')
insert #table_col_update values ('transfer_delq_tax', 'owner_id')
insert #table_col_update values ('transfer_delq_tax_totals', 'entity_id')
insert #table_col_update values ('transfer_mt_appraisal_entity_info', 'entity_id')
insert #table_col_update values ('transfer_mt_appraisal_entity_info', 'owner_id')
insert #table_col_update values ('transfer_mt_appraisal_info_totals', 'entity_id')
insert #table_col_update values ('transfer_tax_stmnt', 'agent_id')
insert #table_col_update values ('transfer_tax_stmnt', 'entity_1_id')
insert #table_col_update values ('transfer_tax_stmnt', 'entity_10_id')
insert #table_col_update values ('transfer_tax_stmnt', 'entity_2_id')
insert #table_col_update values ('transfer_tax_stmnt', 'entity_3_id')
insert #table_col_update values ('transfer_tax_stmnt', 'entity_4_id')
insert #table_col_update values ('transfer_tax_stmnt', 'entity_5_id')
insert #table_col_update values ('transfer_tax_stmnt', 'entity_6_id')
insert #table_col_update values ('transfer_tax_stmnt', 'entity_7_id')
insert #table_col_update values ('transfer_tax_stmnt', 'entity_8_id')
insert #table_col_update values ('transfer_tax_stmnt', 'entity_9_id')
insert #table_col_update values ('transfer_tax_stmnt', 'owner_id')
insert #table_col_update values ('transfer_tax_stmnt', 'taxserver_id')
insert #table_col_update values ('transfer_tax_stmnt', 'mortgage_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_1_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_10_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_11_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_12_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_13_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_14_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_15_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_16_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_17_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_18_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_19_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_2_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_20_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_21_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_22_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_23_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_24_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_25_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_26_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_27_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_28_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_29_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_3_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_30_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_4_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_5_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_6_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_7_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_8_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals', 'entity_9_id')
insert #table_col_update values ('transfer_tax_stmnt_entity_totals_temp', 'entity_id')
insert #table_col_update values ('transfer_tax_stmnt_fifth_yr_comparison', 'owner_id')
insert #table_col_update values ('transfer_tax_stmnt_history', 'owner_id')
insert #table_col_update values ('transfer_tax_stmnt_history_totals', 'owner_id')
insert #table_col_update values ('UDI_owner_transfer_history', 'buyer_owner_id')
insert #table_col_update values ('UDI_owner_transfer_history', 'seller_owner_id')
insert #table_col_update values ('update_agent', 'curr_agent_id')
insert #table_col_update values ('update_agent', 'owner_id')
insert #table_col_update values ('update_agent', 'prev_agent_id')
insert #table_col_update values ('update_freeze', 'entity_id')
insert #table_col_update values ('update_freeze', 'owner_id')
insert #table_col_update values ('update_owner', 'curr_owner_id')
insert #table_col_update values ('update_owner', 'prev_owner_id')
insert #table_col_update values ('value_cert_notice', 'owner_id')
insert #table_col_update values ('value_cert_notice_entity', 'entity_id')
insert #table_col_update values ('value_cert_notice_entity', 'owner_id')
insert #table_col_update values ('value_cert_notice_entity_exempt', 'entity_id')
insert #table_col_update values ('value_cert_notice_entity_exempt', 'owner_id')
insert #table_col_update values ('year_to_date_recap', 'entity_id')
insert #table_col_update values ('year_to_date_recap_bill_list', 'entity_id')
insert #table_col_update values ('year_to_date_recap_delq', 'entity_id')
insert #table_col_update values ('year_to_date_recap_range', 'entity_id')
insert #table_col_update values ('year_to_date_recap_refund', 'entity_id')

insert #table_col_update values ('payment_trans', 'fiscal_entity_id')
insert #table_col_update values ('pp_rendition_penalty_entity', 'system_entity_id')
insert #table_col_update values ('transfer_tax_stmnt_fifth_yr_comparison', 'hist_entity_id')
insert #table_col_update values ('transfer_tax_stmnt_history', 'hist_entity_id')



set nocount off



declare
	@szTableName sysname,
	@szColumnName sysname

declare curTableCol cursor
for
	select szTableName, szColumnName
	from #table_col_update
	order by 1, 2
for read only

open curTableCol
fetch next from curTableCol into @szTableName, @szColumnName
----------------------------------
-- BEGIN - All generalized updates
----------------------------------
while ( @@fetch_status = 0 )
begin
	set @szSQL =
		'update [' + @szTableName + '] set [' + @szTableName + '].[' + @szColumnName + '] = cnv_acct_id_reassign_detail.lAcctID_New ' +
		'from [' + @szTableName + '] with(tablockx) ' +
		'join cnv_acct_id_reassign_detail with(tablockx) on ' +
		'    cnv_acct_id_reassign_detail.lRunID = ' + convert(varchar(12), @lRunID) + ' and ' +
		'    cnv_acct_id_reassign_detail.lAcctID_Old = [' + @szTableName + '].[' + @szColumnName + ']'

	exec(@szSQL)
	--print @szSQL

	print @szTableName + '.' + @szColumnName + ' - ' + convert(varchar(12), @@rowcount) + ' row(s)'

	fetch next from curTableCol into @szTableName, @szColumnName
end
----------------------------------
-- END - All generalized updates
----------------------------------
close curTableCol
deallocate curTableCol

------------------------
-- BEGIN - Special cases
------------------------


update pacs_image
set pacs_image.ref_id = cnv_acct_id_reassign_detail.lAcctID_New
from pacs_image with(tablockx)
join cnv_acct_id_reassign_detail with(tablockx) on
     cnv_acct_id_reassign_detail.lRunID = @lRunID and
     cnv_acct_id_reassign_detail.lAcctID_Old = pacs_image.ref_id
where
	pacs_image.ref_type = 'A'


update clk
set
	clk.lKeyValue = cnv_acct_id_reassign_detail.lAcctID_New,
	clk.szKeyValue = convert(varchar(24), cnv_acct_id_reassign_detail.lAcctID_New)
from change_log_keys as clk with(tablockx)
join change_log as cl with(tablockx) on
	cl.lChangeID = clk.lChangeID
join pacs_tables as pt with(tablockx) on
	pt.iTableID = cl.iTableID
join pacs_columns as pc with(tablockx) on
	pc.iColumnID = clk.iColumnID -- Yes, clk not cl
join #table_col_update as t with(tablockx) on
	t.szTableName = pt.szTableName and
	t.szColumnName = pc.szColumnName
join cnv_acct_id_reassign_detail with(tablockx) on
     cnv_acct_id_reassign_detail.lRunID = @lRunID and
     cnv_acct_id_reassign_detail.lAcctID_Old = clk.lKeyValue


update application_export
set application_export.agent_id = cnv_acct_id_reassign_detail.lAcctID_New
from application_export with(tablockx)
join cnv_acct_id_reassign_detail with(tablockx) on
     cnv_acct_id_reassign_detail.lRunID = @lRunID and
     cnv_acct_id_reassign_detail.lAcctID_Old = convert(int, application_export.agent_id)
where
	isnumeric(application_export.agent_id) = 1


update application_export
set application_export.owner_id = cnv_acct_id_reassign_detail.lAcctID_New
from application_export with(tablockx)
join cnv_acct_id_reassign_detail with(tablockx) on
     cnv_acct_id_reassign_detail.lRunID = @lRunID and
     cnv_acct_id_reassign_detail.lAcctID_Old = convert(int, application_export.owner_id)
where
	isnumeric(application_export.owner_id) = 1


update certified_mailer
set certified_mailer.agent_id = cnv_acct_id_reassign_detail.lAcctID_New
from certified_mailer with(tablockx)
join cnv_acct_id_reassign_detail with(tablockx) on
     cnv_acct_id_reassign_detail.lRunID = @lRunID and
     cnv_acct_id_reassign_detail.lAcctID_Old = convert(int, certified_mailer.agent_id)
where
	isnumeric(certified_mailer.agent_id) = 1


update mm_config
set mm_config.mm_entity_id = cnv_acct_id_reassign_detail.lAcctID_New
from mm_config with(tablockx)
join cnv_acct_id_reassign_detail with(tablockx) on
     cnv_acct_id_reassign_detail.lRunID = @lRunID and
     cnv_acct_id_reassign_detail.lAcctID_Old = convert(int, mm_config.mm_entity_id)
where
	isnumeric(mm_config.mm_entity_id) = 1


update ptd_mt_state_report_school_tax_limitation
set ptd_mt_state_report_school_tax_limitation.entity_id = cnv_acct_id_reassign_detail.lAcctID_New
from ptd_mt_state_report_school_tax_limitation with(tablockx)
join cnv_acct_id_reassign_detail with(tablockx) on
     cnv_acct_id_reassign_detail.lRunID = @lRunID and
     cnv_acct_id_reassign_detail.lAcctID_Old = convert(int, ptd_mt_state_report_school_tax_limitation.entity_id)
where
	isnumeric(ptd_mt_state_report_school_tax_limitation.entity_id) = 1


update ptd_mt_state_report_strata
set ptd_mt_state_report_strata.entity_id = cnv_acct_id_reassign_detail.lAcctID_New
from ptd_mt_state_report_strata with(tablockx)
join cnv_acct_id_reassign_detail with(tablockx) on
     cnv_acct_id_reassign_detail.lRunID = @lRunID and
     cnv_acct_id_reassign_detail.lAcctID_Old = convert(int, ptd_mt_state_report_strata.entity_id)
where
	isnumeric(ptd_mt_state_report_strata.entity_id) = 1


update event
set event.ref_id2 = cnv_acct_id_reassign_detail.lAcctID_New
from event with(tablockx)
join cnv_acct_id_reassign_detail with(tablockx) on
     cnv_acct_id_reassign_detail.lRunID = @lRunID and
     cnv_acct_id_reassign_detail.lAcctID_Old = convert(int, event.ref_id2)
where
	event.ref_evt_type = 'AN' and
	isnumeric(event.ref_id2) = 1


update event
set event.ref_id5 = cnv_acct_id_reassign_detail.lAcctID_New
from event with(tablockx)
join cnv_acct_id_reassign_detail with(tablockx) on
     cnv_acct_id_reassign_detail.lRunID = @lRunID and
     cnv_acct_id_reassign_detail.lAcctID_Old = convert(int, event.ref_id5)
where
	event.ref_evt_type in('STS','TS') and
	isnumeric(event.ref_id5) = 1


------------------------
-- END - Special cases
------------------------


update cnv_acct_id_reassign
set dtComplete = getdate()
where lRunID = @lRunID



-- Enable all triggers & constraints
declare curTables insensitive cursor
for
	select name
	from sysobjects
	where
	xtype = 'U' and
	objectproperty(id, 'IsMSShipped') = 0 and
	name not in ('qe_macro_detail','profile_run_list')
for read only

open curTables
fetch next from curTables into @szTable

while ( @@fetch_status = 0 )
begin
	set @szSQL = 'alter table ' + @szTable + ' check constraint all'
	exec(@szSQL)
	set @szSQL = 'alter table ' + @szTable + ' enable trigger all'
	exec(@szSQL)

	fetch next from curTables into @szTable
end

close curTables
deallocate curTables

GO

