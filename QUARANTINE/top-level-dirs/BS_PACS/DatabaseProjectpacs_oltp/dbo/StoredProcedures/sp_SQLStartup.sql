CREATE  procedure [dbo].[sp_SQLStartup]
as

set nocount on

--------------------------------------------------------------------------------
-- BEGIN - Drop all tables
--------------------------------------------------------------------------------

create table #droplist
(
	szTable sysname not null
)

insert #droplist values ('##annual_financial_report')
insert #droplist values ('##fiscal_tax_collections')
insert #droplist values ('##as_of')
insert #droplist values ('##appr_notice_prop_id_success_list')
insert #droplist values ('##auto_add_ov65_candidates')
insert #droplist values ('##mismatch_pers_prop_entity_work')
insert #droplist values ('##oa_change_entity')
insert #droplist values ('##oa_change_info')
insert #droplist values ('##oa_changes')
insert #droplist values ('##pp_cert_mail')
insert #droplist values ('##pp_rend_entry')
insert #droplist values ('##pp_rend_prop_list')
insert #droplist values ('##pp_sic_summary')
insert #droplist values ('##pers_prop_sic_summary')
insert #droplist values ('##prop_val_comp_by_yr')
insert #droplist values ('##ptd_ajr')
insert #droplist values ('##ptd_ajr_out_for_aud')
insert #droplist values ('##ptd_apl')
insert #droplist values ('##ptd_apl_out_for_and')
insert #droplist values ('##ptd_aud')
insert #droplist values ('##ptd_aud_land_detail')
insert #droplist values ('##ptd_aud_land_pct')
insert #droplist values ('##ptd_aud_land_summary')
insert #droplist values ('##ptd_distinct_prop_sup_assoc')
insert #droplist values ('##ptd_errors')
insert #droplist values ('##ptd_freeze_tmp')
insert #droplist values ('##ptd_state_report_strata_appraisal')
insert #droplist values ('##ptd_supp_assoc')
insert #droplist values ('##ptd_temp8')
insert #droplist values ('##ptd_tu')
insert #droplist values ('##ptd_tu_taxpayers')
insert #droplist values ('##ptd_tu_tmp')
insert #droplist values ('##sales_equity_summary_reports')
insert #droplist values ('##sales_stratfication_report')
insert #droplist values ('##sales_stratfication_summary_report')
insert #droplist values ('##split_merge_report_all')
insert #droplist values ('##split_merge_report_working')
insert #droplist values ('##supp_role_balance_assoc')
insert #droplist values ('##supp_role_balance_entities')
insert #droplist values ('##supp_role_balance_poev_to_pv')
insert #droplist values ('##supp_role_balance_pv_to_poev')
insert #droplist values ('##supp_role_balance_totals')
insert #droplist values ('##tax_statement_event_list')
insert #droplist values ('##temp_propid_spid')
insert #droplist values ('##top_ten_supp_assoc')
insert #droplist values ('##top_ten_taxpayers')
insert #droplist values ('##top_tu_ten_taxpayers')
insert #droplist values ('##top_tu_ten_tmp')
insert #droplist values ('##transfer_appraisal_entity')
insert #droplist values ('##transfer_appraisal_entity_info')
insert #droplist values ('##transfer_appraisal_info')
insert #droplist values ('##transfer_appraisal_info_supp_assoc')
insert #droplist values ('##prop_lookup_list')
insert #droplist values ('##receipting_balance_report')
insert #droplist values ('##receipting_balance_report_item')
insert #droplist values ('##levy_cert_levy_data_vw')
insert #droplist values ('##levy_cert_print_calc_values')
insert #droplist values ('##levy_cert_print_calc_levy_rate')
insert #droplist values ('##levy_cert_agg_limit_grid_report')
insert #droplist values ('##levy_cert_const_limit_grid_report')
insert #droplist values ('##levy_cert_stat_limit_grid_report')
insert #droplist values ('##CertOfLeviesReport')
insert #droplist values ('##CertOfLeviesReportGroup')
insert #droplist values ('##CertOfLeviesReportGroupCode')
insert #droplist values ('##CertToTaxrollReport')
insert #droplist values ('##CertToTaxrollReport_GrandTotal')
insert #droplist values ('##CertToTaxrollReport_propcount')
insert #droplist values ('##LevyRateSummaryReport')
insert #droplist values ('##LevyRatesByTaxAreaReport')
insert #droplist values ('##levy_rates_report')
insert #droplist values ('##tax_district_summary')
insert #droplist values ('##tax_district_summary_tif')
insert #droplist values ('##petition_for_refund')
insert #droplist values ('##assessments_list_for_bill_functions')
insert #droplist values ('##statement_of_account')
insert #droplist values ('##statement_of_account_entity')
insert #droplist values ('##statement_of_account_exemption')
insert #droplist values ('##statement_of_account_paid_bills')
insert #droplist values ('##statement_of_account_unpaid_bills')
insert #droplist values ('##statement_of_account_paid_refunds')
insert #droplist values ('##variance_report')
insert #droplist values ('##payment_receipt')
insert #droplist values ('##payment_receipt_property')
insert #droplist values ('##payment_receipt_property_items')
insert #droplist values ('##rollback_supplement')
insert #droplist values ('##rollback_supplement_item')
insert #droplist values ('##rollback_supplement_open_space_tax')
insert #droplist values ('##rollback_supplement_item_open_space_tax')
insert #droplist values ('##rollback_supplement_dfl_tax')
insert #droplist values ('##rollback_supplement_item_dfl_tax')
insert #droplist values ('##rollback_supplement_years')
insert #droplist values ('##supplemented_property_listing')
insert #droplist values ('##paid_under_protest')
insert #droplist values ('##receivable_summary_report')
insert #droplist values ('##receivable_summary_year')
insert #droplist values ('##abstract_subdivision_report')
insert #droplist values ('##activate_preliminary_properties_report')
insert #droplist values ('##refunds_paid')
insert #droplist values ('##chart_of_accounts_print_register')
insert #droplist values ('##assessment_year_to_date_recap')
insert #droplist values ('##assessment_month_to_date_recap')
insert #droplist values ('##payment_detail_listing_report')
insert #droplist values ('##payment_detail_listing_ref_numbers')
insert #droplist values ('##payment_detail_listing_tender')
insert #droplist values ('##payment_detail_summary_report')
insert #droplist values ('##payment_detail_tender_per_payment')
insert #droplist values ('##payoff_letter')
insert #droplist values ('##payoff_letter_report')
insert #droplist values ('##payout_payment_schedule_general')
insert #droplist values ('##payout_payment_schedule')
insert #droplist values ('##payout_payment_schedule_payments')
insert #droplist values ('##payout_payment_schedule_prop')
insert #droplist values ('##refunds_due')
insert #droplist values ('##escrow_value_listing')
insert #droplist values ('##fin_rpt_deactivated_account')
insert #droplist values ('##fin_rpt_missing_event_mapping')
insert #droplist values ('##fin_rpt_vendor_event_mapping')
insert #droplist values ('##bill_fee_code_listing')
insert #droplist values ('##modified_bill')
insert #droplist values ('##new_and_removed_exempt')
insert #droplist values ('##fund_listing')
insert #droplist values ('##building_permit')
insert #droplist values ('##fms_verification_report')
insert #droplist values ('##fund_number_listing_report')
insert #droplist values ('##annexation_revenue')
insert #droplist values ('##annexation_revenue_payment')
insert #droplist values ('##annexation_revenue_moved')
insert #droplist values ('##annexation_revenue_totals')
insert #droplist values ('##tax_district_within_tax_area_tt')
insert #droplist values ('##building_permit_import_error_tt')
insert #droplist values ('##mass_copy_sale_land_improvement')
insert #droplist values ('##annexation_properties')
insert #droplist values ('##dor_report')
insert #droplist values ('##dor_report_header')
insert #droplist values ('##dor_report_prop_assoc')
insert #droplist values ('##dor_report_general')
insert #droplist values ('##dor_report_real')
insert #droplist values ('##dor_pp_seg_max')
insert #droplist values ('##dor_report_personal')
insert #droplist values ('##dor_report_real_by_land_use')
insert #droplist values ('##dor_report_sale_overall')
insert #droplist values ('##dor_report_sale_strata')
insert #droplist values ('##dor_report_sale_detail')
insert #droplist values ('##rmci_report')
insert #droplist values ('##rmci_report_prop_assoc')
insert #droplist values ('##rmci_report_detail')
insert #droplist values ('##daily_detailed_listing_report')
insert #droplist values ('##rollback_openspace_worksheet')
insert #droplist values ('##rollback_dfl_worksheet')
insert #droplist values ('##special_assessment_import_details_tt')
insert #droplist values ('##cashiers_grouping_summary_user')
insert #droplist values ('##cashiers_grouping_summary_source')
insert #droplist values ('##special_assessment_comparison')
insert #droplist values ('##daily_gl_report')
insert #droplist values ('##month_end_fiscal_ytd_summary_title')
insert #droplist values ('##month_end_fiscal_ytd_summary_detail')
insert #droplist values ('##month_end_fiscal_ytd_recap_title')
insert #droplist values ('##month_end_fiscal_ytd_recap_detail')
insert #droplist values ('##month_end_fiscal_mtd_recap_title')
insert #droplist values ('##month_end_fiscal_mtd_recap_detail')
insert #droplist values ('##recalc_error_report')
insert #droplist values ('##standard_gain_loss_table')
insert #droplist values ('##arb_rpt_panel_decisions')
insert #droplist values ('##arb_rpt_multi_protest_listing')
insert #droplist values ('##arb_rpt_inquiry_report')
insert #droplist values ('##arb_rpt_protest_sign_in_list')
insert #droplist values ('##arb_rpt_protest_report')
insert #droplist values ('##arb_protest_listing')
insert #droplist values ('##daily_summary_payment_summary')
insert #droplist values ('##daily_summary_payment_breakdown_levy')
insert #droplist values ('##daily_summary_payment_breakdown_assessment')
insert #droplist values ('##daily_summary_payment_breakdown_fee')
insert #droplist values ('##daily_summary_payment_total')
INSERT #droplist VALUES ('##MassUpdateTaxAreasSpecialAssessments')
INSERT #droplist VALUES ('##assessment_report')
INSERT #droplist VALUES ('##assessment_report_prop_assoc')
INSERT #droplist VALUES ('##assessment_report_detail')
INSERT #droplist VALUES ('##assessment_report_totals')
INSERT #droplist VALUES ('##levy_collections_recap_report')
INSERT #droplist VALUES ('##assessment_collections_recap_report')
INSERT #droplist VALUES ('##reet_collections_recap_report')
INSERT #droplist VALUES ('##reet_rate_summary')
INSERT #droplist VALUES ('##reet_rate_detail_tax_area')
INSERT #droplist VALUES ('##reet_rate_detail_uga')
INSERT #droplist VALUES ('##reet_rate_detail_uga_desc')
INSERT #droplist VALUES ('##report_captured_value')
INSERT #droplist VALUES ('##totals_report')
INSERT #droplist VALUES ('##totals_report_prop_assoc')
INSERT #droplist VALUES ('##totals_report_detail')
INSERT #droplist VALUES ('##totals_report_detail_exemption')
INSERT #droplist VALUES ('##totals_tax_area_report_detail')
INSERT #droplist VALUES ('##tax_due_calc_bill')
INSERT #droplist VALUES ('##tax_due_calc_fee')
INSERT #droplist VALUES ('##tax_due_calc_bill_payments_due')
INSERT #droplist VALUES ('##tax_due_calc_fee_payments_due')
INSERT #droplist VALUES ('##taxroll_reconciliation_title')
INSERT #droplist VALUES ('##taxroll_reconciliation_detail')
INSERT #droplist VALUES ('##wash_tax_roll')
INSERT #droplist VALUES ('##tax_roll_details')
INSERT #droplist VALUES ('##tax_roll_totals')
INSERT #droplist VALUES ('##export_paid_properties')
INSERT #droplist VALUES ('##AssessmentTaxrollReconciliationReport')
INSERT #droplist VALUES ('##levy_cert_taxes_levied_report')
INSERT #droplist VALUES ('##AssessmentLeviesDueReport')
INSERT #droplist VALUES ('##EscrowCollectionsActivityReport')
INSERT #droplist VALUES ('##fee_collections_activity')
INSERT #droplist VALUES ('##imprv_sched_mult_assoc')
INSERT #droplist VALUES ('##imprv_sched_mult')
INSERT #droplist VALUES ('##imprv_sched_details')
INSERT #droplist VALUES ('##imprv_sched_mtx_order')
INSERT #droplist VALUES ('##imprv_sched_ranges')
INSERT #droplist VALUES ('##imprv_sched_features')
INSERT #droplist VALUES ('##imprv_sched_mtx_details')
INSERT #droplist VALUES ('##non_captured_arb_values')
INSERT #droplist VALUES ('##report_captured_value_by_fund')
INSERT #droplist VALUES ('##tax_summary_by_taxpayer')
INSERT #droplist VALUES ('##eod_batch_report')
INSERT #droplist VALUES ('##wa_payout_amount_due')
INSERT #droplist VALUES ('##mass_update_legal_description')
INSERT #droplist VALUES ('##delinquent_tax_roll_report_idlist')
INSERT #droplist VALUES ('##delinquent_tax_roll_report')
INSERT #droplist VALUES ('##delinquent_tax_roll_report_total')
insert #droplist values ('##certification_of_value_supp_assoc')
insert #droplist values ('##certification_of_value_grouping')
insert #droplist values ('##certification_of_value_levy_description')
insert #droplist values ('##certification_of_value_letter')
insert #droplist values ('##certification_of_value_letter_info')
insert #droplist values ('##certification_of_value_letter_newly_annexed')
insert #droplist values ('##certification_of_value_letter_tax_area_info')
insert #droplist values ('##certification_of_value_letter_levy_info')
insert #droplist values ('##certification_of_value_levy_description_by_levy')
insert #droplist values ('##certification_of_value_letter_by_levy')
insert #droplist values ('##certification_of_value_grouping_by_levy')
insert #droplist values ('##payment_detail_summary_report_params')
insert #droplist values ('##tax_due_calc_overpayment_credit')
INSERT #droplist VALUES ('##fee_statement_report')
insert #droplist values ('##outstanding_fees_report')
insert #droplist values ('##dor_senior_relief_report')
insert #droplist values ('##dor_senior_relief_report_headers')
insert #droplist values ('##merge_sa')

insert #droplist values ('##appraisal_card_prop_assoc')
insert #droplist values ('##appraisal_card_property_paging')
insert #droplist values ('##appraisal_card_property_info')
insert #droplist values ('##appraisal_card_owner_info')
insert #droplist values ('##appraisal_card_exemption_info')
insert #droplist values ('##appraisal_card_building_permit_info')
insert #droplist values ('##appraisal_card_income_info')
insert #droplist values ('##appraisal_card_arb_info')
insert #droplist values ('##appraisal_card_sales_info')
insert #droplist values ('##appraisal_card_improvement_paging')
insert #droplist values ('##appraisal_card_sketch_paging')
insert #droplist values ('##appraisal_card_improvement_summary')
insert #droplist values ('##appraisal_card_improvement_info')
insert #droplist values ('##appraisal_card_improvement_detail_adj_info')
insert #droplist values ('##appraisal_card_improvement_feature_info')
insert #droplist values ('##appraisal_card_land_paging')
insert #droplist values ('##appraisal_card_land_info')
insert #droplist values ('##appraisal_card_land_adjustment_info')
insert #droplist values ('##appraisal_card_pers_prop_seg_summary')
insert #droplist values ('##appraisal_card_pers_prop_seg_info')
insert #droplist values ('##appraisal_card_pers_prop_seg_paging')
insert #droplist values ('##appraisal_card_bp_report_data')

insert #droplist values ('##pps_property_info')
insert #droplist values ('##pps_segment_info')
insert #droplist values ('##pps_sub_segment_info')

insert #droplist values ('##permanent_crop_report')
insert #droplist values ('##permanent_crop_detail')
insert #droplist values ('##permanent_crop_land')
insert #droplist values ('##appraisal_card_permanent_crop_report')

insert #droplist values ('##ms_commercial_estimate_report')
insert #droplist values ('##ms_commercial_estimate_report_section')
insert #droplist values ('##ms_commercial_estimate_report_occupancy')
insert #droplist values ('##ms_commercial_estimate_report_component')
insert #droplist values ('##ms_commercial_estimate_report_addition')
insert #droplist values ('##ms_commercial_estimate_report_depreciation')
insert #droplist values ('##appraisal_card_ms_commercial_paging')
insert #droplist values ('##appraisal_card_ms_commercial_report')

insert #droplist values ('##transfer_appraisal_tax_area')
insert #droplist values ('##oa_change_tax_area')

insert #droplist values ('##appraisal_notice_report_criteria')
insert #droplist values ('##appraisal_notice_report_segment_listing')
insert #droplist values ('##appraisal_notice_report')
insert #droplist values ('##appraisal_notice_report_master_lease')
insert #droplist values ('##appraisal_notice_report_master_lease_sub_account')

insert #droplist values ('##ms_residential_report')
insert #droplist values ('##ms_residential_report_detail')
insert #droplist values ('##appraisal_card_ms_residential_report')
insert #droplist values ('##appraisal_card_ms_residential_paging')
insert #droplist values ('##linked_inquiries_report')

insert #droplist values ('##supplement_tax_adjustment')
insert #droplist values ('##supplement_tax_adjustment_property_info')

insert #droplist values ('##arb_inquiry_listing')
insert #droplist values ('##bill_fee_code_summary_listing')
insert #droplist values ('##statement_of_taxes_collected')
insert #droplist values ('##wa_tax_statement_print_history_statement_assoc')
insert #droplist values ('##autopay_ownership_change_details')
insert #droplist values ('##autopay_enrollment')
insert #droplist values ('##autopay_enrollment_report_params')

insert #droplist values ('##judgements_report')
insert #droplist values ('##judgements_options_report')

insert #droplist values ('##collections_review_report')
insert #droplist values ('##collections_review_detailed_report')
insert #droplist values ('##collections_review_report_options')

insert #droplist values ('##bankruptcy_claim_report')

insert #droplist values ('##annual_auditor_report')
insert #droplist values ('##annual_auditor_report_options')

insert #droplist values ('##bidlist_sold_prop_options_report')
insert #droplist values ('##bidlist_sold_prop_report')

insert #droplist values ('##delq_cert_options_report')
insert #droplist values ('##delq_cert_prop_list_report')
insert #droplist values ('##delq_cert_lien_report')
insert #droplist values ('##delq_cert_report')
insert #droplist values ('##delq_cert_linked_prop_report')
insert #droplist values ('##delq_cert_linked_prop_taxes_report')
insert #droplist values ('##delq_cert_prop_taxes_report')

insert #droplist values ('##ppra_property_list')
insert #droplist values ('##ppra_both_nonfarm_farm')
insert #droplist values ('##ppra_nonfarm_run')
insert #droplist values ('##ppra_nonfarm')
insert #droplist values ('##ppra_nonfarm_assets')
insert #droplist values ('##ppra_farm_run')
insert #droplist values ('##ppra_farm')

insert #droplist values ('##pmt_in_lieu_of_tax_pmts')
insert #droplist values ('##revenue_merge_report')
insert #droplist values ('##payment_in_lieu_of_taxes_master')
insert #droplist values ('##payment_in_lieu_of_taxes_detail')
insert #droplist values ('##mra_property_list')

insert #droplist values ('##pursuit_account_payments_report_options')
insert #droplist values ('##pursuit_account_payments_report')
insert #droplist values ('##pursuit_activity_collector_options_report')
insert #droplist values ('##pursuit_activity_collector_report')
insert #droplist values ('##pursuit_activity_collector_property_report')
insert #droplist values ('##pursuit_activity_collector_event_report')

insert #droplist values ('##current_delinquent_tax_collections_report')
insert #droplist values ('##current_delinquent_tax_collections_report_month_data')

insert #droplist values ('##overlapping_funds_report_levy_rates')
insert #droplist values ('##overlapping_funds_report_detail')
insert #droplist values ('##overlapping_debt_report_tax_area_levy_assoc')
insert #droplist values ('##overlapping_debt_report_tax_area_detail')
insert #droplist values ('##overlapping_debt_report_levy_prop_assoc')
insert #droplist values ('##overlapping_debt_report_outstanding')
insert #droplist values ('##overlapping_debt_report')
insert #droplist values ('##overlapping_debt_report_inset_data')
insert #droplist values ('##overlapping_debt_report_control')
insert #droplist values ('##ReetImportReet')
insert #droplist values ('##ReetImportProperty')
insert #droplist values ('##ReetImportAccount')
insert #droplist values ('##excise_detail')
insert #droplist values ('##reet_webportal_import')
insert #droplist values ('##reet_webportal_import_property')
insert #droplist values ('##reet_webportal_import_account')

insert #droplist values ('##imprv_sched_matrix_assoc_report')
insert #droplist values ('##land_sched_matrix_assoc_report')
insert #droplist values ('##depreciation_schedules_report')
insert #droplist values ('##pp_schedule_report')
insert #droplist values ('##pp_schedule_report_adj')
insert #droplist values ('##pp_schedule_report_area')
insert #droplist values ('##pp_schedule_report_class')
insert #droplist values ('##pp_schedule_report_deprec')
insert #droplist values ('##pp_schedule_report_qd')
insert #droplist values ('##pp_schedule_report_uc')

insert #droplist values ('##cu_notice_of_removal_intent_report')
insert #droplist values ('##cu_removals_report')
insert #droplist values ('##cu_removals_report_params')
insert #droplist values ('##property_lien_report')


insert #droplist values ('##income_worksheet')
insert #droplist values ('##income_worksheet_values')
insert #droplist values ('##income_worksheet_detail')
insert #droplist values ('##income_worksheet_improvement_info')
insert #droplist values ('##income_worksheet_land_info')
insert #droplist values ('##income_worksheet_property_info')

insert #droplist values ('##income_valuations_report')
insert #droplist values ('##income_grm_gim_properties_report')

insert #droplist values ('##income_improvement_detail_schedule_assoc')
insert #droplist values ('##income_schedule_improvement_detail')
insert #droplist values ('##income_schedule_improvement_detail_assoc')
insert #droplist values ('##income_schedule_improvement_detail_matrix')
insert #droplist values ('##income_schedule_report')
insert #droplist values ('##income_schedule_grm_gim_report')

insert #droplist values ('##current_use_property_listing')
insert #droplist values ('##current_use_exception_listing')
insert #droplist values ('##cu_status_codes_report')
insert #droplist values ('##cu_status_codes_report_params')
insert #droplist values ('##ppra_property_list')
insert #droplist values ('##ppra_nonfarm_run')
insert #droplist values ('##ppra_nonfarm')
insert #droplist values ('##ppra_nonfarm_assets')
insert #droplist values ('##ppra_farm_run')
insert #droplist values ('##ppra_farm')
insert #droplist values ('##mra_property_list')
insert #droplist values ('##mkt_appr_grids_not_created_report')
insert #droplist values ('##mkt_appr_grids_not_created_report_detail')

insert #droplist values ('##mkt_value_grid_report')
insert #droplist values ('##mkt_value_grid_report_detail')

insert #droplist values ('##reet_excise_number_report')
insert #droplist values ('##reet_excise_number_report_detail')
insert #droplist values ('##new_construction_certificate_report')
insert #droplist values ('##new_construction_prop_assoc')
insert #droplist values ('##new_construction_detail')
insert #droplist values ('##boe_cert')
insert #droplist values ('##boe_cert_temp')
insert #droplist values ('##dor_composite_report')
insert #droplist values ('##deleted_property_report')
insert #droplist values ('##senior_disable_exemption_review')

insert #droplist values ('##current_use_property_listing')
insert #droplist values ('##current_use_exception_listing')
insert #droplist values ('##cu_status_codes_report')
insert #droplist values ('##cu_status_codes_report_params')
insert #droplist values ('##annexation_property_listing_report')
insert #droplist values ('##annexations_by_tax_area_report')
insert #droplist values ('##annexation_prop_verification_report')
insert #droplist values ('##annexation_pending_tax_area_report')
insert #droplist values ('##mass_create_property_list')

insert #droplist values ('##election_information_report')
insert #droplist values ('##annual_adjustment_report')
insert #droplist values ('##nbhd_inventory_minmax_report')
insert #droplist values ('##nbhd_inventory_misc_report')
insert #droplist values ('##nbhd_inventory_land_report')
insert #droplist values ('##nbhd_inventory_imprv_report')
insert #droplist values ('##expiring_remodel_exemptions')
insert #droplist values ('##ncoa_import_property_list')
insert #droplist values ('##undeliverable_mail_report')
insert #droplist values ('##deferral_report')
insert #droplist values ('##deferral_applications_report')
insert #droplist values ('##deferral_images_report')
insert #droplist values ('##business_closed_or_sold')
insert #droplist values ('##state_assessed_utilities_report')
insert #droplist values ('##state_assessed_utilities_data')
insert #droplist values ('##ppra_masterlease_run')
insert #droplist values ('##ppra_masterlease')
insert #droplist values ('##ppra_masterlease_assets')
insert #droplist values ('##dor_updated_schedules_report')
insert #droplist values ('##dor_non_updated_schedules_report')
insert #droplist values ('##mh_movement_report')
insert #droplist values ('##mh_movement_decal_report')
insert #droplist values ('##mhm_tax_certificate_report')
insert #droplist values ('##mhm_proof_of_taxes_report')
insert #droplist values ('##escrow_available_report')
insert #droplist VALUES ('##appraisal_card_improvement_adj_info')
insert #droplist values ('##dpr_criteria')
insert #droplist values ('##dpr_owner')
insert #droplist values ('##dpr_property')
insert #droplist values ('##dpr_statement')
insert #droplist values ('##tif_property_report')
insert #droplist values ('##tif_report')
insert #droplist values ('##tifcol_levy')
insert #droplist values ('##tifcol_bill')
insert #droplist values ('##tif_fiscal')
insert #droplist values ('##tif_fiscal_area')

insert #droplist values ('##prepare_run_calc_items')
insert #droplist values ('##reet_import_reject_report')

insert #droplist values ('##mass_update_half_pay_status_report')
insert #droplist values ('##mass_update_half_pay_status_prop')


declare
	@szTable sysname,
	@szSQL varchar(8000)

declare curDropList cursor
for
	select szTable
	from #droplist
for read only

open curDropList
fetch next from curDropList into @szTable

while ( @@fetch_status = 0 )
begin
	if exists (
		select [id]
		from tempdb.dbo.sysobjects
		where
			name = @szTable and
			xtype = 'U'
	)
	begin
		set @szSQL = 'drop table ' + @szTable
		exec(@szSQL)
	end

	fetch next from curDropList into @szTable
end

close curDropList
deallocate curDropList

--------------------------------------------------------------------------------
-- END - Drop all tables
--------------------------------------------------------------------------------

create table ##as_of
(
	dataset_id bigint not null,
	year numeric(4,0) not null,
	sup_num int not null,
	prop_id int not null,
	
	primary key clustered (dataset_id, year, sup_num, prop_id)
)

create nonclustered index IDX_##as_of_dataset_id
	on ##as_of (dataset_id)

--------------------------------------------------------------------------------
-- BEGIN - PTD export tables
--------------------------------------------------------------------------------
CREATE TABLE [##ptd_supp_assoc] (
	[prop_id] [int] NOT NULL ,
	[sup_num] [int] NOT NULL ,
	[sup_yr] [numeric](4, 0) NOT NULL,
	[udi_child] [char] (1) NOT NULL,
	[udi_prop_id] [int] NOT NULL,
	[dataset_id] [bigint] NOT NULL,
	
	primary key clustered(prop_id,sup_num,sup_yr,dataset_id)
)

CREATE TABLE [##ptd_distinct_prop_sup_assoc] (
	[prop_id] [int] NOT NULL,
	[sup_num] [int] NOT NULL,
	[sup_yr] [int] NULL,
	[dataset_id] [bigint] NOT NULL
)

CREATE TABLE [##ptd_apl] (
	[record_type] [char] (3)  NULL ,
	[cad_id_code] [varchar] (3)  NULL ,
	[account_number] [varchar] (25)  NULL ,
	[parcel_address] [varchar] (50)  NULL ,
	[legal_description] [varchar] (200)  NULL ,
	[prev_yr_cad_mkt_val] [numeric](18, 0) NULL ,
	[most_recent_sale_price] [numeric](18, 0) NULL ,
	[date_of_sale] [datetime] NULL ,
	[new_prop_ind] [char] (1)  NULL ,
	[verified_sale_by_CAD_ind] [char] (1)  NULL ,
	[second_sale_date] [datetime] NULL ,
	[prop_id] [int] NULL ,
	[owner_id] [int] NULL,
	[dataset_id] [bigint] NOT NULL
)

CREATE TABLE [##ptd_apl_out_for_and] (
	[record_type] [char] (3)  NULL ,
	[cad_id_code] [varchar] (3)  NULL ,
	[account_number] [varchar] (25)  NULL ,
	[parcel_address] [varchar] (50)  NULL ,
	[legal_description] [varchar] (200)  NULL ,
	[prev_yr_cad_mkt_val] [numeric](18, 0) NULL ,
	[most_recent_sale_price] [numeric](18, 0) NULL ,
	[date_of_sale] [datetime] NULL ,
	[new_prop_ind] [char] (1)  NULL ,
	[verified_sale_by_CAD_ind] [char] (1)  NULL ,
	[second_sale_date] [datetime] NULL ,
	[prop_id] [int] NULL ,
	[owner_id] [int] NULL,
	[dataset_id] [bigint] NOT NULL
)

CREATE TABLE [##ptd_ajr] (
	[record_type] [char] (3)  NULL ,
	[cad_id_code] [varchar] (3)  NULL ,
	[account_number] [varchar] (25)  NULL ,
	[taxing_unit_id_code] [varchar] (10)  NULL ,
	[county_fund_type_ind] [char] (1)  NULL ,
	[local_optional_percentage_homestead_exemption_amount] [numeric](9, 0) NULL ,
	[state_mandated_homestead_exemption_amount] [numeric](9, 0) NULL ,
	[state_mandated_over65_homeowner_exemption_amount] [numeric](9, 0) NULL ,
	[state_mandated_disabled_homeowner_exemption_amount] [numeric](9, 0) NULL ,
	[local_optional_over65_homeowner_exemption_amount] [numeric](9, 0) NULL ,
	[local_optional_disabled_homeowner_exemption_amount] [numeric](9, 0) NULL ,
	[total_exemption_amount] [numeric](9, 0) NULL ,
	[local_optional_historical_exemption_amount] [numeric](9, 0) NULL ,
	[solar_wind_powered_exemption_amount] [numeric](9, 0) NULL ,
	[state_mandated_disabled_deceased_veteran_exemption_amount] [numeric](9, 0) NULL ,
	[other_exemption_loss_amount] [numeric](9, 0) NULL ,
	[total_appraised_value_lost_due_to_tax_abatement_agreements] [numeric](9, 0) NULL ,
	[total_payments_into_tax_increment_financing_funds] [numeric](9, 0) NULL ,
	[comptrollers_category_code] [varchar] (2)  NULL ,
	[category_market_value_land_before_any_cap] [numeric](11, 0) NULL ,
	[total_acres_for_category] [numeric](11, 3) NULL ,
	[productivity_value] [numeric](11, 0) NULL ,
	[productivity_value_loss] [numeric](11, 0) NULL ,
	[category_market_value_improvement_before_any_cap] [numeric](11, 0) NULL ,
	[account_taxable_value] [numeric](11, 0) NULL ,
	[all_homestead_before_exemption] [numeric](11, 0) NULL ,
	[freeport_exemption_loss] [numeric](11, 0) NULL ,
	[pollution_control_exemption_loss] [numeric](9, 0) NULL ,
	[personal_property_value] [numeric](11, 0) NULL ,
	[proration_loss_to_property] [numeric](9, 0) NULL ,
	[levy_lost_to_tax_deferral_of_over65_or_increasing_home_taxes] [numeric](9, 0) NULL ,
	[capped_value_of_residential_homesteads] [numeric](9, 0) NULL ,
	[value_loss_to_the_hscap_on_residential_homesteads] [numeric](9, 0) NULL ,
	[water_conservation_initiatives_exemption_amount] [numeric](9, 0) NULL ,
	[local_optional_homestead_exemption_percentage] [numeric](3, 0) NULL ,
	[total_appraised_value_lost_due_to_tax_abatement_agreements_granted_before_may311993] [numeric](9, 0) NULL ,
	[total_appraised_value_lost_due_to_tax_abatement_agreements_granted_since_may311993] [numeric](9, 0) NULL ,
	[chodo] [numeric](9, 0) NULL ,
	[mineral_value] [numeric](11, 0) NULL ,
	[last_reappraisal_year] [numeric](4, 0) NULL ,
	[state_mandated_homestead_exemption_indicator] [char] (1)  NULL ,
	[state_mandated_over6555_surviving_spouse_exemption_indicator] [char] (1)  NULL ,
	[state_mandated_disabled_homeowner_exemption_indicator] [char] (1)  NULL ,
	[local_optional_percentage_homestead_exemption_indicator] [char] (1)  NULL ,
	[local_optional_over6555_surviving_spouse_exemption_indicator] [char] (1)  NULL ,
	[local_optional_disabled_homeowner_exemption_indicator] [char] (1)  NULL ,
	[state_mandated_disabled_or_deceased_veteran_exemption_indicator] [char] (1)  NULL ,
	[abatements_indicator] [char] (1)  NULL ,
	[tax_increment_financing_indicator] [char] (1)  NULL ,
	[certified_value_indicator] [char] (1)  NULL ,
	[pollution_control_exemption_indicator] [char] (1)  NULL ,
	[freeport_exemption_indicator] [char] (1)  NULL ,
	[all_homestead_before_exemption_indicator] [char] (1)  NULL ,
	[hscap_on_residential_homesteads_indicator] [char] (1)  NULL ,
	[water_conservation_initiatives_indicator] [char] (1)  NULL ,
	[multiple_owner_indicator] [char] (1)  NULL ,
	[payments_into_tax_increment_financing_funds_eligible_for_deduction] [numeric](11, 0) NULL ,
	[land_units] [numeric](5, 0) NULL ,
	[abatement_granted_before_may311993_indicator] [char] (1)  NULL,
	[solar_wind_powered_exemption_indicator] [char] (1)  NULL,
	[proration_loss_to_property_indicator] [char] (1)  NULL,
	[local_optional_historical_exemption_indicator] [char] (1)  NULL,
	[other_exemption_loss_indicator] [char] (1)  NULL,
	[chodo_indicator] [char] (1)  NULL,
	[dataset_id] [bigint] NOT NULL
)

CREATE TABLE [##ptd_ajr_out_for_aud] (
	[account_number] [varchar] (25)  NULL ,
	[taxing_unit_id_code] [varchar] (10)  NULL ,
	[county_fund_type_ind] [char] (1)  NULL ,
	[category_market_value_land_before_any_cap] [numeric](11, 0) NULL ,
	[total_acres_for_category] [numeric](11, 3) NULL ,
	[productivity_value] [numeric](11, 0) NULL ,
	[entity_id] int ,
	[dataset_id] [bigint] NOT NULL
)

CREATE TABLE [##ptd_aud_land_detail] (
	[prop_id] [int] NULL ,
	[sup_num] [int] NULL ,
	[prop_val_yr] [numeric](4, 0) NOT NULL ,
	[state_land_type_desc] [varchar] (30)  NULL ,
	[size_acres] [numeric](18, 4) NULL ,
	[ag_val] [numeric](14, 0) NULL ,
	[land_seg_mkt_val] [numeric](14, 0) NULL ,
	[ag_use_cd] [char] (5)  NULL ,
	[dataset_id] [bigint] NOT NULL,
	[prev_st_land_type_cd] [varchar] (30) NULL
)

CREATE TABLE [##ptd_aud_land_summary] (
	[prop_id] [int] NULL ,
	[sup_num] [int] NULL ,
	[prop_val_yr] [numeric](4, 0) NOT NULL ,
	[sum_size_acres] [numeric](18, 4) NULL ,
	[sum_ag_val] [numeric](14, 0) NULL ,
	[sum_land_seg_mkt_val] [numeric](14, 0) NULL ,
	[dataset_id] [bigint] NOT NULL
)

CREATE TABLE [##ptd_aud_land_pct] (
	[prop_id] [int] NULL ,
	[sup_num] [int] NULL ,
	[prop_val_yr] [numeric](4, 0) NOT NULL ,
	[state_land_type_desc] [varchar] (30)  NULL ,
	[pct_acreage] [numeric](28, 20) NULL ,
	[pct_ag_val] [numeric](28, 24) NULL ,
	[pct_mkt_val] [numeric](28, 24) NULL ,
	[dataset_id] [bigint] NOT NULL
)

CREATE TABLE [##ptd_tu_taxpayers] (
	[entity_id] [int] NOT NULL ,
	[year] [int] NOT NULL ,
	[owner_id] [int] NOT NULL ,
	[market_val] [numeric](38, 0) NULL ,
	[taxable_val] [numeric](38, 0) NULL ,
	[owner_id_main] [int] NULL,
	[dataset_id] [bigint]NOT NULL
)

CREATE TABLE [##ptd_tu] (
	[record_type] [char] (3)  NULL ,
	[cad_id_code] [varchar] (3)  NULL ,
	[taxing_unit_id_code] [varchar] (10)  NULL ,
	[county_fund_type_ind] [char] (1)  NULL ,
	[ranking] [int] NULL ,
	[owner_name] [varchar] (50)  NULL ,
	[market_val] [numeric](11, 0) NULL ,
	[taxable_val] [numeric](11, 0) NULL ,
	[entity_id] [int] NULL ,
	[owner_id] [int] NULL ,
	[year] [numeric](4, 0) NULL,
	[dataset_id] [bigint] NOT NULL
)

CREATE TABLE [##ptd_tu_tmp] (
	[record_type] [char] (3)  NULL ,
	[cad_id_code] [varchar] (3)  NULL ,
	[taxing_unit_id_code] [varchar] (10)  NULL ,
	[county_fund_type_ind] [char] (1)  NULL ,
	[ranking] [int] NULL ,
	[owner_name] [varchar] (50)  NULL ,
	[market_val] [numeric](11, 0) NULL ,
	[taxable_val] [numeric](11, 0) NULL ,
	[entity_id] [int] NULL ,
	[owner_id] [int] NULL ,
	[year] [numeric](4, 0) NULL,
	[dataset_id] [bigint] NOT NULL
)

CREATE TABLE [##ptd_freeze_tmp] (
	[entity_id] [int] not null,
	[prop_id] [int] NOT NULL ,
	[owner_id] [int] NOT NULL ,
	[exmpt_tax_yr] [numeric](4, 0) NOT NULL ,
	[sup_num] [int] NOT NULL ,
	[freeze_ceiling] [numeric](14, 2) NULL ,
	[dataset_id] bigint NOT NULL
)

CREATE TABLE [##ptd_temp8] (
	[exmpt_tax_yr] [numeric](4, 0) NOT NULL ,
	[entity_id] [int] NOT NULL ,
	[counts] [int] NULL ,
	[state_amt] [numeric](38, 0) NULL ,
	[local_amt] [numeric](38, 0) NULL ,
	[dataset_id] bigint NOT NULL
)

CREATE TABLE [##ptd_aud] (
	[record_type] [char] (3)  NULL ,
	[cad_id_code] [char] (3)  NULL ,
	[account_number] [varchar] (25)  NULL ,
	[taxing_unit_id_code] [varchar] (10)  NULL ,
	[comptrollers_category_code] [varchar] (2)  NULL ,
	[income_type] [varchar] (4)  NULL ,
	[land_type] [varchar] (4)  NULL ,
	[acres_for_production] [numeric](11, 3) NULL ,
	[productivity_value_by_land_type] [numeric](11, 0) NULL ,
	[timber_1978_value] [numeric](11, 0) NULL ,
	[previous_land_type_for_wildlife_management] [varchar] (4)  NULL ,
	[market_value_of_land_receiving_productivity] [numeric](11, 0) NULL ,
	[previous_land_type_of_timber_in_transition] [varchar] (4)  NULL ,
	[dataset_id] bigint NOT NULL
)

CREATE TABLE [##ptd_state_report_strata_appraisal] (
	[entity_id] [int],
	[state_cd] [varchar] (5)  NOT NULL ,
	[appraisal_val] [numeric](14, 0) NULL ,
	[stratum_number] [int]
)

--------------------------------------------------------------------------------
-- END - PTD export tables
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Appraisal export tables
--------------------------------------------------------------------------------

CREATE TABLE [##transfer_appraisal_entity_info] (
	[prop_id] [int] NOT NULL ,
	[prop_val_yr] [numeric](4, 0) NOT NULL ,
	[sup_num] [int] NOT NULL ,
	[owner_id] [int] NOT NULL ,
	[entity_id] [int] NOT NULL ,
	[entity_cd] [varchar] (10)  NULL,
	[entity_name] [varchar] (50)  NULL,
	[entity_prop_id] [varchar] (50)  NULL,
	[reserved1] [varchar](15)  NULL,
	[assessed_val] [numeric](14, 0)  NULL,
	[taxable_val] [numeric](14, 0)  NULL,
	[ab_amt] [numeric](14, 0)  NULL,
	[en_amt] [numeric](14, 0)  NULL,
	[fr_amt] [numeric](14, 0)  NULL,
	[ht_amt] [numeric](14, 0)  NULL,
	[pro_amt] [numeric](14, 0)  NULL,
	[pc_amt] [numeric](14, 0)  NULL,
	[so_amt] [numeric](14, 0)  NULL,
	[ex366_amt] [numeric](14, 0)  NULL,
	[hs_amt] [numeric](14, 0)  NULL,
	[ov65_amt] [numeric](14, 0)  NULL,
	[dp_amt] [numeric](14, 0)  NULL,
	[dv_amt] [numeric](14, 0)  NULL,
	[ex_amt] [numeric](14, 0)  NULL,
	[ch_amt] [numeric](14, 0)  NULL,
	[market_value] [numeric](14, 0)  NULL,
	[appraised_value] [numeric](14, 0)  NULL,
	[hs_cap] [numeric](14, 0)  NULL,
	[ag_late_loss] [numeric](14, 0)  NULL,
	[freeport_late_loss] [numeric](14, 0)  NULL,
	[hs_state_amt] [numeric](14, 0)  NULL,
	[hs_local_amt] [numeric](14, 0)  NULL,
	[land_hstd_val] [numeric](14, 0)  NULL,
	[land_non_hstd_val] [numeric](14, 0)  NULL,
	[imprv_hstd_val] [numeric](14, 0)  NULL,
	[imprv_non_hstd_val] [numeric](14, 0)  NULL,
	[ag_use_val] [numeric](14, 0)  NULL,
	[ag_market_val] [numeric](14, 0)  NULL,
	[tim_use_val] [numeric](14, 0)  NULL,
	[tim_market_val] [numeric](14, 0)  NULL,
	[partial_entity] [varchar] (1)  NULL default('F'),
	[freeze_yr] numeric(4,0) NULL,
	[freeze_ceiling] numeric(4,0) NULL,
	[freeze_transfer_flag] char(1) NULL,
	[freeze_transfer_date] char(25) NULL,
	[freeze_previous_tax] numeric(15,0) NULL,
	[freeze_previous_tax_unfrozen] numeric(15,0) NULL,
	[freeze_transfer_percentage] numeric(9,6) NULL,
	[lve_amt] numeric(15,0) NULL,
	[dataset_id] [bigint] NOT NULL,

	primary key clustered(dataset_id,prop_val_yr,sup_num,prop_id)
)

CREATE TABLE [##transfer_appraisal_info] (
	prop_id	int ,
	prop_type_cd	varchar(5)  NULL,
	prop_val_yr	numeric(5)  NULL,
	sup_num	int  NULL,
	sup_action	varchar(2)  NULL,
	sup_cd	varchar(10)  NULL,
	sup_desc	varchar(500)  NULL,
	geo_id	varchar(50)  NULL,
	py_owner_id	int  NULL,
	py_owner_name	varchar(70)  NULL,
	partial_owner	varchar(1)  NULL,
	filler1	varchar(14)  NULL,
	py_addr_line1	varchar(60)  NULL,
	py_addr_line2	varchar(60)  NULL,
	py_addr_line3	varchar(60)  NULL,
	py_addr_city	varchar(50)  NULL,
	py_addr_state	varchar(50)  NULL,
	py_addr_country	varchar(5)  NULL,
	py_addr_zip	varchar(5)  NULL,
	py_addr_zip_cass	varchar(4)  NULL,
	py_addr_zip_rt	varchar(2)  NULL,
	py_confidential_flag	varchar(1)  NULL,
	py_address_suppress_flag	varchar(1)  NULL,
	filler2	varchar(20)  NULL,
	py_addr_ml_deliverable	varchar(1)  NULL,
	filler3	varchar(27)  NULL,
	situs_street_prefx	varchar(10)  NULL,
	situs_street	varchar(50)  NULL,
	situs_street_suffix	varchar(10)  NULL,
	situs_city	varchar(30)  NULL,
	situs_zip	varchar(10)  NULL,
	legal_desc	varchar(255)  NULL,
	legal_desc2	varchar(255)  NULL,
	legal_acreage	numeric(16)  NULL,
	abs_subdv_cd	varchar(10)  NULL,
	hood_cd	varchar(10)  NULL,
	block	varchar(50)  NULL,
	tract_or_lot	varchar(50)  NULL,
	land_hstd_val	numeric(15)  NULL,
	land_non_hstd_val	numeric(15,0)  NULL,
	imprv_hstd_val	numeric(15,0)  NULL,
	imprv_non_hstd_val	numeric(15,0)  NULL,
	ag_use_val	numeric(15,0)  NULL,
	ag_market	numeric(15,0)  NULL,
	timber_use	numeric(15,0)  NULL,
	timber_market	numeric(15,0)  NULL,
	appraised_val	numeric(15,0)  NULL,
	ten_percent_cap	numeric(15,0)  NULL,
	assessed_val	numeric(15,0)  NULL,
	filler4	varchar(20)  NULL,
	arb_protest_flag	varchar(1)  NULL,
	filler5	int  NULL,
	deed_book_id	varchar(20)  NULL,
	deed_book_page	varchar(20)  NULL,
	deed_dt	varchar(25)  NULL,
	mortgage_co_id	int NULL,
	mortage_co_name	varchar(70)  NULL,
	mortgage_acct_id	varchar(50)  NULL,
	jan1_owner_id	int  NULL,
	jan1_owner_name	varchar(70)  NULL,
	jan1_addr_line1	varchar(60)  NULL,
	jan1_addr_line2	varchar(60)  NULL,
	jan1_addr_line3	varchar(60)  NULL,
	jan1_addr_city	varchar(50)  NULL,
	jan1_addr_state	varchar(50)  NULL,
	jan1_addr_country	varchar(5)  NULL,
	jan1_addr_zip	varchar(5)  NULL,
	jan1_addr_zip_cass	varchar(4)  NULL,
	jan1_addr_zip_rt	varchar(2)  NULL,
	jan1_confidential_flag	varchar(1)  NULL,
	jan1_address_suppress_flag	varchar(1)  NULL,
	filler6	varchar(37)  NULL,
	jan1_ml_deliverable	varchar(1)  NULL,
	hs_exempt	varchar(1)  NULL,
	ov65_exempt	varchar(1)  NULL,
	ov65_prorate_begin	varchar(25)  NULL,
	ov65_prorate_end	varchar(25)  NULL,
	ov65s_exempt	varchar(1)  NULL,
	dp_exempt	varchar(1)  NULL,
	dv1_exempt	varchar(1)  NULL,
	dv1s_exempt	varchar(1)  NULL,
	dv2_exempt	varchar(1)  NULL,
	dv2s_exempt	varchar(1)  NULL,
	dv3_exempt	varchar(1)  NULL,
	dv3s_exempt	varchar(1)  NULL,
	dv4_exempt	varchar(1)  NULL,
	dv4s_exempt	varchar(1)  NULL,
	ex_exempt	varchar(1)  NULL,
	ex_prorate_begin	varchar(25)  NULL,
	ex_prorate_end	varchar(25)  NULL,
	lve_exempt	varchar(1)  NULL,
	ab_exempt	varchar(1)  NULL,
	en_exempt	varchar(1)  NULL,
	fr_exempt	varchar(1)  NULL,
	ht_exempt	varchar(1)  NULL,
	pro_exempt	varchar(1)  NULL,
	pc_exempt	varchar(1)  NULL,
	so_exempt	varchar(1)  NULL,
	ex366_exempt	varchar(1)  NULL,
	ch_exempt	varchar(1)  NULL,
	imprv_state_cd	varchar(10)  NULL,
	land_state_cd	varchar(10)  NULL,
	personal_state_cd	varchar(10)  NULL,
	mineral_state_cd	varchar(10)  NULL,
	land_acres	numeric(20,0)  NULL,
	entity_agent_id	int  NULL,
	entity_agent_name	varchar(70)  NULL,
	entity_agent_addr_line1	varchar(60)  NULL,
	entity_agent_addr_line2	varchar(60)  NULL,
	entity_agent_addr_line3	varchar(60)  NULL,
	entity_agent_city	varchar(50)  NULL,
	entity_agent_state	varchar(50)  NULL,
	entity_agent_country	varchar(5)  NULL,
	entity_agent_zip	varchar(5)  NULL,
	entity_agent_cass	varchar(4)  NULL,
	entity_agent_rt	varchar(2)  NULL,
	filler7	varchar(34)  NULL,
	ca_agent_id	int  NULL,
	ca_agent_name	varchar(70)  NULL,
	ca_agent_addr_line1	varchar(60)  NULL,
	ca_agent_addr_line2	varchar(60)  NULL,
	ca_agent_addr_line3	varchar(60)  NULL,
	ca_agent_city	varchar(50)  NULL,
	ca_agent_state	varchar(50)  NULL,
	ca_agent_country	varchar(5)  NULL,
	ca_agent_zip	varchar(5)  NULL,
	ca_agent_zip_cass	varchar(4)  NULL,
	ca_agent_zip_rt	varchar(2)  NULL,
	filler8 varchar(34) NULL,
	arb_agent_id	int  NULL,
	arb_agent_name	varchar(70)  NULL,
	arb_agent_addr_line1	varchar(60)  NULL,
	arb_agent_addr_line2	varchar(60)  NULL,
	arb_agent_addr_line3	varchar(60)  NULL,
	arb_agent_city	varchar(50)  NULL,
	arb_agent_state	varchar(50)  NULL,
	arb_agent_country	varchar(5)  NULL,
	arb_agent_zip	varchar(5)  NULL,
	arb_agent_zip_cass	varchar(4)  NULL,
	arb_agent_zip_rt	varchar(2)  NULL,
	filler9	varchar(34)  NULL,
	mineral_type_of_int	varchar(5)  NULL,
	mineral_int_pct	varchar(15)  NULL,
	productivity_use_code	varchar(3)  NULL,
	filler10	varchar(40)  NULL,
	timber_78_market	int  NULL,
	ag_late_loss	int  NULL,
	late_freeport_penalty	int  NULL,
	filler11	varchar(2)  NULL,
	filler12	varchar(5)  NULL,
	filler13	varchar(2)  NULL,
	dba	varchar(40)  NULL,
	filler14	varchar(38)  NULL,
	market_value	numeric(14)  NULL,
	mh_label	varchar(20)  NULL,
	mh_serial	varchar(20)  NULL,
	mh_model	varchar(20)  NULL,
	filler15	varchar(1)  NULL,
	filler16	varchar(1)  NULL,
	filler17	varchar(70)  NULL,
	ov65_deferral_date	varchar(25)  NULL,
	dp_deferral_date	varchar(25)  NULL,
	ref_id1	varchar(25)  NULL,
	ref_id2	varchar(25)  NULL,
	situs_num	varchar(15)  NULL,
	situs_unit	varchar(5)  NULL,
	appr_owner_id	int  NULL,
	appr_owner_name	varchar(70)  NULL,
	appr_addr_line1	varchar(60)  NULL,
	appr_addr_line2	varchar(60)  NULL,
	appr_addr_line3	varchar(60)  NULL,
	appr_addr_city	varchar(50)  NULL,
	appr_addr_state	varchar(50)  NULL,
	appr_addr_country	varchar(5)  NULL,
	appr_addr_zip	varchar(5)  NULL,
	appr_addr_zip_cass	varchar(4)  NULL,
	appr_addr_zip_cass_route	varchar(2)  NULL,
	appr_ml_deliverable	varchar(1)  NULL,
	appr_confidential_flag	varchar(1)  NULL,
	appr_address_suppress_flag	varchar(1)  NULL,
	appr_confidential_name	varchar(70)  NULL,
	py_confidential_name	varchar(70)  NULL,
	jan1_confidential_name	varchar(70)  NULL,
	sic_code	varchar(5)  NULL,
	rendition_filed	varchar(1)  NULL,
	rendition_date	varchar(25)  NULL,
	rendition_penalty	numeric(15)  NULL,
	rendition_penalty_date_paid	varchar(25)  NULL,
	rendition_fraud_penalty	numeric(15)  NULL,
	rendition_fraud_penalty_date_paid	varchar(25)  NULL,
	deed_num	varchar(20)  NULL,
	entities	varchar(80)  NULL

)

CREATE TABLE [##transfer_appraisal_info_supp_assoc] (
	[prop_id] [int] NOT NULL ,
	[sup_num] [int] NOT NULL ,
	[owner_tax_yr] [numeric](4, 0) NOT NULL ,
	[udi_child] [char] (1) NOT NULL,
	[udi_prop_id] [int] NOT NULL,
	[dataset_id] [bigint] NOT NULL,
    [arb_status] [char] NULL,
	primary key clustered (dataset_id,prop_id, owner_tax_yr,sup_num )
	with fillfactor = 90
)

CREATE TABLE [##transfer_appraisal_entity] (
	[entity_id] [int] NOT NULL ,
	[entity_cd] [varchar] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL ,
	[dataset_id] [bigint] NOT NULL,

	primary key clustered(dataset_id,entity_id)
)

--------------------------------------------------------------------------------
-- END - Appraisal export tables
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Owner agent export tables
--------------------------------------------------------------------------------

CREATE TABLE [##oa_change_entity] (
	[entity_id] [int] NOT NULL ,
	[entity_cd] [varchar] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL ,
	[dataset_id] bigint NOT NULL,

	primary key clustered(dataset_id,entity_id)
)

CREATE TABLE [##oa_changes] (
	[oa_id] [int] IDENTITY (1, 1) NOT NULL ,
	[acct_id] [int] NULL ,
	[acct_type] [varchar] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL ,
	[change_type] [varchar] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL ,
	[prop_id] [int] NULL ,
	[owner_tax_yr] [int] NULL ,
	[sup_num] [int] NULL ,
	[update_dt] [datetime] NULL ,
	[address_update_dt] [datetime] NULL ,
	[dataset_id] bigint NOT NULL,

	primary key clustered(oa_id) with fillfactor = 100
)

CREATE INDEX IDX_tmp_oa_changes_prop_id_owner_sup ON
##oa_changes(prop_id, owner_tax_yr, sup_num)

CREATE INDEX IDX_tmp_oa_changes_acct_id ON
##oa_changes(acct_id)

CREATE INDEX IDX_tmp_oa_changes_dataset_id ON
##oa_changes(dataset_id)

CREATE TABLE [##oa_change_info] (
	[record_type] [varchar] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL ,
	[prop_id] [int] NOT NULL ,
	[prop_val_yr] [int] NOT NULL ,
	[current_account_id] [int] NOT NULL ,
	[current_percentage] [numeric](13, 10) NULL ,
	[current_name] [varchar] (70) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[current_addr1] [varchar] (60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[current_addr2] [varchar] (60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[current_addr3] [varchar] (60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[current_city] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[current_state] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[current_zip] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[current_deliverable_flag] [varchar] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[current_country] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[current_confidential_flag] [varchar] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[prop_type_desc] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[geo_id] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[legal_description] [varchar] (255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[legal_acreage] [numeric](14, 4) NULL ,
	[abs_subdv_cd] [varchar] (10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[block] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[tract_or_lot] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[entities] [varchar] (40) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[change_reason] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[ownership_chg_dt] [datetime] NULL ,
	[address_chg_dt] [datetime] NULL ,
	[deed_book_id] [varchar] (20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[deed_book_page] [varchar] (20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[deed_type] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[deed_num] [varchar] (20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[deed_dt] [datetime] NULL ,
	[deed_recorded_dt] [datetime] NULL ,
	[dba_name] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[chg_dt] [datetime] NULL ,
	[lKey] [int] IDENTITY (1, 1) NOT NULL ,
	[dataset_id] bigint NOT NULL
)

--------------------------------------------------------------------------------
-- END - Owner agent export tables
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Sup roll balance tables
--------------------------------------------------------------------------------

CREATE TABLE [##supp_role_balance_assoc] (
	[year] [numeric](4, 0) NOT NULL ,
	[sup_num] [int] NOT NULL ,
	[prop_id] [int] NOT NULL ,
	[prev_sup_num] [int] NULL ,
	[prev_sup_num_check] [int] NULL ,
	[entity_id] [int] NOT NULL ,
	[prop_inactive_dt] [datetime] NULL ,
	[sup_action] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[sup_action_ok] [varchar] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL ,
	[prev_sup_num_ok] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[primary_address_cnt] [int] NULL ,
	[primary_situs_cnt] [int] NULL ,
	[agent_assoc_with_ca_mailing] [int] NULL ,
	[recalc_flag] char(1) NULL,
	[curr_taxable_val] [numeric](16, 0) NULL ,
	[prev_taxable_val] [numeric](16, 0) NULL ,
	[curr_assessed_val] [numeric](16, 0) NULL ,
	[prev_assessed_val] [numeric](16, 0) NULL ,
	[curr_exempt_val] [numeric](16, 0) NULL ,
	[prev_exempt_val] [numeric](16, 0) NULL ,
	[sim_curr_taxable_val] [numeric](16, 0) NULL ,
	[sim_curr_assessed_val] [numeric](16, 0) NULL ,
	[sim_prev_taxable_val] [numeric](16, 0) NULL ,
	[sim_prev_assessed_val] [numeric](16, 0) NULL ,
	[no_pv_record] [char] (1) NULL,
	[no_poev_record] [char] (1) NULL,
	[suspect_property] [char](1) NULL,
	[remarks]	[varchar] (255) NULL,
	[distinct_flag] [char] NULL,
	[spid] [smallint] NOT NULL,
	PRIMARY KEY clustered (spid,prop_id,sup_num,entity_id,year)
)

CREATE TABLE [##supp_role_balance_poev_to_pv] (
	[prop_id] [int] NOT NULL ,
	[sup_num] [int] NOT NULL ,
	[sup_yr] [numeric](4, 0) NOT NULL ,
	[entity_id] [int] NOT NULL,
	[pv_prop_id] [int] NULL ,
	[valid_pv_record] [varchar] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL ,
	[spid] [smallint] NOT NULL
)

CREATE TABLE [##supp_role_balance_pv_to_poev] (
	[prop_id] [int] NOT NULL ,
	[sup_num] [int] NOT NULL ,
	[sup_yr] [numeric](4, 0) NOT NULL ,
	[poev_prop_id] [int] NULL ,
	[valid_poev_record] [varchar] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL ,
	[spid] [smallint] NOT NULL
)

CREATE TABLE [##supp_role_balance_totals] (
	[sup_num] [int] NOT NULL ,
	[year] [numeric](4, 0) NOT NULL ,
	[sup_action] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[entity_id] [int] NOT NULL ,
	[cnt] [int] NULL ,
	[curr_assessed_val] [numeric](38, 0) NULL ,
	[curr_taxable_val] [numeric](38, 0) NULL ,
	[curr_exempt_val] [numeric](38, 0) NULL ,
	[prev_assessed_val] [numeric](38, 0) NULL ,
	[prev_taxable_val] [numeric](38, 0) NULL ,
	[prev_exempt_val] [numeric](38, 0) NULL ,
	[delta_assessed_val] [numeric](38, 0) NULL ,
	[delta_taxable_val] [numeric](38, 0) NULL ,
	[delta_exempt_val] [numeric](38, 0) NULL,
	[spid] [smallint] NOT NULL
)

CREATE TABLE [##supp_role_balance_entities] (
	[entity_id] [int] NOT NULL,
	[spid] [smallint] NOT NULL
)

--------------------------------------------------------------------------------
-- END - Sup roll balance tables
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - ReportSplitMergePropertyWithExemptions tables
--------------------------------------------------------------------------------

create table ##split_merge_report_working
(
	session_id int ,
	prop_id int ,
	sup_num int ,
	prop_val_yr numeric(4) ,
	type char(1),
	parent_child_cd char null,
	type_date datetime null,
	
	PRIMARY KEY CLUSTERED(session_id,prop_id,sup_num,prop_val_yr,type)
)	

create table ##split_merge_report_all
(
	session_id int ,
	prop_id int ,
	assoc_id int,
	parent_id int,
	child_id int,
	type char(1),
	type_date datetime null,
	parent_child_cd char null,

	PRIMARY KEY CLUSTERED(session_id,prop_id,assoc_id,parent_id,child_id)
)	

--------------------------------------------------------------------------------
-- END - ReportSplitMergePropertyWithExemptions tables
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Sales stratification tables
--------------------------------------------------------------------------------

CREATE TABLE [##sales_stratfication_report] (
	[prop_id] [int] NULL,
	[geo_id] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[situs_display] [varchar] (140) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[yr_blt] [numeric](4, 0) NULL ,
	[state_cd] [varchar] (10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[ptd_state_cd] [varchar] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[school_id] [int] NULL ,
	[class_cd] [varchar] (10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[living_area] [numeric](14, 0) NULL ,
	[sl_dt] [datetime] NULL ,
	[sl_price] [numeric](14, 0) NULL ,
	[adjusted_sl_price] [numeric](14, 0) NULL ,
	[sl_financing_cd] [char] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[market] [numeric](14, 0) NULL ,
	[chg_of_owner_id] [int] NULL ,
	[entity_cd] [char] (5) NULL,
	[file_as_name] [varchar] (70) NULL,
	[multi_property] [char] (1) NULL,
	[dataset_id] [bigint] NULL, -- Unique id to identify this data set
	ratio as market/sl_price
)


CREATE TABLE [##sales_stratfication_summary_report] (
	[entity_id] [int] NULL,
	[entity_cd] [char] (5) NULL,
	[state_cd] [varchar] (10) NULL,
	[file_as_name] [varchar] (70) NULL,
	[begin_range] [numeric] (14,0) NULL,
	[end_range] [numeric] (14,0) NULL,
	[sold] [int] NULL,
	[market] [numeric] (14,0) NULL,
	[adjusted_sl_price] [numeric] (14,0) NULL,
	[ratio] [numeric] (6,4) NULL,
	[dataset_id] [bigint] NULL -- Unique id to identify this data set
)

--------------------------------------------------------------------------------
-- END - Sales stratification tables
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - ReportMismatchPersPropEntity tables
--------------------------------------------------------------------------------

create table ##mismatch_pers_prop_entity_work
(
	session_id int,
	prop_id_r int ,
	prop_id_p int ,
	prop_val_p numeric(19,2),
	
	PRIMARY KEY CLUSTERED(session_id,prop_id_r,prop_id_p)
)

--------------------------------------------------------------------------------
-- END - ReportMismatchPersPropEntity tables
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - PP Rendition report tables
--------------------------------------------------------------------------------

CREATE TABLE ##pp_rend_prop_list
(
	session_id int NOT NULL,
	prop_id int NOT NULL,
	prop_val_yr int NOT NULL,
	sort_id int IDENTITY (1, 1) NOT NULL
)

--------------------------------------------------------------------------------
-- END - PP Rendition report tables
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Top ten taxpayer report tables
--------------------------------------------------------------------------------

CREATE TABLE [##top_ten_supp_assoc] (
	[prop_id] [int] NOT NULL ,
	[sup_num] [int] NOT NULL ,
	[sup_yr] [numeric](4, 0) NOT NULL,
	[udi_child] [char] (1) NOT NULL,
	[udi_prop_id] [int] NOT NULL,
	[dataset_id] [bigint] NOT NULL,

	primary key clustered(prop_id,sup_num,sup_yr,dataset_id)
)

CREATE TABLE [##top_tu_ten_taxpayers] (
	[entity_id] [int] NOT NULL ,
	[year] [int] NOT NULL ,
	[owner_id] [int] NOT NULL ,
	[market_val] [numeric](38, 0) NULL ,
	[taxable_val] [numeric](38, 0) NULL ,
	[owner_id_main] [int] NULL,
	[dataset_id] [bigint]NOT NULL
)

CREATE TABLE [##top_ten_taxpayers] (
	[group_id] [int] NOT NULL ,
	[group_description] [varchar] (50) NOT NULL ,
	[year] [numeric](4, 0) NOT NULL ,
	[as_of_sup_num] [int] NOT NULL ,
	[owner_id] [int] NOT NULL ,
	[owner_name] [varchar] (70) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[property_type_desc] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
	[total_market_val] [numeric](14, 0) NULL ,
	[total_taxable_val] [numeric](14, 0) NULL ,
	[tv_percent] [numeric](7,4) NULL,
	[mv_percent] [numeric](7,4) NULL,
	[top_percent] [numeric](7,4) NULL,
	[ranking] int IDENTITY(1,1) ,
	[dataset_id] [bigint] NOT NULL 
)

CREATE TABLE [##top_tu_ten_tmp] (
	[record_type] [char] (3)  NULL ,
	[cad_id_code] [varchar] (3)  NULL ,
	[taxing_unit_id_code] [varchar] (10)  NULL ,
	[county_fund_type_ind] [char] (1)  NULL ,
	[ranking] [int] NULL ,
	[owner_name] [varchar] (50)  NULL ,
	[market_val] [numeric](11, 0) NULL ,
	[taxable_val] [numeric](11, 0) NULL ,
	[entity_id] [int] NULL ,
	[owner_id] [int] NULL ,
	[year] [numeric](4, 0) NULL,
	[dataset_id] [bigint] NOT NULL
)

--------------------------------------------------------------------------------
-- END - Top ten taxpayer report tables
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Sales & equity summary tables
--------------------------------------------------------------------------------

CREATE TABLE [##sales_equity_summary_reports] (
	[spid] [int] NOT NULL ,
	[report_type] [varchar] (5) NOT NULL,	-- RS, RE, CS, CE
	[prop_id] [int] NULL ,
	[situs] [varchar] (140)  NULL,
	[property_use_cd] [varchar] (10)  NULL,
	[sub_market_cd] [varchar] (10) NULL,
	[market] [numeric] (14,0) NULL	,
	[gba] [numeric] (14,0) NULL	,
	[gba_sqft] [numeric] (14,2) NULL,
	[nra] [numeric] (14,0) NULL	,
	[nra_sqft] [numeric] (14,2) NULL	,
	[eff_yr] [numeric] (4,0)  NULL,
	[actual_yr] [numeric] (4,0)  NULL,
	[lbratio] [numeric] (14,5) NULL	,
	[imprv_class] [varchar] (10)  NULL,
	[region] [varchar] (5)  NULL,
	[vac_pct] [numeric] (5,2) NULL	,
	[cap_rate] [numeric] (5,2) NULL,
	[dba_name] [varchar] (50) NULL,
	[sale_price] [numeric] (14,0)  NULL,
	[sale_price_sqft] [numeric] (14,2)  NULL,
	[living_area] [numeric] (14,0)  NULL,
	[mkt_val_sqft] [numeric] (14,2) NULL	,
	[state_cd] [varchar] (10)  NULL,
	[condition_cd] [varchar] (5) NULL,
	[heat_ac_cd] [varchar] (75)  NULL,
	[land_total_sqft] [numeric] (18,2)  NULL,
	[land_total_acres] [numeric] (18,4)  NULL,
	[additive_val] [numeric] (14,0) NULL	,
	[percent_complete] [numeric] (5,2)  NULL,
	[sale_date]  [datetime] NULL,
	[imprv_sub_class] [varchar] (10)  NULL,
	[issubject] [varchar] (2) NULL,
	[pacs_user_name] [varchar] (30) NULL,
	[heat_only_code_attribute] [varchar](75) NULL,
	[cool_only_code_attribute] [varchar](75) NULL,
	[num_stories] [varchar] (5) NULL,
	[hood_cd] [varchar] (10) NULL
)

CREATE INDEX IDX_sales_equity_summary_reports ON
##sales_equity_summary_reports(spid,report_type,prop_id)

CREATE TABLE [##temp_propid_spid] (
	[spid] [int] NOT NULL ,
	[prop_id] [int] NOT NULL,
	[type]	varchar(5) NULL ,
	[var1]	varchar(50) NULL,
	[var2]  varchar(50) NULL,
	[var3]	varchar(50) null,
	[int1]	int null,
	[int2]	int null,
	[int3]	int null
)

--------------------------------------------------------------------------------
-- END - Sales & equity summary tables
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Property value comparison by year tables
--------------------------------------------------------------------------------

CREATE TABLE [##prop_val_comp_by_yr]
(
  [prop_id]  [int] NOT NULL,
  [dataset_id] [bigint] NOT NULL,

  primary key clustered(prop_id,dataset_id)
)

--------------------------------------------------------------------------------
-- END - Property value comparison by year tables
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - PP Rend entry report tables
--------------------------------------------------------------------------------

CREATE TABLE [##pp_rend_entry]
(
  [pp_yr_acquired] numeric(4,0) NOT NULL,
  [pp_rend_column] varchar(10) NOT NULL,
  [pp_new_orig_cost] numeric(14,0) NOT NULL,
  [dataset_id] [bigint] NOT NULL,
  [dataset_db] varchar(50)  not Null  default 'UNKNOWN',
  primary key clustered(pp_yr_acquired, pp_rend_column, dataset_id, dataset_db)
)

--------------------------------------------------------------------------------
-- END - PP Rend entry report tables
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - OV65 report tables
--------------------------------------------------------------------------------

CREATE TABLE [##auto_add_ov65_candidates]
(
	[session_id]			[int] NOT NULL,			
	[prop_id] 				[int] NOT NULL,
	[udi_parent_prop_id] 	[int] NULL,
	[owner_id]				[int] NOT NULL,
	[owner_tax_yr] 			[numeric] (4, 0)NOT NULL,
	[sup_num]				[int] NOT NULL,
	[file_as_name] 			[varchar] (256),
	[birth_dt]   			[datetime] NULL,
	[spouse_birth_dt] 		[datetime] NULL,
	[addr_line1] 			[varchar] (256) NULL,
	[addr_line2] 			[varchar] (256) NULL,
	[addr_line3] 			[varchar] (256) NULL,
	[addr_city]  			[varchar] (32)  NULL,
	[addr_state] 			[varchar] (32)  NULL,
	[addr_zip]   			[varchar] (32)  NULL,
	[ntype]      			[numeric] (1, 0)NULL,
	[stype]      			[varchar] (256) NULL,
	[sp_processed_status] 	[varchar] (256)	NULL
)

--------------------------------------------------------------------------------
-- END - OV65 report tables
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Tax statement event list
--------------------------------------------------------------------------------

create table ##tax_statement_event_list
(
	event_id int not null,
	pacs_user_id int not null
)

--------------------------------------------------------------------------------
-- END - Tax statement event list
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - PP SIC summary
--------------------------------------------------------------------------------

CREATE TABLE [##pers_prop_sic_summary]
(
	[dataset_id] bigint not null,
	[prop_id] int not null,
	[prop_val_yr] numeric(4,0) not null,
	[owner_id] int null,
	[c_taxpayer] varchar(70) null,
	[taxpayer] varchar(70) null,
	[situs_address] varchar(145) null,
	[legal_desc] varchar(255) null, 	
	[situs_num] varchar(15) null,	
	[situs_street] varchar(50) null,			
	[situs_suffix] varchar(10) null,			
	[situs_prefix] varchar(10) null,			
	[situs_unit] varchar(10) null,	
	[situs_state] char(2) null,
	[dba_name] varchar(50) null,
	[confidential_flag] char(1) null,
	[sic_cd] char(10) null,
	[pp_seg_id] int null,
	[pp_type_cd] char(10) null,   	
	[seg_area] numeric(12,0) not null,
	[rend] char(1) null,
	[pps_appraised_method] char(5) null,
	[pps_value] numeric(14,0) not null,
	[quality_cd] char(5) null,
	[density_cd] char(5) null,
	[udi_parent] char(1) null,										
	[reviewed_dt] smalldatetime null,											
	[geo_id] varchar(50) null,
	[ubi_number] varchar(50) null,
	[last_appraisal_yr] numeric(4,0) null,
	[dep_schedule] varchar(50) null,
	[dep_percent] numeric(5,2) null,

	primary key clustered(prop_id, dataset_id)
)

-- Old version - This can be removed when release 33 is no longer in use
CREATE TABLE [##pp_sic_summary]
(
  [prop_id] int NOT NULL,
  [prop_val_yr] numeric(4,0) NOT NULL,
  [owner_id] int NOT NULL,
  [c_taxpayer] varchar(70) NULL,
  [taxpayer] varchar(70) NULL,
  [situs_address] varchar(145) NULL,
  [legal_desc] varchar(255) NULL, 	
  [situs_num] varchar(15) NULL,	
  [situs_street] varchar(50) NULL,			
  [situs_suffix] varchar(10) NULL,			
  [situs_prefix] varchar(10) NULL,			
  [situs_unit] varchar(10) NULL,	
  [situs_state] char(2) NULL,
  [dba_name] varchar(50) NULL,
  [confidential_flag] char(1) NULL,
  [sic_cd] char(5) NULL,
  [pp_seg_id] int NULL,
  [pp_type_cd] char(10) NOT NULL,   	
  [seg_area] numeric(12,0) NOT NULL,
  [rend] char(1) NULL,
  [pps_appraised_method] char(5) NULL,
  [pps_value] numeric(14,0) NOT NULL,
  [quality_cd] char(5) NULL,
  [density_cd] char(5) NULL,
  [udi_parent]	char(1) NULL,										
  [reviewed_dt] smalldatetime NULL,											
  [dataset_id] [bigint] NOT NULL,

  primary key clustered(prop_id, dataset_id)
)

--------------------------------------------------------------------------------
-- END - PP SIC summary
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Cert mail report
--------------------------------------------------------------------------------

CREATE TABLE [##pp_cert_mail]
(
  [prop_id] int NOT NULL,
  [owner_id] int NOT NULL,
  [file_as_name] varchar(70) NULL,
  [legal_desc] varchar(255) NULL,
  [legal_desc_2] varchar(255) NULL,
  [addr_line1] varchar(50) NULL,
  [addr_line2] varchar(50) NULL,
  [addr_line3] varchar(50) NULL,
  [city] varchar(50) NULL,
  [state] char(2) NULL,
  [zip] varchar(50) NULL,
  [tax_due] numeric(14,2) NULL,
  [penalty_mno]	numeric(14,2) NULL,	 	 			
  [penalty_ins]	numeric(14,2) NULL,	 	 			
  [interest_mno] numeric(14,2) NULL,	 	 			
  [interest_ins] numeric(14,2) NULL,	 	 			
  [attorney_fee] numeric(14,2) NULL,
  [total] numeric(14,2) NULL,	 	
  [prop_type] varchar(50) NULL, 	 				 	 			  	
  [dataset_id] [bigint] NOT NULL,

  primary key clustered(prop_id, dataset_id)
)

--------------------------------------------------------------------------------
-- END - Cert mail report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Appraisal notice export
--------------------------------------------------------------------------------

CREATE TABLE [##appr_notice_prop_id_success_list]
(
  [prop_id]  [int] NOT NULL,
  [dataset_id] [bigint] NOT NULL,

  primary key clustered(prop_id,dataset_id)
)

--------------------------------------------------------------------------------
-- END - Appraisal notice export
--------------------------------------------------------------------------------


--------------------------------------------------------------------------------
-- BEGIN - Appraisal notice export
--------------------------------------------------------------------------------

CREATE TABLE [##prop_lookup_list]
(
  [dataset_id] [bigint] NOT NULL,
  [prop_id]  [int] NOT NULL,
  primary key clustered(dataset_id, prop_id)
)

--------------------------------------------------------------------------------
-- END - Appraisal notice export
--------------------------------------------------------------------------------


--------------------------------------------------------------------------------
-- BEGIN - Receipting Balance Report
--------------------------------------------------------------------------------

CREATE TABLE [##receipting_balance_report]
(
	[dataset_id] [int] NOT NULL,
	[report_dt] [datetime] NULL,
	[beginning_cash] [numeric](14, 2) NULL,
	[net_deposit] [numeric](14, 2) NULL,
	[gl_journal] [numeric](14, 2) NULL,
	[day_refunds] [numeric](14, 2) NULL,
	[month_refunds] [numeric](14, 2) NULL,
	[year_refunds] [numeric](14, 2) NULL,
	[ap_file] [numeric](14, 2) NULL,
	[cad_name] [varchar](50)
)

CREATE TABLE [##receipting_balance_report_item]
(
	[dataset_id] [int] NULL,
	[receipt_name] [varchar](50),
	[day_value] [numeric](14, 2) NULL,
	[month_value] [numeric](14, 2) NULL,
	[year_value] [numeric](14, 2) NULL
)


--------------------------------------------------------------------------------
-- END - Receipting Balance Report
--------------------------------------------------------------------------------


--------------------------------------------------------------------------------
-- BEGIN - Levy Certification Print Reports
--------------------------------------------------------------------------------

CREATE TABLE [##levy_cert_levy_data_vw] (
	dataset_id int,
	tax_district_name_filter varchar(70),
	outstanding_item_cnt_filter varchar(5),
	levy_cert_run_id int,
	year numeric (4, 0),
	tax_district_id int,
	tax_district_name varchar(70),
	levy_cd varchar(10),
	levy_description varchar(50),
	levy_type_cd varchar(10),
	levy_type_desc varchar(50),
	voted bit,
	timber_assessed_full numeric(16, 2),
	timber_assessed_half numeric(16, 2),
	timber_assessed_roll numeric(16, 2),
	budget_amount numeric(16, 2),
	tax_base numeric(16, 2),
	levy_rate numeric(13, 10),
	outstanding_item_cnt int,
	priority int
)

CREATE TABLE [##levy_cert_print_calc_values](
	[dataset_id] [int] NOT NULL,
	[dataset_dt] [datetime] NOT NULL,
	[group_name] [varchar](50) NOT NULL,
	[location_area] [varchar](255) NULL,
	[real_personal] [numeric](14, 2) NULL,
	[senior_disabled] [numeric](14, 2) NULL,
	[state_assessed] [numeric](14, 2) NULL,
	[total_taxable_value] [numeric](14, 2) NULL,
	[annex_value] [numeric](14, 2) NULL,
	[new_const] [numeric](14, 2) NULL,
)

CREATE TABLE [##levy_cert_print_calc_levy_rate](
	[dataset_id] [int] NOT NULL,
	[dataset_dt] [datetime] NOT NULL,
	[levy_cd] [varchar](10) NOT NULL,
	[levy_description] [varchar](50) NULL,
	[budget_amount] [numeric](14, 2) NULL,
	[timber_assessed_value] [numeric](14, 0) NULL,
	[total_taxable_value] [numeric](14, 2) NULL,
	[tax_rate] [numeric](13, 10) NULL
)

--------------------------------------------------------------------------------
-- END - Levy Certification Print Calculation Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Levy Certification Print Grid Reports
--------------------------------------------------------------------------------

create table ##levy_cert_agg_limit_grid_report
(
	[dataset_id] int not null, 
	[levy_cert_run_id] int,
	[year] numeric(4, 0),
	[tax_area_number] varchar(23),
	[tax_area_description] varchar(255),
	[status] varchar(20),
	[tax_area_original_levy_rate] numeric(13, 10),
	[tax_area_levy_reduction]  numeric(13, 10),
	[tax_area_final_levy_rate] numeric(13, 10),
	[levy_cd] varchar(10),
	[levy_description] varchar(50),
	[tax_district_desc] varchar(50),
	[original_levy_rate] numeric(13, 10),
	[levy_reduction]  numeric(13, 10),
	[final_levy_rate] numeric(13, 10)
)
	
create table ##levy_cert_const_limit_grid_report
(
	[dataset_id] int not null, 
	[levy_cert_run_id] int,
	[year] numeric(4, 0),
	[tax_area_number] varchar(23),
	[tax_area_description] varchar(255),
	[status] varchar(20),
	[tax_area_original_levy_rate] numeric(13, 10),
	[tax_area_levy_reduction]  numeric(13, 10),
	[tax_area_final_levy_rate] numeric(13, 10),
	[levy_cd] varchar(10),
	[levy_description] varchar(50),
	[tax_district_desc] varchar(50),
	[original_levy_rate] numeric(13, 10),
	[levy_reduction]  numeric(13, 10),
	[final_levy_rate] numeric(13, 10)
)

create table ##levy_cert_stat_limit_grid_report
(
	dataset_id int,
	levy_cert_run_id int,
	[year] numeric(4, 0),
	tax_district_type_priority int,
	tax_district_id int,
	tax_district_desc varchar(50),
	tax_district_type_cd varchar(10),
	statutory_limit numeric(13, 10), 
	levy_cd varchar(10), 
	levy_description varchar(50),
	levy_rate numeric(13, 10),
	linked_levy_rate numeric(13, 10), 
	levy_stat_limit numeric(13, 10), 
	levy_reduction_amount numeric(13, 10), 
	calculated_limit numeric(13, 10)
)

--------------------------------------------------------------------------------
-- END - Levy Certification Print Grid Reports
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Certification of Levies Report 
--------------------------------------------------------------------------------

CREATE TABLE [##CertOfLeviesReport]
(
	[dataset_id] [int],
	[year] [numeric](4, 0),
	[as_of_sup_num] [int],
	[tax_district_type_priority] [int],
	[tax_district_type_cd] [varchar](10),
	[tax_district_type_desc] [varchar](50),
	[tax_district_id] [int],
	[tax_district_cd] [varchar](20),
	[tax_district_name] [varchar](50),
	[parent_levy_description] [varchar](120),
	[is_linked] [bit],
	[levy_cd] [varchar](10),
	[levy_description] [varchar](120),
	[levy_rate] [numeric](13, 10),
	[fund_number] [varchar](255),
	[taxable_value] [numeric](16, 2),
	[tav_value] [numeric](16, 2),
	[total_taxes] [decimal](16, 2),
	[tav_total_taxes] [numeric](16, 2),
	[run_id] [int],	
	[status] [varchar](20),
	[is_parent] [bit],
	[group_number] [int],
	[voted] bit,
	[timber_assessed_cd] varchar(10),
	[summarize_av] bit,
	[summarize_tav] bit
) 

CREATE TABLE [##CertOfLeviesReportGroup]
(
	[dataset_id] [int],
	[tax_district_id] [int],
	[tax_district_type_cd] [varchar](10),
	[summary_assessed_value] [numeric](16, 2),
	[summary_excess_assessed_value] [numeric](16, 2),
	[summary_half_tav_value] [numeric](16, 2),
	[summary_full_tav_value] [numeric](16, 2),
	[summary_assessed_rate] [numeric](14, 10),
	[summary_excess_rate] [numeric](14, 10),
	[summary_half_tav_rate] [numeric](14, 10),
	[summary_full_tav_rate] [numeric](14, 10),
	[summary_assessed_taxes] [decimal](16, 2),
	[summary_excess_taxes] [decimal](16, 2),
	[summary_half_tav_taxes] [decimal](16, 2),
	[summary_full_tav_taxes] [decimal](16, 2)
) 

CREATE TABLE [##CertOfLeviesReportGroupCode]
(
	[dataset_id] [int],
	[tax_district_type_cd] [varchar](10),
	[summary_assessed_value] [numeric](16, 2),
	[summary_excess_assessed_value] [numeric](16, 2),
	[summary_half_tav_value] [numeric](16, 2),
	[summary_full_tav_value] [numeric](16, 2),
	[summary_assessed_rate] [numeric](14, 10),
	[summary_excess_rate] [numeric](14, 10),
	[summary_half_tav_rate] [numeric](14, 10),
	[summary_full_tav_rate] [numeric](14, 10),
	[summary_assessed_taxes] [decimal](16, 2),
	[summary_excess_taxes] [decimal](16, 2),
	[summary_half_tav_taxes] [decimal](16, 2),
	[summary_full_tav_taxes] [decimal](16, 2)
) 


--------------------------------------------------------------------------------
-- END - Certification of Levies Report 
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Certification to Taxroll Report 
--------------------------------------------------------------------------------

CREATE TABLE [##CertToTaxrollReport] (
	dataset_id int,
	priority int,
	row_num int,
	line_item varchar(255),
	[year] numeric(4, 0),
	tax_district_id int,
	tax_district_name varchar(50),
	levy_cd varchar(10),
	levy_description varchar(50),
	senior_assessed_value numeric(16, 0),
	senior_levy_rate numeric(13, 10),
	assessed_value numeric(16, 0),
	levy_rate numeric(13, 10),
	total_levy numeric(14, 2),
	destroyed_property bit,
	prorated_property bit
)

CREATE TABLE [##CertToTaxrollReport_GrandTotal] 
(
	dataset_id int,
	row_num int,
	line_item varchar(255),
	total_assessed_value numeric(17, 2),
	total_levy numeric(17,2)
)

create table ##CertToTaxrollReport_propcount
(
	dataset_id int,
	row_num int,
	line_item varchar(255),
	propCount int
)

--------------------------------------------------------------------------------
-- END - Certification to Taxroll Report 
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Levy Rate Summary Report 
--------------------------------------------------------------------------------

CREATE TABLE [##LevyRateSummaryReport] (
	dataset_id int,
	[year] numeric(4),
	entity_name varchar(50),
	tax_area_number varchar(23),
	sch_levy_rate numeric(13,10),
	st_cnty_levy_rate numeric(13,10),
	cnty_rd_levy_rate numeric(13,10),
	city_levy_rate numeric(13,10),
	port_district_name varchar(50),
	port_levy_rate numeric(13,10),
	park_levy_rate numeric(13,10),
	cem_district_name varchar(50),
	cem_levy_rate numeric(13,10),
	fire_district_name varchar(50),
	fire_levy_rate numeric(13,10),
	lbry_levy_rate numeric(13,10),
	ems_levy_rate numeric(13,10),
	total_levy_rate numeric(13,10),
	lbry_bnd_levy_rate numeric(13,10),
	other_levy_rate numeric(13,10),
	has_post_year_fund bit,
)

--------------------------------------------------------------------------------
-- END - Levy Rate Summary Report 
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Levy Rates by Tax Area Report 
--------------------------------------------------------------------------------

CREATE TABLE ##LevyRatesByTaxAreaReport
(
	dataset_id int, 
	[year] numeric(4, 0),
	tax_area_number	varchar(23),
	tax_area_description varchar(255),
	tax_district_name varchar(50),
	tax_district_type_desc varchar(50),
	priority int,
	levy_cd	varchar(10),
	levy_description varchar(50),
	levy_rate numeric(13, 10),
	senior_levy_rate numeric(13, 10)
)

--------------------------------------------------------------------------------
-- END - Levy Rates by Tax Area Report 
--------------------------------------------------------------------------------

create table ##levy_rates_report (
	[dataset_id] int,
	[year] numeric(4, 0),
	[priority] int,
	[tax_district_name] varchar(50),
	[tax_district_type_cd] varchar(10),
	[tax_district_type_desc] varchar(50),
	[voted] bit,
	[levy_cd] varchar(10),
	[levy_description] varchar(50),
	[levy_type_desc] varchar(50),
	[fund_number] varchar(500),
	[levy_rate] numeric(13, 10),
	[is_tif_sponsor] bit
)

--------------------------------------------------------------------------------
-- BEGIN - Tax District Summary Report
--------------------------------------------------------------------------------

create table [##tax_district_summary]
(
	[dataset_id] [int] not null, 
	[dataset_dt] [datetime] not null,
	[tax_district_id] int,
	[tax_district_cd] [varchar](10) not null,
	[tax_district_name] [varchar](50) null,
	[tax_district_type_cd] [varchar](10) not null,
	[tax_district_type_desc] [varchar](50) null,
	[levy_cd] [varchar](10) not null,
	[levy_description] [varchar](50) null, 
	[levy_fund_no] [varchar](255) null,
	[levy_year] numeric(4, 0) not null,
	[voted_levy_rate] numeric(13, 10) null,
	[budget_limit_exists] bit not null default(0),
	[hll_limit_exists] bit not null default(0),
	[stat_limit_exists] bit not null default(0),
	[agg_limit_exists] bit not null default(0),
	[const_limit_exists] bit not null default(0),
	[lid_lift_exists] bit not null default(0),
	[election_term_exists] bit not null default(0),

	-- [calc_method_levy_year] - [regular_property_tax_limit_with_annex], [received_capacity] and [regular_property_tax_limit_with_annex_rc] should be null if no 'hll' limit
	[calc_method_levy_year] numeric(4, 0) null,					-- year of highest lawful levy since 1985
	[nolift_calc_method_levy_year] numeric(4, 0) null,				
	[calc_method_levy_amount] numeric(14, 2) null,				-- highest lawful levy since 1985
	[nolift_calc_method_levy_amount] numeric(14, 2) null,
	[general_limit_factor] numeric(13, 10) null,					-- general limit factor
	[senior_general_limit_factor] numeric(13, 10) null,
	[pct_increase_levy_amount] numeric(14, 4) null,				-- percent increase levy amount
	[lift_pct_increase_levy_amount] numeric(14, 4) null,
	[senior_pct_increase_levy_amount] numeric(14, 4) null,
	[new_const_value] numeric(14, 0) null,						-- new construction taxable assessed value
	[lift_new_const_value] numeric(14, 0) null,						
	[senior_new_const_value] numeric(14, 0) null,						
	[prior_year_levy_rate] numeric(14, 10) null,					-- last year's levy rate
	[senior_prior_year_levy_rate] numeric(14, 10) null,				
	[new_const_levy_amount] numeric(14, 4) null,					-- new construction levy amount
	[lift_new_const_levy_amount] numeric(14, 4) null,
	[senior_new_const_levy_amount] numeric(14, 4) null,
	[non_annex_state_taxable_this_year] numeric(14, 0) null,		-- non-annexed state assessed taxable value this year
	[state_taxable_last_year] numeric(14, 0) null,				-- state assessed taxable value last year
	[new_state_levy_amount] numeric(14, 4) null,					-- new state assessed value levy amount
	[regular_property_tax_limit] numeric(14,4) null,				-- regular property tax limit w/o annexations
	[lift_regular_property_tax_limit] numeric(14,4) null,
	[senior_regular_property_tax_limit] numeric(14,4) null,
	[taxable_value] numeric(14, 0) null,							-- taxable assessed value (excludes timber assessed value)
	[annex_value] numeric(14,0) null,								-- annexation taxable value
	[lift_annex_value] numeric(14,0) null,
	[senior_annex_value] numeric(14,0) null,
	[annex_levy_rate] numeric(14,10) null,							-- annexation levy rate
	[lift_annex_levy_rate] numeric(14,10) null,
	[senior_annex_levy_rate] numeric(14,10) null,
	[annex_levy_amount] numeric(14,4) null,							-- annexation levy amount
	[lift_annex_levy_amount] numeric(14,4) null,
	[senior_annex_levy_amount] numeric(14,4) null,
	[regular_property_tax_limit_with_annex] numeric(14, 4) null,	-- regular property tax limit including annexations
	[lift_regular_property_tax_limit_with_annex] numeric(14, 4) null,
	[senior_regular_property_tax_limit_with_annex] numeric(14, 4) null,
	[received_capacity] numeric(14, 2) null,						-- received capacity (null if zero)
	[regular_property_tax_limit_with_annex_rc] numeric(14, 2) null,	-- regular property tax limit including annexations and received capacity
	[lift_regular_property_tax_limit_with_annex_rc] numeric(14,2) null,	
	[senior_regular_property_tax_limit_with_annex_rc] numeric(14, 2) null,
	[resolution_limit_factor] numeric(13,10) null,				-- limit factor for resolution calculation
	[resolution_senior_limit_factor] numeric(13,10) null,
	[prior_year_levy] numeric(14,2) null,						-- actual levy amount last year
	[senior_prior_year_levy] numeric(14,2) null,
	[resolution_amount_with_new_annex_tif] numeric(14, 2) null,		-- resolution amount including annexations and received capacity
	[resolution_lift_amount_with_new_annex_tif] numeric(14,2) null,
	[resolution_senior_amount_with_new_annex_tif] numeric(14,2) null,
	[population_count] numeric(10, 0) null,						-- population count
	[resolution_pct_increase_levy_amount] numeric(14, 2) null,	-- resolution - percent increase levy amount
	[resolution_senior_pct_increase_levy_amount] numeric(14,2) null,
	[resolution_regular_property_tax_limit] numeric(14, 2) null,	-- resolution - regular property tax limit w/o annexations
	[resolution_lift_regular_property_tax_limit] numeric(14, 2) null,	
	[resolution_senior_regular_property_tax_limit] numeric(14, 2) null,	
	[statutory_levy_rate] numeric(14, 10) null,					-- statutory levy rate (null if no 'statutory' limit)
	[statutory_levy_amount] numeric(14, 2) null,					-- statutory levy amount (null if no 'statutory' limit)
	[lift_statutory_levy_amount] numeric(14,2) null,
	[senior_statutory_levy_amount] numeric(14,2) null,
	[budget_amount] numeric(14, 2) null,							-- budget amount (null if no 'hll' limit)
	[lowest_of_limit_statutory_budget] numeric(14, 2) null,		-- lowest of [regular_property_tax_limit_with_annex_rc], [statutory_levy_amount] and [budget_amount]
	[lift_lowest_of_limit_statutory_budget] numeric(14, 2) null,
	[senior_lowest_of_limit_statutory_budget] numeric(14, 2) null,
	[admin_refund_linked_levy_amount] numeric(14, 2) null,		-- levy amount for admin refund linked levies
	[lift_admin_refund_linked_levy_amount] numeric(14,2) null,
	[senior_admin_refund_linked_levy_amount] numeric(14,2) null,
	[linked_levy_amount_non_admin] numeric(14, 2) null,			-- levy amount for admin refund linked levies
	[lift_linked_levy_amount_non_admin] numeric(14,2) null,
	[senior_linked_levy_amount_non_admin] numeric(14,2) null,

	-- [total_levy], [amount_recovered], [lowest_of_limit_statutory_budget_less_recovered], [corrections_year], [corrections_amount], [refund_amount], 
	-- [banking_capacity], [shift_to_levy_cd], [total_levy_after_corrections], [hll_rate_general], [hll_rate_admin_refund_linked], and [combined_hll_rate]
	-- are all null if no 'hll' limit
	[total_levy] numeric(14, 2) null,								-- total levy ([lowest_of_limit_statutory_budget] + [admin_refund_linked_levy_amount]) (null if no 'hll' limit)
	[lift_total_levy] numeric(14,2) null,
	[senior_total_levy] numeric(14,2) null,
	[amount_recovered] numeric(14, 2) null,						-- amount recovered 
	[lowest_of_limit_statutory_budget_less_recovered] numeric(14, 2) null,	-- [lowest_of_limit_statutory_budget] - [amount_recovered] (null if [amount_recovered] is null)
	[lift_lowest_of_limit_statutory_budget_less_recovered] numeric(14, 2) null,
	[senior_lowest_of_limit_statutory_budget_less_recovered] numeric(14, 2) null,
	[corrections_year] numeric(4, 0) null,						-- corrections year 
	[corrections_amount] numeric(14, 2) null,						-- corrections amount 
	[refund_amount] numeric(14, 2) null,							-- refund amount (null if [lowest_of_limit_statutory_budget] = [budget_amount], ie no refund if lowest is budget amount)
	[banking_capacity] numeric(14, 2) null,						-- banking capacity 
	[shift_to_levy_cd] [varchar](10) null,							-- levy code to which banking capacity is shifted (null if no banking capacity)
	[shift_diversion_reason] [varchar](30) null,					-- shift/diversion reason
	[shift_diversion_amount] numeric(14,2) null,					-- shift/diversion amount
	[total_levy_after_corrections] numeric(14, 2) null,			-- total levy after corrections, refunds, and shifted capacity 
	[lift_total_levy_after_corrections] numeric(14,2) null,
	[senior_total_levy_after_corrections] numeric(14,2) null,
	[hll_rate_general] numeric(14, 10) null,						-- highest lawful levy rate for general levy = 1000 x ([total_levy_after_corrections] - [admin_refund_linked_levy_amount]) / [taxable_value] 
	[lift_hll_rate_general] numeric(14,10) null,
	[senior_hll_rate_general] numeric(14,10) null,
	[hll_rate_admin_refund_linked] numeric(14, 10) null,			-- highest lawful levy rate for admin refund linked levies = 1000 x [admin_refund_linked_levy_amount] / [taxable_value] 
	[lift_hll_rate_admin_refund_linked] numeric(14,10) null,
	[senior_hll_rate_admin_refund_linked] numeric(14,10) null,
	[hll_rate_non_admin_refund_linked] numeric(14, 10) null,		-- highest lawful levy rate for non admin refund linked levies = 1000 x [admin_refund_linked_levy_amount] / [taxable_value] 
	[lift_hll_rate_non_admin_refund_linked] numeric(14,10) null,
	[senior_hll_rate_non_admin_refund_linked] numeric(14,10) null,
	[combined_hll_rate] numeric(14, 10) null,						-- combined highest lawful levy rate 
	[lift_combined_hll_rate] numeric(14,10) null,
	[senior_combined_hll_rate] numeric(14,10) null,
	[aggregate_limit_rate_for_run] numeric(6, 3) null,			-- aggregate limit rate for tax district (null if no 'aggregate' or 'const' limit)
	[constitutional_limit_rate_for_run] numeric(14, 10) null,		-- constitutional limit for tax district (null if no 'aggregate' or 'const' limit)
	[aggregate_limit_rate_for_levy] numeric(14, 10) null,			-- aggregate limit rate for levy (null if no 'aggregate' or 'const' limit)
	[constitutional_limit_rate_for_levy] numeric(14, 10) null,	-- constitutional limit rate for levy (null if no 'aggregate' or 'const' limit)
	[lesser_of_aggregate_constitutional] numeric(14, 10) null,	-- less of aggregate limit rate and constitutional limit rate for levy (null if no 'aggregate' or 'const' limit)

	-- [budget_amount_for_levy], [tax_base_for_levy], [rate_computation_for_levy], [budget_admin_refund_linked], [tax_base_for_linked_levies], [rate_computation_for_admin_refund_linked], [total_levy_for_computation], and [total_levy_rate_for_computation] are null if no 'budget' limit or anything in addition to 'budget' limit)
	[budget_amount_for_levy] numeric(14, 2) null,					-- budget amount for levy (null if no 'budget' limit or anything in addition to 'budget' limit)
	[tax_base_for_levy] numeric(14, 0) null,						-- tax base for levy (includes timber assessed value)
	[rate_computation_for_levy] numeric(14, 10) null,				-- rate computation for levy
	[lift_rate_computation_for_levy] numeric(14,10) null,
	[senior_rate_computation_for_levy] numeric(14,10) null,
	[budget_admin_refund_linked] numeric(14, 2) null,				-- budget amount for administrative refund linked levies (null if no 'budget' limit or anything in addition to 'budget' limit)
	[budget_non_admin_refund_linked] numeric(14, 2) null,			-- budget amount for non-administrative refund linked levies (null if no 'budget' limit or anything in addition to 'budget' limit)
	[tax_base_for_linked_levies] numeric(14, 0) null,				-- tax base for linked levies (includes timber assessed value)
	[tax_base_for_non_admin_linked_levies] numeric(14, 0) null,	-- tax base for non-admin linked levies (includes timber assessed value)
	[rate_computation_for_admin_refund_linked] numeric(14, 10) null,	-- rate computation for admin refund linked levies
	[rate_linked_levies_non_admin] numeric(14, 10) null,			-- rate computation for non admin refund linked levies
	[total_levy_rate_for_computation] numeric(14, 10) null,		-- total levy rate for computation = [rate_computation_for_levy] + [rate_computation_for_admin_refund_linked]
	[total_levy_for_computation] numeric(14, 2) null,				-- total levy for computation = [budget_amount_for_levy] + [budget_admin_refund_linked]

	-- [final_or_voted_levy_rate], [tax_base_for_run], [total_levy_for_straight_rate] are null unless the levy has no limit calcs, or has a lid lift in the hll calc
	[final_or_voted_levy_rate] numeric(14, 10) null,				-- final levy_rate if no limit exists, voted_levy_rate if lid_lift_exists
	[tax_base_for_run] numeric(14, 0),							-- tax base for levy (includes timber assessed value)
	[total_levy_for_straight_rate] numeric(14, 2) null,				-- total levy for straight rate or lid lift calculation

	[first_percent_enable] bit,							-- levy first amount enabled
	[first_amount_requested] numeric(14, 2) null,		-- levy first amount requested
	[first_percent_amount] numeric(14, 10) null,		-- first resolution percent
	[second_percent_enable] bit,						-- levy second amount enabled
	[second_amount_requested] numeric(14, 2) null,	-- levy second amount requested
	[second_percent_amt] numeric(14, 10) null,		-- second resolution percent
	[final_levy_rate_sum] numeric(14,10) null,
	[senior_levy_rate] numeric(13,10) null,
	[senior_value] numeric(14, 0) null,
	[senior_total_rate] numeric(14, 2) null,
	[linked_levy_taxable] numeric(14, 2) null,		-- linked levy amount taxable value
	[lift_linked_levy_taxable] numeric(14,2) null,
	[senior_linked_levy_taxable] numeric(14,2) null,
	[admin_levy_taxable] numeric(14, 2) null,			-- admin amount taxable value
	[lift_admin_levy_taxable] numeric(14,2) null,
	[senior_admin_levy_taxable] numeric(14,2) null,
	multiple_linked_levies bit,							-- flag to indicate more than one linked levy exists
	tif_active bit null,								-- flag to indicate an active ltif area
	prior_year_tif_levy_amount numeric(14,2) null,		-- ltif additional levy amount from the previous year
	non_senior_prior_year_tif_levy_amount numeric(14,2) null, 
	senior_prior_year_tif_levy_amount numeric(14,2) null, 
	sum_tif_levy_amount numeric(14,2) null,
	sum_tif_lift_levy_amount numeric(14,2) null,
	sum_tif_senior_levy_amount numeric(14,2) null,
	sum_tif_increment numeric(14,2) null,
	sum_tif_senior_increment numeric(14,2) null,
	final_levy_rate numeric(14,10) null,					-- calculated overall levy rate
	most_recent_election_start_year numeric(4,0), 
	most_recent_election_term int,
	most_recent_election_is_senior_exempt bit,

	-- These fields are no longer used in R57 and later
	tif_levy_amount numeric(14,2) null,
	tif_lift_levy_amount numeric(14,2) null,
	tif_senior_levy_amount numeric(14,2) null,
	tif_assessed_amount numeric(14,0) null,				
	tif_lift_assessed_amount numeric(14,0) null,
	tif_senior_assessed_amount numeric(14,0) null,
	tif_taxable_value numeric(14,0) null,				
	tif_lift_taxable_value numeric(14,0) null,
	tif_senior_taxable_value numeric(14,0) null,
	tif_base_value numeric(14,0) null,				
	tif_lift_base_value numeric(14,0) null,
	tif_senior_base_value numeric(14,0) null,
	tif_new_const_value numeric(14,0) null,				
	tif_lift_new_const_value numeric(14,0) null,
	tif_senior_new_const_value numeric(14,0) null,
	tif_state_value numeric(14,0) null,
	tif_increment numeric(14,0) null,
	tif_senior_increment numeric(14,0) null
)


create table [##tax_district_summary_tif]
(
	dataset_id int not null, 
	tax_district_id int,
	levy_cd varchar(10) not null,
	tif_area_id int not null,
	tif_area_name varchar(50) null,
	tif_taxable_value numeric(14,0) null,				-- taxable value in the ltif area
	tif_lift_taxable_value numeric(14,0) null,
	tif_senior_taxable_value numeric(14,0) null,
	tif_base_value numeric(14,0) null,					-- value of properties in the ltif area that was recorded in the base year
	tif_lift_base_value numeric(14,0) null,
	tif_senior_base_value numeric(14,0) null,
	tif_new_const_value numeric(14,0) null,				-- new construction value in the ltif area
	tif_lift_new_const_value numeric(14,0) null,
	tif_senior_new_const_value numeric(14,0) null,
	tif_state_value numeric(14,0) null,					-- increase in state value since the previous year in the ltif area
	tif_assessed_amount numeric(14,0) null,				-- ltif taxable value, minus the base, new construction, and state increase values
	tif_lift_assessed_amount numeric(14,0) null,
	tif_senior_assessed_amount numeric(14,0) null,
	tif_levy_amount numeric(14,2) null,					-- ltif additional levy amount in the current year
	tif_lift_levy_amount numeric(14,2) null,
	tif_senior_levy_amount numeric(14,2) null,
	tif_increment numeric(14,0) null,
	tif_senior_increment numeric(14,0) null
)

--------------------------------------------------------------------------------
-- End - Tax District Summary Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Petition for Refund Report
--------------------------------------------------------------------------------
  CREATE TABLE [##petition_for_refund](
	[dataset_id] [int] NOT NULL,
	[petitioner] [varchar](70) NULL,
	[county_name] [varchar](30) NULL,
	[tax_year] [numeric](4,0) NULL,
	[parcel_number] [int] NULL,
	[supplement_reason] [varchar](500) NULL,
	[exempt_value] [numeric](14, 0) NULL,
	[exempt_rate] [numeric](13, 10) NULL,
	[not_exempt_value] [numeric](14, 0) NULL,
	[not_exempt_rate] [numeric](13, 10) NULL,
	[tax_area] [varchar](23) NULL,
	[tax] [numeric](14, 2) NULL,
	[prop_type_cd] CHAR(5) NULL
)
--------------------------------------------------------------------------------
-- End - Petition for Refund Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Assessment List for Bill Functions
--------------------------------------------------------------------------------
CREATE TABLE [##assessments_list_for_bill_functions](
	[agency_id] int NOT NULL,
	[dataset_id] bigint NOT NULL,
	[assessment_amt] numeric(14,2) NULL,
	primary key clustered(dataset_id, agency_id)
)

--------------------------------------------------------------------------------
-- END - Assessment List for Bill Functions
--------------------------------------------------------------------------------


--------------------------------------------------------------------------------
-- BEGIN - Statement of Account Report
--------------------------------------------------------------------------------

create table [##statement_of_account]
(
	[dataset_id] [int] not null,
	[pacs_user_id] [int] not null,
	[prop_id] [int] not null,
	[geo_id] [varchar] (50) null,
	[legal_acres] [numeric] (14,4) null,
	[legal_desc] [varchar] (255) null,
	[situs] [varchar] (200) null,
	[dba] [varchar] (50) null,
	[exemptions] [varchar] (50) null,
	[owner_id] [int] not null,
	[owner_name] [varchar] (70) null,
	[owner_addr_line1] [varchar] (60) null,
	[owner_addr_line2] [varchar] (110) null,
	[owner_addr_line3] [varchar] (110) null,
	[owner_addr_line4] [varchar] (110) null,
	[owner_addr_country] [varchar] (50) null,
	[pct_ownership] [numeric] (13,10) null,
	[mineral_pct] [numeric] (13,10) null,
	[improvement_hs] [numeric] (14,0) null,
	[improvement_nhs] [numeric] (14,0) null,
	[land_hs] [numeric] (14,0) null,
	[land_nhs] [numeric] (14,0) null,
	[productivity_market] [numeric] (14,0) null,
	[productivity_use] [numeric] (14,0) null,
	[assessed_value] [numeric] (14,0) null,
	[current_escrow_balance] [numeric] (14,2) null,
	[system_addr_line1] [varchar] (50) null,
	[system_addr_line2] [varchar] (50) null,
	[system_addr_line3] [varchar] (110) null,
	[system_addr_line4] [varchar] (110) null,
	primary key clustered(dataset_id, pacs_user_id, prop_id)
)

create table [##statement_of_account_entity]
(
	[dataset_id] [int] not null,
	[pacs_user_id] [int] not null,
	[prop_id] [int] not null,
	[entity_cd] [varchar] (5) not null,
	[entity_desc] [varchar] (70) not null,
	[entity_pct] [numeric] (13,10) null,
	primary key clustered(dataset_id, pacs_user_id, prop_id, entity_cd)
)

create table [##statement_of_account_exemption]
(
	[dataset_id] [int] not null,
	[pacs_user_id] [int] not null,
	[prop_id] [int] not null,
	[exmpt_type_cd] [varchar] (10) not null,
	[exmpt_desc] [varchar] (50) not null,
	primary key clustered(dataset_id, pacs_user_id, prop_id, exmpt_type_cd)
)

create table [##statement_of_account_paid_bills]
(
	[dataset_id] [int] not null,
	[pacs_user_id] [int] not null,
	[prop_id] [int] not null,
	[year] [numeric] (4,0) not null,
	[entity_cd] [varchar] (5) not null,
	[statement_id] [int] null,
	[tax_paid] [numeric] (14,2) null,
	[disc_pi_paid] [numeric] (14,2) null,
	[att_fee_paid] [numeric] (14,2) null,
	[under_over_refund] [numeric] (14,2) null,
	[posting_date] [datetime] null,
	[amount_paid] [numeric] (14,2) null,
	primary key clustered(dataset_id, pacs_user_id, prop_id, year, entity_cd)
)

create table [##statement_of_account_unpaid_bills]
(
	[dataset_id] [int] not null,
	[pacs_user_id] [int] not null,
	[prop_id] [int] not null,
	[year] [numeric] (4,0) not null,
	[entity_cd] [varchar] (5) not null,
	[statement_id] [int] null,
	[tax_rate] [numeric] (13,10) null,
	[type] [varchar] (5) null,
	[tax_due] [numeric] (14,2) null,
	[disc_pi] [numeric] (14,2) null,
	[att_fee] [numeric] (14,2) null,
	[total_due] [numeric] (14,2) null,
	[paid_by_date] [datetime] null,
	primary key clustered(dataset_id, pacs_user_id, prop_id, year, entity_cd)
)

create table [##statement_of_account_paid_refunds]
(
	[dataset_id] [int] not null,
	[pacs_user_id] [int] not null,
	[prop_id] [int] not null,
	[year] [numeric] (4,0) not null,
	[entity_cd] [varchar] (5) not null,
	[statement_id] [int] null,
	[date_refunded] [datetime] null,
	[refund_amount_paid] [numeric] (14,2) null,
	primary key clustered(dataset_id, pacs_user_id, prop_id, year, entity_cd)
)

--------------------------------------------------------------------------------
-- END - Statement of Account Report
--------------------------------------------------------------------------------
--------------------------------------------------------------------------------
-- BEGIN - Variance Report
--------------------------------------------------------------------------------

create table [##variance_report](
	[dataset_id] [int] not null,
	[prop_id] [int] null,
	[date] [datetime] null,
	[tax_year] [numeric] (4) null,
	[owner] [varchar](70) null,
	[user] [varchar](50) null,
	[source] [varchar](50) null,
	[variance] [numeric](14,2) null
)

--------------------------------------------------------------------------------
-- End - Variance Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Payment Receipt
--------------------------------------------------------------------------------

CREATE TABLE [##payment_receipt](
	[payment_id] [int] NOT NULL,
	[dataset_id] [int] NOT NULL,
	[receipt_num] [int] NULL,
	[receipt_date] [datetime] NULL,
	[payment_code] [varchar](50) NULL,
	[payee_id] [int] NULL,
	[payee_name] [varchar](70) NULL,
	[payee_addr1] [varchar](60) NULL,
	[payee_addr2] [varchar](60) NULL,
	[payee_addr3] [varchar](60) NULL,
	[operator_id] [int] NULL,
	[operator_name] [varchar](30) NULL,
	[operator_full_name] [varchar](30) NULL,
	[batch_id] [int] NULL,
	[batch_description] [varchar](255) NULL,
	[voided] [bit] NULL,
	[void_date] [datetime] NULL,
	[paid_under_protest] [bit] NULL
)

CREATE TABLE [##payment_receipt_property](
	[prop_id] [int] NOT NULL,
	[dataset_id] [int] NOT NULL,
	[tax_area_id] [int] NULL,
	[tax_area_code] [varchar](50) NULL,
	[situs_id] [int] NULL,
	[situs_addr] [varchar](173) NULL,
	[owner_id] [int] NULL,
	[owner_name] [varchar](70) NULL,
	[owner_addr1] [varchar](60) NULL,
	[owner_addr2] [varchar](60) NULL,
	[owner_addr3] [varchar](60) NULL,
	[legal_desc] [varchar](255) NULL
)

CREATE TABLE [##payment_receipt_property_items](
	[object_id] [int] NOT NULL,
	[dataset_id] [int] NOT NULL,
	[object_type] [varchar](18) NOT NULL,
	[prop_id] [int] NULL,
	[year] [numeric](4, 0) NULL,
	[levy_rate] [numeric](13, 10) NULL,
	[taxable_value] [numeric](38, 0) NULL,
	[statement_id] [int] NULL,
	[base_amount] [numeric](14, 2) NULL,
	[interest] [numeric](14, 2) NULL,
	[penalty] [numeric](14, 2) NULL,
	[amount_paid] [numeric](14, 2) NULL
)

--------------------------------------------------------------------------------
-- End - Payment Receipt Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Rollback Supplement Report
--------------------------------------------------------------------------------

CREATE TABLE [dbo].[##rollback_supplement](
	[dataset_id] [int] NULL,
	[sup_group_id] [int] NULL,
	[create_date] [datetime] NULL,
	[lock_date] [datetime] NULL,
	[accept_date] [datetime] NULL,
	[bill_date] [datetime] NULL,
	[sort_order] [varchar](50) NULL,
	[tax_area] [varchar](250) NULL,
	[county_name] [varchar](50) NULL,
) ON [PRIMARY]

CREATE TABLE [dbo].[##rollback_supplement_item](
	[dataset_id] [int] NULL,
	[classification] varchar(20) NULL,
	[ag_rollback_id] int NULL,
	[property_id] [int] NULL,
	[owner_id] [int] NULL,
	[pct_ownership] numeric(13,10) NULL,
	[prop_type_cd] [varchar](50) NULL,
	[owner] [varchar](70) NULL,
	[address_1] [varchar](50) NULL,
	[address_2] [varchar](50) NULL,
	[address_3] [varchar](50) NULL,
	[city] [varchar](50) NULL,
	[state] [varchar](50) NULL,
	[zip] [varchar](10) NULL,
	[geo] [varchar](50) NULL,
	[legal_description] [varchar](50) NULL,
	[appraiser] [varchar](40) NULL,
	[operator] [varchar](30) NULL,
	[situs] [varchar](173) NULL,
	[tax_area_number] [varchar](23) NULL,
	[verified_date] [datetime] NULL,
	[verified_user] [varchar](50) NULL,
 	[total_rollback_taxes] numeric(14,2) NULL,
	[name] [varchar](50) NULL,
	[acres_included] numeric(18,4) NULL,
	[status] [varchar](50) NULL,
	[total_interest_due] numeric(14,2) NULL,
	[total_tax_interest] numeric(14,2) NULL,
	[sup_num] int NULL,
	[chg_in_use_dt] datetime NULL
) ON [PRIMARY]

CREATE TABLE [dbo].[##rollback_supplement_open_space_tax](
	[dataset_id] [int] NULL,
	[tax_year] [int] NULL,
	[market_value] numeric(14,0) NULL,
	[current_use_value] numeric(14,0) NULL,
	[value_difference] numeric(14,0) NULL,
	[additional_tax] numeric(14,2) NULL
) ON [PRIMARY]

CREATE TABLE [dbo].[##rollback_supplement_item_open_space_tax](
	[dataset_id] [int] NULL,
	[ag_rollback_id] int NULL,
	[property_id] [int] NULL,
	[tax_year] [varchar](5) NULL,
	[market_value] numeric(14,0) NULL,
	[current_use_value] numeric(14,0) NULL,
	[value_difference] numeric(14,0) NULL,
	[additional_tax] numeric(14,2) NULL,
	[year_type] varchar(11) NULL,	
	tax_area_number varchar(23) NULL,
	levy_rate numeric(13,10) NULL,
	one_perc_per_month int null,
	interest_due numeric(14,2) NULL,
	tax_interest numeric(14,2) NULL
) ON [PRIMARY]

CREATE TABLE [dbo].[##rollback_supplement_dfl_tax](
	[dataset_id] [int] NULL,
	[ag_rollback_id] int NULL,
	[market_val] numeric(14,0) NULL,
	[forest_val] numeric(14,0) NULL,
	[market_taxes] numeric(14,2) NULL
) ON [PRIMARY]

CREATE TABLE [dbo].[##rollback_supplement_item_dfl_tax](
	[dataset_id] [int] NULL,
	[ag_rollback_id] int NULL,
	[property_id] [int] NULL,
	[num_years] [int] NULL,
	[market_val] numeric(14,0) NULL,
	[forest_val] numeric(14,0) NULL,
	[last_levy_rate] numeric(13,10) NULL,
	[market_taxes] numeric(14,2) NULL,
	[year_type] varchar(20) NULL
) ON [PRIMARY]

CREATE TABLE [dbo].[##rollback_supplement_years](
	[dataset_id] [int] NULL,
	[year] varchar(100) NULL
) ON [PRIMARY]

--------------------------------------------------------------------------------
-- End - Rollback Supplement Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Supplemented Property Listing Report
--------------------------------------------------------------------------------

CREATE TABLE [dbo].[##supplemented_property_listing]
(
	[dataset_id][int] NULL,
	[prop_id] [int] NOT NULL,
	[file_as_name] [varchar](70) NULL,
	[tax_area] [varchar](23) NULL,
	[supplement_date] [datetime] NULL,
	[prop_val_yr] [numeric](4,0) NULL,
	[legal_desc] [varchar](150) NULL,
	[situs] [varchar](173) NULL,
	[exemption_list] [varchar] (100) NULL,
	[prop_type_cd] [varchar] (5) NULL,
	[curr_market_value] [numeric](14,0) NULL,
	[prev_market_value] [numeric](14,0) NULL,
	[curr_taxable_value] [numeric](14,0) NULL,
	[prev_taxable_value] [numeric](14,0) NULL,
	[market_gain_loss] [numeric](14,0) NULL,
	[taxable_gain_loss] [numeric](14,0) NULL,
	[sup_cd] [varchar] (10) NULL,
	[sup_group_id] [int] NULL,
	[sup_type_desc] [varchar] (50) NULL,
	[curr_sup_num] [int] NULL,
	[prev_sup_num] [int] NULL
)
ON [PRIMARY]

--------------------------------------------------------------------------------
-- END - Supplemented Property Listing Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Paid Under Protest Report
--------------------------------------------------------------------------------

CREATE TABLE [##paid_under_protest](
	[dataset_id] [int] NOT NULL,
	[prop_id] [int] NULL,
	[owner_id] [int] NULL,
	[owner_name] [varchar](70) NULL,
	[year] [numeric] (4,0) NULL
)

--------------------------------------------------------------------------------
-- End - Paid Under Protest Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Receivable Summary Report
--------------------------------------------------------------------------------

create table [##receivable_summary_report](
	[dataset_id] [int] not null,
	[title] varchar(255),
	[page_key] varchar(50),
	[report_dt] [datetime] not null,
	[gl_receipt] [numeric](14,2) null,
	[gl_supplement] [numeric](14,2) null,
	tax_district_id int
)
create table [##receivable_summary_year](
	[dataset_id] [int] not null,
	[page_key] varchar(50) null,
	[tax_year] [numeric](4,0) not null,
	[balance_begin] [numeric](14,2) null default 0,
	[receipts_date] [numeric](14,2) null default 0,
	[receipts_month] [numeric](14,2) null default 0,
	[receipts_year] [numeric](14,2) null default 0,
	[supplements_date] [numeric](14,2) null default 0,
	[supplements_month] [numeric](14,2) null default 0,
	[supplements_year] [numeric](14,2) null default 0,
	[balance_end] as ([balance_begin] - [receipts_year] + [supplements_year])
)

--------------------------------------------------------------------------------
-- End - Receivable Summary Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Abstract Subdivision Report
--------------------------------------------------------------------------------

CREATE TABLE [##abstract_subdivision_report](
	[dataset_id] [int] NULL,
	[abs_sub_code] [char](10) NULL,
	[type] [char](10) NULL,
	[description] [varchar](60) NULL,
	[create_dt] [datetime] NULL,
	[record_dt] [datetime] NULL,
	[land_pct] [numeric](5, 2) NULL,
	[imp_pct] [numeric](5, 2) NULL,
	[parent] [varchar](200) NULL,
	[parent_value] [varchar](200) NULL
)

--------------------------------------------------------------------------------
-- End - Abstract Subdivision Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Activate Preliminary Properties Report
--------------------------------------------------------------------------------

CREATE TABLE [##activate_preliminary_properties_report](
	[dataset_id] [int] NULL,
	[prop_id] [int] NULL,
	[year] [numeric](4, 0) NULL,
	[legal_desc] [varchar](255) NULL,
	[land_value] [bit] NULL,
	[activated] [bit] NULL
)

--------------------------------------------------------------------------------
-- End - Activate Preliminary Properties Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Refunds Paid Report
--------------------------------------------------------------------------------
CREATE TABLE [##refunds_paid](
	[dataset_id] [int] NULL,
	[refund_id] [int] NULL,
	[refund_date] [datetime] NULL,
	[balance_date] [datetime] NULL,
	[check_number] [varchar](50) NULL,
	[status] [varchar](50) NULL,
	[refund_to_name] [varchar](70) NULL,
	refund_to_address [varchar](60) NULL,
	[prop_id] [int] NULL,
	[year] [numeric](4,0) NULL,
	[owner_name] [varchar](70) NULL,
	[item_type] [varchar](63) NULL,
	[refund_type] [varchar](20) NULL,
	[refund_reason] [varchar](50) NULL,
	[refund_amount] [numeric](14,2) NULL,
	[p_and_i_interest] [numeric](14,2) NULL,
	[refund_interest] [numeric](14,2) NULL,
	[refund_total] [numeric](14,2) NULL,
	[group_by] varchar(1000)
)
--------------------------------------------------------------------------------
-- END - Refunds Paid Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Chart Of Accounts Print Register
--------------------------------------------------------------------------------
CREATE TABLE [##chart_of_accounts_print_register](
	[dataset_id] [int] NOT NULL,
	[fin_transaction_id] [int] NOT NULL,
	[transaction_date] [datetime] NOT NULL,
	[fin_event_cd] [varchar](10) NOT NULL,
	[description] [varchar](100) NULL,
	[export_date] [datetime] NULL,
	[debit_amount] [numeric](14, 2) NULL,
	[credit_amount] [numeric](14, 2) NULL,
	[balance_amount] [numeric](14, 2) NULL
)
--------------------------------------------------------------------------------
-- END - Chart Of Accounts Print Register
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Assessment Year To Date Recap
--------------------------------------------------------------------------------
CREATE TABLE [##assessment_year_to_date_recap] (
	[dataset_id] int not null,
	[agency_description] varchar(50) null,
	[agency_id] int not null,
	[recap_yr] numeric(4,0) not null,
	[orig_tax] numeric(14,2) null,
	[adjustments] numeric(14,2) null,
	[adj_tax] numeric(14,2) null,
	[adj_amount] numeric(14,2) null,
	[tax_pd] numeric(14,2) null,
	[underage_pd] numeric(14,2) null,
	[eff_tax_pd] numeric(14,2) null,
	[penalty_pd] numeric(14,2) null,
	[interest_pd] numeric(14,2) null,
	[bond_interest] numeric(14,2) null,
	[overage_pd] numeric(14,2) null,
	[payments] numeric(14,2) null,
	[begin_balance] numeric(14,2) null,
	[balance] numeric(14,2) null,
	[pct_collected] numeric(5,2) null,
	[refund_total_paid] numeric(14,2) null,
	[refund_base_tax_paid] numeric(14,2) null,
	[refund_penalty_pd] numeric(14,2) null,
	[refund_interest_pd] numeric(14,2) null,
	[refund_bond_interest_pd] numeric(14,2) null,
	[fiscal_year_id] int null,
	[num_owe] int null,
	[agency_cd] varchar(50) null,
	CONSTRAINT [PK_assessment_year_to_date_recap] PRIMARY KEY CLUSTERED
	(
		dataset_id ASC,
		agency_id ASC,
		recap_yr ASC
	)
)
--------------------------------------------------------------------------------
-- END - Assessment Year To Date Recap
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Assessment Month To Date Recap
--------------------------------------------------------------------------------
CREATE TABLE [##assessment_month_to_date_recap] (
	[dataset_id] int not null,
	[agency_id] int not null,
	[recap_yr] numeric(4,0) not null,
	[tax_pd] numeric(14,2) null,
	[underage_pd] numeric(14,2) null,
	[eff_tax_pd] numeric(14,2) null,
	[penalty_pd] numeric(14,2) null,
	[interest_pd] numeric(14,2) null,
	[bond_interest] numeric(14,2) null,
	[overage_pd] numeric(14,2) null,
	[payments] numeric(14,2) null,
	[adjustments] numeric(14,2) null,
	[refund_total_paid] numeric(14,2) null,
	[refund_base_tax_paid] numeric(14,2) null,
	[refund_penalty_pd] numeric(14,2) null,
	[refund_interest_pd] numeric(14,2) null,
	[refund_bond_interest_pd] numeric(14,2) null,
	[agency_description] varchar(50) null,
	[agency_cd] varchar(50) null,
	CONSTRAINT [PK_assessment_month_to_date_recap] PRIMARY KEY CLUSTERED
	(
		dataset_id ASC,
		agency_id ASC,
		recap_yr ASC
	)
)
--------------------------------------------------------------------------------
-- END - Assessment Month To Date Recap
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Payment Listing Report
--------------------------------------------------------------------------------
CREATE TABLE [dbo].[##payment_detail_listing_report] (
  [dataset_id] int NOT NULL,
  [payment_id] int NOT NULL,
  [receipt_num] int NULL,
  [date_paid] datetime NULL,
  [post_date] datetime NULL,
  [paid_by_name] varchar(70) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
  [cash_drawer_description] varchar(30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
  [batch_id] int NULL,
  [batch_description] varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
  [prop_id] int NULL,
  [owner_name] varchar(70) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
  [description] varchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
  [transaction_type] varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
  [transaction_type_desc] varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
  [fee_type] varchar(60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
  [levy_cd] varchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
  [tax_year] numeric(4, 0) NULL,
  [base_amount] numeric(14, 2) NULL,
  [interest_amount_pd] numeric(14, 2) NULL,
  [penalty_amount_pd] numeric(14, 2) NULL,
  [bond_interest_pd] numeric(14, 2) NULL,
  [overage_amount_pd] numeric(14, 2) NULL,
  [underage_amount_pd] numeric(14, 2) NULL,
  [reet_interest_pd] numeric(14, 2) NULL,
	[reet_penalty_pd] numeric(14, 2) NULL,
  [total_paid] numeric(19, 2) NULL,
  [balance_due] numeric(15, 2) NULL,
  [balance_date] datetime NULL,
  [payment_code] varchar(50) NULL,
  [agency_cd] varchar(50) NULL,
  [payment_amount] numeric(15, 2) NULL
)
ON [PRIMARY]

CREATE NONCLUSTERED INDEX [##payment_detail_listing_report_idx]
ON [dbo].[##payment_detail_listing_report]
  (dataset_id ASC, payment_id ASC)
ON [PRIMARY]

CREATE TABLE [dbo].[##payment_detail_listing_ref_numbers] (
  [dataset_id] int NOT NULL,
  [payment_id] int NOT NULL,
  [ref_number] varchar(12) NULL
)
ON [PRIMARY]

CREATE NONCLUSTERED INDEX [##payment_detail_listing_ref_numbers_idx]
ON [dbo].[##payment_detail_listing_ref_numbers]
  (dataset_id ASC, payment_id ASC)
ON [PRIMARY]

CREATE TABLE [dbo].[##payment_detail_listing_tender] (
  [dataset_id] int NOT NULL,
  [tender_type_desc] varchar(255) NULL,
  [amount] numeric(38, 2) NULL,
  [credit_amount] numeric(38,2) NULL
)
ON [PRIMARY]

CREATE TABLE [dbo].[##payment_detail_summary_report] (
  [dataset_id] int NOT NULL,
  [description] varchar(100) NULL,
  [tax_year] numeric(4, 0) NULL,
  [levy_cd] varchar(10) NULL,
  [sum_base_amount] numeric(38, 2) NULL,
  [sum_interest_amount] numeric(38, 2) NULL,
  [sum_penalty_amount] numeric(38, 2) NULL,
  [sum_bond_interest] numeric(38, 2) NULL,
  [sum_overage_amount] numeric(38, 2) NULL,
  [sum_underage_amount] numeric(38, 2) NULL,
  [sum_reet_penalty] numeric(38, 2) NULL,
  [sum_reet_interest] numeric(38,2) NULL,
  [sum_total_paid] numeric(38, 2) NULL,
  [sum_balance_due] numeric(38, 2) NULL
)
ON [PRIMARY]

CREATE NONCLUSTERED INDEX [##payment_detail_summary_report_idx]
ON [dbo].[##payment_detail_summary_report]
  (dataset_id ASC, description ASC)
ON [PRIMARY]

CREATE TABLE [dbo].[##payment_detail_tender_per_payment] (
  [dataset_id] int NOT NULL,
  [payment_id] int NOT NULL,
  [tender_type_desc] varchar(255) NULL,
  [amount] numeric(38, 2) NULL,
  [credit_amount] numeric(38, 2) NULL,
  [ref_number] varchar(12) NULL
)
ON [PRIMARY]

CREATE NONCLUSTERED INDEX [##payment_detail_tender_per_payment_idx]
ON [dbo].[##payment_detail_tender_per_payment]
  (dataset_id ASC, payment_id ASC)
ON [PRIMARY]
--------------------------------------------------------------------------------
-- END - Payment Listing Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Payoff Letter Report  ** Obselete, can be removed after release 26
--                                  is no longer in use
--------------------------------------------------------------------------------
CREATE TABLE [dbo].[##payoff_letter_report] (
  [dataset_id] int NOT NULL,
  [payout_agreement_id] int NOT NULL,
  [prop_id] int NOT NULL,
  [file_as_name] varchar(70) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
  [situs_display] varchar(173) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
  [legal_desc] varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
  [principal] numeric(15, 2) NULL,
  [bond_interest] numeric(38, 2) NOT NULL,
  [dlq_interest] numeric(15, 2) NOT NULL,
  [penalty] numeric(15, 2) NOT NULL
)
ON [PRIMARY]

CREATE NONCLUSTERED INDEX [##payoff_letter_report_idx]
ON [dbo].[##payoff_letter_report]
  (dataset_id ASC, payout_agreement_id ASC)
ON [PRIMARY]
--------------------------------------------------------------------------------
-- END - Payoff Letter Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Payoff Letter Report
--------------------------------------------------------------------------------
CREATE TABLE [dbo].[##payoff_letter] (
  [dataset_id] int NOT NULL,
  [payout_agreement_id] int NOT NULL,
  [payoff_date] datetime NOT NULL,
  [description] varchar(64) NULL,
  [prop_id] int NULL,
  [file_as_name] varchar(70) NULL,
  [situs_display] varchar(173) NULL,
  [legal_desc] varchar(255) NULL,
  [principal] numeric(15, 2) NULL,
  [bond_interest] numeric(38, 2) NULL,
  [dlq_interest] numeric(15, 2) NULL,
  [penalty] numeric(15, 2) NULL,
  [user_name] varchar(30) NULL
)
ON [PRIMARY]

CREATE NONCLUSTERED INDEX [##payoff_letter_idx]
ON [dbo].[##payoff_letter]
  (dataset_id ASC, payout_agreement_id ASC)
ON [PRIMARY]
--------------------------------------------------------------------------------
-- END - Payoff Letter Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Payout Payment Schedule Report
--------------------------------------------------------------------------------
CREATE TABLE ##payout_payment_schedule_general
(
	dataset_id int,
	payout_agreement_id int,
	ref_id varchar(50),
	payment_terms_type_desc varchar(50),
	start_date datetime,
	end_date datetime,
	contact varchar(300),
  	description varchar(64) null,
	CONSTRAINT [PK_payout_payment_schedule_general] PRIMARY KEY CLUSTERED
	(
		dataset_id ASC,
		payout_agreement_id ASC
	)
)

CREATE TABLE ##payout_payment_schedule
(
	dataset_id int,
	payout_agreement_id int,
	payout_agreement_schedule_id int,
	due_date datetime,
	due_date_month char(3),
	amount_due numeric (14,2),
	amount_paid numeric (14,2),
	balance numeric (14,2),
	status varchar(10),
	CONSTRAINT [PK_payout_payment_schedule] PRIMARY KEY CLUSTERED
	(
		dataset_id ASC,
		payout_agreement_id ASC,
		payout_agreement_schedule_id ASC
	)
)

CREATE TABLE ##payout_payment_schedule_payments
(
	id int identity,
	dataset_id int,
	payout_agreement_id int,
	receipt_number int,
	date_paid datetime,
	amount_paid	 numeric (14,2),
	payee varchar(100),
	CONSTRAINT [PK_payout_payment_schedule_payments] PRIMARY KEY CLUSTERED
	(
		dataset_id ASC,
		payout_agreement_id ASC,
		id asc
	)
)

CREATE TABLE ##payout_payment_schedule_prop
(
	dataset_id int,
	payout_agreement_id int,
	prop_id int,
	owner varchar(100),
	situs varchar(100),
	statements_count int,
	CONSTRAINT [PK_payout_payment_schedule_prop] PRIMARY KEY CLUSTERED
	(
		dataset_id ASC,
		payout_agreement_id ASC,
		prop_id ASC
	)

)

--------------------------------------------------------------------------------
-- END - Payout Payment Schedule Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Refunds Due Report
--------------------------------------------------------------------------------
CREATE TABLE [##refunds_due](
    [dataset_id] [int] NULL,
    [date_paid] [datetime] NULL,
    [prop_id] [int] NULL,
    [item_type] [varchar](10) NULL,
    [year] [numeric](4,0) NULL,
    [owner_name] [varchar](70) NULL,
    [credit_type] [varchar](20) NULL,
    [credit_balance] [numeric](14,2) NULL,
    [refund_interest] [numeric](14,2) NULL,
    [refund_total] [numeric](14,2) NULL,
    [trans_group_id] [int] NULL,
    [trans_group_type] [varchar](10) NULL,
    [refund_interest_multiplier] [numeric](14,4) NULL,
    [credit_description] [varchar](500) NULL,
    [refund_type_cd] [varchar](20) NULL,
    [latest_payor] [varchar](70) NULL,
    [statement_id] int NULL,
    [owner_id] int NULL
)
--------------------------------------------------------------------------------
-- END - Refunds Due Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Escrow Value Listing Report
--------------------------------------------------------------------------------
CREATE TABLE [dbo].[##escrow_value_listing] (
  [dataset_id] int NOT NULL,
  [prop_id] int NULL,
  [escrow_id] int NULL,
  [taxpayer_name] varchar(70) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
  [legal_desc] varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
  [date_paid] datetime NULL,
  [receipt_num] int NULL,
  [escrow_type_cd] varchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
  [escrow_type_desc] varchar(30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
  [batch_id] [int] NULL,
  [batch_description] [varchar](255) NULL,
  [pacs_user_id] [int] NULL,
  [pacs_user_name] [varchar](255) NULL,
  [escrow_collected] numeric(14, 2) NULL,
  [applied_date] datetime NULL,
  [amount_overpaid] numeric(38, 2) NULL,
  [tax_year] numeric(4, 0) NULL,
  [tax_amount] numeric(38, 2) NULL,
  [taxable_val] numeric(16, 0) NULL,
  [comment] varchar(255) NULL,
  [over_under_variance] numeric(14,2) NULL
)
ON [PRIMARY]
--------------------------------------------------------------------------------
-- END - Escrow Value Listing Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Validate Event Mapping Report
--------------------------------------------------------------------------------
CREATE TABLE [##fin_rpt_deactivated_account] (
  [dataset_id] int NOT NULL,
  [year] decimal(4, 0) NULL,
  [panel_object_type] varchar(25) NOT NULL,
  [title] varchar(500) NOT NULL,
  [event_description] varchar(50) NULL,
  [account_number] varchar(259) NULL,
  [account_type_description] varchar(50) NULL,
  [account_description] varchar(100) NULL
)

CREATE TABLE [##fin_rpt_missing_event_mapping] (
  [dataset_id] int NOT NULL,
  [year] decimal(4, 0) NULL,
  [panel_object_type] varchar(25) NOT NULL,
  [title] varchar(500) NOT NULL,
  [event_description] varchar(50) NULL,
  [account_number] varchar(259) NULL,
  [allow_multiple] bit NULL,
  [debit_entry_count] int NOT NULL,
  [credit_entry_count] int NOT NULL,
)

CREATE TABLE [##fin_rpt_vendor_event_mapping] (
  [dataset_id] int NOT NULL,
  [panel_object_type] varchar(25) NULL,
  [title] varchar(500) NOT NULL,
  [error_description] varchar(50) NULL,
)
--------------------------------------------------------------------------------
-- END - Validate Event Mapping Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Bill/Fee Code Listing Report
--------------------------------------------------------------------------------
CREATE TABLE [##bill_fee_code_listing] (
	[prop_id] [int] NOT NULL,
	[file_as_name] [varchar](70) NULL,
	[code] [varchar](10) NULL,
	[year] [numeric](4, 0) NULL,
	[tax_district] [varchar](50) NULL,
	[type_desc] [varchar](60) NULL,
	[statement_id] [int] NULL,
	[comment] [varchar](500) NULL,
	[partial_payment_indicator] [varchar](5) NULL,
	[dataset_id] [bigint] NOT NULL
)
--------------------------------------------------------------------------------
-- END - Bill/Fee Code Listing Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Modified Bill Report
--------------------------------------------------------------------------------
CREATE TABLE [##modified_bill](
	[dataset_id] [int] NOT NULL,
	[item_type] [int] NULL,
	[tax_district] [varchar](50) NULL,
	[cd] [varchar](10) NULL,
	[description] [varchar](60) NULL,
	[owner_name] [varchar](70) NULL,
	[prop_id] [int] NULL,
	[bill_type] [varchar](5) NULL,
	[year] [numeric](4,0) NULL,
	[sup_num] [int] NULL,
	[sup_code] [varchar](10) NULL,
	[adjustment_code] [varchar](10) NULL,
	[modify_date] [datetime] NULL,
	[modify_code] [varchar](10) NULL,
	[modify_reason] [varchar](500) NULL,
	[current_tax] [numeric](14,2) NULL,
	[previous_tax] [numeric](14,2) NULL,
	[user_name] [varchar](30) NULL,
	[display_year] numeric(5,0) NULL
	
)
--------------------------------------------------------------------------------
-- END - Refunds Paid Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Senior Citizen and Disabled Persons Exemption Audit/Renewal Report
--------------------------------------------------------------------------------
CREATE TABLE [##new_and_removed_exempt](
        [dataset_id] [int] NULL,
        [prop_id] [int] NULL,
        [owner_id] [int] NULL,
        [exmpt_type_cd] [varchar](10) NULL,
        [exmpt_subtype_cd] [varchar](10) NULL,
        [file_as_name] [varchar] (70) NULL,
        [status] [varchar](10) NULL
)
--------------------------------------------------------------------------------
-- END - Senior Citizen and Disabled Persons Exemption Audit/Renewal Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - FUND Listing Report
--------------------------------------------------------------------------------
CREATE TABLE [##fund_listing] 
(
	[dataset_id] int NULL,
	[tax_district_type_cd] varchar(10) NULL,
	[tax_district_type_desc] varchar(50) NULL,
	[tax_district_name] varchar(50) NULL,
	[td_tax_district_id] int NULL,
	[levy_description] varchar(50) NULL,
	[levy_code] varchar(10) NULL,
	[fund_number] varchar(50) NULL,
	[tax_areas] varchar(3000) NULL,
	[tax_district_id] int NULL,
	[current_year] numeric NULL,
	[levy_type_cd] varchar(10) NULL,
	[exempt_code] varchar(50) NULL,
	[priority] int NULL
)
--------------------------------------------------------------------------------
-- END - FUND Listing Report
--------------------------------------------------------------------------------
--------------------------------------------------------------------------------
-- BEGIN - Building Permit Report
--------------------------------------------------------------------------------
create table [##building_permit] ( 
[dataset_id] int NULL,
[prop_id] int NULL,
[bldg_permit_import_prop_id] varchar(15) NULL,
[file_as_name] varchar(70)  NULL,
[bldg_permit_num] varchar(30)  NULL,
[bldg_permit_status] varchar(5)  NULL,
[bldg_permit_type_cd] varchar(10)  NULL,
[bldg_permit_cmnt] varchar(512)  NULL)

--------------------------------------------------------------------------------
-- END - FUND Listing Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Distribution FMS Verification Report
--------------------------------------------------------------------------------
CREATE TABLE [##fms_verification_report]
(
	[dataset_id] [int] NOT NULL,
	[create_process_id] [int] NULL,
	[distribution_type] [varchar](10) NULL,
	[transaction_date] [datetime] NULL,
	[debit_amount] [numeric](14, 2) NULL,
	[credit_amount] [numeric](14, 2) NULL,
	[transaction_type] [varchar](50) NULL,
	[account_number] [varchar](259) NULL,
	[account_description] [varchar](100) NULL,
	[account_type_description] [varchar](255) NULL
)
--------------------------------------------------------------------------------
-- END - Distribution FMS Verification Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Certification Fund Number Listing Report
--------------------------------------------------------------------------------
CREATE TABLE [##fund_number_listing_report]
(
	[dataset_id] [int] NOT NULL,
	[tax_district_cd] [varchar](20) NULL,
	[tax_district_desc] [varchar](50) NULL,
	[levy_fund_description] [varchar](110) NULL,
	[annexation] [varchar](20) NULL,
	[levy_type_cd] [varchar](10) NULL,
	[account_number]	[varchar](259) NULL,
	[comment] [varchar](255) NULL
)
--------------------------------------------------------------------------------
-- END - Certification Fund Number Listing Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Annexation Revenue Report
--------------------------------------------------------------------------------
create table ##annexation_revenue
(
	dataset_id int not null,
	annexation_id int,
	annexation_description varchar(50),
	tax_district_desc varchar(50),
	start_year int,
	tax_area_id int,
	tax_area_number varchar(23),
	divert_funds_date datetime,
	effective_date datetime,
	ordinance_date datetime,
	prop_id int,
	taxes_levied numeric(16, 2),
	divertable_taxes_levied numeric(16, 2),
	pmt_adj_before_annex numeric(16, 2),
	balance_on_divert_date numeric(16, 2),
	pmt_adj_month int,
	pmt_adj_year numeric(4, 0),
	pmt_adj_amount numeric(16, 2),
	levy_description varchar(50)
)

create table ##annexation_revenue_totals
(
	dataset_id int not null,
	annexation_id int,
	annexation_description varchar(50),
	tax_district_desc varchar(50),
	start_year int,
	divert_funds_date datetime,
	effective_date datetime,
	ordinance_date datetime,
	prop_count int,
	taxes_levied numeric(16, 2),
	divertable_taxes_levied numeric(16, 2),
	pmt_adj_before_annex numeric(16, 2),
	balance_on_divert_date numeric(16, 2),
	recievables_to_date numeric(16,2),
	criteria varchar(500),
	levy_description varchar(50)
)
--------------------------------------------------------------------------------
-- END - Annexation Revenue Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Listing tax districts within tax area
--------------------------------------------------------------------------------

create table ##tax_district_within_tax_area_tt 
(
  dataset_id int NULL,
  tax_area_id int,
  tax_area_number varchar(23),
  [year] numeric(4, 0),
  tax_district_id int,
  levy_cd varchar(10),
  tax_district_desc varchar(50),
  tax_district_type_desc varchar(50),
  priority int,
  levy_description varchar(50),
  fund_numbers varchar(255),
  full_levy_rate numeric(13, 10),
  senior_levy_rate numeric(13, 10),
  CountyName varchar(100) NULL
)

--------------------------------------------------------------------------------
-- END - Listing tax districts within tax area
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Building Permit Import Error
--------------------------------------------------------------------------------

create table ##building_permit_import_error_tt
(
	Run_ID Int NOT NULL,
	Record_ID Int NOT NULL,
	Error_ID Int NOT NULL,
	Property_ID varchar(100) NULL,
	Tidemark_ID varchar(15) NULL,
	Permit_Date Datetime NULL,
	Permit_Num varchar(100) NULL,
	Error_Desc varchar(256) NULL,
	CountyName varchar(100) NULL
)

--------------------------------------------------------------------------------
-- END - Building Permit Import Error
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Mass copy of sale land improvment Report
--------------------------------------------------------------------------------

create table ##mass_copy_sale_land_improvement
(
	dataset_id int NOT NULL,
	prop_id int NOT NULL,
	owner_name varchar(70) NULL,
	sale_date datetime NULL,
	imported_land_value numeric (14,0) NULL,
	imported_improvement_value numeric (14,0) NULL
)

--------------------------------------------------------------------------------
-- END - Mass copy of sale land improvment Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Annexation Properties Report
--------------------------------------------------------------------------------

CREATE TABLE [##annexation_properties](
	  [dataset_id] [int] NULL,
    [prop_id] [int] NULL,
    [file_as_name] [varchar] (70) NULL,
    [legal_desc] [varchar](255) NULL,
    [situs_display] [varchar](255) NULL,
    [market] [numeric](14, 0) NULL,
    [fromTaxArea] [varchar](255),
    [toTaxArea] [varchar](255)
)
  
--------------------------------------------------------------------------------
-- END - Annexation Properties Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - DOR Report
--------------------------------------------------------------------------------

create table ##dor_report
(
dataset_id	int,
year		numeric(4,0),
county_name	varchar(30),
tax_area_list varchar(max),
Assess_Using_GEO_ID bit
)

create table ##dor_report_prop_assoc
(
dataset_id	int,
prop_id		int,
geo_id		varchar(50),
sup_num		int,
prop_val_yr	numeric(4),
u500_flag bit,
snr_flag bit
)

create table ##dor_report_header (
dataset_id			int,
income_level		int,
income_min			int,
income_max			int
)

create table ##dor_report_general
(
dataset_id	int,
senior1_count int,
senior1_market numeric(14,0),
senior1_frozen numeric(14,0),
senior1_exempt numeric(14,0),
senior2_count int,
senior2_market numeric(14,0),
senior2_frozen numeric(14,0),
senior2_exempt numeric(14,0),
senior3_count int,
senior3_market numeric(14,0),
senior3_frozen numeric(14,0),
senior3_exempt numeric(14,0),
current_use_agreements int,
new_current_use_agreements int,
remodel_count	int,
remodel_value	numeric(14,0),
new_construction numeric(14,0),
new_construction_imprv numeric(14,0),
new_construction_land numeric(14,0),
new_construction_personal numeric(14,0),
new_construction_windturbine numeric(14,0),
new_construction_solar numeric(14,0),
new_construction_biomass numeric(14,0),
new_construction_geothermal numeric(14,0),

senior1_levy2 numeric(14,0),
senior2_levy2 numeric(14,0),
senior3_levy2 numeric(14,0),

new_construction_levy2 numeric(14,0),
new_construction_imprv_levy2 numeric(14,0),
new_construction_land_levy2 numeric(14,0),
new_construction_personal_levy2 numeric(14,0),
)

create table ##dor_report_real
(
dataset_id int,
dfl_acres  numeric(14,4),
dfl_market_land	numeric(14,0),
osp_acres		numeric(14,4),
osp_market_land numeric(14,0),
ag_acres		numeric(14,4),
ag_market_land	numeric(14,0),
tim_acres		numeric(14,4),
tim_market_land	numeric(14,0),
osp_land		numeric(14,0),
ag_land			numeric(14,0),
tim_land		numeric(14,0),
other_land		numeric(14,0),
other_imprv		numeric(14,0),
other_senior	numeric(14,0),
other_total		numeric(14,0),
total_land		numeric(14,0),
total_imprv		numeric(14,0),
total_senior	numeric(14,0),
total_total		numeric(14,0),
combine_DFL_timber_values char(1),

dfl_market_land_levy2	numeric(14,0),
osp_land_levy2		numeric(14,0),
ag_land_levy2			numeric(14,0),
tim_land_levy2		numeric(14,0),
other_land_levy2		numeric(14,0),
other_imprv_levy2		numeric(14,0),
other_senior_levy2	numeric(14,0),
other_total_levy2		numeric(14,0),
total_land_levy2		numeric(14,0),
total_imprv_levy2		numeric(14,0),
total_senior_levy2	numeric(14,0),
total_total_levy2		numeric(14,0),

dfl_imprv	numeric(14,0),
--dfl_imprv_levy2	numeric(14,0),
osp_imprv	numeric(14,0),
--osp_imprv_levy2	numeric(14,0),
ag_imprv	numeric(14,0),
--ag_imprv_levy2	numeric(14,0),
tim_imprv	numeric(14,0),
--tim_imprv_levy2	numeric(14,0),

dfl_senior	numeric(14,0),
dfl_senior_levy2	numeric(14,0),
osp_senior	numeric(14,0),
osp_senior_levy2	numeric(14,0),
ag_senior	numeric(14,0),
ag_senior_levy2	numeric(14,0),
tim_senior	numeric(14,0),
tim_senior_levy2	numeric(14,0)

)


create table ##dor_pp_seg_max
(
dataset_id		      int,
prop_id				  int,
asset_listing_type_cd char(1), 
farm_asset			  bit, 
mkt_val				  numeric(14,0)
)


create table ##dor_report_personal
(
dataset_id	int,
ag_me_local_count	int,
ag_me_local_mkt_val	numeric(14,0),
ag_me_state_count	int,
ag_me_state_mkt_val	numeric(14,0),
industrial_me_count	int,
industrial_me_mkt_val	numeric(14,0),
other_me_count			int,
other_me_mkt_val		numeric(14,0),
supplies_count			int,
supplies_mkt_val		numeric(14,0),
franchise_count			int,
franchise_mkt_val		numeric(14,0),
taxable_imprv_count		int,
taxable_imprv_mkt_val	numeric(14,0),
misc_pers_prop_count	int,
misc_pers_prop_mkt_val	numeric(14,0),
hof_exempt_count		int,
hof_exempt_amount		numeric(14,0),
u500_exempt_count		int,
u500_exempt_amount		numeric(14,0),

taxable_imprv_count_levy2		int,
taxable_imprv_mkt_val_levy2	numeric(14,0),
misc_pers_prop_count_levy2	int,
misc_pers_prop_mkt_val_levy2	numeric(14,0),
hof_exempt_count_levy2		int,
hof_exempt_amount_levy2		numeric(14,0),
u500_exempt_count_levy2		int,
u500_exempt_amount_levy2		numeric(14,0)

)

create table ##dor_report_real_by_land_use
(
dataset_id	int,
single_family_count	int,
single_family_land	numeric(14,0),
single_family_imprv	numeric(14,0),
single_family_exempt	numeric(14,0),
multi_family_count		int,
multi_family_land		numeric(14,0),
multi_family_imprv		numeric(14,0),
multi_family_exempt		numeric(14,0),
manufacturing_count		int,
manufacturing_land		numeric(14,0),
manufacturing_imprv		numeric(14,0),
manufacturing_exempt	numeric(14,0),
commercial_count		int,
commercial_land			numeric(14,0),
commercial_imprv		numeric(14,0),
commercial_exempt		numeric(14,0),
ag_count				int,
ag_land					numeric(14,0),
ag_imprv				numeric(14,0),
ag_exempt				numeric(14,0),
other_count				int,
other_land				numeric(14,0),
other_imprv				numeric(14,0),
other_exempt			numeric(14,0),
u500_land numeric(14,0),
u500_imprv numeric(14,0),
u500_exempt_count		int,
u500_exempt_amount		numeric(14,0),

single_family_exempt_levy2	numeric(14,0),
multi_family_exempt_levy2		numeric(14,0),
manufacturing_exempt_levy2	numeric(14,0),
commercial_exempt_levy2		numeric(14,0),
ag_exempt_levy2				numeric(14,0),
other_exempt_levy2			numeric(14,0),
u500_exempt_amount_levy2		numeric(14,0)


)

create table ##rmci_report
(
dataset_id		int,
year			numeric(14,0),
criteria_text	varchar(max)
)

create table ##rmci_report_prop_assoc
(
dataset_id	int,
prop_id		int,
sup_num		int,
prop_val_yr	numeric(4)
)

create table ##rmci_report_detail
(
dataset_id		int,
tax_area_number	varchar(23),
tax_area_id		int,
property_count	int,
taxable_val		numeric(14,0),
new_val			numeric(14,0)
)

create table ##dor_senior_relief_report
(
	dataset_id			int,
	[year]				numeric(4, 0),
	sup_num				int,
	income_level		int,
	prop_count			int,
	prefreeze_value		numeric(16, 0),
	frozen_value		numeric(16, 0),
	freeze_value_relief	numeric(16, 0),
	freeze_taxes_relief	numeric(14, 2),
	reg_exempt_value	numeric(16, 0),
	reg_exempt_relief	numeric(14, 2),
	snr_exempt_value	numeric(16, 0),
	snr_exempt_relief	numeric(14, 2),
	total_relief		numeric(14, 2)
)

create table ##dor_senior_relief_report_headers
(
	dataset_id			int,
	income_level		int,
	income_min			int,
	income_max			int
)

create table ##dor_report_sale_overall
(
	dataset_id int,
	stata_order int,
	strata_group varchar(100),
	stratum_name varchar(100),
	stratum_min numeric(14, 0),
	stratum_max numeric(14, 0),
	assessed_value numeric(16, 0),
	stratum_ratio numeric(14, 6),
	market_to_assessed_value numeric(16, 0),
	prior_assessed_value numeric(16, 0),
)

create table ##dor_report_sale_strata
(
	dataset_id int,
	sort_order	int,
	strata_group varchar(100),
	stratum_name varchar(100),
	stratum_min numeric(14, 0),
	stratum_max numeric(14, 0),
	number_of_sales int,
	assessed_value numeric(16, 0),
	adjusted_sale_price numeric(16, 0),
	stratum_ratio numeric(14, 6),
	prior_assessed_value numeric(16, 0),

)


create table ##dor_report_sale_detail
(
	dataset_id int,
	chg_of_owner_id	int,
	excise_number	int,
	main_prop_id	int,
	prop_id			int,
	sale_date		datetime,
	sale_price		numeric(14, 0),
	adjusted_sale_price	numeric(14, 0),
	sl_ratio_type_cd char(5),
	dor_use_cd		varchar(10),
	assessed_val	numeric(14, 0),
	sale_ratio		numeric(14, 6),
	invalid_sales_code varchar(5) null,
	invalid_reason	varchar(100) null,
	prop_type_cd	char(5) null,
	sort_order		int,
	stratum_group	varchar(100),
	stratum_min		numeric(14, 0),
	stratum_max		numeric(14, 0),
	stratum_ratio numeric(14, 6),
	deed_type_cd char(10) null,
	deed_type_desc varchar(50) null,
	prior_assessed_val	numeric(14, 0),
	land_only_sale bit null,

)


create table ##annual_financial_report(
dataset_id int,
year numeric(4),
tax_district_desc varchar(50),
priority int,
fi_account_id int,
fund_description varchar(50),
balance_due numeric(14,2),
levy_rate numeric(13,10),
initial_amount_due numeric(14,2),
base_amount_pd numeric(14,2),
tax_adj_increase numeric(14,2),
tax_adj_decrease numeric(14,2),
end_year_balance_due numeric(14,2)
)


create table ##fiscal_tax_collections
(
dataset_id int,
group_by int,
year_due varchar(50) null,
uncollected_balance_begin numeric(14,2) null,
additions_balance numeric(14,2) null,
collections_balance numeric(14,2) null,
cancellations_balance numeric(14,2) null,
uncollected_balance_end numeric(14,2) null
)

--------------------------------------------------------------------------------
-- END - DOR Report
--------------------------------------------------------------------------------





--------------------------------------------------------------------------------
-- BEGIN - Daily Detailed Listing Report
--------------------------------------------------------------------------------
CREATE TABLE [##daily_detailed_listing_report]
(
	[dataset_id] [int] NOT NULL,
	[prop_id] [int] NULL,
	[prop_type_description] [varchar](50) NULL,
	[object_type_cd] [varchar](100) NULL,
	[description] [varchar](110) NULL,
	[tax_area_description] [varchar](255) NULL,
	[year] [numeric](4,0) NULL,
	[amount] [numeric](14,2) NULL,
	[int_penalty_amount] [numeric](15,2) NULL,
	[var_amount] [numeric](15,2) NULL,
	[total_amount] [numeric](15,2) NULL,
	[receipt_number] [int] NULL
)
--------------------------------------------------------------------------------
-- END - Daily Detailed Listing Report
--------------------------------------------------------------------------------


--------------------------------------------------------------------------------
-- BEGIN - Special Assessment Import Details Report
--------------------------------------------------------------------------------

CREATE TABLE ##special_assessment_import_details_tt
(
  [dataset_id] [int] NOT NULL,
  RunID int NOT NULL,       
  PropID int NULL,
  GeoID char(25) NULL,
  map_type char(1) NULL,
  Match varchar(256) NOT NULL,
  CountyName varchar(30) NULL,
  AgencyCD varchar(50) NULL
)

--------------------------------------------------------------------------------
-- END - Special Assessment Import Details Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Rollback OpenSpace Worksheet Report
--------------------------------------------------------------------------------

CREATE TABLE ##rollback_openspace_worksheet
(
 dataset_id INT NULL,
 [year] INT NULL,
 year_type VARCHAR(30) NULL,
 years VARCHAR(15),
 market_val NUMERIC(14,2) NULL,
 current_use_val NUMERIC(14,2) NULL,
 levy_rate NUMERIC(13,10) NULL,
 proration_factor NUMERIC(10,6) NULL,
 market_taxes_due NUMERIC(14,2) NULL,
 curr_use_tax_due NUMERIC(14,2) NULL,
 additional_tax NUMERIC(14,2) NULL,
 interest_due NUMERIC(14,2) NULL,
 tax_interest NUMERIC(14,2) NULL,
 tax_override BIT NULL,
 value_difference NUMERIC(14,2) NULL,
 tax_area_id INT NULL,
 one_perc_per_month INT NULL,
 senior BIT NULL
)

--------------------------------------------------------------------------------
-- END - Rollback OpenSpace Worksheet Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Rollback DFL Worksheet Report
--------------------------------------------------------------------------------

CREATE TABLE ##rollback_dfl_worksheet
(
 dataset_id INT NULL,
 [year_type] VARCHAR(30),
 [market_val] NUMERIC(14,2),
 [forest_val] NUMERIC(14,2),
 [last_levy_rate] NUMERIC(13,10),
 [proration_factor] NUMERIC(10,6),
 [market_taxes] NUMERIC(14,2),
 [num_years] INT,
 [market_override] BIT,
 [senior] BIT 
)

--------------------------------------------------------------------------------
-- END - Rollback DFL Worksheet Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Cashier's Grouping Summary Report
--------------------------------------------------------------------------------

create table ##cashiers_grouping_summary_user
(
	dataset_id	int,
	is_totals bit not null default(0),
	pacs_user_name	varchar(30),
	display_order int,
	[description] varchar(50),
	taxes numeric(14,2),
	p_and_i numeric(14,2),
	escrow numeric(14,2),
	assessment numeric(14,2),
	reet numeric(14,2),
	fee numeric(14,2),
	variance numeric(14,2),
	total numeric(14,2),
	adjustments numeric(14,2),
	OPC numeric(14,2),
	reet_p_and_i numeric(14,2)
)

create table ##cashiers_grouping_summary_source
(
dataset_id	int,
payment_source_desc varchar(50),
taxes numeric(14,2),
p_and_i numeric(14,2),
escrow numeric(14,2),
assessment numeric(14,2),
reet numeric(14,2),
fee numeric(14,2),
variance numeric(14,2),
total numeric(14,2),
adjustments numeric(14,2),
OPC numeric(14,2),
reet_p_and_i numeric(14,2)
)

--------------------------------------------------------------------------------
-- END - Cashier's Grouping Summary Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Special Assessment Comparison Report
--------------------------------------------------------------------------------

CREATE TABLE [dbo].[##special_assessment_comparison] (
  [dataset_id] int NOT NULL,
  [agency_id] int NULL,
  [agency_name] varchar(100) NULL,
  [prop_id] int NULL,
  [sup_num] int NULL,
  [year] numeric(4, 0) NULL,
  [year_c] numeric(4, 0) NULL,
  [year_p] numeric(4, 0) NULL,
  [amount_c] numeric(38, 2) NOT NULL,
  [amount_p] numeric(38, 2) NOT NULL,
  [exmpt_status_c] varchar(100) NULL,
  [exmpt_status_p] varchar(100) NULL,
  [prop_type] varchar(8) NOT NULL,
  [taxpayer_name] varchar(70) NULL
)
ON [PRIMARY]

--------------------------------------------------------------------------------
-- END - Special Assessment Comparison Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN -    Report
--------------------------------------------------------------------------------

CREATE TABLE [##daily_gl_report]
(
	[dataset_id] [int] NOT NULL,
	[trans_date] [datetime] NULL,
	[trans_code] [varchar](100) NULL,
	[acc_code] [varchar](260) NULL,
	[debit] [numeric](14,2) NULL,
	[credit] [numeric](14,2) NULL
)

--------------------------------------------------------------------------------
-- END -     Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN -    Month End Reports
--------------------------------------------------------------------------------

create table ##month_end_fiscal_ytd_summary_title
(
dataset_id int,
title varchar(255),
page_key varchar(255),
tax_district_id int
)

create clustered index idx_dataset_id_page_key_title
on ##month_end_fiscal_ytd_summary_title
(dataset_id,page_key,title)

create table ##month_end_fiscal_ytd_summary_detail
(
dataset_id	int,
page_key varchar(255),
export_key varchar(255),
tax_year int,
tax_month int,
max_year int,
year_0_title varchar(10),
year_0_original_receivable numeric(14,2) default(0),
year_0_receipts numeric(14,2) default(0),
year_0_annexation_adjustments numeric(14,2) default(0),
year_0_adjustments numeric(14,2) default(0),
year_0_ending_balance numeric(14,2) default(0),
year_1_title varchar(10),
year_1_original_receivable numeric(14,2) default(0),
year_1_receipts numeric(14,2) default(0),
year_1_annexation_adjustments numeric(14,2) default(0),
year_1_adjustments numeric(14,2) default(0),
year_1_ending_balance numeric(14,2) default(0),
year_2_title varchar(10),
year_2_original_receivable numeric(14,2) default(0),
year_2_receipts numeric(14,2) default(0),
year_2_annexation_adjustments numeric(14,2) default(0),
year_2_adjustments numeric(14,2) default(0),
year_2_ending_balance numeric(14,2) default(0),
year_3_title varchar(10),
year_3_original_receivable numeric(14,2) default(0),
year_3_receipts numeric(14,2) default(0),
year_3_annexation_adjustments numeric(14,2) default(0),
year_3_adjustments numeric(14,2) default(0),
year_3_ending_balance numeric(14,2) default(0),
year_4_title varchar(10),
year_4_original_receivable numeric(14,2) default(0),
year_4_receipts numeric(14,2) default(0),
year_4_annexation_adjustments numeric(14,2) default(0),
year_4_adjustments numeric(14,2) default(0),
year_4_ending_balance numeric(14,2) default(0),
year_5_title varchar(10),
year_5_original_receivable numeric(14,2) default(0),
year_5_receipts numeric(14,2) default(0),
year_5_annexation_adjustments numeric(14,2) default(0),
year_5_adjustments numeric(14,2) default(0),
year_5_ending_balance numeric(14,2) default(0),
year_6_title varchar(10),
year_6_original_receivable numeric(14,2) default(0),
year_6_receipts numeric(14,2) default(0),
year_6_annexation_adjustments numeric(14,2) default(0),
year_6_adjustments numeric(14,2) default(0),
year_6_ending_balance numeric(14,2) default(0),
year_7_title varchar(10),
year_7_original_receivable numeric(14,2) default(0),
year_7_receipts numeric(14,2) default(0),
year_7_annexation_adjustments numeric(14,2) default(0),
year_7_adjustments numeric(14,2) default(0),
year_7_ending_balance numeric(14,2) default(0),
year_8_title varchar(10),
year_8_original_receivable numeric(14,2) default(0),
year_8_receipts numeric(14,2) default(0),
year_8_annexation_adjustments numeric(14,2) default(0),
year_8_adjustments numeric(14,2) default(0),
year_8_ending_balance numeric(14,2) default(0),
year_9_title varchar(10),
year_9_original_receivable numeric(14,2) default(0),
year_9_receipts numeric(14,2) default(0),
year_9_annexation_adjustments numeric(14,2) default(0),
year_9_adjustments numeric(14,2) default(0),
year_9_ending_balance numeric(14,2) default(0)
)

create clustered index idx_dataset_id_page_key_tax_year_tax_month_max_year
on ##month_end_fiscal_ytd_summary_detail(
dataset_id,
page_key,
tax_year,
tax_month,
max_year)

create table ##month_end_fiscal_ytd_recap_title
(
dataset_id int,
title varchar(255),
page_key varchar(255),
tax_district_id int
)

create clustered index idx_dataset_id_page_key_title
on ##month_end_fiscal_ytd_recap_title
(dataset_id,page_key,title)

create table ##month_end_fiscal_ytd_recap_detail
(
dataset_id	int,
page_key varchar(255),
f_year int,
original_receivable numeric(14,2) default(0),
receipts numeric(14,2) default(0),
annexation_adjustments numeric(14,2) default(0),
adjustments numeric(14,2) default(0),
penalty numeric(14,2) default(0),
interest numeric(14,2) default(0),
ending_receivable numeric(14,2) default(0),
refund_receipts numeric(14,2) default(0),
refund_penalty numeric(14,2) default(0),
refund_interest numeric(14,2) default(0),
delinquent_year bit default(0)

)

create clustered index idx_dataset_id_page_key_f_year
on ##month_end_fiscal_ytd_recap_detail(dataset_id, page_key, f_year)

create table ##month_end_fiscal_mtd_recap_title
(
dataset_id int,
title varchar(255),
page_key varchar(255),
tax_district_id int
)

create clustered index idx_dataset_id_page_key_title
on ##month_end_fiscal_mtd_recap_title
(dataset_id,page_key,title)


create table ##month_end_fiscal_mtd_recap_detail
(
dataset_id	int,
page_key varchar(255),
year int,
receipts numeric(14,2) default(0),
annexation_adjustments numeric(14,2) default(0),
adjustments numeric(14,2) default(0),
penalty numeric(14,2) default(0),
interest numeric(14,2) default(0),
payments numeric(14,2) default(0),
refund_receipts numeric(14,2) default(0),
refund_penalty numeric(14,2) default(0),
refund_interest numeric(14,2) default(0),
delinquent_year bit default(0)
)

create clustered index idx_dataset_id_page_key_year
on ##month_end_fiscal_mtd_recap_detail(dataset_id, page_key, year)

--------------------------------------------------------------------------------
-- END -     Month End Reports
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Recalculation Error Report
--------------------------------------------------------------------------------

CREATE TABLE [dbo].[##recalc_error_report]
(
	[dataset_id] [bigint] NOT NULL,
	[year] [numeric](4, 0) NOT NULL,
	[sup_num] [int] NOT NULL,
	[prop_id] [int] NOT NULL,
	[error_id] [int] NOT NULL identity(1,1),
	[error_type] [varchar](5) null,
	[prop_type_cd] [char](5) null,
	[imprv_id] [int] null,
	[imprv_detail_id] [int] null,
	[file_as_name] [varchar](70) null,
	[legal_desc] [varchar](255) null,
	[geo_id] [varchar](50) null,
	[error] [varchar](255) null,
	[land_detail_id] [int] null,
	[land_type_desc] [varchar](50) null,
	[recalc_error_validate_flag] [bit] null,
	[recalc_error_validate_datetime] [varchar](30) null,
	[recalc_error_validate_username] [varchar](30) null,
	CONSTRAINT CPK_recalc_error_report PRIMARY KEY CLUSTERED
	(dataset_id, [year], sup_num, prop_id, error_id)
)

create index IDX_##recalc_error_report_year_sup_num_prop_id
	on ##recalc_error_report ([year], sup_num, prop_id)
	
--------------------------------------------------------------------------------
-- END - Recalculation Error Report
--------------------------------------------------------------------------------


--------------------------------------------------------------------------------
-- BEGIN - Standard Gain Loss Report
--------------------------------------------------------------------------------

CREATE TABLE [dbo].[##standard_gain_loss_table]
(
	[DataSetID] [int],
	[entity_id] [int] NOT NULL,
	[entity_cd] [char](23) NOT NULL,
	[entity_name] [varchar](255) NULL,
	[prop_type_cd] [char](5) NOT NULL,
	[prop_id] [int] NOT NULL,
	[abs_subdv_cd] [varchar](10) NULL,
	[geo_id] [varchar](50)  NULL,
	[legal_desc] [varchar](255) NULL,
	[owner_name] [varchar](70) NULL,
	[curr_appraised_val] [numeric](14, 0) NULL,
	[prev_appraised_val] [numeric](14, 0) NULL,
	[gain_loss] [numeric](15, 0) NULL,
	[hood_cd] [varchar](10) NULL,
	[imprv_type_cd] [char](5) NULL,
	[pct_change] [numeric](18, 8) NULL,
	[dba] [varchar](50) NULL,
	[sic_code_desc] [varchar](50) NULL,
	[last_appr_init] [varchar](5) NULL,
	[cat_appr_init] [varchar](5) NULL,
	[rendered_flag] [varchar](1) NULL
)

--------------------------------------------------------------------------------
-- END - Standard Gain Loss Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - ARB Reports (Task 3383)
--------------------------------------------------------------------------------

CREATE TABLE ##arb_rpt_panel_decisions(
	[dataset_id] [bigint] NOT NULL,
	[owner_name] [varchar](70) NULL,
	[agent_name] [varchar](70) NULL,
	[prop_id] [int] NOT NULL,
	[geo_id] [varchar](50) NULL,
	[legal_desc] [varchar](255) NULL,
	[prop_val_yr] [numeric](4, 0) NOT NULL,
	[case_id] [int] NOT NULL,
	[appraiser_nm] [varchar](40) NULL,
	[situs] [varchar](83) NULL,
	[first_decision] [varchar](50) NULL,
	[second_decision] [varchar](50) NULL,
	[prot_second_motion_decision_dt] [datetime] NULL,
	[prot_first_motion_decision_dt] [datetime] NULL,
	[prot_first_motion_decision_cd] [varchar](10) NULL,
	[prot_second_motion_decision_cd] [varchar](10) NULL,
	[meeting_appraiser_nm] [varchar](40) NULL,
	[property_use_cd] [varchar](10) NULL
)

CREATE TABLE ##arb_rpt_multi_protest_listing(
	[datasetID] [bigint] NOT NULL,
	[prop_id] [int] NOT NULL,
	[prop_val_yr] [numeric](18, 0) NOT NULL,
	[case_id] [int] NOT NULL,
	[prot_status] [varchar](10) NULL,
	[prot_type] [varchar](10) NULL,
	[prot_by_type] [varchar](10) NULL,
	[prot_hearing_start_dt] [datetime] NULL
)

CREATE TABLE ##arb_rpt_inquiry_report(
	[datasetID] [bigint] NOT NULL,
	[pacs_user_id] [int] NOT NULL,
	[file_as_name] [varchar](70) NULL,
	[appraised_val] [numeric](14, 0) NULL,
	[prop_id] [int] NOT NULL,
	[prop_val_yr] [numeric](4, 0) NOT NULL,
	[case_id] [int] NOT NULL,
	[inq_type] [varchar](10) NULL,
	[inq_status] [varchar](10) NULL,
	[appraiser_meeting_date_time] [datetime] NULL,
	[geo_id] [varchar](50) NULL,
	[appraiser_nm] [varchar](40) NULL,
	[meeting_appraiser_nm] [varchar](40) NULL,
	[property_use_cd] [varchar](10) NULL,
	[owner_id] [int] NOT NULL
)

CREATE TABLE ##arb_rpt_protest_sign_in_list(
	[dataset_id] [bigint] NOT NULL,
	[pacs_user_id] [int] NOT NULL,
	[owner_name] [varchar](70) NULL,
	[agent_name] [varchar](70) NULL,
	[prot_type] [varchar](10) NULL,
	[prop_id] [int] NOT NULL,
	[legal_desc] [varchar](255) NULL,
	[prop_val_yr] [numeric](4, 0) NOT NULL,
	[case_id] [int] NOT NULL,
	[docket_start_year] [int] NULL,
	[docket_start_month] [int] NULL,
	[docket_start_day] [int] NULL,
	[docket_start_hour] [int] NULL,
	[docket_start_minute] [int] NULL,
	[prot_assigned_panel] [varchar](10) NULL,
	[meeting_appraiser_nm] [varchar](40) NULL,
	[property_use_cd] [varchar](10) NULL
)

CREATE TABLE ##arb_rpt_protest_report(
	[dataset_id] [bigint] NOT NULL,
	[pacs_user_id] [int] NOT NULL,
	[file_as_name] [varchar](70) NULL,
	[appraised_val] [numeric](14, 0) NULL,
	[prop_id] [int] NOT NULL,
	[prop_val_yr] [numeric](4, 0) NOT NULL,
	[case_id] [int] NOT NULL,
	[prot_type] [varchar](10) NULL,
	[prot_status] [varchar](10) NULL,
	[prot_assigned_panel] [varchar](10) NULL,
	[appraiser_meeting_date_time] [datetime] NULL,
	[docket_start_date_time] [datetime] NULL,
	[geo_id] [varchar](50) NULL,
	[appraiser_nm] [varchar](40) NULL,
	[meeting_appraiser_nm] [varchar](40) NULL,
	[owner_id] [int] NOT NULL,
	[sup_num] [int] NOT NULL,
	[property_use_cd] [varchar](10) NULL,
	[agent_list] [varchar](2048) NULL
)

CREATE TABLE ##arb_protest_listing(
	[dataset_id] [bigint] NOT NULL,
	[case_id] [int] NOT NULL,
	[prop_val_yr] [numeric](4, 0) NOT NULL,
	[prop_id] [int] NOT NULL,
	[sup_num] [int] NOT NULL,
	[owner_id] [int] NOT NULL,
	[pct_ownership] [numeric](13, 10) NULL,
	[geo_id] [varchar](50) NULL,
	[prop_type_cd] [varchar](5) NULL,
	[legal_desc] [varchar](255) NULL,
	[situs] [varchar](255) NULL,
	[entities] [varchar](50) NULL,
	[exemption] [varchar](50) NULL,
	[prot_taxpayer_comments] [varchar](1024) NULL,
	[prev_other] [numeric](14, 0) NULL,
	[prev_ag_mkt] [numeric](14, 0) NULL,
	[prev_ag_use] [numeric](14, 0) NULL,
	[prev_land] [numeric](14, 0) NULL,
	[prev_imprv] [numeric](14, 0) NULL,
	[prev_appraised] [numeric](14, 0) NULL,
	[prev_cap] [numeric](14, 0) NULL,
	[prev_assessed] [numeric](14, 0) NULL,
	[curr_other] [numeric](14, 0) NULL,
	[curr_ag_mkt] [numeric](14, 0) NULL,
	[curr_ag_use] [numeric](14, 0) NULL,
	[curr_land] [numeric](14, 0) NULL,
	[curr_imprv] [numeric](14, 0) NULL,
	[curr_appraised] [numeric](14, 0) NULL,
	[curr_cap] [numeric](14, 0) NULL,
	[curr_assessed] [numeric](14, 0) NULL,
	[diff_other] [numeric](14, 0) NULL,
	[diff_ag_mkt] [numeric](14, 0) NULL,
	[diff_ag_use] [numeric](14, 0) NULL,
	[diff_land] [numeric](14, 0) NULL,
	[diff_imprv] [numeric](14, 0) NULL,
	[diff_appraised] [numeric](14, 0) NULL,
	[diff_cap] [numeric](14, 0) NULL,
	[diff_assessed] [numeric](14, 0) NULL,
	[prot_assigned_panel] [varchar](10) NULL,
	[docket_start_date_time] [datetime] NULL,
	[prot_type] [varchar](10) NULL,
	[prot_status] [varchar](10) NULL,
	[meeting_appraiser_nm] [varchar](40) NULL,
	[prev_market] [numeric](18, 0) NULL,
	[curr_market] [numeric](18, 0) NULL,
	[diff_market] [numeric](18, 0) NULL,
	[property_use_cd] [varchar](10) NULL
)

--------------------------------------------------------------------------------
-- END - ARB Reports (Task 3383)
--------------------------------------------------------------------------------



--------------------------------------------------------------------------------
-- BEGIN - Daily Summary Report
--------------------------------------------------------------------------------

create table ##daily_summary_payment_summary
(
dataset_id	int,
tender_type_desc varchar(255),
payment_total numeric(14,2)
)

create table ##daily_summary_payment_breakdown_levy
(
dataset_id	int,
levy_description varchar(103),
payment_total numeric(14,2)
)

create table ##daily_summary_payment_breakdown_assessment
(
dataset_id	int,
assessment_description varchar(70),
payment_total numeric(14,2)
)

create table ##daily_summary_payment_breakdown_fee
(
dataset_id	int,
fee_description varchar(60),
payment_total numeric(14,2)
)

create table ##daily_summary_payment_total
(
dataset_id	int,
penalty numeric(14,2),
interest numeric(14,2),
escrow numeric(14,2),
reet numeric(14,2),
reet_penalty numeric(14,2),
reet_interest numeric(14,2),
overpayment_credit numeric(14,2),
variance numeric(14,2),
total numeric(14,2),
)

--------------------------------------------------------------------------------
-- END - Daily Summary Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Mass Update Tax Areas Report
--------------------------------------------------------------------------------

CREATE TABLE [dbo].[##MassUpdateTaxAreasSpecialAssessments]
(
	[DataSet_ID] [int],
	[prop_id] [int] NOT NULL,
	[owner] [varchar](70) NULL
)

--------------------------------------------------------------------------------
-- END - Mass Update Tax Areas Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Assessment Roll Report
--------------------------------------------------------------------------------

create table ##assessment_report
(
dataset_id			int,
year				numeric(4,0),
sup_num				int,
county_name			varchar(30),
report_date			datetime,
property_type_list	varchar(50),
totals_only			bit,
title				varchar(30)
)

create table ##assessment_report_prop_assoc
(
dataset_id	int,
prop_id		int,
sup_num		int,
prop_val_yr	numeric(4)
)

create table ##assessment_report_detail
(
dataset_id				int,
prop_id					int,
type					varchar(10),
exempt_sub_type_cd		varchar(10),
exempt_level			varchar(10),
tax_area_id				int,
tax_area_number			varchar(23),
legal_acreage			numeric(14,4),
land_val				numeric(14,0),
ag_use_val			numeric(14,0),
imp_val					numeric(14,0),
pp_val					numeric(14,0),
ex_local_assd_val		numeric(14,0),
snr_dsbl_tot_frz		numeric(14,0),
taxable_val				numeric(14,0),
total_nc				numeric(14,0),
prop_type_cd			char(5)
)


create table ##assessment_report_totals
(
dataset_id				int,
exempt_type_cd			varchar(10),
prop_ct					int,
legal_acreage			numeric(14,4),
land_val				numeric(14,0),
imp_val					numeric(14,0),
pp_val					numeric(14,0),
ex_local_assd_val		numeric(14,0),
snr_dsbl_tot_frz		numeric(14,0),
taxable_val				numeric(14,0),
total_nc				numeric(14,0)
)

--------------------------------------------------------------------------------
-- END - Assessment Roll Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Levy Collections Recap Report
--------------------------------------------------------------------------------
CREATE TABLE [##levy_collections_recap_report]
(
	[dataset_id] [int] NOT NULL,
	[levy_display_text] [varchar](110) NULL,
	[year_one_heading] [varchar](5) NULL,
	[year_one_amount] [numeric](24,2) NULL,
	[year_two_heading] [varchar](5) NULL,
	[year_two_amount] [numeric](24,2) NULL,
	[year_three_heading] [varchar](5) NULL,
	[year_three_amount] [numeric](24,2) NULL,
	[year_four_heading] [varchar](5) NULL,
	[year_four_amount] [numeric](24,2) NULL,
	[year_five_heading] [varchar](5) NULL,
	[year_five_amount] [numeric](24,2) NULL,
	[year_six_heading] [varchar](5) NULL,
	[year_six_amount] [numeric](24,2) NULL,
	[year_seven_heading] [varchar](5) NULL,
	[year_seven_amount] [numeric](24,2) NULL,
	[year_eight_heading] [varchar](5) NULL,
	[year_eight_amount] [numeric](24,2) NULL,
	[year_nine_heading] [varchar](5) NULL,
	[year_nine_amount] [numeric](24,2) NULL,
	[year_ten_heading] [varchar](5) NULL,
	[year_ten_amount] [numeric](24,2) NULL,
	[adjustment_amount] [numeric](24,2) NULL
)

--------------------------------------------------------------------------------
-- END - Levy Collections Recap Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Assessment Collections Recap Report
--------------------------------------------------------------------------------

CREATE TABLE [##assessment_collections_recap_report]
(
	[dataset_id] [int] NOT NULL,
	[assessment_display_text] [varchar](210) NULL,
	[year_one_heading] [varchar](5) NULL,
	[year_one_amount] [numeric](24,2) NULL,
	[year_two_heading] [varchar](5) NULL,
	[year_two_amount] [numeric](24,2) NULL,
	[year_three_heading] [varchar](5) NULL,
	[year_three_amount] [numeric](24,2) NULL,
	[year_four_heading] [varchar](5) NULL,
	[year_four_amount] [numeric](24,2) NULL,
	[year_five_heading] [varchar](5) NULL,
	[year_five_amount] [numeric](24,2) NULL,
	[year_six_heading] [varchar](5) NULL,
	[year_six_amount] [numeric](24,2) NULL,
	[year_seven_heading] [varchar](5) NULL,
	[year_seven_amount] [numeric](24,2) NULL,
	[year_eight_heading] [varchar](5) NULL,
	[year_eight_amount] [numeric](24,2) NULL,
	[year_nine_heading] [varchar](5) NULL,
	[year_nine_amount] [numeric](24,2) NULL,
	[year_ten_heading] [varchar](5) NULL,
	[year_ten_amount] [numeric](24,2) NULL,
	[adjustment_amount] [numeric](24,2) NULL
)

--------------------------------------------------------------------------------
-- END - Assessment Collections Recap Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Reet Collections Recap Report
--------------------------------------------------------------------------------

CREATE TABLE [##reet_collections_recap_report]
(
	[dataset_id] [int] NOT NULL,
	[tax_district_desc] [varchar] (50) NULL,
	[reet_description] [varchar](50) NULL,
	[amount_collected] [numeric](25,2) NULL,
	[value_type] [varchar] (20) NULL,
	[admin_fee] [bit] NOT NULL
)

--------------------------------------------------------------------------------
-- END - Reet Collections Recap Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - REET Rate Summary Report and REET Rate Detail Report
--------------------------------------------------------------------------------

CREATE TABLE [##reet_rate_summary] (
	[rate_type_cd] varchar(10) NULL,
	[description] varchar(50) NULL,
	[begin_date] datetime NULL,
	[end_date] datetime NULL,
	[reet_rate] numeric(5,2) NOT NULL,
	[dataset_id] [bigint] NOT NULL,
	[min_sale_price] numeric(14,0) NULL,
	[max_sale_price] numeric(14,0)
)

CREATE TABLE [##reet_rate_detail_tax_area] (
	[tax_area_number] varchar(23) NOT NULL,
	[dataset_id] [bigint] NOT NULL
)

CREATE TABLE [##reet_rate_detail_uga] (
	[uga_indicator_cd] varchar(10) NOT NULL,
	[dataset_id] [bigint] NOT NULL
)

CREATE TABLE [##reet_rate_detail_uga_desc] (
	[uga_indicator_cd] varchar(10) NOT NULL,
	[uga_description] varchar(50) NOT NULL,
	[percentage] numeric(5,2) NULL,
	[dataset_id] [bigint] NOT NULL
)

--------------------------------------------------------------------------------
-- END - REET Rate Summary Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Report Captured Value
--------------------------------------------------------------------------------

create table ##report_captured_value 
(
	dataset_id int,
	as_of_sup_num int,
	[year] numeric(4, 0),
	tax_district_id int,
	levy_cd varchar(10),
	tax_area_id int,
	appraised_classified numeric(16, 0),
	appraised_non_classified numeric(16, 0),
	real_pers_value numeric(16, 0),
	state_value numeric(16, 0),
	senior_value numeric(16, 0),
	annex_value numeric(16, 0),
	new_const_value numeric(16, 0),
	taxable_value numeric(16, 0),
	real_value numeric(16, 0),
	personal_value numeric(16, 0),
	senior_real_value numeric(16, 0),
	senior_personal_value numeric(16, 0),
	exempted_senior_value numeric(14, 0),
	is_joint_district_value bit
)

CREATE TABLE ##report_captured_value_by_fund (
	dataset_id int NOT NULL,
	[year] numeric(4, 0) NOT NULL,
	as_of_sup_num int NOT NULL,
	tax_district_id int NOT NULL,
	levy_cd varchar(10) NOT NULL,
	fund_id int NOT NULL,
	tax_area_id int NOT NULL,
	appraised_classified numeric(16, 0),
	appraised_non_classified numeric(16, 0),
	real_pers_value numeric(14, 0) NULL,
	state_value numeric(14, 0) NULL,
	senior_value numeric(14, 0) NULL,
	annex_value numeric(14, 0) NULL,
	new_const_value numeric(14, 0) NULL,
	taxable_value numeric(14, 0) NULL,
	is_joint_district_value bit NOT NULL DEFAULT ((0)),
	real_value numeric(14, 0) NULL,
	personal_value numeric(14, 0) NULL,
	senior_real_value numeric(14, 0) NULL,
	senior_personal_value numeric(14, 0) NULL,
	exempted_senior_value numeric(14, 0) NULL,
	CONSTRAINT CPK_report_captured_value_by_fund PRIMARY KEY CLUSTERED 
		(dataset_id, as_of_sup_num, [year], tax_district_id, levy_cd, fund_id, is_joint_district_value, tax_area_id)
)

--------------------------------------------------------------------------------
-- END - Report Captured Value
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Assessment/Taxroll Reconciliation
--------------------------------------------------------------------------------

CREATE TABLE ##AssessmentTaxrollReconciliationReport
(
	dataset_id int,
	[year] numeric(4, 0),
	tax_area_id int,
	tax_area_number varchar(23),
	levy_rate numeric(13, 10),
	senior_levy_rate numeric(13, 10),
	beginning_sup_num int,
	beginning_assessed_value numeric(16, 0),
	beginning_taxable_value numeric(16, 0),
	beginning_exemptions numeric(16, 0),
	beginning_tax_amount numeric(16, 2),
	ending_sup_num int,
	ending_assessed_value numeric(16, 0),
	ending_taxable_value numeric(16, 0),
	ending_exemptions numeric(16, 0),
	ending_tax_amount numeric(16, 2)
)

--------------------------------------------------------------------------------
-- END - Assessment/Taxroll Reconciliation
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Report Totals
--------------------------------------------------------------------------------

create table ##totals_report
(
dataset_id	int,
year		numeric(4,0),
sup_num		int,
county_name	varchar(30),
report_type	varchar(5),
group_type  varchar(5),
report_date	datetime,
heading_line varchar(50)
)

create table ##totals_report_prop_assoc
(
dataset_id	int,
prop_id		int,
sup_num		int,
prop_val_yr	numeric(4),
primary key clustered (dataset_id, prop_val_yr, sup_num, prop_id),
unique nonclustered (dataset_id, prop_val_yr, prop_id)
)

create table ##totals_report_detail
(
dataset_id					int,
group_id					varchar(10),
group_desc					varchar(282),   -- size(tax_area_description) + ' (' + size(tax_area_number) + ')'
sort_option					varchar(30),
total_type					varchar(5),
prop_ct						int,
imprv_hstd_val				numeric(14,0),
imprv_non_hstd_val			numeric(14,0),
total_imprv					numeric(14,0),
land_hstd_val				numeric(14,0),
land_non_hstd_val			numeric(14,0),
curr_use_mkt_hstd_val		numeric(14,0),
curr_use_mkt_non_hstd_val	numeric(14,0),
total_land					numeric(14,0),
pp_non_farm_val			numeric(14,0),
pp_non_farm_ct			numeric(14,0),
pp_farm_val				numeric(14,0),
pp_farm_ct				numeric(14,0),
mineral_val				numeric(14,0),
mineral_ct				numeric(14,0),
auto_val				numeric(14,0),
auto_ct					numeric(14,0),
total_non_real			numeric(14,0),
market_val				numeric(14,0),
curr_use_mkt_val		numeric(14,0),
curr_use_hstd_val		numeric(14,0),
curr_use_non_hstd_val	numeric(14,0),
productivity_loss_val	numeric(14,0),
subtotal_val			numeric(14,0),
frz_imprv_val			numeric(14,0),
frz_land_val			numeric(14,0),
total_frozen			numeric(14,0),
non_frz_imprv_val		numeric(14,0),
non_frz_land_val		numeric(14,0),
non_frz_non_real_val	numeric(14,0),
total_non_frozen		numeric(14,0),
appraised_val			numeric(14,0),
local_assessed_val		numeric(14,0),
local_assessed_ct		int,
total_local_assessed	numeric(14,0),
net_taxable				numeric(14,0),
state_assessed_pp_val	numeric(14,0),
state_assessed_real_val	numeric(14,0),
state_assessed_total_val	numeric(14,0),
state_assessed_pp_ct		int,
state_assessed_real_ct		int,
state_assessed_total_ct		int,
senior_taxable				numeric(14,0),
non_senior_taxable			numeric(14,0),
farm_taxable				numeric(14,0),
non_farm_taxable			numeric(14,0),
new_construction_val		numeric(14,0),
pp_leased_land_ct		numeric(14,0),
pp_leased_land_val		numeric(14, 0),
levy_exempts_senior			bit,
levy_exempts_farm			bit,
)

create table ##totals_report_detail_exemption
(
dataset_id				int,
group_id				varchar(10),
group_desc					varchar(282),   -- size(tax_area_description) + ' (' + size(tax_area_number) + ')'
total_type				varchar(5),
exempt_type_cd			varchar(10),
exempt_sub_type_cd		varchar(10),
exempt_level			varchar(10),
exempt_ct				int,
exempt_val				numeric(14,0)
)

create table ##totals_tax_area_report_detail
(
	dataset_id        int,
	tax_area_id       int,              
	tax_area_number   varchar(23),
	real              numeric(14,0),
	real_utils        numeric(14,0),
	personal          numeric(14,0),
	pers_utils        numeric(14,0),
	total             numeric(14,0),
	nc                numeric(14,0),
	annexation        numeric(14,0),
	real_exempt       numeric(14,0),
	personal_exempt   numeric(14,0),
	personal_snr_exempt   numeric(14,0),
	sort_option				varchar(30)
)

--------------------------------------------------------------------------------
-- END - Report Totals
--------------------------------------------------------------------------------

create table ##tax_due_calc_bill
(
	[dataset_id] int not null,
	[bill_id] int not null,
	[year] numeric(4,0) not null,
	[sup_num] int not null,
	[prop_id] int not null,
	[initial_amount_due] numeric(14,2) not null,
	[current_amount_due] numeric(14,2) not null,
	[amount_paid] numeric(14,2) not null,
	[is_active] bit not null,
	[bill_type] varchar(5) null,
	[effective_due_date] datetime null,
	[statement_id] int null,
	[payment_status_type_cd] varchar(10) null,

	primary key clustered (dataset_id, bill_id)
	with fillfactor = 100
)

create table ##tax_due_calc_fee
(
	[dataset_id] int not null,
	[fee_id] int not null,
	[year] numeric(4,0) not null,
	[initial_amount_due] numeric(14,2) not null,
	[current_amount_due] numeric(14,2) not null,
	[amount_paid] numeric(14,2) not null,
	[fee_type_cd] varchar(50) null,
	[effective_due_date] datetime null,
	[statement_id] int null,
	[payment_status_type_cd] varchar(10) null,

	primary key clustered (dataset_id, fee_id)
	with fillfactor = 100
)

create table ##tax_due_calc_bill_payments_due
(
	[dataset_id] int not null,
	[bill_id] int not null,
	[payment_id] int not null,
	[amt_penalty] numeric(14,2) not null,
	[amt_interest] numeric(14,2) not null,
	[amount_due] numeric(14,2) not null,
	[amount_paid] numeric(14,2) not null,
	[due_date] datetime null,
	[amt_bond_interest] numeric(14,2) not null,
	[total_due_as_of_posting] as ((([amount_due]-[amount_paid])+[amt_penalty])+[amt_interest]+[amt_bond_interest]),
	[is_h1_payment] bit not null,
	[is_delinquent] bit not null,

	primary key clustered (dataset_id, bill_id, payment_id)
	with fillfactor = 100
)

create table ##tax_due_calc_fee_payments_due
(
	[dataset_id] int not null,
	[fee_id] int not null,
	[payment_id] int not null,
	[amt_penalty] numeric(14,2) not null,
	[amt_interest] numeric(14,2) not null,
	[amount_due] numeric(14,2) not null,
	[amount_paid] numeric(14,2) not null,
	[due_date] datetime null,
	[amt_bond_interest] numeric(14,2) not null,
	[total_due_as_of_posting] as ((([amount_due]-[amount_paid])+[amt_penalty])+[amt_interest]+[amt_bond_interest]),
	[is_h1_payment] bit not null,
	[is_delinquent] bit not null,

	primary key clustered (dataset_id, fee_id, payment_id)
	with fillfactor = 100
)

create table ##tax_due_calc_overpayment_credit
(
	dataset_id int not null,
	overpmt_credit_id int not null,

	year numeric(4,0) not null,
	prop_id int not null,
	owner_id int not null,
	
	amount_base numeric(14,2) not null,
	amount_paid numeric(14,2) not null,

	primary key clustered (dataset_id, overpmt_credit_id)
	with fillfactor = 100
)

create table ##fee_statement_report
(
	[dataset_id] [int] NOT NULL
	,[fee_id] [int] NOT NULL
	,[fee_type_cd] [varchar](10)
	,[fee_type_desc] [varchar](60)
	,[current_amount_due] [numeric](14,2)
	,[amount_paid] [numeric](14,2)
	,[penalty_and_interest] [numeric](14,2)
	,[balance_due] [numeric](14,2)
	,[fee_create_date] [datetime]
	,tax_cert_num [int] 
	,ref_num [varchar](30)
	,fee_assoc_id [int]
	,fee_assoc_type [varchar](4)
	,geo_id [varchar](50)
	,legal_desc [varchar](255)
	,tax_cert_prop_id [int]
)


create table ##taxroll_reconciliation_title
(
	[dataset_id] [int] NOT NULL,
	[title] [varchar](255) NOT NULL,
	[page_key] [varchar](255) NOT NULL
)

create table ##taxroll_reconciliation_detail
(
	[dataset_id] [int] NOT NULL,
	[page_key] [varchar](255) NOT NULL,
	[description] [varchar](110) NULL,
	[account_number] varchar(255) NULL,
	[tax_collection_amount] numeric(14,2) NULL,
	[gl_balance_amount] numeric(14,2) NULL
)

CREATE TABLE [##wash_tax_roll]
(
	[dataset_id] int not null, 
	[tax_area_id] int, 
	[tax_area_number] varchar(23),
	[year] numeric(4,0),
	[prop_id] int,
	[sup_num] int,
	[owner_id] int,
	[owner_name] varchar(70),
	[legal_desc] varchar(510),
	[prop_type_cd] varchar(10),
	[prop_type_desc] varchar(50),
	[taxable_classified] numeric(14,0),
	[taxable_non_classified] numeric(14,0),
	[levy_taxable_val] numeric(14,0),
	[tax_district_id] int,
	[tax_district_desc] varchar(50),
	[priority] int,
	[levy_cd] varchar(10),
	[fund_number] numeric(14, 0),
	[levy_exempts_classified] bit,
	[levy_rate] numeric(13,10),
	[total_tax] numeric(14,2)
)

CREATE TABLE [##tax_roll_details]
(
 [dataset_id] int not null, 
 [tax_area_number] varchar(25),
 [year] numeric(4,0),
 [prop_id] int,
 [owner_name] varchar(70),
 [legal_desc] varchar(520) ,
 [prop_type_desc] varchar(50),
 [taxable_classified] numeric(14,0),
 [taxable_non_classified] numeric(14,0),
 [total_taxable_val] numeric(15,0),
 [priority] int,
 [tax_district_desc] varchar(50),
 [levy_code_desc] varchar(70),
 [levy_taxable_val] numeric(14,0),
 [levy_rate] numeric(13,10),
 [total_tax] numeric(14,2)
)

CREATE TABLE [##tax_roll_totals]
(
 [dataset_id] int not null, 
 [tax_area_number] varchar(25),
 [year] numeric(4,0),
 [priority] int,
 [tax_district_desc] varchar(50),
 [levy_code_desc] varchar(70),
 [number_of_props] int,
 [levy_total_taxable_val] numeric(20,0),
 [total_tax_due] numeric(20,2)
)

CREATE TABLE [##export_paid_properties]
(
 [dataset_id] int not null, 
 [prop_id] int not null
)

--------------------------------------------------------------------------------
-- BEGIN - Total Taxes Levied Report
--------------------------------------------------------------------------------

create table ##levy_cert_taxes_levied_report
(
	dataset_id int,
	[year] numeric(4, 0),
	tax_district_id int,
	tax_area_id int,
	tax_district_name varchar(50),
	tax_area_number varchar(23),
	real_taxes numeric(16, 4),
	personal_taxes numeric(16, 4),
	state_taxes numeric(16, 4)
)

--------------------------------------------------------------------------------
-- END - Total Taxes Levied Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Assessment Levies Due Report
--------------------------------------------------------------------------------

create table ##AssessmentLeviesDueReport
(
	ID int identity(1,1),
	dataset_id int,
	as_of_sup_num int,
	[year] numeric(4, 0),
	tax_district_id int,
	levy_cd varchar(10),
	tax_district_type varchar(100),
	levy_type varchar(100),
	levy_category varchar(100),
	tax_district_desc varchar(50),
	levy_description varchar(50),
	valuation_no_timber numeric(16, 0),
	levy_rate numeric(13, 10),
	total_tax numeric(16, 2),
	timber_assessed_full numeric(16, 2),
	timber_assessed_half numeric(16, 2),
	timber_assessed_roll numeric(16, 2),
	shift numeric(14,2),
	diverted_amount numeric(14,2),
	isNew bit,
	comment varchar(255),
	senior_levy_rate numeric(13, 10),
	senior_valuation numeric(16, 0)
)


--------------------------------------------------------------------------------
-- END - Assessment Levies Due Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Escrow Collections Activity Report
--------------------------------------------------------------------------------

create table ##EscrowCollectionsActivityReport 
(
	dataset_id int,
	taxpayer_id int,
	taxpayer_name varchar(70),
	prop_id int,
	escrow_id int,
	transaction_id int,
	payment_id int,
	batch_id int,
	[description] varchar(255),
	balance_date datetime,
	paid_date datetime,
	receipt_num int,
	[year] numeric(4, 0),
	transaction_type varchar(25),
	amount_paid numeric(14, 2)
)

--------------------------------------------------------------------------------
-- END - EscrowCollections Activity Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Escrow Available Report
--------------------------------------------------------------------------------

create table ##escrow_available_report 
(
	dataset_id int,
	tax_year numeric(4,0),
	prop_id int,
	taxpayer_name varchar(70),
	escrow_type varchar(30),
	escrow_collected numeric(14,2),
	amount_due numeric(14,2),
	diff numeric(14,2)
)

--------------------------------------------------------------------------------
-- END - Escrow Available Report
--------------------------------------------------------------------------------

create table ##fee_collections_activity
(
	dataset_id int,
	balance_dt datetime,
	batch_id int,
	fee_dt datetime,
	fee_id int,
	fee_type_cd varchar(10),
	fee_type_desc varchar(60),
	assigned_to varchar(70),
	[year] numeric(4, 0),
	fee_amt decimal(14, 2)
)

--------------------------------------------------------------------------------
-- BEGIN - Improvement Schedules Printing
--------------------------------------------------------------------------------

CREATE TABLE [##imprv_sched_mult_assoc]
(
[dataset_id] [bigint] NOT NULL,  
[imprv_sched_value_type] char(1) NULL, 
[imprv_det_meth_cd] char(5) NOT NULL, 
[imprv_det_type_cd] char(10) NOT NULL, 
[imprv_det_class_cd] char(10) NOT NULL, 
[mult_type_desc] varchar(20) NULL, 
[imprv_use_mult] char(1) NULL, 
[imprv_sched_mult_type] char(2) NULL, 
[masonary_local_mult] numeric(6,4) NULL, 
[masonary_cost_mult] numeric(6,4) NULL, 
[frame_local_mult] numeric(6,4) NULL, 
[frame_cost_mult] numeric(6,4) NULL, 
[manm_local_mult] numeric(6,4) NULL, 
[manm_cost_mult] numeric(6,4) NULL, 
[mm_masonary_local_mult] numeric(6,4) NULL, 
[mm_masonary_cost_mult] numeric(6,4) NULL, 
[mm_frame_local_mult] numeric(6,4) NULL, 
[mm_frame_cost_mult] numeric(6,4) NULL, 
[lm_local_value] numeric(6,4) NULL, 
[imprv_sched_mult_form] char(1) NULL, 
[cm_cost_value] numeric(6,4) NULL, 
)

CREATE TABLE [##imprv_sched_mult]
(
[dataset_id] [bigint] NOT NULL,  
[imprv_det_meth_cd] char(5) NOT NULL,
[imprv_det_type_cd] char(10) NOT NULL, 
[imprv_det_class_cd] char(10) NOT NULL, 
[mult] varchar(256) NULL
)

CREATE TABLE [##imprv_sched_details]
(
[dataset_id] [bigint] NOT NULL,  
[i_imprv_det_meth_cd] char(10) NOT NULL, 
[i_imprv_det_type_cd] char(10) NOT NULL, 
[i_imprv_det_class_cd] char(10) NOT NULL, 
[imprv_det_sub_class_cd]	varchar(10) NOT NULL,
[i_imprv_yr] numeric(4,0) NOT NULL, 
[i_imprv_pc_of_base] numeric(5,2) NULL,
[i_imprv_interpolate] char(1) NULL,
[i_imprv_use_mult] char(1) NULL,
[i_imprv_sched_area_type_cd] char(10) NULL, 
[i_imprv_sched_mult_quality_cd] char(10) NULL,
[i_imprv_sched_mult_section_cd] char(10) NULL,
[i_imprv_sched_mult_local_quality_cd] char(10) NULL,
[i_imprv_sched_deprec_cd] char(10) NULL, 
[i_imprv_sched_value_type] char(1) NULL,
[idm_imprv_det_meth_dsc] varchar(50) NULL, 
[idt_imprv_det_typ_desc] varchar(50) NULL,
[isat_imprv_sched_area_type_desc] varchar(100) NULL, 
[idc_imprv_det_cls_desc] varchar(50) NULL, 
[imprv_det_sub_cls_desc] varchar(50) NULL
)

CREATE TABLE [##imprv_sched_mtx_order]
(
[dataset_id] [bigint] NOT NULL,  
[isma_imprv_det_meth_cd] char(5) NOT NULL, 
[isma_imprv_det_type_cd] char(10) NOT NULL, 
[isma_imprv_det_class_cd] char(10) NOT NULL, 
[isma_imprv_yr] numeric(4,0) NOT NULL, 
[isma_matrix_order] int NOT NULL,
[m_matrix_description] varchar(50) NULL
)

CREATE TABLE [##imprv_sched_ranges]
(
[dataset_id] [bigint] NOT NULL,  
[imprv_det_meth_cd] char(5) NOT NULL, 
[imprv_det_type_cd] char(10) NOT NULL, 
[imprv_det_class_cd] char(10) NOT NULL, 
[imprv_yr] numeric(4,0) NOT NULL, 
[range_max] numeric(18,1) NOT NULL,
[range_adj_price] numeric(14,2) NULL
)

CREATE TABLE [##imprv_sched_features]
(
[dataset_id] [bigint] NOT NULL,  
[isa_imprv_det_meth_cd] char(5) NOT NULL, 
[isa_imprv_det_type_cd] char(10) NOT NULL, 
[isa_imprv_det_class_cd] char(10) NOT NULL, 
[isa_imprv_yr] numeric(4,0) NOT NULL,
[iav_imprv_attr_id] int NOT NULL,
[iav_imprv_attr_val_cd] varchar(75) NOT NULL,
[iav_imprv_attr_base_up] numeric(14,2) NULL,
[iav_imprv_attr_up] numeric(14,2) NULL,
[iav_imprv_attr_base_incr] numeric(14,2) NULL,
[iav_imprv_attr_incr] numeric(14,2) NULL,
[iav_imprv_attr_pct] numeric(5,2) NULL,
[a_imprv_attr_desc] varchar(50) NULL
)

CREATE TABLE [##imprv_sched_mtx_details]
(
[dataset_id] [bigint] NOT NULL,
[m_label] varchar(20) NULL,
[m_axis_1] varchar(20) NULL,
[m_axis_2] varchar(20) NULL,
[m_matrix_description] varchar(50) NULL,
[m_operator]  varchar(20) NULL,
[md_axis_1_value] varchar(40) NOT NULL,
[md_axis_2_value] varchar(40) NOT NULL,
[md_cell_value] numeric(16,2) NOT NULL, 
[mad_axis_1_order] int NULL,
[mad_axis_2_order] int NULL,
[isma_imprv_det_meth_cd] char(5) NOT NULL, 
[isma_imprv_det_type_cd] char(15) NOT NULL, 
[isma_imprv_det_class_cd] char(15) NOT NULL, 
[isma_imprv_yr] numeric(4,0) NOT NULL, 
[isma_matrix_id] int NOT NULL,
[isma_adj_factor] numeric(7,4) NOT NULL,
[isma_matrix_order] int NOT NULL
)

CREATE TABLE [##non_captured_arb_values]
(
[dataset_id] [bigint] NOT NULL,
[prop_id] int NOT NULL,
[market] numeric(14,0) NULL,
[legal_desc] varchar(255) NULL,
[hood_cd] varchar(10) NULL,
[ref_id2]  varchar(50) NULL,
[geo_id] varchar(50) NULL,
[file_as_name] varchar(70) NULL
) 

CREATE TABLE ##tax_summary_by_taxpayer
(
	dataset_id int,
	owner_id int,
	tax_payer varchar(61),
	prop_id int,
	legal_desc varchar(255),
	statement_id int,
	bill_type varchar(2),
	bill_desc varchar(50),	
	year numeric(14, 0),
	base_tax_due numeric(14, 2),
	P_I_due numeric(14, 2),
	total_due numeric(14, 2)
)

create table ##eod_batch_report
(
	[dataset_id] int,
	[batch_desc] varchar(255),
	[batch_create_dt] datetime,
	[prop_id] int,
	[appraiser_nm] varchar(40),
	[abs_subdv_cd] varchar(10),
	[geo_id] varchar(50),
	[assessed_val] int,
	[assessed_val_prev] int,
	[assessed_val_diff] int,
	[recalc_flag] char(1)
)

CREATE TABLE ##wa_payout_amount_due(
 dataset_id INT NOT NULL,
 [payout_agreement_id] [int] NOT NULL,
 [payment_date] [datetime] NOT NULL,
 [base_amount] [numeric](14, 2) NULL,
 [bond_interest] [numeric](14, 2) NULL,
 [delinquent] [numeric](14, 2) NULL,
 [penalty] [numeric](14, 2) NULL,
 [total_due] [numeric](14, 2) NULL,
 [collection_fee][numeric](14, 2) NULL,
 CONSTRAINT [CPK_wa_payout_amount_due] PRIMARY KEY CLUSTERED 
(
 dataset_id ASC,
 [payout_agreement_id] ASC,
 [payment_date] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON, FILLFACTOR = 100) ON [PRIMARY]
) ON [PRIMARY]

--------------------------------------------------------------------------------
-- END - Improvement Schedules Printing
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Delinquent Tax Roll Report
--------------------------------------------------------------------------------

CREATE TABLE [dbo].[##delinquent_tax_roll_report_idlist] (
  [dataset_id] int NOT NULL,
  [trans_group_id] int NOT NULL
)
ON [PRIMARY]

CREATE CLUSTERED INDEX [##delinquent_tax_roll_report_idlist_idx]
ON [dbo].[##delinquent_tax_roll_report_idlist]
  (dataset_id ASC, trans_group_id ASC)
ON [PRIMARY]


CREATE TABLE [dbo].[##delinquent_tax_roll_report] (
  [dataset_id] int NOT NULL,
  [item_id] int NOT NULL,
  [prop_id] int NULL,
  [year] numeric(4, 0) NULL,
  [amount_due] numeric(14, 2) NOT NULL,
  [penalty] numeric(14, 2) NOT NULL,
  [interest] numeric(15, 2) NULL,
  [prop_type_cd] char(5) NOT NULL,
  [file_as_name] varchar(70) NULL,
  [legal_desc] varchar(255) NULL
)
ON [PRIMARY]

CREATE TABLE [dbo].[##delinquent_tax_roll_report_total] (
  [dataset_id] int NOT NULL,
  [description] varchar(300) NULL,
  [year] numeric(4, 0) NULL,
  [num_of_bills] int NULL,
  [base_tax_due] numeric(38, 2) NULL,
  [real_tax_due] numeric(38, 2) NULL,
  [mobile_tax_due] numeric(38, 2) NULL,
  [mineral_tax_due] numeric(38, 2) NULL,
  [personal_tax_due] numeric(38, 2) NULL,
  [auto_tax_due] numeric(38, 2) NULL,
  [levy_cd] varchar(50) NULL,
  [priority] int NULL,
  [type] varchar(10) NULL
)
ON [PRIMARY]
--------------------------------------------------------------------------------
-- END - Delinquent Tax Roll Report
--------------------------------------------------------------------------------

-- Mass Update Legal Descriptions

create table ##mass_update_legal_description
(
	[year] [numeric](4,0) NOT NULL,
	[sup_num] [int] NOT NULL,
	[prop_id] [int] NOT NULL,
	[legal_desc] [varchar](max) NULL,
	 CONSTRAINT [CPK_mass_update_legal_description] PRIMARY KEY CLUSTERED 
	(
	 [year] ASC,
	 [sup_num] ASC,
	 [prop_id] ASC
	)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON, FILLFACTOR = 100) ON [PRIMARY]
) ON [PRIMARY]

-- End Mass Update Legal Descriptions

-- Certification of Value Letter Report

create table [##certification_of_value_supp_assoc]
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	prop_id int not null,
	tax_district_id int not null,
	CONSTRAINT CPK_certification_of_value_supp_assoc PRIMARY KEY CLUSTERED 
		(dataset_id, [year], sup_num, prop_id, tax_district_id)
) ON [PRIMARY]

create nonclustered index IDX_certification_of_value_supp_assoc_year_sup_num_prop_id
on ##certification_of_value_supp_assoc ([year], sup_num, prop_id)
with (fillfactor = 90)

create table [##certification_of_value_grouping]
(
	dataset_id int not null,
	tax_district_id int not null,
	group_id int not null identity(1,1),
	tax_areas varchar(4000) null,
	CONSTRAINT CPK_certification_of_value_grouping PRIMARY KEY CLUSTERED 
		(dataset_id, group_id, tax_district_id)
) ON [PRIMARY]

create table [##certification_of_value_levy_description]
(
	dataset_id int not null,
	tax_district_id int not null,
	group_id int not null,
	levy_descriptions varchar(4000) null,
	CONSTRAINT CPK_certification_of_value_levy_description PRIMARY KEY CLUSTERED 
		(dataset_id, group_id, tax_district_id)
) ON [PRIMARY]

create table [##certification_of_value_letter]
(
	dataset_id int not null,
	tax_district_id int not null,
	group_id int not null,
	tax_district_name varchar(70) null,
	tax_district_desc varchar(50) null,
	tax_district_addr1 varchar(60) null,
	tax_district_addr2 varchar(60) null,
	tax_district_addr3 varchar(60) null,
	tax_district_csz varchar(80) null,
	year numeric(4,0) not null,
	levy_descriptions varchar(4000) null,
	email_address varchar(128) null,
	priority int not null,
	sup_num int not null,
	CONSTRAINT CPK_certification_of_value_letter PRIMARY KEY CLUSTERED 
		(dataset_id, tax_district_id, group_id)
) ON [PRIMARY]

create table [##certification_of_value_letter_info]
(
	dataset_id int not null,
	assessor_name varchar(50) null,
	office_name varchar(50) null,
	addr_line1 varchar(50) null,
	addr_line2 varchar(50) null,
	addr_line3 varchar(50) null,
	city varchar(50) null,
	state varchar(2) null,
	zip varchar(50) null,
	phone varchar(25) null,
	fax varchar(25) null,
	url varchar(50) null,
	levy_year numeric(4,0) null,
	tax_year numeric(4,0) null,
	CONSTRAINT CPK_certification_of_value_letter_info PRIMARY KEY CLUSTERED 
		(dataset_id)
) ON [PRIMARY]

create table [##certification_of_value_letter_newly_annexed]
(
	dataset_id int not null,
	tax_area_id int not null,
	CONSTRAINT CPK_certification_of_value_letter_newly_annexed PRIMARY KEY CLUSTERED 
		(dataset_id, tax_area_id)
) ON [PRIMARY]

create table [##certification_of_value_letter_tax_area_info]
(
	dataset_id int not null,
	tax_district_id int not null,
	group_id int not null,
	tax_area_id int not null,
	tax_area_number varchar(23) not null,
	newly_annexed bit not null,
	total_assessed_value numeric(14,0) null,
	taxable_regular_levy numeric(14,0) null,
	taxable_excess_levy numeric(14,0) null,
	senior_assessed_value numeric(14,0) null,
	new_construction_value numeric(14,0) null,
	CONSTRAINT CPK_certification_of_value_letter_tax_area_info PRIMARY KEY CLUSTERED 
		(dataset_id, tax_district_id, group_id, tax_area_id)
) ON [PRIMARY]

create table [##certification_of_value_letter_levy_info]
(
	dataset_id int not null,
	tax_district_id int not null,
	group_id int not null,
	year numeric(4,0) not null,
	levy_cd varchar(10) not null,
	levy_description varchar(50) null,
	levy_type_desc varchar(50) null,
	full_tav numeric(14,0) null,
	half_tav numeric(14,0) null,
	timber_roll numeric(14,0),
	CONSTRAINT CPK_certification_of_value_letter_levy_info PRIMARY KEY CLUSTERED 
		(dataset_id, tax_district_id, group_id, year, levy_cd)
) ON [PRIMARY]

create table [##certification_of_value_levy_description_by_levy]
(
	dataset_id int not null,
	tax_district_id int not null,
	group_id int not null,
	levy_cd varchar(10) not null,
	levy_description varchar(50) null,
	CONSTRAINT CPK_certification_of_value_levy_description_by_levy PRIMARY KEY CLUSTERED 
		(dataset_id, group_id, tax_district_id, levy_cd)
) ON [PRIMARY]

create table [##certification_of_value_letter_by_levy]
(
	dataset_id int not null,
	tax_district_id int not null,
	group_id int not null,
	tax_district_name varchar(70) null,
	tax_district_desc varchar(50) null,
	tax_district_addr1 varchar(60) null,
	tax_district_addr2 varchar(60) null,
	tax_district_addr3 varchar(60) null,
	tax_district_csz varchar(80) null,
	[year] numeric(4,0) not null,
	levy_cd varchar(10) not null,
	levy_description varchar(50) null,
	email_address varchar(128) null,
	priority int not null,
	sup_num int not null,
	CONSTRAINT CPK_certification_of_value_letter_by_levy PRIMARY KEY CLUSTERED 
		(dataset_id, tax_district_id, group_id, levy_cd)
) ON [PRIMARY]

create table [##certification_of_value_grouping_by_levy]
(
	dataset_id int not null,
	tax_district_id int not null,
	group_id int not null identity(1,1),
	levy_cd varchar(10) not null,
	tax_areas varchar(4000) null,
	CONSTRAINT CPK_certification_of_value_grouping_by_levy PRIMARY KEY CLUSTERED 
		(dataset_id, group_id, tax_district_id, levy_cd)
) ON [PRIMARY]


-- END Certification of Value Letter Report

CREATE TABLE [##payment_detail_summary_report_params] (
	[dataset_id] [bigint] NOT NULL,
	[name] [varchar] (30) NOT NULL,
	[value] [varchar] (140) NOT NULL,
) ON [PRIMARY]

create table ##outstanding_fees_report
(
	dataset_id int not null,
	fee_id int not null,
	amount_paid numeric(14,2),
	current_amount_due numeric(14,2),
	fee_create_date datetime,
	fee_type_cd varchar(10),
	fee_type_desc varchar(60),
	owner_id int,
	year numeric(4,0),
	prop_id int,
	ref_num varchar(30),
	tax_cert_num int,
	legal_desc varchar(255),
	prop_state char(1),
	prop_inactive_dt datetime
)


--------------------------------------------------------------------------------
-- BEGIN - Appraisal Card Project Reports
--------------------------------------------------------------------------------

create table ##appraisal_card_prop_assoc
(
	dataset_id int not null,
	sequence_id bigint not null identity(1,1),
	[year] numeric(4,0) not null,
	sup_num int not null,
	sale_id int not null,
	prop_id int not null,
	segment int null,
	CONSTRAINT CPK_appraisal_card_prop_assoc PRIMARY KEY CLUSTERED
		(dataset_id, sequence_id)
)

create nonclustered index IDX_appraisal_card_prop_assoc_dataset_id
	on ##appraisal_card_prop_assoc (dataset_id)

create nonclustered index IDX_appraisal_card_prop_assoc_year_sup_num_prop_id
	on ##appraisal_card_prop_assoc ([year], sup_num, prop_id)

create nonclustered index IDX_appraisal_card_prop_assoc_year_sup_num_sale_id_prop_id
	on ##appraisal_card_prop_assoc ([year], sup_num, sale_id, prop_id)

create nonclustered index IDX_appraisal_card_prop_assoc_prop_id
	on ##appraisal_card_prop_assoc (prop_id)


create table ##appraisal_card_property_paging
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	prop_id int not null,
	page_number int not null,
	end_page_number int not null,
	CONSTRAINT CPK_appraisal_card_property_paging PRIMARY KEY CLUSTERED
		(dataset_id, [year], sup_num, prop_id, page_number)
)

create table ##appraisal_card_property_info
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	prop_id int not null,
	prop_type_cd varchar(5) not null,
	prop_type_desc varchar(12) null,
	prop_sub_type_cd varchar(5) null,
	dba_name varchar(50) null,
	legal_desc varchar(255) null,
	geo_id varchar(50) null,
	map_id varchar(20) null,
	ref_id1 varchar(50) null,
	ref_id2 varchar(50) null,
	mapsco varchar(20) null,
	situs_display varchar(150) null,
	tif_flag char(1) null,
	eff_size_acres numeric(14,4) null,
	legal_acreage numeric(14,4) null,
	tax_area_number varchar(23) null,
	prev_appr_method varchar(5) null,
	curr_appr_method varchar(5) null,
	prev_improvement numeric(14,0) null,
	curr_improvement numeric(14,0) null,
	prev_land_market numeric(14,0) null,
	curr_land_market numeric(14,0) null,
	prev_market numeric(14,0) null,
	curr_market numeric(14,0) null,
	prev_prod_loss numeric(14,0) null,
	curr_prod_loss numeric(14,0) null,
	prev_subtotal numeric(14,0) null,
	curr_subtotal numeric(14,0) null,
	prev_frozen numeric(14,0) null,
	curr_frozen numeric(14,0) null,
	prev_appraised numeric(14,0) null,
	curr_appraised numeric(14,0) null,
	utilities varchar(50) null,
	topography varchar(50) null,
	road_access varchar(50) null,
	primary_zoning varchar(10) null,
	group_codes varchar(50) null,
	next_reason varchar(500) null,
	last_appraisal_yr numeric(4,0) null,
	cap_basis_yr numeric(4,0) null,
	last_appraisal_dt datetime null,
	next_appraisal_dt datetime null,
	last_appraiser_nm varchar(20) null,
	nbhd_appraiser_nm varchar(20) null,
	subdv_appraiser_nm varchar(20) null,
	land_appraiser_nm varchar(20) null,
	value_appraiser_nm varchar(20) null,
	remarks varchar(3000) null,
	image_path varchar(255) null,
	rgn_cd varchar(5) null,
	rgn_imprv_pct numeric(5,2) null,
	rgn_land_pct numeric(5,2) null,
	abs_subdv_cd varchar(10) null,
	abs_subdv_imprv_pct numeric(5,2) null,
	abs_subdv_land_pct numeric(5,2) null,
	hood_cd varchar(10) null,
	hood_imprv_pct numeric(5,2) null,
	hood_land_pct numeric(5,2) null,
	subset_cd varchar(5) null,
	subset_imprv_pct numeric(5,2) null,
	subset_land_pct numeric(5,2) null,
	lawsuit_count int not null,
	recalc_flag char(1) null,
	prop_sic_cd varchar(10) null,
	sic_desc varchar(50) null,
	rendition_date datetime null,
	signed_by varchar(50) null,
	prop_create_dt datetime null,
	prop_inactive_dt datetime null,
	property_use_cd varchar(10) null,
	linked_props varchar(200) null,
	agent_count int null,
	living_area numeric(18,1) null,
	sale_price numeric(14,0) null,
	num_building_permits int not null,
	image_blob varbinary(max) null,	
	has_marshall_swift_commercial bit null,
	has_marshall_swift_residential bit null
	CONSTRAINT CPK_appraisal_card_property_info PRIMARY KEY CLUSTERED 
		(dataset_id, [year], sup_num, prop_id)
)

create nonclustered index IDX_appraisal_card_property_info_dataset_id
	on ##appraisal_card_property_info (dataset_id)

create nonclustered index IDX_appraisal_card_property_info_year_sup_num_prop_id
	on ##appraisal_card_property_info ([year], sup_num, prop_id)

create nonclustered index IDX_appraisal_card_property_info_year_prop_id
	on ##appraisal_card_property_info ([year], prop_id)

create nonclustered index IDX_appraisal_card_property_info_prop_id
	on ##appraisal_card_property_info (prop_id)

create table ##appraisal_card_owner_info
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	prop_id int not null,
	owner_id int not null,
	owner_name varchar(70) null,
	owner_addr1 varchar(60) null,
	owner_addr2 varchar(60) null,
	owner_addr3 varchar(60) null,
	owner_addr_city varchar(50) null,
	owner_addr_state varchar(50) null,
	owner_addr_zip varchar(10) null,
	owner_addr_country varchar(5) null,
	owner_addr_is_international bit not null,
	pct_ownership numeric(13,10) null,
	CONSTRAINT CPK_appraisal_card_owner_info PRIMARY KEY CLUSTERED
		(dataset_id, [year], sup_num, prop_id, owner_id)
)

create nonclustered index IDX_appraisal_card_owner_info_dataset_id
	on ##appraisal_card_owner_info (dataset_id)

create table ##appraisal_card_exemption_info
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	prop_id int not null,
	owner_id int not null,
	exmpt_type_cd varchar(10) not null,
	exmpt_desc varchar(50) null,
	CONSTRAINT CPK_appraisal_card_exemption_info PRIMARY KEY CLUSTERED
		(dataset_id, [year], sup_num, prop_id, owner_id, exmpt_type_cd)
)

create nonclustered index IDX_appraisal_card_exemption_info_dataset_id
	on ##appraisal_card_exemption_info (dataset_id)


create table ##appraisal_card_building_permit_info
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	prop_id int not null,
	bldg_permit_id int not null,
	bldg_permit_issue_dt datetime null,
	bldg_permit_num varchar(30) null,
	bldg_permit_type_cd varchar(10) null,
	bldg_permit_area numeric(18,0) null,
	bldg_permit_active char(1) null,
	bldg_permit_val numeric(18,0) null,
	appraiser_nm varchar(20) null,
	bldg_permit_builder varchar(30) null,
	bldg_permit_cmnt varchar(512) null,
	CONSTRAINT CPK_appraisal_card_building_permit_info PRIMARY KEY CLUSTERED
		(dataset_id, [year], sup_num, prop_id, bldg_permit_id)
)

create nonclustered index IDX_appraisal_card_building_permit_info_dataset_id
	on ##appraisal_card_building_permit_info (dataset_id)


create table ##appraisal_card_income_info
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	prop_id int not null,
	income_id int not null,
	gpi numeric(14,0) null,
	vac numeric(5,2) null,
	egr numeric(14,0) null,
	other_inc numeric(14,0) null,
	egi numeric(14,0) null,
	expense numeric(14,0) null,
	taxes numeric(14,0) null,
	noi numeric(14,0) null,
	value_method varchar(5) null,
	income_value numeric(14,0) null,
	egi_nnnsft numeric(14,2) null,
	expense_nnnsft numeric(14,2) null,
	noi_nnnsft numeric(14,2) null,
	income_value_nnnsft numeric(14,2) null,
	tax_agent varchar(70) null,
	tax_agent_phone varchar(20) null,
	gross_sqft numeric(14,0) null,
	net_sqft numeric(14,0) null,
	linked_accounts varchar(100) null,
	reconciled_value numeric(14,0) null,
	CONSTRAINT CPK_appraisal_card_income_info PRIMARY KEY CLUSTERED
		(dataset_id, [year], sup_num, prop_id, income_id)
)

create nonclustered index IDX_appraisal_card_income_info_dataset_id
	on ##appraisal_card_income_info (dataset_id)


create table ##appraisal_card_arb_info
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	prop_id int not null,
	case_id int not null,
	prot_create_dt datetime null,
	appraiser_nm varchar(40) null,
	prot_status varchar(10) null,
	prot_taxpayer_comments varchar(1024) null,
	prot_district_comments varchar(1024) null,
	CONSTRAINT CPK_appraisal_card_arb_info PRIMARY KEY CLUSTERED
		(dataset_id, [year], sup_num, prop_id, case_id)
)

create nonclustered index IDX_appraisal_card_arb_info_dataset_id
	on ##appraisal_card_arb_info (dataset_id)


create table ##appraisal_card_sales_info
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	prop_id int not null,
	chg_of_owner_id int not null,
	sale_date datetime null,
	sale_price numeric(14,0) null,
	sale_type varchar(5) null,
	sale_ratio_type varchar(10) null,
	sale_financing varchar(5) null,
	sale_financing_term numeric(4,1) null,
	sale_living_area_sqft numeric(14,0) null,
	sale_price_sqft numeric(14,2) null,
	first_imprv_type_desc varchar(50) null,
	second_imprv_type_desc varchar(50) null,
	grantor varchar(70) null,
	consideration varchar(20) null,
	deed_type_cd varchar(10) null,
	deed_book_id varchar(20) null,
	deed_book_page varchar(20) null,
	CONSTRAINT CPK_appraisal_card_sales_info PRIMARY KEY CLUSTERED
		(dataset_id, [year], sup_num, prop_id, chg_of_owner_id)
)

create nonclustered index IDX_appraisal_card_sales_info_dataset_id
	on ##appraisal_card_sales_info (dataset_id)


create table ##appraisal_card_improvement_paging
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	sale_id int not null,
	prop_id int not null,
	seq_num int not null,
	imprv_id int not null,
	imprv_det_id int not null,
	page_number int not null,
	imprv_sequence int not null,
	imprv_det_sequence char(2) not null,
	CONSTRAINT CPK_appraisal_card_improvement_paging PRIMARY KEY CLUSTERED
		(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, imprv_id, imprv_det_id, page_number)
)

create nonclustered index IDX_appraisal_card_improvement_paging
	on ##appraisal_card_improvement_paging (dataset_id, [year], sup_num, prop_id, page_number)


create table ##appraisal_card_sketch_paging
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	prop_id int not null,
	page_number int not null,
	imprv_sequence int not null,
	small_sketch_path varchar(255) null,
	large_sketch_path varchar(255) null,
	small_sketch_blob varbinary(max) null,
	large_sketch_blob varbinary(max) null,
	CONSTRAINT CPK_appraisal_card_sketch_paging PRIMARY KEY CLUSTERED
		(dataset_id, [year], sup_num, prop_id, page_number)
)


create table ##appraisal_card_improvement_summary
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	sale_id int not null,
	prop_id int not null,
	imprv_id int not null,
	detail_count int not null,
	detail_area numeric(18,1) not null,
	living_area numeric(18,1) not null,
	detail_value numeric(14,0) not null,
	detail_adj_value numeric(14,0) not null,
	CONSTRAINT CPK_appraisal_card_improvement_summary PRIMARY KEY CLUSTERED
		(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id)
)


create table ##appraisal_card_improvement_info
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	sale_id int not null,
	prop_id int not null,
	seq_num int not null,

	report_detail_type varchar(6) not null,
	imprv_id int not null,
	imprv_det_id int not null,

	imprv_det_type_cd varchar(10) null,
	imprv_det_type_desc varchar(50) null,
	imprv_det_meth_cd varchar(5) null,
	imprv_det_class_cd varchar(10) null,
	imprv_det_sub_class_cd varchar(10) null,
	imprv_det_main_area char(1) null,
	imprv_det_area numeric(18,1) null,
	imprv_det_load_factor numeric(3,0) null,
	imprv_det_unit_price numeric(14,2) null,
	imprv_det_num_units int null,
	imprv_det_year_built numeric(4,0) null,
	effective_year numeric(4,0) null,
	imprv_det_condition varchar(5) null,
	use_flat_values bit null,
	imprv_det_value numeric(18,0) null,
	imprv_det_dep_pct numeric(5,2) null,
	imprv_det_phys_pct numeric(5,2) null,
	imprv_det_econ_pct numeric(5,2) null,
	imprv_det_func_pct numeric(5,2) null,
	imprv_det_pct_complete numeric(5,2) null,
	adj_factor numeric(5,2) null,
	adj_value numeric(18,0) null,
	imprv_adj_factor numeric(5,2) null,
	imprv_adj_value numeric(18,0) null,
	imprv_type_desc varchar(50) null,
	imprv_state_cd varchar(5) null,
	imprv_effective_year numeric(4,0) null,
	imprv_homesite char(1) null,
	imprv_homesite_pct numeric(13,10) null,
	
	imprv_living_area numeric(18,1) null,
	detail_adj_value numeric(14,0) null,

	imprv_comment varchar(1000) null,
	imprv_large_sketch_path varchar(255) null,
	imprv_small_sketch_path varchar(255) null,
	imprv_det_sketch_cmds varchar(1800) null,

	CONSTRAINT CPK_appraisal_card_improvement_info PRIMARY KEY CLUSTERED
		(dataset_id, [year], sup_num, sale_id, prop_id, seq_num)
)

create nonclustered index IDX_appraisal_card_improvement_info_dataset_id
	on ##appraisal_card_improvement_info (dataset_id)

create nonclustered index IDX_appraisal_card_improvement_info_impkeys
	on ##appraisal_card_improvement_info (dataset_id, [year], sup_num, sale_id, prop_id, imprv_id)


create table ##appraisal_card_improvement_detail_adj_info
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	sale_id int not null,
	prop_id int not null,
	imprv_id int not null,
	imprv_det_id int not null,
	imprv_det_adj_seq int not null,
	imprv_adj_type_cd varchar(5) not null,
	imprv_det_adj_amt numeric(14,0) null,
	imprv_det_adj_pct numeric(14,2) null,
	CONSTRAINT CPK_appraisal_card_improvement_detail_adj_info PRIMARY KEY CLUSTERED
		(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, imprv_det_adj_seq, imprv_adj_type_cd)
)

create nonclustered index IDX_appraisal_card_improvement_detail_adj_info_dataset_id
	on ##appraisal_card_improvement_detail_adj_info (dataset_id)

create table ##appraisal_card_improvement_adj_info
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	sale_id int not null,
	prop_id int not null,
	imprv_id int not null,
	imprv_adj_seq int not null,
	imprv_adj_type_cd varchar(5) not null,
	imprv_adj_amt numeric(14,0) null,
	imprv_adj_pct numeric(14,2) null,
	CONSTRAINT CPK_appraisal_card_improvement_adj_info PRIMARY KEY CLUSTERED
		(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_adj_seq, imprv_adj_type_cd)
)

create nonclustered index IDX_appraisal_card_improvement_adj_info_dataset_id
	on ##appraisal_card_improvement_adj_info (dataset_id)


create table ##appraisal_card_improvement_feature_info
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	sale_id int not null,
	prop_id int not null,
	imprv_id int not null,
	imprv_det_id int not null,
	imprv_attr_id int not null,
	imprv_attr_code varchar(75) not null,
	imprv_attr_desc varchar(50) null,
	imprv_attr_unit numeric(10,2) null,
	imprv_attr_val numeric(14,0) null,
	CONSTRAINT CPK_appraisal_card_improvement_feature_info PRIMARY KEY CLUSTERED
		(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, imprv_attr_id)
)

create nonclustered index IDX_appraisal_card_improvement_feature_info_dataset_id
	on ##appraisal_card_improvement_feature_info (dataset_id)


create table ##appraisal_card_land_paging
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	sale_id int not null,
	prop_id int not null,
	seq_num int not null,
	land_seg_id int not null,
	page_number int not null,
	land_sequence int not null,
	CONSTRAINT CPK_appraisal_card_land_paging PRIMARY KEY CLUSTERED
		(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, land_seg_id, page_number)
)


create table ##appraisal_card_land_info
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	sale_id int not null,
	prop_id int not null,
	seq_num int not null,

	report_detail_type varchar(6) not null,
	land_seg_id int not null,
	land_type_description varchar(50) null,
	land_type_cd varchar(10) null,
	land_soil_cd varchar(10) null,
	land_class_cd varchar(3) null,
	land_table varchar(25) null,
	land_state_cd varchar(5) null,
	land_homesite char(1) null,
	land_homesite_pct numeric(13,10) null,
	land_method varchar(5) null,
	land_dimensions varchar(20) null,
	land_unit_price numeric(14,2) null,
	land_gross_value numeric(14,0) null,
	land_adj_factor numeric(8,6) null,
	land_mass_adj_factor numeric(8,6) null,
	land_mkt_val_source char(1) null,
	land_seg_mkt_val numeric(14,0) null,
	ag_apply char(1) null,
	ag_use_cd varchar(5) null,
	ag_table varchar(25) null,
	ag_unit_price numeric(14,2) null,
	ag_val numeric(14,0) null,
	irr_wells numeric(14,0) null,
	irr_capacity numeric(14,0) null,
	irr_acres numeric(14,4) null,
	oil_wells numeric(14,0) null,
	land_comment varchar(500) null,
	CONSTRAINT CPK_appraisal_card_land_info PRIMARY KEY CLUSTERED
		(dataset_id, [year], sup_num, sale_id, prop_id, seq_num)
)

create nonclustered index IDX_appraisal_card_land_info_dataset_id
	on ##appraisal_card_land_info (dataset_id)


create table ##appraisal_card_land_adjustment_info
(
	dataset_id int not null,	
	[year] numeric(4,0) not null,
	sup_num int not null,
	sale_id int not null,
	prop_id int not null,
	seq_num int not null,
	land_seg_id int not null,
	land_seg_adj_seq int not null,
	land_seg_adj_type varchar(5) null,
	land_seg_adj_amt numeric(10,0) null,
	land_seg_adj_pct numeric(5,2) null,
	CONSTRAINT CPK_appraisal_card_land_adjustment_info PRIMARY KEY CLUSTERED
		(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, land_seg_id, land_seg_adj_seq)
)

create nonclustered index IDX_appraisal_card_land_adjustment_info_dataset_id
	on ##appraisal_card_land_adjustment_info (dataset_id)


create table ##appraisal_card_pers_prop_seg_summary
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	sale_id int not null,
	prop_id int not null,
	pp_type_cd varchar(10) not null,
	detail_count int not null,
	CONSTRAINT CPK_appraisal_card_pers_prop_seg_summary PRIMARY KEY CLUSTERED
		(dataset_id, [year], sup_num, sale_id, prop_id, pp_type_cd)
)


create table ##appraisal_card_pers_prop_seg_info
(
	dataset_id int not null,	
	[year] numeric(4,0) not null,
	sup_num int not null,
	sale_id int not null,
	prop_id int not null,
	seq_num int not null,

	report_detail_type varchar(8) not null,
	pp_seg_id int not null,
	pp_sub_seg_id int not null,
	pp_type_cd varchar(10) null,
	pp_type_desc varchar(50) null,
	pp_description varchar(255) null,
	pp_qual_cd varchar(5) null,
	pp_density_cd varchar(5) null,
	pp_class_cd varchar(5) null,
	pp_area numeric(12,0) null,
	pp_unit_count numeric(16,4) null,
	pp_yr_acquired numeric(4,0) null,
	pp_orig_cost numeric(14,0) null,
	pp_farm_asset bit null,
	pp_unit_price numeric(14,2) null,
	pp_pct_good numeric(5,2) null,
	pp_deprec_deprec_cd varchar(10) null,
	pp_deprec_pct numeric(5,2) null,
	pp_prior_yr_val numeric(14,0) null,
	pp_appraised_val numeric(14,0) null,
	pp_rendered_val numeric(14,0) null,
	pp_appraise_meth varchar(5) null,
	pp_mkt_val numeric(14,0) null,
	sub_descrip varchar(255) null,
	sub_veh_vin varchar(30) null,
	sub_yr_acquired numeric(4,0) null,
	sub_orig_cost numeric(14,0) null,
	sub_veh_yr numeric(4,0) null,
	sub_veh_make varchar(10) null,
	sub_veh_model varchar(10) null,
	sub_dep_type_cd varchar(5) null,
	sub_deprec_cd varchar(10) null,
	sub_dep_pct numeric(5,2) null,
	sub_flat_val numeric(14,0) null,
	sub_mkt_val numeric(14,0) null,
	asset_id varchar(50) null,
	segment_count int null,
	CONSTRAINT CPK_appraisal_card_pers_prop_seg_info PRIMARY KEY CLUSTERED
		(dataset_id, [year], sup_num, sale_id, prop_id, seq_num)
)


create table ##appraisal_card_pers_prop_seg_paging
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	sale_id int not null,
	prop_id int not null,
	seq_num int not null,
	pp_seg_id int not null,
	pp_sub_seg_id int not null,
	page_number int not null,
	pp_sequence int not null,
	CONSTRAINT CPK_appraisal_card_pers_prop_seg_paging PRIMARY KEY CLUSTERED
		(dataset_id, [year], sup_num, sale_id, prop_id, seq_num, pp_seg_id, pp_sub_seg_id, page_number)
)

create nonclustered index IDX_appraisal_card_pers_prop_seg_info_dataset_id
	on ##appraisal_card_pers_prop_seg_info (dataset_id)



create table ##appraisal_card_bp_report_data
(
	dataset_id int not null,
	prop_id int not null,
	seq_num int not null,

	report_detail_type varchar(12) not null,
	end_page_number int null,
	permit_id int null,
	permit_num varchar(30) null,
	issued_to varchar(255) null,
	issue_date datetime null,
	limit_date datetime null,
	street_num varchar(10) null,
	street_prefix varchar(10) null,
	street_name varchar(50) null,
	street_suffix varchar(10) null,
	city varchar(30) null,
	source varchar(50) null,
	active bit null,
	type_cd varchar(10) null,
	type_desc varchar(50) null,
	issuer varchar(5) null,
	permit_status varchar(5) null,
	issuer_desc varchar(50) null,
	permit_val numeric(18,0) null,
	sub_type_cd varchar(5) null,
	sub_type_desc varchar(50) null,
	res_com char(1) null,
	cad_status varchar(5) null,
	cad_status_desc varchar(50) null,
	unit_type varchar(5) null,
	unit_number varchar(15) null,
	sub_division varchar(50) null,
	plat varchar(4) null,
	block varchar(4) null,
	lot varchar(30) null,
	area numeric(18,0) null,
	dim1 varchar(10) null,
	dim2 varchar(10) null,
	dim3 varchar(10) null,
	building_inspection_required bit null,
	electrical_inspection_required bit null,
	mechanical_inspection_required bit null,
	plumbing_inspection_required bit null,
	builder varchar(30) null,
	date_worked datetime null,
	appraiser_nm varchar(40) null,
	builder_phone varchar(16) null,
	date_complete datetime null,
	land_use varchar(30) null,
	owner_phone varchar(16) null,
	last_changed_date datetime null,
	percent_complete numeric(5,2) null,
	case_name varchar(30) null,
	imported_prop_id varchar(15) null,
	project_num varchar(15) null,
	project_name varchar(30) null,
	description varchar(255) null,
	other_id varchar(15) null,
	comment varchar(512) null,
	prop_type_cd varchar(5) null,
	prop_prop_id int null,
	prop_owner_name varchar(70) null,
	prop_legal_desc varchar(255) null,
	prop_map_id varchar(20) null,
	prop_abs_subdv_cd varchar(10) null,
	prop_other varchar(50) null,
	prop_appraised_val numeric(14,0) null,
	CONSTRAINT CPK_appraisal_card_bp_report_data PRIMARY KEY CLUSTERED
		(dataset_id, prop_id, seq_num)
)

--------------------------------------------------------------------------------
-- END - Appraisal Card Project Reports
--------------------------------------------------------------------------------

-- Begin Personal Property Segments Report

create table ##pps_property_info
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	prop_id int not null,
	dba_name varchar(50) null,
	owner_name varchar(70) null,
	legal_desc varchar(255) null,
	situs_display varchar(150) null,
	CONSTRAINT CPK_pps_property_info PRIMARY KEY CLUSTERED
		(dataset_id, [year], sup_num, prop_id)
)

create table ##pps_segment_info
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	prop_id int not null,
	pp_seg_id int not null,
	pp_active_flag char(1) null,
	pp_type_cd char(10) null,
	pp_description varchar(255) null,
	pp_yr_acquired numeric(4,0) null,
	pp_orig_cost numeric(14,0) null,
	CONSTRAINT CPK_pps_segment_info PRIMARY KEY CLUSTERED
		(dataset_id, [year], sup_num, prop_id, pp_seg_id)
)

create table ##pps_sub_segment_info
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	prop_id int not null,
	pp_seg_id int not null,
	pp_sub_seg_id int not null,
	descrip varchar(255) null,
	pp_yr_acquired numeric(4,0) null,
	pp_orig_cost numeric(14,0) null,
	asset_id varchar(50) null,
	pp_mkt_val numeric(14,0) null,
	CONSTRAINT CPK_pps_sub_segment_info PRIMARY KEY CLUSTERED
		(dataset_id, [year], sup_num, prop_id, pp_seg_id, pp_sub_seg_id)
)

-- END Personal Property Segments Report

--------------------------------------------------------------------------------
-- BEGIN - Permanent Crop Worksheet Report Tables
--------------------------------------------------------------------------------
create table ##permanent_crop_report
(
	dataset_id			int,
	[year]				numeric(4, 0),
	prop_id				int,
	sup_num				int,
	imprv_id			int,
	owner_name			varchar(70),
	geo_id				varchar(50),
	legal_acreage		numeric(14, 4),
	situs				varchar(173),
	land_acres			numeric(14, 4),
	planted_acres		numeric(14, 4),
	non_planted_acres	numeric(14, 4), 
	indicated_total_value numeric(14, 0),
	column_1_name		varchar(30),
	column_2_name		varchar(30),
	column_3_name		varchar(30),
	column_4_name		varchar(30),
	column_5_name		varchar(30),
	column_6_name		varchar(30),
	column_7_name		varchar(30)
)

create table ##permanent_crop_detail
(
	dataset_id			int,
	[year]				numeric(4, 0),
	prop_id				int,
	sup_num				int,
	imprv_id			int,
	imprv_det_id		int, 
	imprv_det_type_cd	varchar(10),
	imprv_det_meth_cd	varchar(5),
	imprv_det_class_cd	varchar(10),
	yr_built			numeric(4, 0),
	imprv_det_val_source varchar(1),
	imprv_det_val		numeric(18, 0),
	column_1_value		varchar(50),
	column_2_value		varchar(50),
	column_3_value		varchar(50),
	column_4_value		varchar(50),
	column_5_value		varchar(50),
	column_6_value		varchar(50),
	column_7_value		varchar(50)
)

create table ##permanent_crop_land
(
	dataset_id			int,
	[year]				numeric(4, 0),
	prop_id				int,
	sup_num				int,	
	land_seg_id			int,
	land_type_cd		varchar(10),
	land_class_code		varchar(3), 
	primary_use_cd		varchar(10),
	size_acres			numeric(18, 4),
	land_soil_code		varchar(10),
	cu_table			varchar(25), 
	cu_value			numeric(14, 0)
)

create table ##appraisal_card_permanent_crop_report (
	dataset_id			int,
	prop_id				int,
	[year]				numeric(4, 0),
	sup_num				int,
	report_detail_type	varchar(50),
	seq_num				int,
	imprv_id			int,
	owner_name			varchar(70),
	geo_id				varchar(50),
	legal_acreage		numeric(14, 4),
	situs				varchar(173),
	land_acres			numeric(14, 4),
	planted_acres		numeric(14, 4),
	non_planted_acres	numeric(14, 4), 
	indicated_total_value numeric(14, 0),
	column_1_name		varchar(30),
	column_2_name		varchar(30),
	column_3_name		varchar(30),
	column_4_name		varchar(30),
	column_5_name		varchar(30),
	column_6_name		varchar(30),
	column_7_name		varchar(30),
	imprv_det_id		int, 
	imprv_det_type_cd	varchar(10),
	imprv_det_meth_cd	varchar(5),
	imprv_det_class_cd	varchar(10),
	yr_built			numeric(4, 0),
	imprv_det_val_source varchar(1),
	imprv_det_val		numeric(18, 0),
	column_1_value		varchar(50),
	column_2_value		varchar(50),
	column_3_value		varchar(50),
	column_4_value		varchar(50),
	column_5_value		varchar(50),
	column_6_value		varchar(50),
	column_7_value		varchar(50),
	land_seg_id			int,
	land_type_cd		varchar(10),
	land_class_code		varchar(3), 
	primary_use_cd		varchar(10),
	size_acres			numeric(18, 4),
	land_soil_code		varchar(10),
	cu_table			varchar(25), 
	cu_value			numeric(14, 0)
)

create table ##merge_sa (
	dataset_id int,
	merged_prop_id int,
	prop_id int,
	year numeric(4,0),
	sup_num int,
	is_deleted bit,
	special_assessments varchar(1000)
)

-----------------------------------------------------
-- BEGIN -- Marshall & Swift Commercial Report tables
-----------------------------------------------------
create table ##ms_commercial_estimate_report
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	sale_id int not null,
	prop_id int not null,
	imprv_id int not null,
	imprv_det_id int not null,
	owner_name varchar(70) null,
	situs_address varchar(173) null,
	calculated_date datetime null,
	report_date datetime null,
	total_area numeric(14,1) not null,
	total_cost_new numeric(14,0) not null,
	total_cost_unit_price numeric(14,2) not null,
	total_depreciation_amount numeric(14,0) not null,
	total_depreciated_cost numeric(14,0) not null,
	CONSTRAINT CPK_ms_commercial_estimate_report PRIMARY KEY CLUSTERED
	(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id)
)

create table ##ms_commercial_estimate_report_section
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	sale_id int not null,
	prop_id int not null,
	imprv_id int not null,
	imprv_det_id int not null,
	section_id int not null,
	section_description varchar(50) not null,
	effective_age int not null,
	shape int not null,
	perimeter numeric(14,1) not null,
	stories numeric(5,2) not null,
	area numeric(14,1) not null,
	basement_section_id int null,
	basement_description varchar(50) null,
	basement_levels int null,
	basement_shape int null,
	basement_perimeter numeric(14,1) null,
	basement_area numeric(14,1) null,
	total_cost_new numeric(14,0) not null,
	depreciation_amount numeric(14,0) not null,
	depreciated_cost numeric(14,0) not null,
	basement_total_cost_new numeric(14,0) not null,
	basement_depreciation_amount numeric(14,0) not null,
	basement_depreciated_cost numeric(14,0) not null,
	base_cost_calc_unit_cost numeric(14,2) not null,
	base_cost_total_cost_new numeric(14,0) not null,
	base_cost_depreciation_amount numeric(14,0) not null,
	base_cost_depreciated_cost numeric(14,0) not null,
	basement_base_cost_calc_unit_cost numeric(14,2) null,
	basement_base_cost_total_cost_new numeric(14,0) null,
	basement_base_cost_depreciation_amount numeric(14,0) null,
	basement_base_cost_depreciated_cost numeric(14,0) null,
	basement_fireproof_flag bit null,
	basement_fireproof_calc_unit_cost numeric(14,2) null,
	basement_fireproof_total_cost_new numeric(14,0) null,
	basement_fireproof_depreciation_amount numeric(14,0) null,
	basement_fireproof_depreciated_cost numeric(14,0) null,	
	remarks varchar(1000) null,
	basement_remarks varchar(1000) null,
	CONSTRAINT CPK_ms_commercial_estimate_report_section PRIMARY KEY CLUSTERED
	(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, section_id)
)

create table ##ms_commercial_estimate_report_occupancy
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	sale_id int not null,
	prop_id int not null,
	imprv_id int not null,
	imprv_det_id int not null,
	section_id int not null,
	basement_flag bit not null default(0),
	occupancy_id int not null,
	occupancy_code varchar(5) not null,
	occupancy_description varchar(50) not null,
	occupancy_name varchar(50) null,
	occupancy_pct numeric(5,2) not null,
	class char(1) null,
	height numeric(5,2) null,
	quality_rank numeric(2,1) null,
	basement_type_description varchar(50) null,
	basement_area numeric(14,1) null,
	CONSTRAINT CPK_ms_commercial_estimate_report_occupancy PRIMARY KEY CLUSTERED
	(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, 
	 section_id, basement_flag, occupancy_id)
)

create table ##ms_commercial_estimate_report_component
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	sale_id int not null,
	prop_id int not null,
	imprv_id int not null,
	imprv_det_id int not null,
	section_id int not null,
	basement_flag bit not null default(0),
	component_id int not null,
	component_code varchar(5) not null,
	component_description varchar(50) not null,
	component_system_description varchar(50) not null,
	component_pct numeric(5,2) null,
	units numeric(8,2) not null,
	calc_unit_cost numeric(14,2) not null,
	total_cost_new numeric(14,0) not null,
	depreciation_amount numeric(14,0) not null,
	depreciated_cost numeric(14,0) not null,
	CONSTRAINT CPK_ms_commercial_estimate_report_component PRIMARY KEY CLUSTERED
	(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, 
	 basement_flag, section_id, component_id)
)

create table ##ms_commercial_estimate_report_addition
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	sale_id int not null,
	prop_id int not null,
	imprv_id int not null,
	imprv_det_id int not null,
	section_id int not null,
	addition_id int not null,
	addition_description varchar(50) not null,
	units numeric(8,2) not null,
	calc_unit_cost numeric(14,2) not null,
	total_cost_new numeric(14,0) not null,
	depreciation_amount numeric(14,0) not null,
	depreciated_cost numeric(14,0) not null,
	CONSTRAINT CPK_ms_commercial_estimate_report_addition PRIMARY KEY CLUSTERED
	(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, 
	 section_id, addition_id)
)

create table ##ms_commercial_estimate_report_depreciation
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	sale_id int not null,
	prop_id int not null,
	imprv_id int not null,
	imprv_det_id int not null,
	section_id int not null,
	depreciation_num int not null,
	depreciation_description varchar(50) not null,
	depreciation_pct numeric(5,2) null,
	depreciation_amount numeric(14,0) null,
	CONSTRAINT CPK_ms_commercial_estimate_report_depreciation PRIMARY KEY CLUSTERED
	(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id,
	 section_id, depreciation_num)
)

create table ##appraisal_card_ms_commercial_paging
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	sale_id int not null,
	prop_id int not null,
	imprv_id int not null,
	imprv_det_id int not null,
	seq_num int not null,
	page_number int not null,
	CONSTRAINT CPK_appraisal_card_ms_commercial_paging PRIMARY KEY CLUSTERED
	(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num)
)

create table ##appraisal_card_ms_commercial_report
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	sale_id int not null,
	prop_id int not null,
	imprv_id int not null,
	imprv_det_id int not null,
	seq_num int not null,

	report_detail_type varchar(30) not null,

	calculated_date datetime null,
	report_date datetime null,
	heading varchar(100) null,
	effective_age int null,
	perimeter_shape_label varchar(12) null,
	perimeter_shape_value numeric(14,1) null,

	stories numeric(5,2) null,
	area numeric(14,1) null,

	code varchar(5) null,
	description varchar(50) null,
	class char(1) null,
	height numeric(5,2) null,
	quality_rank numeric(2,1) null,
	percentage numeric(5,2) null,
	
	type_description varchar(50) null,

	units numeric(14,0) null,
	unit_cost numeric(14,2) null,
	total_cost_new numeric(14,0) null,
	depreciation_amount numeric(14,0) null,
	depreciated_cost numeric(14,0) null,

	remarks varchar(1000) null,
	CONSTRAINT CPK_appraisal_card_ms_commercial_report PRIMARY KEY CLUSTERED
		(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num)
)

-----------------------------------------------------
-- END -- Marshall & Swift Commercial Report tables
-----------------------------------------------------

-----------------------------------------------------
-- BEGIN -- Appraisal Export Tables
-----------------------------------------------------
create table ##transfer_appraisal_tax_area
(
	dataset_id int,
	tax_area_id int,
	tax_area_number varchar(23)
)

create index ##ndx_transfer_appraisal_tax_area on ##transfer_appraisal_tax_area(dataset_id, tax_area_id)

create table ##oa_change_tax_area
(
	dataset_id int,
	tax_area_id int,
	tax_area_number varchar(23),
	constraint cpk_oa_change_tax_area primary key clustered (dataset_id, tax_area_id)	
)

create index ndx_oa_change_tax_area on ##oa_change_tax_area(dataset_id, tax_area_number)
-----------------------------------------------------
-- END -- Appraisal Export Tables
-----------------------------------------------------

-----------------------------------------------------
-- BEGIN -- Appraisal Notice Report Tables
-----------------------------------------------------

CREATE TABLE [##appraisal_notice_report_criteria](
	[dataset_id] [int] not null,
	[notice_year] [numeric](4, 0) NOT NULL,
	[notice_run_id] [int] NOT NULL,
	[real_option] [char](1) NULL,
	[personal_option] [char](1) NULL,
	[mobile_option] [char](1) NULL,
	[mineral_option] [char](1) NULL,
	[market_value_based] [bit] NULL,
	[assessed_value_based] [bit] NULL,
	[include_value_increase_greater] [bit] NULL,
	[value_increase_greater] [numeric](14, 0) NULL,
	[include_value_decrease_greater] [bit] NULL,
	[value_decrease_greater] [numeric](14, 0) NULL,
	[include_rendered_value] [bit] NULL,
	[rendered_value] [char](1) NULL,
	[include_neighborhood_codes] [bit] NULL,
	[include_last_ownership_change] [bit] NULL,
	[last_ownership_change_date] [datetime] NULL,
	[include_previously_printed] [bit] NULL,
	[include_last_appraisal_year] [bit] NULL,
	[last_appraisal_year] [numeric](4, 0) NULL,
	[include_cycles] [bit] NULL,
	[include_property_groups] [bit] NULL,
	[select_by_query] [bit] NULL,
	[query] [varchar](1024) NULL,
	[exclude_properties_no_notice] [bit] NULL,
	[exclude_properties_under_500] [bit] NULL,
	[exclude_exempt_properties] [bit] NULL,
	[exclude_local_assessed_properties] [bit] NULL,
	[create_date] [datetime] NULL,
	[created_by] [int] NULL,
	[print_date] [datetime] NULL,
	[printed_by] [int] NULL,
	[notice_line1] [varchar](60) NULL,
	[notice_line2] [varchar](60) NULL,
	[notice_line3] [varchar](60) NULL,
	[print_property_id] [bit] NULL,
	[property_id_type] [int] NULL,
	[print_prior_year_values] [bit] NULL,
	[print_appraiser_id] [bit] NULL,
	[logo_path] [varchar](128) NULL,
	[sup_yr] [numeric](4, 0) NULL,
	[sup_num] [int] NULL,
	[include_pp_segment_listing] [bit] NULL,
 CONSTRAINT [CPK_wash_appraisal_notice_selection_criteria] PRIMARY KEY CLUSTERED 
(
	[dataset_id] ASC,
	[notice_year] ASC,
	[notice_run_id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]

CREATE TABLE [##appraisal_notice_report](
	[dataset_id] int not null,
	[notice_id] int not null,
	[notice_year] [numeric](4, 0) NOT NULL,
	[notice_run_id] [int] NOT NULL,
	[prop_id] [int] NOT NULL,
	[owner_id] [int] NOT NULL,
	[sup_yr] [numeric](4, 0) NOT NULL,
	[sup_num] [int] NOT NULL,
	[notice_acct_id] [int] NOT NULL,
	[agent_copy] [bit] NULL,
	[tax_area_id] [int] NULL,
	[tax_area_number] [varchar](23) NULL,
	[legal_desc] [varchar](255) NULL,
	[situs_display] [varchar](200) NULL,
	[notice_acct_name] [varchar](70) NULL,
	[addr_line1] [varchar](60) NULL,
	[addr_line2] [varchar](60) NULL,
	[addr_line3] [varchar](60) NULL,
	[addr_city] [varchar](50) NULL,
	[addr_state] [varchar](50) NULL,
	[addr_zip] [varchar](14) NULL,
	[addr_country] [varchar](50) NULL,
	[addr_mail_undeliverable] [bit] NULL,
	[is_international] [bit] NULL,
	[hood_cd] [char](10) NULL,
	[hood_appraiser] [varchar](40) NULL,
	[prev_land] [numeric](14, 0) NULL,
	[curr_land] [numeric](14, 0) NULL,
	[prev_structures] [numeric](14, 0) NULL,
	[curr_structures] [numeric](14, 0) NULL,
	[prev_land_in_program] [numeric](14, 0) NULL,
	[curr_land_in_program] [numeric](14, 0) NULL,
	[prev_land_non_program] [numeric](14, 0) NULL,
	[curr_land_non_program] [numeric](14, 0) NULL,
	[prev_frozen] [numeric](14, 0) NULL,
	[curr_frozen] [numeric](14, 0) NULL,
	[prev_non_exempt] [numeric](14, 0) NULL,
	[curr_non_exempt] [numeric](14, 0) NULL,
	[prev_snrdsbl_pct] [numeric](5, 2) NULL,
	[curr_snrdsbl_pct] [numeric](5, 2) NULL,
	[prev_snr_reduction_frozen] [numeric](14, 0) NULL,
	[curr_snr_reduction_frozen] [numeric](14, 0) NULL,
	[prev_frozen_taxable] [numeric](14, 0) NULL,
	[curr_frozen_taxable] [numeric](14, 0) NULL,
	[prev_total_base] [numeric](14, 0) NULL,
	[curr_total_base] [numeric](14, 0) NULL,
	[sys_addr_line1] [varchar](50) NULL,
	[sys_addr_line2] [varchar](50) NULL,
	[sys_addr_line3] [varchar](50) NULL,
	[sys_addr_city] [varchar](50) NULL,
	[sys_addr_state] [char](2) NULL,
	[sys_addr_zip] [varchar](10) NULL,
	[sys_addr_url] [varchar](50) NULL,
	[last_appraiser] [varchar](40) NULL,
	[review_appraiser] [varchar](40) NULL,
	[exemptions] [varchar](100) NULL,
	[owner_name] [varchar](70) NULL,
	[geo_id] [varchar](50) NULL,
	[ref_id1] [varchar](50) NULL,
	[ref_id2] [varchar](50) NULL,
	[prop_type_cd] [char](5) NULL,
	[zip_4_2] [varchar](14) NULL,
	[route] [varchar](2) NULL,
	[cass] [varchar](4) NULL,
	[zip] [varchar](5) NULL,
	[segment] [int] null,
	[prev_legal_acreage] [numeric](14,4) NULL,
	[curr_legal_acreage] [numeric](14,4) NULL,
	[split_merge_indicator] [bit] NULL,
	[dba_name] [varchar](70) NULL,
	[total_value] [numeric](14,0) NULL,
	[value_exempt_from_taxation] [numeric](14,0) NULL,
	[total_assessed_value] [numeric](14,0) NULL,
	[state_farm_exempt_assets_value] [numeric](14,0) NULL,
	[total_segment_orig_cost] [numeric](14,0) NULL,
	[total_segment_assessed_value] [numeric](14,0) NULL,
	[num_segment_lines] [int] NULL,
	[is_leased_land_property] bit NULL,
	[prev_non_taxed_mkt_val] [numeric](14,0) NULL,
	[non_taxed_mkt_val] [numeric](14,0) NULL,
	[postmarked] [varchar](10) NULL,
	[penalty_pct] numeric(5,2) NULL,
	[master_lease_group_id] int NULL,
	[sys_main_phone] varchar(15) NULL,
	[sys_direct_phone] varchar(15) NULL,
	[sys_fax_phone] varchar(15) NULL,
	[sys_email] varchar(255) NULL,
	CONSTRAINT [CPK_appraisal_notice_report] PRIMARY KEY
	(
		[dataset_id] ASC,
		[notice_id] ASC,
		[notice_year] ASC,
		[notice_run_id] ASC,
		[prop_id] ASC,
		[owner_id] ASC,
		[sup_yr] ASC,
		[sup_num] ASC,
		[notice_acct_id] ASC
	) 
)

create nonclustered index IDX_appraisal_notice_report_dataset_id
	on ##appraisal_notice_report (dataset_id)
	
create nonclustered index IDX_appraisal_notice_report_prop_id
	on ##appraisal_notice_report (prop_id)

create nonclustered index IDX_appraisal_notice_report_notice_id_dataset_id
	on ##appraisal_notice_report (notice_id, dataset_id)

create table ##appraisal_notice_report_master_lease
(
	[dataset_id] int not null,
	[notice_year] [numeric](4, 0) NOT NULL,
	[notice_run_id] [int] NOT NULL,
	[master_lease_id] int NOT NULL,
	[owner_address] [varchar](max) NULL,
	[sys_addr_line1] [varchar](50) NULL,
	[sys_addr_line2] [varchar](50) NULL,
	[sys_addr_line3] [varchar](50) NULL,
	[sys_addr_city] [varchar](50) NULL,
	[sys_addr_state] [char](2) NULL,
	[sys_addr_zip] [varchar](10) NULL,
	[sys_addr_url] [varchar](50) NULL,
	[dba_name] [varchar](70) NULL,
	[legal_desc] [varchar](500) NULL,
	[situs_display] [varchar](max) NULL,
	[value_exempt_from_taxation] [numeric](14,0) NULL,
	[total_assessed_value] [numeric](14,0) NULL,
	[total_value] [numeric](14,0) NULL,
	[state_farm_exempt_assets_value] [numeric](14,0) NULL,
	[last_appraiser] [varchar](40) NULL,
	[review_appraiser] [varchar](40) NULL,
	[tax_area_number] [varchar](23) NULL,
	[exemptions] [varchar](100) NULL,
	[postmarked] [varchar](10) NULL,
	[penalty_pct] numeric(5,2) NULL,
	[sys_main_phone] varchar(15) NULL,
	[sys_direct_phone] varchar(15) NULL,
	[sys_fax_phone] varchar(15) NULL,
	[sys_email] varchar(255) NULL,
)
create nonclustered index IDX_appraisal_notice_report_ML_dataset_id
	on ##appraisal_notice_report_master_lease (dataset_id)

create table ##appraisal_notice_report_master_lease_sub_account
(
	dataset_id int not null,
	master_lease_group_id int not null,
	prop_id int not null,
	tax_area_number varchar(23) not null,
	total_assessed_value numeric(14,0) not null,
	situs_address varchar(120),
	constraint PK_master_lease_sub_account primary key (dataset_id, master_lease_group_id, prop_id)
)

CREATE TABLE [##appraisal_notice_report_segment_listing]
(
	[dataset_id] int not null,
	[notice_id] int not null,
	[notice_year] [numeric](4, 0) NOT NULL,
	[notice_run_id] [int] NOT NULL,
	[prop_id] [int] NOT NULL,
	[owner_id] [int] NOT NULL,
	[sup_yr] [numeric](4, 0) NOT NULL,
	[sup_num] [int] NOT NULL,
	[notice_acct_id] [int] NOT NULL,
	[pp_seg_id] [int] NOT NULL,
	[pp_sub_seg_id] [int] NOT NULL,
	[pp_sched_cd] [varchar](10) NULL,
	[pp_description] [varchar](255) NULL,
	[pp_year_acquired] [numeric](4,0) NULL,
	[pp_orig_cost] [numeric](14,0) NULL,
	[pp_assessed_value] [numeric](14,0) NULL,
	[master_lease_group_id] int NULL,
	[tax_area_number] [varchar](23) NULL,
	CONSTRAINT [CPK_appraisal_notice_report_segment_listing] PRIMARY KEY CLUSTERED
	(
		[dataset_id] ASC,
		[notice_id] ASC,
		[notice_year] ASC,
		[notice_run_id] ASC,
		[prop_id] ASC,
		[owner_id] ASC,
		[sup_yr] ASC,
		[sup_num] ASC,
		[notice_acct_id] ASC,
		[pp_seg_id] ASC,
		[pp_sub_seg_id] ASC
	)
)	

-----------------------------------------------------
-- END -- Appraisal Notice Report Tables
-----------------------------------------------------

-----------------------------------------------------
-- BEGIN -- Marshall & Swift Residential Report tables
-----------------------------------------------------

create table ##ms_residential_report
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	prop_id int not null,
	imprv_id int not null,
	imprv_det_id int not null,
	owner_name varchar(70) null,
	situs_address varchar(173) null,
	zip_code varchar(5) null,
	cost_data_as_of datetime null,
	report_date datetime null,
	residential_type varchar(50) null,
	style varchar(50) null,
	style_pct numeric(5,2) null,
	secondary_style varchar(50) null,
	secondary_style_pct numeric(5,2) null,
	floor_area int null,
	num_units int null,
	wall_height int null,
	exterior_walls varchar(100) null,
	quality numeric(3,2) null,
	quality_desc varchar(50) null,
	effective_age int null,
	condition numeric(3,2) null,
	condition_desc varchar(50) null,
	num_fixtures int null,
	num_rough_ins int null,
	cost_multiplier numeric(3,2) null,
	local_multiplier numeric(3,2) null,
	other_multiplier numeric(5,2) null,
	total_multiplier numeric(18,16) null,
	total_depreciation_pct numeric(5,2) null,
	total_rcn_value numeric(14,0) null,
	total_less_depreciation_amount numeric(14,0) null,
	total_rcnld_value numeric(14,0) null,
	non_main_section_flag bit not null,
	addition_section_flag bit not null,
	last_recalc_date datetime null,
	CONSTRAINT CPK_ms_residential_report PRIMARY KEY CLUSTERED
	(dataset_id, [year], sup_num, prop_id, imprv_id, imprv_det_id)
)

create table ##ms_residential_report_detail
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	prop_id int not null,
	imprv_id int not null,
	imprv_det_id int not null,
	detail_id int not null identity(1,1),
	main_section bit not null,
	addition_flag bit not null,
	component_type varchar(50) null,
	component_desc varchar(255) null,
	adjustment_flag bit not null default(0),
	factor numeric(5,4) null,
	quantity int null,
	cost numeric(14,2) null,
	rcn_value numeric(14,0) null,
	less_depreciation_amount numeric(14,0) null,
	rcnld_value numeric(14,0) null,
	CONSTRAINT CPK_ms_residential_report_detail PRIMARY KEY CLUSTERED
	(dataset_id, [year], sup_num, prop_id, imprv_id, imprv_det_id, detail_id)
)

create table ##appraisal_card_ms_residential_report
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	sup_num int not null,
	sale_id int not null,
	prop_id int not null,
	imprv_id int not null,
	imprv_det_id int not null,
	seq_num int not null,

	report_detail_type varchar(20) not null,
	owner_name varchar(70) null,
	situs_address varchar(173) null,
	zip_code varchar(5) null,
	cost_data_as_of datetime null,
	report_date datetime null,
	residential_type varchar(50) null,
	style varchar(50) null,
	style_pct numeric(5,2) null,
	secondary_style varchar(50) null,
	secondary_style_pct numeric(5,2) null,
	floor_area int null,
	num_units int null,
	wall_height int null,
	exterior_walls varchar(50) null,
	quality numeric(3,2) null,
	quality_desc varchar(50) null,
	effective_age int null,
	condition numeric(3,2) null,
	condition_desc varchar(50) null,
	num_fixtures int null,
	num_rough_ins int null,
	cost_multiplier numeric(3,2) null,
	local_multiplier numeric(3,2) null,
	other_multiplier numeric(5,2) null,
	total_multiplier numeric(3,2) null,
	total_depreciation_pct numeric(5,2) null,
	component_type varchar(50) null,
	component_desc varchar(50) null,
	factor numeric(5,4) null,
	adjustment_flag bit not null default(0),
	quantity int null,
	cost numeric(14,2) null,
	rcn_value numeric(14,0) null,
	less_depreciation_value numeric(14,0) null,
	rcnld_value numeric(14,0) null,
	CONSTRAINT CPK_appraisal_card_ms_residential_report PRIMARY KEY CLUSTERED
	(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num)
)

create table ##appraisal_card_ms_residential_paging
(
	dataset_id int not null,
	[year] numeric(4,0) not null, 
	sup_num int not null, 
	sale_id int not null, 
	prop_id int not null, 
	imprv_id int not null, 
	imprv_det_id int not null, 
	seq_num int not null,
	page_number int not null,
	CONSTRAINT CPK_appraisal_card_ms_residential_paging PRIMARY KEY CLUSTERED
	(dataset_id, [year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id, seq_num)
)

create nonclustered index IDX_appraisal_card_ms_residential_report_dataset_id_year_sup_num_prop_id
	on ##appraisal_card_ms_residential_report (dataset_id, [year], sup_num, prop_id)

create nonclustered index IDX_appraisal_card_ms_residential_paging_dataset_id
	on ##appraisal_card_ms_residential_paging (dataset_id)

create nonclustered index IDX_appraisal_card_ms_residential_paging_year_sup_num_sale_id_prop_id_imprv_id_imprv_det_id
	on ##appraisal_card_ms_residential_paging ([year], sup_num, sale_id, prop_id, imprv_id, imprv_det_id)
	
-----------------------------------------------------
-- END -- Marshall & Swift Residential Report tables
-----------------------------------------------------

create table ##linked_inquiries_report
(
	dataset_id int not null,
	link_id int not null,
	[year] numeric(4,0) not null,
	case_id int not null,
	prop_id int not null,
	hood_cd varchar(10) null,
	appraiser_nm varchar(40) null,
	active_protest_id int null,
	inquiry_by_name varchar(70) null,
	inquiry_nature varchar(10) null,
	inquiry_status varchar(10) null,
	constraint CPK_linked_inquiries_report primary key clustered
	(
		dataset_id, 
		link_id, 
		[year],
		case_id, 
		prop_id
	)
)

--------------------------------------------------------------------------------
-- BEGIN - Auto-Pay Ownership Change Run Report table
--------------------------------------------------------------------------------

CREATE TABLE ##autopay_ownership_change_details
(
  [dataset_id] [int] NOT NULL,
  run_id int NOT NULL,       
  prop_id int NULL,
  transfer_action_cd varchar(16) NULL,
  change_date datetime NULL ,
  prev_owner_id int NULL,
  prev_owner_name varchar(70) NULL,
  curr_owner_id int NULL,
  curr_owner_name varchar(70) NULL,
  geo_id varchar(50) NULL,
  legal_desc varchar(255) NULL
)


--------------------------------------------------------------------------------
-- BEGIN - Auto-Pay Enrollment Report table
--------------------------------------------------------------------------------

CREATE TABLE ##autopay_enrollment
(
  [dataset_id] [int] NOT NULL,
  prop_id int NULL,
  owner_id int NULL,
	geo_id varchar(50) NULL,  
  owner_name varchar(70) NULL,
  account_number varchar(16) NULL,
  bank_name varchar(50) NULL,
  authorization_name varchar(50) NULL,
  account_type_cd varchar(16) NULL,
  payment_type_cd varchar(16) NULL,
  as_of_date datetime NULL,
  amount_due varchar(32) NULL
)

create table ##supplement_tax_adjustment
(
	dataset_id int not null,
	[year] numeric(4,0) not null, 
	sup_num int not null, 
	prop_id int not null, 
	statement_id int,
	[trans_year] numeric(4,0), 
	trans_group_id int not null,
	trans_group_type varchar(10),
	trans_description varchar(500),
	code varchar(10),
	adjustment_id int, 
	modify_cd varchar(10),
	modify_reason varchar(500),
	previous_effective_due_date datetime,
	effective_due_date datetime,
	previous_taxable numeric(14, 2),
	taxable numeric(14, 2),
	previous_amount_due numeric(14, 2),
	amount_due numeric(14, 2),
	total_adjustment numeric(14, 2),
	percent_adj	numeric(5, 2),
	rollback_id int,
	
	CONSTRAINT CPK_supplement_tax_adjustment PRIMARY KEY CLUSTERED
		(dataset_id, [year], sup_num, prop_id, adjustment_id)	
)

create table ##supplement_tax_adjustment_property_info
(
	dataset_id int not null,
	[year] numeric(4,0) not null, 
	sup_num int not null, 
	prop_id int not null, 
	prop_type_cd varchar(5),
	owner_id int, 
	file_as_name varchar(70), 
	property_identifier varchar(70),
	legal_desc varchar(255),
	sup_action varchar(2),
	rollback_id int,
	
	CONSTRAINT CPK_supplement_tax_adjustment_property_info PRIMARY KEY CLUSTERED
		(dataset_id, [year], sup_num, prop_id, rollback_id)	
)

  create table ##arb_inquiry_listing
  (
	dataset_id int not null,
	case_id int not null,
	prop_val_yr numeric(4,0) not null,
	prop_id int not null,
	sup_num int not null,
	owner_id int not null,
	pct_ownership numeric(13,10) null,
	geo_id varchar(50) null,
	prop_type_cd varchar(5) null,
	legal_desc varchar(255) null,
	situs varchar(174) null,
	entities varchar(50) null,
	exemptions varchar(50) null,
	inq_taxpayer_comments varchar(1024) null,
	prev_other numeric(14,0) null,
	prev_ag_mkt numeric(14,0) null,
	prev_ag_use numeric(14,0) null,
	prev_land numeric(14,0) null,
	prev_imprv numeric(14,0) null,
	prev_appraised numeric(14,0) null,
	prev_cap numeric(14,0) null,
	prev_assessed numeric(14,0) null,
	curr_other numeric(14,0) null,
	curr_ag_mkt numeric(14,0) null,
	curr_ag_use numeric(14,0) null,
	curr_land numeric(14,0) null,
	curr_imprv numeric(14,0) null,
	curr_appraised numeric(14,0) null,
	curr_cap numeric(14,0) null,
	curr_assessed numeric(14,0) null,
	inq_type varchar(10) null,
	meeting_appraiser_nm varchar(40) null,
	property_use_cd varchar(10) null,
	inq_by_name varchar(70) null,
	inq_by_addr_line1 varchar(60) null,
	inq_by_addr_line2 varchar(60) null,
	inq_by_addr_line3 varchar(60) null,
	inq_by_addr_city varchar(50) null,
	inq_by_addr_state varchar(50) null,
	inq_by_addr_zip varchar(10) null,
	inq_by_addr_country varchar(50) null,
	inq_by_addr_is_international bit null,
	hood_cd varchar(10) null,
	inq_nature varchar(10) null,
	inq_status varchar(10) null,
	inq_appraisal_staff varchar(75) null,
	CONSTRAINT CPK_arb_inquiry_listing PRIMARY KEY CLUSTERED
	(
		dataset_id,
		case_id,
		prop_val_yr,
		prop_id,
		sup_num,
		owner_id
	)
)

--------------------------------------------------------------------------------
-- BEGIN - Bill/Fee Code Summary Listing Report
--------------------------------------------------------------------------------
CREATE TABLE [##bill_fee_code_summary_listing] (
	[prop_id] [int] NOT NULL,
	[file_as_name] [varchar](70) NULL,
	[code] [varchar](10) NULL,
	[year] [numeric](4, 0) NULL,
	[statement_id] [int] NULL,
	[comment] [varchar](500) NULL,
	[partial_payment_indicator] [varchar](5) NULL,
	[dataset_id] [bigint] NOT NULL
)
--------------------------------------------------------------------------------
-- END - Bill/Fee Code Summary Listing Report
--------------------------------------------------------------------------------



create table ##statement_of_taxes_collected
(
	[dataset_id] int NOT NULL,
	[county_name] varchar(30) NULL,
	[begin_affidavit] int NULL,
	[end_affidavit] int NULL,
	[date_range] varchar(25) NULL,
	[total_number_of_affidavits] int NULL,
	[total_number_of_mobile_homes] int NULL,
	[total_state_local_tax_collected_non_mh] numeric(14,2) NULL,
	[total_state_local_tax_mh] numeric(14,2) NULL,
	[capital_projects] numeric(14,2) NULL,
	[conservancy_land_acquisition_maint] numeric(14,2) NULL,
	[net_state_tax_collected] numeric(14,2) NULL,
	[less_administrative_fee] numeric(14,2) NULL,
	[total_delinquent_penalty_collected] numeric(14,2) NULL,
	[total_state_delinquent_interest_collected] numeric(14,2) NULL,
	[total_electronic_technology_fee] numeric(14,2) NULL,
	[total_electronic_state_technology_fee] numeric(14,2) NULL,
	[total_electronic_local_technology_fee] numeric(14,2) NULL,
	[administrative_fee_percentage] numeric(14,2) NULL,
	[administrative_fee] numeric(14,2) NULL,
	[affordable_housing] numeric(14,2) NULL,
	
	CONSTRAINT CPK_statement_of_taxes_collected PRIMARY KEY CLUSTERED
		(dataset_id)	
)

CREATE TABLE ##wa_tax_statement_print_history_statement_assoc
(
	[group_id] [int] NOT NULL,
	[year] [numeric](4, 0) NOT NULL,
	[run_id] [int] NOT NULL,
	[history_id] [int] NOT NULL,
	[copy_type] [bigint] NOT NULL,
	[prop_id] [int] NOT NULL,
	[owner_id] [int] NOT NULL,
	[sup_num] [int] NOT NULL,
	[statement_id] [int] NOT NULL,
	[order_seq] [int] IDENTITY(1,1) NOT FOR REPLICATION NOT NULL,
 CONSTRAINT [CPK_tmp_wa_tax_statement_print_history_statement_assoc] PRIMARY KEY CLUSTERED 
(
	[group_id] ASC,
	[year] ASC,
	[run_id] ASC,
	[history_id] ASC,
	[statement_id] ASC,
	[copy_type] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON, FILLFACTOR = 100) ON [PRIMARY]
) ON [PRIMARY]



--------------------------------------------------------------------------------
-- BEGIN - Auto-Pay Enrollment Report tables
--------------------------------------------------------------------------------

CREATE TABLE ##autopay_enrollment_report_params
(
  [dataset_id] [int] NOT NULL,
  as_of_date datetime NULL,
  include_deleted_props int NULL,
  start_date datetime NULL,
  end_date datetime NULL,
	sorted_by varchar(32) NULL
)

--------------------------------------------------------------------------------
-- BEGIN - Personal Property Rendition Application report tables
--------------------------------------------------------------------------------

create table [##ppra_property_list] 
(
	dataset_id int not null,
	prop_id int not null
)

create table [##ppra_both_nonfarm_farm]
(
	nonfarm_dataset_id int null,
	farm_dataset_id int null,
	prop_id int null,
	sort_key int null,
	segment_id int null
)

create table [##ppra_nonfarm_run]
(
	dataset_id int not null,
	appraisal_year numeric(4,0) not null,
	county_appraiser varchar(50) null,
	county_name varchar(30) null,
	county_address varchar(500) null,
	county_phone varchar(60) null,
	county_logo_blob varbinary(max) null,
	instructions_main varchar(max) null,
	instructions_supplies varchar(max) null,
	instructions_commercial varchar(max) null,
	instructions_farm varchar(max) null,
	instructions_leased varchar(max) null,
	instructions_penalty varchar(max) null,
	instructions_improvements varchar(max) null,
	instructions_cost varchar(max) null
)

create table [##ppra_nonfarm]
(
	dataset_id int not null,
	prop_id int not null,
	year numeric(4,0) not null,
	sup_num int null,
	ubi varchar(50) null,
	sub_type varchar(5) null,
	sic_code char(10) null,
	owner_id int,
	owner_name varchar(70) null,
	owner_phone	varchar(20) null,
	owner_fax varchar(20) null,
	owner_email varchar(50) null,
	owner_address varchar(500) null,
	situs varchar(200) null,
	linked_real_prop_id int null,
	legal_description varchar(600) null,
	tax_area_number varchar(23) null,
	sort_key int null,
	dba_name varchar(50) null,
	segment_id int null,
	linked_real_prop_list varchar(max) null
)

create table [##ppra_nonfarm_assets]
(
	dataset_id int not null,
	prop_id int not null,
	pp_seg_id int null,
	pp_sub_seg_id int null,
	pp_mkt_val numeric(14,0) null,
	pp_type_cd char(10) null,
	description varchar(255) null,
	pp_yr_acquired numeric(4,0) null,
	pp_orig_cost numeric(14,0) null,
	sort_key int null,
	has_subsegments bit not null default 0,
	asset_id varchar(50) null,
	is_first_in_segment_group bit not null default 0
)

create table [##ppra_farm_run]
(
	dataset_id int not null,
	appraisal_year numeric(4,0) not null,
	county_name varchar(30) null,
	county_address varchar(500) null,
	county_logo_blob varbinary(max) null,
	farm_contact_info varchar(max) null
)

create table [##ppra_farm]
(
	dataset_id int not null,
	prop_id int not null,
	year numeric(4,0) not null,
	sup_num int null,
	owner_id int null,
	owner_name varchar(70) null,
	owner_address varchar(500) null,
	situs varchar(200) null,
	legal_description varchar(600) null,
	tax_area_number varchar(23) null,
	sort_key int null,
	segment_id int null
)

--------------------------------------------------------------------------------
-- END - Personal Property Rendition Application report tables
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Payment In Lieu of Taxes Report tables
--------------------------------------------------------------------------------

create table ##pmt_in_lieu_of_tax_pmts
(
	dataset_id			int,
	group_id			int,
	[year]				int,
	tax_area_number		varchar(23),
	amount				numeric(14,2),
	tax_district_desc	varchar(50),
	levy_description	varchar(50),
	year_minus0_total	numeric(14, 2),
	year_minus1_total	numeric(14, 2),
	year_minus2_total	numeric(14, 2),
	year_minus3_total	numeric(14, 2),
	year_minus4_total	numeric(14, 2),
	year_minus5_total	numeric(14, 2)
)

create table ##payment_in_lieu_of_taxes_master
(
      dataset_id  int,
      year1       numeric(4, 0),
      year2       numeric(4, 0),
      year3       numeric(4, 0),
      year4       numeric(4, 0),
      year5       numeric(4, 0),
      year6       numeric(4, 0)
)

create table ##payment_in_lieu_of_taxes_detail
(
      dataset_id              int,
      tax_district_id         int,
      tax_district_desc				varchar(50),
      tdt_priority            int,
      levy_cd                 varchar(10),
      levy_description				varchar(50),
      year1_amount            numeric(14, 2),
      year2_amount            numeric(14, 2),
      year3_amount            numeric(14, 2),
      year4_amount            numeric(14, 2),
      year5_amount            numeric(14, 2),
      year6_amount            numeric(14, 2)
)

--------------------------------------------------------------------------------
-- END - Payment In Lieu of Taxes Report tables
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Revenue Merge Report Tables
--------------------------------------------------------------------------------

create table ##revenue_merge_report
(
	dataset_id int,
	payee_name varchar(70),
	[description] varchar(70),
	balance_dt datetime,
	account_number varchar(259),
	offset_account_number varchar(259),
	amount numeric(16, 2),
	treasurer_rcpt_number int,
	payment_receipt_number int
)

--------------------------------------------------------------------------------
-- BEGIN - End Revenue Merge Report Tables
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - MRA Tables for CA
--------------------------------------------------------------------------------

create table ##mra_property_list 
	(
		ident int identity(1,1) not null,
		dataset_id int not null,
		[year] int not null,
		prop_id int not null,
		sup_num int not null,
		sale_price numeric(14,0) not null default 0,
		sale_date datetime null,
		sale_price_time_adjusted numeric(14,0) not null default 0,
		imprv int,
		imprv_det_id int,
		imprv_det_val numeric(14,0), 
		imprv_val numeric(14,0),
		imprv_det_class_cd varchar(255), 
		imprv_det_sub_class_cd varchar(255), 
		condition_cd varchar(255),
		height numeric(10,1) ,
		effective_age numeric(4,0) , 
		area numeric(14,2),
		land_acres numeric(18,4),
		
		imprv_id1 int,
		imprv_val1 numeric(14,0),
		area1 numeric(14,2),
		imprv_id2 int,
		imprv_val2 numeric(14,0),
		area2 numeric(14,2),
		
		land_id int,
		land_val numeric(14,0),
		land_area numeric(14,6),
		
		land_id1 int,
		land_val1 numeric(14,0),
		land_area1 numeric(14,2),
		land_id2 int,
		land_val2 numeric(14,0),
		land_area2 numeric(14,2),
		sale_id int
		
	)	


--------------------------------------------------------------------------------
-- END - MRA Tables for CA
--------------------------------------------------------------------------------


--------------------------------------------------------------------------------
-- BEGIN - DELINQUENT COLELCTIONS
--------------------------------------------------------------------------------

CREATE TABLE ##judgements_report
(
  [dataset_id] [int] NOT NULL,
  year numeric(4, 0) NOT NULL,
  prop_id int NOT NULL,
  owner_name varchar(70) NOT NULL,
  property_type varchar(16) NULL,
  base_tax_due numeric(18, 2) not null default(0),
  bill_adj_code_comment varchar(256) NULL,
  cause_num varchar(16) NOT NULL,
  total_base_tax_due numeric(18,2) not null default(0),
  sort_id int not null default(0),
	CONSTRAINT CPK_judgements_report PRIMARY KEY CLUSTERED (
		dataset_id, 
		prop_id,
		year,
		owner_name,
		cause_num
	)
)

CREATE TABLE ##judgements_options_report
(
  [dataset_id] [int] NOT NULL,
  report_title varchar(64) NOT NULL,
	selected_years varchar(500) NULL,
	selected_codes varchar(500) NULL,
	sort_option varchar(40) NULL,
	exclude_codes bit not null default 0,
	office_name varchar(50) null,
	addr_line1 varchar(50) null,
	addr_line2 varchar(50) null,
	addr_line3 varchar(50) null,
	city varchar(50) null,
	state char(2) null,
	zip varchar(50) null,
	property_tax_questions_phone varchar(15) null,
	fax_num varchar(25) null,
	url varchar(50) null,
	chief_appraiser varchar(50) null,
	county_logo_blob varbinary(max) null,
	CONSTRAINT CPK_judgements_options_report PRIMARY KEY CLUSTERED
	(dataset_id)
)

CREATE TABLE ##collections_review_report
(
  [dataset_id] [int] NOT NULL,
  year numeric(4, 0) NOT NULL,
  prop_id int NOT NULL,
  owner_name varchar(70) NOT NULL,
  base_tax_due numeric(18, 2) not null default 0,
  bill_code varchar(32) NULL,
  bill_adj_code_comment varchar(256) NULL,
  description varchar(256) NULL,
  sort_id int IDENTITY (1, 1) not null,
	CONSTRAINT CPK_collections_review_report PRIMARY KEY CLUSTERED (
		dataset_id, 
		prop_id,
		year,
		owner_name
	)
)

CREATE TABLE ##collections_review_detailed_report
(
  [dataset_id] [int] NOT NULL,
  year numeric(4, 0) NOT NULL,
  prop_id int NOT NULL,
  item_id int NOT NULL,
  owner_name varchar(128) NOT NULL,
  base_tax_due numeric(18, 2) not null default 0,
  bill_code varchar(32) NULL,
  bill_adj_code_comment varchar(256) NULL,
  description varchar(256) NULL,
  sort_id int IDENTITY (1, 1) not null,
	CONSTRAINT CPK_collections_review_detailed_report PRIMARY KEY CLUSTERED (
		dataset_id, 
		prop_id,
		year,
		owner_name,
		item_id
	)
)

CREATE TABLE ##collections_review_report_options
(
  [dataset_id] [int] NOT NULL,
	due_date_from datetime null,
	due_date_to datetime null,
	bill_codes varchar(max) NULL,
	include_codes bit not null default 0,
	years varchar(500) NULL,	
	tax_districts varchar(max) NULL,	
	special_assessments varchar(max) NULL,	
	fee_types varchar(max) NULL,
	sort_option varchar(40) NULL,
	summary_report bit not null default 0
)

create table ##annual_auditor_report_options (
	dataset_id int not null,
	year varchar(500) NULL,
	sort_option varchar(40) NULL,
	CONSTRAINT CPK_annual_auditor_report_options PRIMARY KEY CLUSTERED (
		dataset_id
	)
)

create table ##annual_auditor_report (
	dataset_id int not null,
	year numeric(4, 0) NOT NULL,
	prop_id int not null,
	owner_name varchar(70) not null,
	base_tax_due numeric(18, 2) not null default 0,
	sort_id int IDENTITY (1, 1) not null,
	CONSTRAINT CPK_annual_auditor_report PRIMARY KEY CLUSTERED (
		dataset_id, 
		prop_id,
		year,
		owner_name
	)
)

create table ##bankruptcy_claim_report (
	dataset_id int not null, 
	prop_id int not null, 
	prop_type_cd varchar(8), 
	total_amount_due numeric(18, 2), 
	net_taxable numeric(18, 2), 
	basis_for_claim varchar(16), 
	annual_interest_rate decimal(18, 2),
	file_as_name varchar(70),
	addr_line1 varchar(60),
	addr_line2 varchar(60),
	addr_line3 varchar(60),
	addr_city varchar(50),
	addr_state varchar(50),
	addr_zip varchar(10),
	country_name varchar(50),
	phone_num varchar(20)
	CONSTRAINT CPK_bankruptcy_claim_report PRIMARY KEY CLUSTERED (
		dataset_id, 
		prop_id
	)
)


CREATE TABLE ##delq_cert_options_report
(
  [dataset_id] [int] NOT NULL,
  report_title varchar(64) NOT NULL,
	prop_ids varchar(max) NULL, 
	years varchar(1000) NULL,
	bill_fee_codes varchar(4000) NULL,
	tax_districts varchar(4000) NULL,
	agencies varchar(4000) NULL,
	delinquent_effective_date datetime NULL,
	as_of_date datetime NULL,
	fee_types varchar(4000) NULL,
	CONSTRAINT CPK_delq_cert_options_report PRIMARY KEY CLUSTERED (
		dataset_id
	)
)

CREATE TABLE ##delq_cert_prop_list_report
(
	[id] [int] IDENTITY (1, 1) NOT NULL,
  [dataset_id] [int] NOT NULL,
	prop_id int NOT NULL,
	CONSTRAINT [PK_delq_cert_prop_list_report] PRIMARY KEY CLUSTERED
	(
		id
	)
)

CREATE TABLE ##delq_cert_report
(
  [dataset_id] [int] NOT NULL,
  prop_id int NOT NULL,
	geo_id varchar(50) NULL,
  owner_name varchar(70) NOT NULL,
  legal_desc varchar(255) NULL,
  situs_display varchar(175) NULL,
	addr_line1 varchar(60) NULL,
	addr_line2 varchar(60) NULL,
	addr_line3 varchar(60) NULL,
	addr_city varchar(50) NULL,
	addr_state varchar(50) NULL,
	zip varchar(5) NULL,
	legal_acreage numeric(14, 4) NULL,
	metes_and_bounds varchar(max) NULL,
	lien_present_flag bit not null default 0,
	CONSTRAINT CPK_delq_cert_report PRIMARY KEY CLUSTERED (
		dataset_id, 
		prop_id
	)
)

CREATE TABLE ##delq_cert_lien_report
(
  [dataset_id] [int] NOT NULL,
  prop_id int NOT NULL,
  owner_name varchar(70) NOT NULL,
  lien_holder_id int NOT NULL,
	trustee varchar(70) NULL,
	beneficiary varchar(70) NULL,
	foreclosure_cost numeric(18, 2),
	superior_court_cause_number varchar(50) NULL,
	in_favor_of varchar(70) NULL,
	auditor_file_number varchar(70) NULL,
	CONSTRAINT CPK_delq_cert_lien_report PRIMARY KEY CLUSTERED (
		dataset_id, 
		prop_id,
		lien_holder_id		
	)
)

CREATE TABLE ##delq_cert_linked_prop_report
(
  [dataset_id] [int] NOT NULL,
  parent_prop_id int NOT NULL,
  prop_id int NOT NULL,
  owner_name varchar(70) NOT NULL,
  legal_desc varchar(255) NULL,
  year numeric(4, 0) NOT NULL
	CONSTRAINT CPK_delq_cert_linked_prop_report PRIMARY KEY CLUSTERED (
		dataset_id,
		parent_prop_id, 
		prop_id,
		year
	)
)

CREATE TABLE ##delq_cert_linked_prop_taxes_report
(
  [dataset_id] [int] NOT NULL,
  prop_id int NOT NULL,
  year numeric(4, 0) NOT NULL,
	base_tax_due numeric(18, 2), 
	late_filing_penalty_fee numeric(18, 2), 
	interest numeric(18, 2), 
  penalty numeric(18, 2), 
  total_taxes_due numeric(18, 2), 
	CONSTRAINT CPK_delq_cert_linked_prop_taxes_report PRIMARY KEY CLUSTERED (
		dataset_id,
		prop_id,
		year
	)
)

CREATE TABLE ##delq_cert_prop_taxes_report
(
  [dataset_id] [int] NOT NULL,
  prop_id int NOT NULL,
  year numeric(4, 0) NOT NULL,
	base_tax_due numeric(18, 2), 
	late_filing_penalty_fee numeric(18, 2),  
	interest numeric(18, 2), 
  penalty numeric(18, 2), 
  total_taxes_due numeric(18, 2),
	CONSTRAINT CPK_delq_cert_prop_taxes_report PRIMARY KEY CLUSTERED (
		dataset_id,
		prop_id,
		year
	)
)

CREATE TABLE ##bidlist_sold_prop_options_report
(
  [dataset_id] [int] NOT NULL,
  report_title varchar(64) NOT NULL,
  auction_from_date datetime NOT NULL,	
  auction_to_date datetime NOT NULL,	
	sort_option varchar(40) NULL
	CONSTRAINT CPK_bidlist_sold_prop_options_report PRIMARY KEY CLUSTERED (
		dataset_id
	)
)

CREATE TABLE ##bidlist_sold_prop_report
(
  [dataset_id] [int] NOT NULL,
  prop_id int NOT NULL,
  cause_num varchar(16) NULL,
  auction_date datetime NOT NULL,	
  legal_desc varchar(255) NULL,
  situs_display varchar(175) NULL,
	minimum_bid numeric(18, 2), 
	bidder_file_as_name varchar(70),
	winning_bid numeric(18, 2), 
	bid_difference numeric(18, 2),
	sort_id int not null identity(1,1),
	CONSTRAINT CPK_bidlist_sold_prop_report PRIMARY KEY CLUSTERED (
		dataset_id, 
		prop_id
	)
)

--------------------------------------------------------------------------------
-- END - DELINQUENT COLELCTIONS
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - 1010 Collections Pursuit Report Tables
--------------------------------------------------------------------------------

create table ##pursuit_account_payments_report_options (
	dataset_id int not null,
	include_payment_date_range bit not null default 0,
	payment_from_date datetime null,
	payment_to_date datetime null,
	pursuit_types varchar(max) null
)


create table ##pursuit_account_payments_report (
	dataset_id int not null,
	prop_id int not null,
	year numeric(4, 0) not null,
	owner_name varchar(70) not null,
	pursuit_type_desc varchar(255) null,
	pursuit_category_desc varchar(255) null,
	base_amount numeric(18, 2) default 0 not null,
	interest_amount numeric(18, 2) default 0 not null,
	penalty_amount numeric(18, 2) default 0 not null,
	total_amount numeric(18, 2) default 0 not null,
	refund_overpayment_amt numeric(18, 2) default 0 not null,
	last_payment_date datetime null,
	sort_id int IDENTITY (1, 1) not null,
	CONSTRAINT CPK_pursuit_account_payments_report PRIMARY KEY CLUSTERED (
		dataset_id, 
		prop_id,
		year,
		owner_name
	)
)


create table ##pursuit_activity_collector_options_report (
	dataset_id int not null,
	include_activity_date_range bit null,
	activity_from_date datetime null,
	activity_to_date datetime null,
	pursuit_types varchar(max) null,
	pursuit_statuses varchar(max) null,
	collectors varchar(max) null,
	include_unworked_accounts bit not null default 0	
)


create table ##pursuit_activity_collector_report (
	dataset_id int not null,
	collector_id int not null,
	collector_name varchar(70) not null,
	assigned_count int not null default 0,
	collected_count int not null default 0,
	cancelled_count int not null default 0,
	open_count int not null default 0,
	payment_count int not null default 0,
	assigned_amount numeric(20, 2) not null default 0,
	collected_amount numeric(20, 2) not null default 0,
	cancelled_amount numeric(20, 2) not null default 0,
	open_amount numeric(20, 2) not null default 0,
	recovery numeric(5, 2) not null default 0,
	CONSTRAINT CPK_pursuit_activity_collector_report PRIMARY KEY CLUSTERED (
		dataset_id, 
		collector_id
	)
)


create table ##pursuit_activity_collector_property_report (
	dataset_id int not null,
	year numeric(4, 0) not null,
	collector_id int not null,
	prop_id int not null,
	owner_name varchar(70) null,
	amount_due numeric(18, 2) not null default 0,
	amount_paid numeric(18, 2) not null default 0,
	amount_cancelled numeric(18, 2) not null default 0,
	payment_count int not null default 0,
	recovery numeric(5, 2) not null default 0,
	CONSTRAINT CPK_pursuit_activity_collector_property_report PRIMARY KEY CLUSTERED (
		dataset_id,
		year, 
		collector_id,
		prop_id
	)
)


create table ##pursuit_activity_collector_event_report (
	dataset_id int not null,
	prop_id int not null,
	event_id int not null,
	event_date datetime not null,	
	event_type_cd varchar(20) not null,
	event_type_desc varchar(255) not null,
	collector_id int not null,
	litigation_id int null,	
	year numeric(4, 0) null,
	CONSTRAINT CPK_pursuit_activity_event_report PRIMARY KEY CLUSTERED (
		dataset_id,
		prop_id,
		event_id
	)
)

--------------------------------------------------------------------------------
-- END - 1010 Collections Pursuit Report Tables
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - 1020 Overlapping Debt Report Tables
--------------------------------------------------------------------------------

CREATE TABLE [##current_delinquent_tax_collections_report] 
(
	[dataset_id] [bigint] NOT NULL,
	[year] [numeric](4, 0) NOT NULL,
	[current_year_tax_levy] [numeric](14,0) NOT NULL,
	[current_year_tax_collection] [numeric](14,0) NOT NULL,
	[delinquent_tax_collection] [numeric](14,0) NOT NULL
)

CREATE TABLE [##current_delinquent_tax_collections_report_month_data] 
(
	[dataset_id] [bigint] NOT NULL,
	[jan_collection] [numeric](14, 0) NULL,
	[feb_collection] [numeric](14, 0) NULL,
	[mar_collection] [numeric](14, 0) NULL,
	[apr_collection] [numeric](14, 0) NULL,
	[may_collection] [numeric](14, 0) NULL,
	[jun_collection] [numeric](14, 0) NULL,
	[jul_collection] [numeric](14, 0) NULL,
	[aug_collection] [numeric](14, 0) NULL,
	[sep_collection] [numeric](14, 0) NULL,
	[oct_collection] [numeric](14, 0) NULL,
	[nov_collection] [numeric](14, 0) NULL,
	[dec_collection] [numeric](14, 0) NULL,
)

CREATE TABLE [##overlapping_funds_report_levy_rates] 
(
	[dataset_id] [int] NOT NULL,
	levy_type_desc [varchar](50) not null,
	year1_rate [numeric](13,10) NULL,
	year2_rate [numeric](13,10) NULL,
	year3_rate [numeric](13,10) NULL,
	year4_rate [numeric](13,10) NULL,
	year5_rate [numeric](13,10) NULL,
	CONSTRAINT CPK_overlapping_funds_report_levy_rates PRIMARY KEY CLUSTERED
		(dataset_id, levy_type_desc)
)

CREATE TABLE [##overlapping_funds_report_detail] 
(
	[dataset_id] [int] NOT NULL,
	levy_type_desc [varchar](50) not null,
	levy_year [numeric](4,0) not null,
	initial_value [numeric](14,2) not null,
	year1_value [numeric](14,2) NULL,
	year2_value [numeric](14,2) NULL,
	year3_value [numeric](14,2) NULL,
	year4_value [numeric](14,2) NULL,
	year5_value [numeric](14,2) NULL,
	net_cancellation [numeric](14,2) NULL,
	CONSTRAINT CPK_overlapping_funds_report_detail PRIMARY KEY CLUSTERED
		(dataset_id, levy_type_desc, levy_year)
)

CREATE TABLE [##overlapping_debt_report_tax_area_levy_assoc] 
(
	[dataset_id] [int] NOT NULL,
	[year] [numeric](4,0) NOT NULL,
	[sup_num] [int] NOT NULL,
	[prop_id] [int] NOT NULL,
	[tax_area_id] [int] NOT NULL,
	[levy_cd] [varchar](10) NOT NULL,
	[assessed_val] [numeric](14,0) NULL,
	CONSTRAINT CPK_overlapping_debt_report_tax_area_levy_assoc PRIMARY KEY CLUSTERED
		([dataset_id], [year], [sup_num], [prop_id], [tax_area_id], [levy_cd])
)

CREATE TABLE [##overlapping_debt_report_tax_area_detail] 
(
	[dataset_id] [int] NOT NULL,
	[tax_area_number] [varchar](23) NOT NULL,
	[levy_cd] [varchar](10) NOT NULL,
	[assessed_value] [numeric](14,0) NULL,
	[sort_flag] [bit] NULL,
	CONSTRAINT CPK_overlapping_debt_report_tax_area_detail PRIMARY KEY CLUSTERED
		([dataset_id], [tax_area_number], [levy_cd])
)

CREATE TABLE [##overlapping_debt_report_levy_prop_assoc] 
(
	[dataset_id] [int] NOT NULL,
	[year] [numeric](4,0) NOT NULL,
	[sup_num] [int] NOT NULL,
	[prop_id] [int] NOT NULL,
	[levy_cd] [varchar](10) NOT NULL,
	[assessed_val] [numeric](14,0) NULL,
	CONSTRAINT CPK_overlapping_debt_report_levy_prop_assoc PRIMARY KEY CLUSTERED
		([dataset_id], [year], [sup_num], [prop_id], [levy_cd])
)

CREATE TABLE [##overlapping_debt_report_outstanding] 
(
	[dataset_id] [int] NOT NULL,
	[levy_cd] [varchar](10) NOT NULL,
	[outstanding_debt_amount] [numeric](14,0)
	CONSTRAINT CPK_overlapping_debt_report_outstanding PRIMARY KEY CLUSTERED
		([dataset_id], [levy_cd])

)

CREATE TABLE [##overlapping_debt_report] 
(
	[dataset_id] [int] NOT NULL,
	[levy_cd] [varchar](10) NOT NULL,
	[levy_description] [varchar](50) NULL,
	[total_taxable_av] [numeric](14,0) NULL,
	[taxable_av_in_subject] [numeric](14,0) NULL,
	[sort_flag] [bit] NOT NULL DEFAULT 0,
	CONSTRAINT CPK_overlapping_debt_report PRIMARY KEY CLUSTERED
		([dataset_id], [levy_cd])
)

CREATE TABLE [##overlapping_debt_report_inset_data] 
(
	[dataset_id] [int] NOT NULL,
	[levy_cd] [varchar](10) NOT NULL,
	[property_valuation_of_district] [numeric](14,0) NULL,
	[estimated_population_of_district] [numeric](14,0) NULL,
	[total_net_general] [numeric](14,0) NULL,
	CONSTRAINT CPK_overlapping_debt_report_inset_data PRIMARY KEY CLUSTERED
		([dataset_id], [levy_cd])
)

create table [##overlapping_debt_report_control]
(
	[dataset_id] [int] NOT NULL
	CONSTRAINT CPK_overlapping_debt_report_control PRIMARY KEY CLUSTERED (dataset_id)
)

--------------------------------------------------------------------------------
-- END - 1020 Overlapping Debt Report Tables
--------------------------------------------------------------------------------



--------------------------------------------------------------------------------
-- BEGIN - 1021 REET Import Tables
--------------------------------------------------------------------------------



create table [##ReetImportReet]
(
	[dataset_id] [int] not null,
	[unique_id] [decimal] (10,0) not null,
	[line_num] [int] not null,
	[instrument_type_cd] [char](10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[sale_date] [datetime] NULL,
	[partial_sale] [bit] NOT NULL,
	[legal_desc] [varchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[sale_price] [numeric](11, 2) NULL,
	[pers_prop_included] [bit] NOT NULL,
	[pers_prop_description] [varchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[pers_prop_val] [numeric](11, 2) NULL,
	[exemption_claimed] [bit] NOT NULL,
	[exemption_amount] [numeric](11, 2) NULL,
	[wac_number_type_cd] [varchar](32) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[wac_reason] [varchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[agency_id] [decimal](4, 0) NULL,
	[imp_continuance_flag] [bit] NULL,
	[imp_historic_flag] [bit] NULL,
	[imp_forestland_flag] [bit] NULL,
	[imp_open_space_flag] [bit] NULL,
	[imp_city] [varchar](150) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[imp_current_use_flag] [bit] NULL,
	[tax_area_id] [int] NULL,
	[urban_growth_cd] [varchar](10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[webportal_id] [varchar] (50),
	[hasError]  [bit] NULL,
	
	CONSTRAINT CPK_ReetImportReet PRIMARY KEY CLUSTERED
		(dataset_id, [unique_id])	
)




create table [##ReetImportProperty]
(
	[dataset_id] [int] not null,
	[unique_id] [decimal] (10,0) not null,
	[line_num] [int] not null,
	[prop_id] [varchar] (50) NOT NULL,
	[year] [numeric](4, 0) NOT NULL,
	[sup_num] [int] NOT NULL,
	[land_use_cd] [varchar](10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[dor_use_cd] [varchar](10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[imp_property_use_cd] [varchar](10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[situs_display] [varchar](141) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[prop_type_cd] [char](10) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[taxable_val]  [numeric](14,0) NULL,
	[urban_growth_cd] [varchar](10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[legal_acreage] [numeric](14, 4) NULL,
	[location_cd] [varchar](4) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[parcel_segregated] [bit] NULL,
	[TaxAreaID] [int] null,
	[ownerid] [int] null,
	
	CONSTRAINT CPK_ReetImportProperty PRIMARY KEY CLUSTERED
		(dataset_id, [unique_id], [prop_id], [year], [sup_num])	
)


create table [##ReetImportAccount]
(
	[dataset_id] [int] not null,
	[unique_id] [decimal] (10,0) not null,
	[line_num] [int] not null,
	[account_type_cd] [char](1) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[name] [varchar](150) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[addr_line1] [varchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[addr_line2] [varchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[addr_line3] [varchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[addr_city] [varchar](50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[addr_state] [varchar](50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[addr_zip] [char](9) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[addr_country_cd] [char](5) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[phone_num] [char](20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	
	CONSTRAINT CPK_ReetImportAccount PRIMARY KEY CLUSTERED
		(dataset_id, [unique_id], [account_type_cd], [name])	
)


--------------------------------------------------------------------------------
-- END - 1021 REET Import Tables
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Excise Detail Report
--------------------------------------------------------------------------------

create table [##excise_detail]
(
	[dataset_id] [int] NOT NULL,
	[reet_id] [int] NOT NULL,
	[excise_number] [int] NULL,
	[transaction_id] [int] NULL,
	[balance_dt] [datetime] NULL,
	[completion_date] [datetime] NULL,
	[sale_date] [datetime] NULL,
	[Total_Paid] [decimal](16, 2) NULL,
	[property_type] [char](10) NULL,
	[geo_id] [varchar](50) NULL,
	[prop_id] [int] NOT NULL,
	[tax_area] [varchar](23) NULL,
	[sale_price] [decimal](16, 2) NULL,
	[taxable_value] [decimal](14, 0) NULL,
	[state_excise_paid] [decimal](16, 2) NULL,
	[local_excise_paid] [decimal](16, 2) NULL,
	[state_interest] [decimal](16, 2) NULL,
	[local_interest] [decimal](16, 2) NULL,
	[penalty] [decimal](16, 2) NULL,
	[state_tech_fee] [decimal](16, 2) NULL,
	[proc_fee] [decimal](16, 2) NULL,
	[over_under_amount] [decimal](16, 2) NULL,
	[voided_or_voiding] bit NULL,
	[multi_property_reet] bit NULL
)

--------------------------------------------------------------------------------
-- END - Excise Detail Report
--------------------------------------------------------------------------------
--------------------------------------------------------------------------------
-- BEGIN - Improvement Schedules Assoc Report
--------------------------------------------------------------------------------
create table ##imprv_sched_matrix_assoc_report
(
	[dataset_id] int NOT NULL,
	[year] numeric(4,0),
	[matrix_id] int,
	[matrix_description] varchar(50),
	[label] varchar(20),
	[imprv_det_meth_cd] char(5),
	[imprv_det_type_cd] char(10),
	[imprv_det_class_cd] char(10),
	[imprv_det_sub_class_cd] varchar(10)
)
--------------------------------------------------------------------------------
-- END - Improvement Schedules Assoc Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Land Schedules Assoc Report
--------------------------------------------------------------------------------
create table ##land_sched_matrix_assoc_report
(
	[dataset_id] int NOT NULL,
	[year] numeric(4,0),
	[matrix_id] int,
	[matrix_description] varchar(50),
	[label] varchar(20),
	[ls_ag_or_mkt] char(1),
	[ls_code] char(25),
	[ls_method] char(5)
)
--------------------------------------------------------------------------------
-- END - Land Schedules Assoc Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Depreciation Schedules Report
--------------------------------------------------------------------------------
create table ##depreciation_schedules_report
(
	[dataset_id] int NOT NULL,
	[type_cd] char(10) NOT NULL,
	[deprec_cd] char(10) NOT NULL,
	[year] numeric(4,0) NOT NULL,
	[prop_type_cd] char(5) NOT NULL,
	[description] varchar(50),
	[deprec_year_max] numeric(3,0),
	[deprec_year_pct] decimal(5,2)
)
--------------------------------------------------------------------------------
-- END - Depreciation Schedules Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Income Worksheet Reports
--------------------------------------------------------------------------------

create table ##income_worksheet
(
	dataset_id int not null,
	income_id int not null,
	econ_area varchar(10) null,
	property_type varchar(10) null,
	expense_structure varchar(10) null,
	rent_type varchar(10) null,
	class varchar(10) null,
	year_built numeric(4,0) null,
	[level] varchar(10) null,
	property_name varchar(50) null,
	stories varchar(10) null,
	comments varchar(255),
	value_method varchar(50) null,
	method_value numeric(14,0) null,
	less_personal_property numeric(14,0) null,
	leaseup_costs numeric(14,0) null,
	other_value numeric(14,0) null,
	other_land_value numeric(14,0) null,
	base_indicated_value numeric(14,0) null,
	non_income_land_imps_value numeric(14,0) null,
	total_indicated_value numeric(14,0) null,
	constraint CPK_income_worksheet primary key
	(dataset_id)
)

create table ##income_worksheet_property_info
(
	dataset_id int not null,
	prop_id int not null,
	owner_name varchar(70) null,
	situs varchar(147) null,
	distribution_pct numeric(5,2) null,
	[value] numeric(14,0) null,
	constraint CPK_income_worksheet_property_info primary key
	(dataset_id, prop_id)
)

create table ##income_worksheet_values
(
	dataset_id int not null,
	seq_num int not null,
	operator varchar(3) null,
	description varchar(50) null,
	[value] numeric(14,2) null,
	rate numeric(14,2) null,
	[percent] numeric(5,2) null,
	units varchar(20) null,
	constraint CPK_income_worksheet_values primary key
	(dataset_id, seq_num)
)

create table ##income_worksheet_detail
(
	dataset_id int not null,
	seq_num int not null,
	imprv_id int not null,
	imprv_det_id int not null,
	imprv_det_type_cd varchar(10) null,
	imprv_det_type_desc varchar(20) null,
	imprv_det_meth_cd varchar(10) null,
	gross_building_area numeric(18,1) null,
	net_rentable_area numeric(18,1) null,
	rent_rate numeric(14,2) null,
	occupancy_pct numeric(5,2) null,
	reimbursed_expenses numeric(14,0) null,
	secondary_income numeric(14,0) null,
	gross_potential_income numeric(14,0) null,
	effective_gross_income numeric(14,0) null,
	overall_expenses numeric(14,0) null,
	overall_rate numeric(7,4) null,
	net_operating_income numeric(14,0) null,
	[value] numeric(14,0) null,
	constraint CPK_income_worksheet_detail primary key
	(dataset_id, seq_num)
)

create table ##income_worksheet_improvement_info
(
	dataset_id int not null,
	imprv_id int not null,
	imprv_desc varchar(255) null,
	constraint CPK_income_worksheet_improvement_info primary key
	(dataset_id, imprv_id)
)

create table ##income_worksheet_land_info
(
	dataset_id int not null,
	prop_id int not null,
	land_seg_id int not null,
	constraint CPK_income_worksheet_land_info primary key
	(dataset_id, prop_id, land_seg_id)
)

--------------------------------------------------------------------------------
-- END - Income Worksheet Reports
--------------------------------------------------------------------------------

create table ##income_valuations_report
(
	dataset_id int not null,
	income_id int not null,
	owner_name varchar(70) null,
	dba varchar(70) null,
	situs varchar(174) null,
	neighborhood varchar(10) null,
	primary_use varchar(10) null,
	source_pid int not null,
	used_on_pid int not null,
	market_value numeric(14,0) null,
	situs_state char(2) null,
	situs_city varchar(30) null,
	situs_street varchar(50) null,
	situs_street_sufix varchar(10) null,
	situs_street_prefx varchar(10) null,
	situs_num varchar(15) null,
	constraint CPK_income_valuations_report primary key
	(dataset_id, income_id, source_pid)
)

create table ##income_grm_gim_properties_report
(
	dataset_id int not null,
	income_id int not null,
	prop_id int not null,
	hood_cd varchar(10) null,
	cycle int null,
	primary_use_code varchar(10) null,
	num_units int null,
	grm_multiplier numeric(5,2) null,
	gim_multiplier numeric(5,2) null,
	method varchar(10) null,
	grm_value numeric(14,0) null,
	gim_value numeric(14,0) null,
	market_value numeric(14,0) null,
	situs varchar(174) null,
	situs_state char(2) null,
	situs_city varchar(30) null,
	situs_street varchar(50) null,
	situs_street_sufix varchar(10) null,
	situs_street_prefx varchar(10) null,
	situs_num varchar(15) null,
	constraint CPK_pro_forma_report primary key
	(dataset_id, income_id, prop_id)
)

--------------------------------------------------------------------------------
-- BEGIN - Income Schedule Reports
--------------------------------------------------------------------------------

create table ##income_improvement_detail_schedule_assoc
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	matrix_id int not null,
	area varchar(10) not null default(''),
	imprv_det_type_cd char(10) not null default (''),
	imprv_det_meth_cd char(5) not null default(''),
	matrix_description varchar(50) null,
	label varchar(20) null,
	constraint CPK_income_improvement_detail_schedule_assoc primary key
	(dataset_id, [year], matrix_id, area, imprv_det_type_cd, imprv_det_meth_cd)
)

create table ##income_schedule_improvement_detail
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	area_type bit not null,
	area varchar(10) not null,
	imprv_det_type_cd char(10) not null,
	imprv_det_meth_cd char(5) not null,
	area_desc varchar(100) null,
	imprv_det_type_desc varchar(50) null,
	imprv_det_meth_desc varchar(50) null,
	use_matrices bit not null,
	do_not_use_tax_rate_in_overall_rate bit not null,
	rent_rate numeric(14,2) null,
	rent_rate_period char not null,
	collection_loss numeric(5,2) null,
	occupancy_rate numeric(5,2) null,
	secondary_income_rsf numeric(14,2) null,
	cap_rate numeric(7,4) null,
	expense_rsf numeric(14,2) null,
	expense_ratio numeric(5,2) null,
	constraint CPK_income_schedule_improvement_detail primary key
	(dataset_id, [year], area_type, area, imprv_det_type_cd, imprv_det_meth_cd)
)

create table ##income_schedule_improvement_detail_assoc
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	area_type bit not null,
	area varchar(10) not null,
	imprv_det_type_cd char(10) not null,
	imprv_det_meth_cd char(5) not null,
	matrix_id int not null,
	matrix_order int not null,
	adj_factor numeric(7,4) not null,
	matrix_description varchar(50) null,
	matrix_sub_type_cd varchar(10) null,
	matrix_sub_type_desc varchar(50) null,
	label varchar(20) null,
	axis_1_cd varchar(20) not null,
	axis_1_data_type varchar(20) null,
	axis_2_cd varchar(20) not null,
	axis_2_data_type varchar(20) null,
	operator varchar(20) null,
	constraint CPK_income_schedule_improvement_detail_assoc primary key
	(dataset_id, [year], area_type, area, imprv_det_type_cd, imprv_det_meth_cd, matrix_id,
	 matrix_order)
)

create table ##income_schedule_improvement_detail_matrix
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	area_type bit not null,
	area varchar(10) not null,
	imprv_det_type_cd char(10) not null,
	imprv_det_meth_cd char(5) not null,
	matrix_id int not null,
	axis_1_value varchar(75) not null,
	axis_1_number int not null,
	axis_1_order int not null,
	axis_2_value varchar(75) not null,
	axis_2_number int not null,
	axis_2_order int not null,
	cell_value numeric(16,2) not null,
	constraint CPK_income_schedule_improvement_detail_matrix primary key
	(dataset_id, [year], area_type, area, imprv_det_type_cd, imprv_det_meth_cd, matrix_id,
	 axis_1_value, axis_2_value)
)

create table ##income_schedule_report
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	econ_area varchar(10) not null,
	prop_type varchar(10) not null,
	class varchar(10) not null,
	[level] varchar(10) not null,
	occupancy_rate numeric(5,2) null,
	management_rate numeric(5,2) null,
	expense_rsf numeric(14,2) null,
	secondary_income_rsf numeric(14,2) null,
	tenant_imprv_rate numeric(5,2) null,
	reserve_for_replacement_rate numeric(5,2) null,
	cap_rate numeric(5,2) null,
	lease_rsf numeric(14,2) null,
	vacancy numeric(5,2) null,
	econ_area_desc varchar(20) null,
	prop_type_desc varchar(20) null,
	class_desc varchar(50) null,
	level_desc varchar(20) null,
	do_not_use_tax_rate bit null,
	triple_net_schedule bit null,
	constraint CPK_income_schedule_report primary key
	(dataset_id, [year], econ_area, prop_type, class, [level])
)

create table ##income_schedule_grm_gim_report
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	prop_type_cd varchar(10) not null,
	class_cd varchar(10) not null,
	econ_cd varchar(10) not null,
	level_cd varchar(10) not null,
	potential_gross_income_annual numeric(14,0) null,
	potential_gross_income_monthly numeric(14,0) null,
	gross_income_multiplier numeric(5,2) null,
	gross_rent_multiplier numeric(5,2) null,
	econ_area_desc varchar(20) null,
	prop_type_desc varchar(20) null,
	class_desc varchar(50) null,
	level_desc varchar(20) null,
	constraint CPK_income_schedule_grm_gim_report primary key
	(dataset_id, [year], prop_type_cd, class_cd, level_cd)
)

--------------------------------------------------------------------------------
-- END - Income Schedule Reports
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - 9019 REET Web Portal Import Tables
--------------------------------------------------------------------------------

create table ##reet_webportal_import
(
		webportal_id varchar(50) NOT NULL,
		agency_id decimal(4,0) NOT NULL,
		partial_sale bit NOT NULL,
		exemption_claimed bit NOT NULL,
		imp_forestland_flag bit NOT NULL,
		imp_current_use_flag bit NOT NULL,
		imp_historic_flag bit NOT NULL,
		imp_continuance_flag bit NOT NULL,
		imp_open_space_flag bit NOT NULL,
		pers_prop_description varchar(140) NOT NULL,
		wac_number_type_cd varchar(32) NULL,
		wac_reason varchar(100)  NULL,
		instrument_type_cd char(10) NULL,
		sale_date datetime NOT NULL,
		sale_price numeric(11,2) NOT NULL,
		pers_prop_val numeric(11,2) NULL,
		exemption_amount numeric(11,2) NULL,
		taxable_selling_price numeric(11,2) NOT NULL,
		imp_city varchar(150) NOT NULL,
		legal_desc varchar(max) NOT NULL,
		transaction_date datetime NOT NULL,
		excise_number int  NULL,
		url_image varchar(255)  NULL,
		excise_amount numeric(11,2) NULL,
		excise_PandI numeric(11,2) NULL,
		excise_fees numeric(11,2) NULL,
		receipt_number int NULL,
		property_tax numeric(11,2) NULL,
		property_PandI numeric(11,2) NULL,
		batch_balance_date datetime NULL,
		paid_by varchar(50) NULL,
		pacs_user varchar(50) NULL,
		error varchar(255) NULL,
		REET_id int NULL,
		status varchar(25) NULL,
		status_change_date datetime NULL,
		total_amount numeric(11,2) NULL,
		pacs_user_id int NULL,
		assigned_user_name varchar(30) NULL,
		imp_timber_ag_flag bit NOT NULL,
		imp_multiple_locations bit NOT NULL,		
		CONSTRAINT [CPK_gt_reet_webportal_import] PRIMARY KEY CLUSTERED 
		([webportal_id] ASC)
 )
 
 create table ##reet_webportal_import_property
(
	webportal_id varchar(50) NOT NULL,
	prop_id varchar(50) NOT NULL,
	land_use_cd varchar(10) NOT NULL,
	location_cd varchar(4) NOT NULL,
	parcel_segregated bit NOT NULL,
	error varchar(255) NULL,
	CONSTRAINT [CPK_gt_reet_webportal_import_property] PRIMARY KEY CLUSTERED 
		([webportal_id] ASC,
		 [prop_id] ASC
	))

create table [##reet_webportal_import_account]
(
	[webportal_id] varchar(50) NOT NULL,
	[account_type_cd] char(1) NOT NULL,
	[name] varchar(150) NOT NULL,
	[addr_line1] varchar(60) NOT NULL,
	[addr_line2] varchar(60) NOT NULL,
	[addr_line3] varchar(60) NOT NULL,
	[addr_city] varchar(50) NOT NULL,
	[addr_state] varchar(50) NOT NULL,
	[addr_zip] char(9) NOT NULL,
	[addr_country_cd] char(5) NOT NULL,
	[phone_num] char(15) NOT NULL,
	[error] varchar(255) NULL,
	CONSTRAINT [CPK_gt_reet_webportal_import_account] PRIMARY KEY CLUSTERED 
		([webportal_id] ASC,
		 [account_type_cd] ASC,
		 [name] ASC
	))

--------------------------------------------------------------------------------
-- END - 9019 REET Web Portal Import Tables
--------------------------------------------------------------------------------


--------------------------------------------------------------------------------
-- BEGIN - PP Schedules Report
--------------------------------------------------------------------------------
create table ##pp_schedule_report
(
	[dataset_id] int NOT NULL,
	[pp_sched_id] int NOT NULL,
	[year] numeric(4,0) NOT NULL,
	[value_method] char(5) NOT NULL,
	[table_code] char(10) NOT NULL,
	[segment_type] char(10) NOT NULL,
	[module_1] char(4),
	[module_2] char(4),
	[module_3] char(4),
	[module_4] char(4),
	[module_5] char(4),
	[module_6] char(4)
)

create table ##pp_schedule_report_adj
(
	[dataset_id] int NOT NULL,
	[pp_sched_id] int NOT NULL,
	[pp_sched_adj_id] int NOT NULL,
	[year] numeric(4,0) NOT NULL,
	[pp_sched_adj_cd] char(5),
	[pp_sched_adj_pc] numeric(5,2),
	[pp_sched_adj_amt] numeric(14,0)
)

create table ##pp_schedule_report_area
(
	[dataset_id] int NOT NULL,
	[pp_sched_id] int NOT NULL,
	[pp_sched_area_id] int NOT NULL,
	[year] numeric(4,0) NOT NULL,
	[area_max] numeric(14,1) NOT NULL,
	[area_price] numeric(14,2),
	[area_percent] numeric(5,2)
)

create table ##pp_schedule_report_class
(
	[dataset_id] int NOT NULL,
	[pp_sched_id] int NOT NULL,
	[pp_sched_class_id] int NOT NULL,
	[year] numeric(4,0) NOT NULL,
	[pp_class_cd] char(5) NOT NULL,
	[pp_class_amt] numeric(14,2),
	[pp_class_pct] numeric(5,2)
)

create table ##pp_schedule_report_deprec
(
	[dataset_id] int NOT NULL,
	[pp_sched_id] int NOT NULL,
	[pp_sched_deprec_type_cd] char(10) NOT NULL,
	[pp_sched_deprec_deprec_cd] char(10) NOT NULL,
	[year] numeric(4,0) NOT NULL,
	[description] varchar(50) NOT NULL
)

create table ##pp_schedule_report_qd
(
	[dataset_id] int NOT NULL,
	[pp_sched_id] int NOT NULL,
	[pp_sched_qd_id] int NOT NULL,
	[year] numeric(4,0) NOT NULL,
	[quality_cd] char(5),
	[density_cd] char(5),
	[qd_unit_price] numeric(14,2),
	[qd_percent] numeric(5,2)
)

create table ##pp_schedule_report_uc
(
	[dataset_id] int NOT NULL,
	[pp_sched_id] int NOT NULL,
	[pp_sched_unit_count_id] int NOT NULL,
	[year] numeric(4,0) NOT NULL,
	[unit_count_max] numeric(16,4) NOT NULL,
	[unit_price] numeric(14,2),
	[unit_percent] numeric(5,2)
)
--------------------------------------------------------------------------------
-- END - PPSchedules Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - 2006-B Current Use Reports
--------------------------------------------------------------------------------

create table ##cu_notice_of_removal_intent_report
(
		[dataset_id] int NOT NULL,
		[prop_id] int NOT NULL,
		[owner_id] int NOT NULL,
		[ag_rollbk_id] int NOT NULL,
		[status_cd] char(5),
		[removal_intent_dt] datetime,
		CONSTRAINT [CPK_cu_notice_of_removal_intent_report] PRIMARY KEY CLUSTERED 
		([dataset_id] ASC, [prop_id] ASC, [owner_id], [ag_rollbk_id])
)

create table ##cu_removals_report
(
		[dataset_id] int NOT NULL,
		[prop_id] int NOT NULL,
		[owner_id] int NOT NULL,
		[ag_rollbk_id] int NOT NULL,
		[status_cd] char(5),
		[owner_name] varchar(70),
		[legal_description] varchar(255),
		[chg_in_use_dt] datetime,
		[num_acres_removed] numeric(10, 5),
		[taxes_billed] numeric(14, 2),
		[taxes_paid] numeric(14, 2),
		[bills_created] bit,
		[bills_paid] bit,
		CONSTRAINT [CPK_cu_removals_report] PRIMARY KEY CLUSTERED 
		([dataset_id] ASC, [prop_id] ASC, [owner_id], [ag_rollbk_id])
)

create table ##cu_removals_report_params
(
		[dataset_id] int NOT NULL,
		[name] varchar(255) NOT NULL,
		[value] varchar(255),
		CONSTRAINT [CPK_cu_removals_report_params] PRIMARY KEY CLUSTERED 
		([dataset_id] ASC, [name])
)

--------------------------------------------------------------------------------
-- END - 2006-B Current Use Reports
--------------------------------------------------------------------------------

create table [##property_lien_report]
(
	[dataset_id] int NOT NULL,
	[prop_id] int NOT NULL,
	[owner] varchar(70),
	[legal] varchar(255),
	[acres] numeric(9,5),
	[lien_date] datetime
)

--------------------------------------------------------------------------------
-- BEGIN - 2006-A Current Use
--------------------------------------------------------------------------------
CREATE TABLE ##current_use_property_listing
(
  dataset_id INT NOT NULL,
  run_id INT NOT NULL,
  [year] INT NOT NULL,
  property_id INT NOT NULL,
  owner_name VARCHAR(MAX),
  legal_description VARCHAR(MAX),
  legal_acres NUMERIC(14, 4),
  cu_effective_acres NUMERIC(18, 4),
  number_acres_in_cu NUMERIC(18, 4),
  use_code VARCHAR(512),
  application_number VARCHAR(512)
)

CREATE TABLE ##current_use_exception_listing
(
  dataset_id INT NOT NULL,
  run_id INT NOT NULL,
  [year] INT NOT NULL,
  property_id INT NOT NULL,
  owner_name VARCHAR(MAX),
  legal_description VARCHAR(MAX),
  exception VARCHAR(MAX)
)

create table ##cu_status_codes_report
(
		[dataset_id] int NOT NULL,
		[prop_id] int NOT NULL,
		[year] int NOT NULL,
		[status_code] varchar(15),
		[status_date] datetime,
		[review_date] datetime,
		[legal_acreage] numeric(14, 4),
		[owner_name] varchar(70),
		[ag_use_codes] varchar(max),
		[application_numbers] varchar(max),
		CONSTRAINT [CPK_cu_status_codes_report] PRIMARY KEY CLUSTERED 
		([dataset_id] ASC, [prop_id] ASC, [year])
)

create table ##cu_status_codes_report_params
(
		[dataset_id] int NOT NULL,
		[name] varchar(255) NOT NULL,
		[value] varchar(255),
		CONSTRAINT [CPK_cu_status_codes_report_params] PRIMARY KEY CLUSTERED 
		([dataset_id] ASC, [name])
)

--------------------------------------------------------------------------------
-- END - 2006-A Current Use
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Market Approach Grids Not Created Report
--------------------------------------------------------------------------------

create table ##mkt_appr_grids_not_created_report
(
	dataset_id bigint not null,
	
	run_id int not null,
	criteria_description varchar(max) not null,
	
	primary key clustered (dataset_id)
	with fillfactor = 100
)

create table ##mkt_appr_grids_not_created_report_detail
(
	dataset_id bigint not null,
	detail_id int identity(1,1) not null,
	
	prop_id int not null,
	owner_name varchar(70) null,
	legal_desc varchar(255) null,
	cycle int null,
	value_method varchar(10) null,
	cost_value numeric(14,0) null,
	neighborhood varchar(64) null,
	
	failure_reason_min_comps bit not null,
	failure_reason_score bit not null,
	failure_reason_differential bit not null,

	primary key clustered (dataset_id, detail_id)
	with fillfactor = 100
)

--------------------------------------------------------------------------------
-- END - Market Approach Grids Not Created Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - Market Value Grid Report
--------------------------------------------------------------------------------

create table ##mkt_value_grid_report
(
	dataset_id bigint not null,
	
	criteria_description varchar(max) not null,
	
	primary key clustered (dataset_id)
	with fillfactor = 100
)

create table ##mkt_value_grid_report_detail
(
	dataset_id bigint not null,
	detail_id int identity(1,1) not null,
	
	year numeric(4,0) not null,
	sup_num int not null,
	prop_id int not null,
	chg_of_owner_id int not null,
	multi_prop_sale bit not null,
	
	hood_cd varchar(10) null,
	cycle int null,
	improv_sum_la numeric(18,1) null,
	improv_class_cd varchar(10) null,
	actual_year_built numeric(4,0) null,
	effective_year_built numeric(4,0) null,
	sale_date datetime null,
	adj_sale_price numeric(14,0) null,
	indicated_value_land numeric(14,0) null,
	indicated_value_improv numeric(14,0) null,
	cost_value_land numeric(14,0) null,
	cost_value_improv numeric(14,0) null,
	imv_ratio numeric(18,4) null,
	cost_ratio numeric(18,4) null,
	prior_year_mkt_val numeric(14,0) null,
	
	primary key clustered (dataset_id, detail_id)
	with fillfactor = 100
)

--------------------------------------------------------------------------------
-- END - Market Value Grid Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - REET Excise Number Report
--------------------------------------------------------------------------------

create table ##reet_excise_number_report
(
	dataset_id bigint not null,
	
	criteria_description varchar(max) not null,
	excise_number_begin int null,
	excise_number_end int null,
	
	additional_notes varchar(max) not null,
	
	primary key clustered (dataset_id)
	with fillfactor = 100
)

create table ##reet_excise_number_report_detail
(
	dataset_id bigint not null,
	excise_number int not null,

	cancelled_flag bit not null,
	
	primary key clustered (dataset_id, excise_number)
	with fillfactor = 100
)

--------------------------------------------------------------------------------
-- END - REET Excise Number Report
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - New Construction Certificate
--------------------------------------------------------------------------------

create table ##new_construction_certificate_report
(
		[dataset_id] int NOT NULL,
		[year] int NOT NULL,
		[county_name] varchar(30),
		[new_construction_value] numeric(14,2),
		CONSTRAINT [CPK_new_construction_certificate_report] PRIMARY KEY CLUSTERED 
		([dataset_id] ASC)
)

create table ##new_construction_prop_assoc
(
		dataset_id	int,
		prop_id		int,
		sup_num		int,
		prop_val_yr	numeric(4)
)

create table ##new_construction_detail
(
		dataset_id				int,
		prop_id					int,
		type					varchar(10),
		exempt_sub_type_cd		varchar(10),
		exempt_level			varchar(10),
		tax_area_id				int,
		tax_area_number			varchar(23),
		legal_acreage			numeric(14,4),
		land_val				numeric(14,0),
		ag_use_val			numeric(14,0),
		imp_val					numeric(14,0),
		pp_val					numeric(14,0),
		ex_local_assd_val		numeric(14,0),
		snr_dsbl_tot_frz		numeric(14,0),
		taxable_val				numeric(14,0),
		total_nc				numeric(14,0),
		prop_type_cd			char(5)
)


--------------------------------------------------------------------------------
-- END - REET Excise Number Report
--------------------------------------------------------------------------------


--------------------------------------------------------------------------------
-- Begin - DOR Assessment Certificate to BOE
--------------------------------------------------------------------------------

create table ##boe_cert
(
	[value_group] varchar(100) not null,
	[value] bigint not null,
	[dataset_id] int null
)

create table ##boe_cert_temp
(
	[dataset_id] int null,
	[Forest_Land_Assessed_Value] bigint null,
	[Current_Use_Land_Assessed_Value] bigint null,
	[Improvement_Value_on_Current_Use_Lands] bigint null,
	[Personal_Property_Assessed_Value] bigint null,
	[Real_Property_Assessed_Value] bigint null,
	[Senior_Freeze_Assessed_Value] bigint null,
	[Total_County_Locally_Assessed_Value] bigint null,
	[Total_Taxable_Assessed_Value_of_Real_Property] bigint null
)

--------------------------------------------------------------------------------
-- End - DOR Assessment Certificate to BOE
--------------------------------------------------------------------------------

create table ##ncoa_import_property_list
(
	[dataset_id] int not null,
	[acct_id] int not null,
	[file_as_name] varchar(70),
	[addr_line1] varchar(60),
	[addr_line2] varchar(60),
	[addr_line3] varchar(60),
	[addr_city] varchar(50),
	[addr_state] varchar(50),
	[addr_zip] varchar(10),
	[invalid_flag] bit
)


--------------------------------------------------------------------------------
-- Begin - DOR Composite Report
--------------------------------------------------------------------------------

create table ##dor_composite_report
(
		[dataset_id] int NOT NULL,
		[tax_district_id] int NOT NULL,
		[tax_district_desc] varchar(50) NOT NULL,
		[levy_rate] numeric(26,10) NOT NULL,
		[ag_val] numeric(20,0) NOT NULL,
		[acres] numeric(20,4) NOT NULL,
		CONSTRAINT [CPK_dor_composite_report] PRIMARY KEY CLUSTERED 
		([dataset_id] ASC, [tax_district_id] ASC)
)

--------------------------------------------------------------------------------
-- End - DOR Composite Report
--------------------------------------------------------------------------------

CREATE TABLE ##mass_create_property_list (
	[dataset_id] int NOT NULL,
	[prop_id] int NOT NULL,
	[year] int NOT NULL,
	[owner_id] int NULL,
	[file_as_name] varchar(70) NOT NULL,
	[legal_desc] varchar(255) NOT NULL
)

create table ##deleted_property_report
(
	dataset_id int not null,
	[year] numeric(4,0) not null,
	prop_id int not null,
	prop_inactive_dt datetime not null,
	file_as_name varchar(70) null,
	reason varchar(2048) null,
	constraint CPK_deleted_property_report primary key clustered
	(dataset_id, [year], prop_id)
)
-- END SDS 1003

-- BEGIN SDS 2035
create table ##senior_disable_exemption_review
(
	dataset_id int not null,
	prop_id int not null,
	owner_name varchar(70) null,
	request_date datetime null,
	review_status_cd varchar(10) null,
	exemption_sub_type varchar(10) null,
	qualify_year numeric(4,0) null,
	comment varchar(100) null,
	constraint CPK_senior_disable_exemption_review primary key clustered
	(dataset_id, prop_id)
)
-- END SDS 2035

-- BEGIN SDS 1003
CREATE TABLE ##election_information_report
(
	dataset_id INT NOT NULL,
	taxing_district VARCHAR(50),
	[description] VARCHAR(40),
	[year] NUMERIC(4, 0) NOT NULL,
	voted_amount NUMERIC(14, 0),
	voted_rate NUMERIC(13, 10),
	election_date DATETIME NOT NULL,
	term NUMERIC(3, 0),
	end_year NUMERIC(4, 0),
	pass BIT NOT NULL,
	FACTOR NUMERIC(13, 10)
)
-- END SDS 1003


--------------------------------------------------------------------------------
-- BEGIN - 1007 - Annexation
--------------------------------------------------------------------------------
create table ##annexation_property_listing_report
(
	[dataset_id] int NOT NULL,
	[prop_id] int,
	[year] int NOT NULL,
	[tax_district_desc] varchar(50),
	[annexation_code] varchar(10),
	[annexation_description] varchar(50),
	[land_value] numeric(14,0),
	[improvement_value] numeric(14,0),
	[current_use_value] numeric(14,0),
	[prior_tax_area] varchar(23),
	[new_tax_area] varchar(23),
	CONSTRAINT [CPK_annexation_property_listing_report] PRIMARY KEY CLUSTERED 
		([dataset_id] ASC, [prop_id] ASC, [year] ASC, [annexation_code] ASC)
)
create table ##annexations_by_tax_area_report
(
	[dataset_id] int NOT NULL,
	[annexation_id] int,
	[start_year] int,
	[annexation_code] varchar(10),
	[annexation_description] varchar(50),
	[ordinance_number] varchar(40),
	[effective_date] datetime,
	[destination_tax_area] varchar(23),
	[state_tax_area] varchar(50),
	[source_tax_area] varchar(23),
	[tax_district_type] varchar(50),
	[district_desc] varchar(50),
	[priority] int
)
create table ##annexation_prop_verification_report
(
	[dataset_id] int NOT NULL,
	[prop_id] int,
	[year] int NOT NULL,
	[annexation_code] varchar(10),
	[annexation_description] varchar(50),
	[owner_name] varchar(70),
	[land_value] numeric(14,0),
	[imprv_value] numeric(14,0),
	[total_value] numeric(14,0),
	[exemption_amount] numeric(14,0),
	[taxable_value] numeric(14,0),
	[current_use] char(1),
	[local_assessed] char(1),
	[prop_type_cd] char(5),
	[legal_acreage] numeric(14,4),
	CONSTRAINT [CPK_annexation_prop_verification_report] PRIMARY KEY CLUSTERED 
	(
		[dataset_id] ASC, [prop_id] ASC, [year] ASC, [annexation_code] ASC
	)
)
create table ##annexation_pending_tax_area_report
(
	[dataset_id] int NOT NULL,
	[year] int NOT NULL,
	[prior_tax_area] varchar(23),
	[pending_tax_area] varchar(23),
	[annexation_code] varchar(10),
	[annexation_description] varchar(50),
	[tax_district_desc] varchar(50),
	[effective_date] datetime,
	[source_levy] varchar(10),
	[source_fund] varchar(10),
	[source_fund_description] varchar(50),
	[destination_fund] varchar(10),
	[dest_fund_description] varchar(50)
)
--------------------------------------------------------------------------------
-- END - 1007 - Annexation
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - 2001 - Property Level Changes
--------------------------------------------------------------------------------
create table ##annual_adjustment_report
(
	[dataset_id] int NOT NULL,
	[hood_yr] numeric(4, 0) NOT NULL,
	[hood_cd] varchar(10) NOT NULL,
	[cycle] int NULL,
	[hood_land_pct] numeric(5, 2) NOT NULL,
	[hood_imprv_pct] numeric(5, 2) NOT NULL,
	[hood_comments] varchar(500) NULL,
	[abs_subdv_cd] varchar(10),
	[abs_subdv_desc] varchar(60),
	[abs_land_pct] numeric(5, 2),
	[abs_imprv_pct] numeric(5, 2),
	[abs_comments] varchar(500),
	CONSTRAINT [CPK_annual_adjustment_report] PRIMARY KEY CLUSTERED 
	([dataset_id] ASC, [hood_yr] ASC, [hood_cd], [abs_subdv_cd])
)
create table ##nbhd_inventory_minmax_report
(
		[dataset_id] int NOT NULL,
		[hood_cd] varchar(10) NOT NULL,
		[min_acres] numeric(18,4) NOT NULL,
		[max_acres] numeric(18,4) NOT NULL,
		CONSTRAINT [CPK_nbhd_inventory_minmax_report] PRIMARY KEY CLUSTERED 
		([dataset_id] ASC, [hood_cd] ASC)
)
create table ##nbhd_inventory_misc_report
(
		[dataset_id] int NOT NULL,
		[county_indicator] [numeric](1, 0) NOT NULL,
		[cycle] [numeric](1, 0) NOT NULL,
		[region_cd] [varchar](5) NULL,
		[rgn_name] [varchar](50),
		[hood_cd] [varchar](10) NULL,
		[subset_cd] [varchar](5) NULL,
		[subset_desc] [varchar](50),
		[misc_code] [varchar](6) NOT NULL,
		[misc_desc] [varchar](30) NOT NULL,
		[calc_value] [numeric](14, 0) NULL,
		[count] int NOT NULL
)
create table ##nbhd_inventory_land_report
(
		[dataset_id] int NOT NULL,
		[hood_cd] varchar(15) NOT NULL,
		[range_desc] varchar(30) NOT NULL,
		[min_value] numeric(18,4) NOT NULL,
		[max_value] numeric(18,4) NOT NULL,
		[count] int NOT NULL,
		CONSTRAINT [CPK_nbhd_inventory_land_report] PRIMARY KEY CLUSTERED 
		([dataset_id] ASC, [hood_cd] ASC, [range_desc] ASC, [min_value] ASC, [max_value] ASC)
)
create table ##nbhd_inventory_imprv_report
(
		[dataset_id] int NOT NULL,
		[hood_cd] varchar(15) NOT NULL,
		[class_cd] char(10) NOT NULL,
		[class_desc] varchar(50),
		[year_range_desc] varchar(30) NOT NULL,
		[sqft_range_desc] varchar(30) NOT NULL,
		[subclass_cd] varchar(10) NOT NULL,
		[subclass_desc] varchar(50),
		[count] int NOT NULL,
		CONSTRAINT [CPK_nbhd_inventory_imprv_report] PRIMARY KEY CLUSTERED 
		([dataset_id] ASC, [hood_cd] ASC, [class_cd] ASC, [class_desc] ASC, [year_range_desc] ASC, [sqft_range_desc] ASC, [subclass_cd] ASC, [subclass_desc] ASC)
)
--------------------------------------------------------------------------------
-- END - 2001 - Property Level Changes
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- BEGIN - 2037 - Expiring Remodel Exemptions
--------------------------------------------------------------------------------

create table ##expiring_remodel_exemptions
(
		[dataset_id] int NOT NULL,
		[prop_id] int NOT NULL,
		[owner_name] varchar(70) NULL,
		[app_num] varchar(15) NOT NULL,
		[imprv_det_assoc] int NOT NULL,
		[imprv_assoc] int NOT NULL,
		[exemption_amount] numeric(14,0) NULL,
		[assess_yr_removed] numeric(4,0) NOT NULL,
		[assess_yr_requalify] numeric(4,0) NOT NULL
		CONSTRAINT [CPK_expiring_remodel_exemptions] PRIMARY KEY CLUSTERED
		([dataset_id] ASC, [app_num] ASC, [prop_id] ASC, [imprv_assoc] ASC, [imprv_det_assoc] ASC)
)


--------------------------------------------------------------------------------
-- END - 2037 - Expiring Remodel Exemptions
--------------------------------------------------------------------------------
create table ##undeliverable_mail_report
(
	[dataset_id] int not null,
	[prop_id] int not null,
	[owner_id] int not null,
	[ml_return_type_cd] varchar(5),
	[file_as_name] varchar(70),
	[mailing_addr] varchar(max),
	[ml_returned_reason] varchar(50),
	[ml_returned_dt] datetime
)
--------------------------------------------------------------------------------
-- Begin - DEFERRAL REPORTS
--------------------------------------------------------------------------------

create table ##deferral_report
(
	[dataset_id] int not null,
	[year] numeric(4) not null,
	[prop_id] int not null,
	[application_number] varchar(25) not null,
	[owner_name] varchar(70) not null,
	[deferral_date] DateTime not null,
	[date_of_death] DateTime null
)

create table ##deferral_applications_report
(
	[dataset_id] int not null,
	[application_number] varchar(25) not null,
	[application_dt] DateTime not null,
	[amount] numeric(14,2) not null,
	[status] varchar(15) not null
)

create table ##deferral_images_report
(
	[dataset_id] int not null,
	[imageblob] image	
)

--------------------------------------------------------------------------------
-- End - DEFERRAL REPORTS
--------------------------------------------------------------------------------

create table ##business_closed_or_sold
(
	[dataset_id] int not null,
	[prop_id] int,
	[geo_id] varchar(50),
	[file_as_name] varchar(70),
	[dba_name] varchar(50),
	[situs_display] varchar(173),
	[prop_sic_cd] char(10),
	[ubi_number] varchar(50),
	[market] numeric(14, 0),
	[business_close_dt] datetime,
	[business_sold_dt] datetime
)

create table ##state_assessed_utilities_report
(
	dataset_id int not null,
	county_name varchar(30),
	criteria varchar(max)
)

create table ##state_assessed_utilities_data
(
	dataset_id int not null,
	state_tax_area varchar(50),
	tax_area_number varchar(23),
	owner_name varchar(70),
	real_value numeric(14,0),
	personal_value numeric(14,0)
)

create table [##ppra_masterlease_run]
(
	dataset_id int not null,
	appraisal_year numeric(4,0) not null,
	county_appraiser varchar(50) null,
	county_name varchar(30) null,
	county_address varchar(500) null,
	county_phone varchar(60) null,
	county_logo_blob varbinary(max) null,
	instructions_main varchar(max) null,
	instructions_supplies varchar(max) null,
	instructions_commercial varchar(max) null,
	instructions_farm varchar(max) null,
	instructions_leased varchar(max) null,
	instructions_penalty varchar(max) null,
	instructions_improvements varchar(max) null,
	instructions_cost varchar(max) null
)

create table ##ppra_masterlease
(
	dataset_id int not null,
	group_id int not null,
	year numeric(4,0) not null,
	owner_id int not null,
	file_as_name varchar(70) null,
	phone_num varchar(20) null,
	fax_num varchar(20) null,
	email_addr varchar(50) null,
	owner_address varchar(500) null,
	legal_desc varchar(500) null,
	dba varchar(50) null,
	sort_key int null,
	segment_id int null
)

create table [##ppra_masterlease_assets]
(
	dataset_id int not null,
	group_id int not null,
	prop_id int not null,
	pp_seg_id int null,
	pp_sub_seg_id int null,
	pp_mkt_val numeric(14,0) null,
	pp_type_cd char(10) null,
	description varchar(255) null,
	pp_yr_acquired numeric(4,0) null,
	pp_orig_cost numeric(14,0) null,
	sort_key int null,
	has_subsegments bit not null default 0,
	tax_area_number varchar(23) null,
	asset_id varchar(50) null,
	is_first_in_segment_group bit not null default 0
)

create table ##dor_updated_schedules_report
(
	dataset_id int,
	dor_schedule_cd varchar(25),
	type_cd varchar(10),
	deprec_cd varchar(10),
	age int,
	percentage numeric(5,2),
	deprec_year_max int,
	depres_year_pct decimal(5,2)
)

create table ##dor_non_updated_schedules_report
(
	dataset_id int,
	dor_schedule_cd varchar(25),
	age int,
	percentage decimal(5,2)
)

--------------------------------------------------------------------------------
-- Begin - MH MOVEMENT REPORTS
--------------------------------------------------------------------------------

create table ##mh_movement_report
(
	dataset_id int NOT NULL,
	mhm_id int NOT NULL,
	prop_id int,
	status_dt datetime,
	mhm_type_cd varchar(10),
	mhm_status_cd varchar(10),
	completed bit
)

create table ##mh_movement_decal_report
(
	dataset_id int NOT NULL,
	mbl_hm_make varchar(100),
	mbl_hm_model varchar(100),
	mbl_hm_year int,
	mbl_hm_sn varchar(100),
	mbl_hm_sn_2 varchar(100),
	transporter_desc varchar(50),
	wutc_permit_num	varchar(20),
	dot_permit_num varchar(20)
)

create table ##mhm_tax_certificate_report
(
	dataset_id int NOT NULL,
	mhm_id int NOT NULL,
	prop_id int NOT NULL,
	current_owner_name varchar(70),
	current_owner_addr_line1 varchar(60),
	current_owner_addr_line2 varchar(60),
	current_owner_addr_line3 varchar(60),
	current_owner_city varchar(50),
	current_owner_state varchar(50),
	current_owner_zip varchar(5),
	purchaser_type char(1),
	purchaser_name varchar(70),
	purchaser_addr_line1 varchar(60),
	purchaser_addr_line2 varchar(60),
	purchaser_addr_line3 varchar(60),
	purchaser_addr_city varchar(30),
	purchaser_addr_state varchar(2),
	purchaser_addr_zip varchar(5),
	purchaser_addr_zip_cass varchar(4),
	purchaser_addr_full varchar(max),
	purchase_price numeric(14,0),
	real_prop_owner_different bit,
	real_prop_owner_name varchar(70),
	transporter_desc varchar(50),
	wutc_permit_num varchar(20),  --New Column
	dot_permit_num varchar(20),   --New Column
	mbl_hm_make varchar(100),
	mbl_hm_model varchar(100),
	mbl_hm_year int,
	mbl_hm_sn varchar(100),
	mbl_hm_sn_2 varchar(100),
	mbl_hm_tip_out numeric(10,0),
	[length] numeric(18,1),
	[width] numeric(18,1),
	situs_display varchar(max),
	move_to_county varchar(20),
	move_to_num varchar(15),
	move_to_street_prefix varchar(10),
	move_to_street varchar(60),
	move_to_street_suffix varchar(10),
	move_to_street_unit varchar(5),
	move_to_city varchar(30),
	move_to_state varchar(2),
	move_to_zip varchar(10),
	comment varchar(80),
	tax_area_number varchar(max),
	assessments varchar(max)
)


create table ##mhm_proof_of_taxes_report
(
	dataset_id int NOT NULL,
	mhm_id int NOT NULL,
	prop_id int NOT NULL,
	current_owner_name varchar(70),
	current_owner_addr_line1 varchar(60),
	current_owner_addr_line2 varchar(60),
	current_owner_addr_line3 varchar(60),
	current_owner_city varchar(50),
	current_owner_state varchar(50),
	current_owner_zip varchar(5),
	purchaser_type char(1),
	purchaser_name varchar(70),
	purchaser_addr_line1 varchar(60),
	purchaser_addr_line2 varchar(60),
	purchaser_addr_line3 varchar(60),
	purchaser_addr_city varchar(30),
	purchaser_addr_state varchar(2),
	purchaser_addr_zip varchar(5),
	purchaser_addr_zip_cass varchar(4),
	purchase_price numeric(14,0),
	real_prop_owner_different bit,
	real_prop_owner_name varchar(70),
	transporter_desc varchar(50),
	mbl_hm_make varchar(100),
	mbl_hm_model varchar(100),
	mbl_hm_year int,
	mbl_hm_sn varchar(100),
	mbl_hm_sn_2 varchar(100),
	mbl_hm_tip_out numeric(10,0),
	[length] numeric(18,1),
	[width] numeric(18,1),
	situs_display varchar(max),
	receipt_num int
)

--------------------------------------------------------------------------------
-- End - MH MOVEMENT REPORTS
--------------------------------------------------------------------------------


CREATE TABLE ##dpr_criteria
(
	dataset_id int not null,
	county_name varchar(max),
	years varchar(max),
	bill_fee_codes varchar(max),
	tax_districts varchar(max),
	agencies varchar(max),
	fee_types varchar(max),
	delinquent_effective_date datetime,
	as_of_date datetime,
	CONSTRAINT CPK_dpr_criteria PRIMARY KEY CLUSTERED (dataset_id)
)

CREATE TABLE ##dpr_owner
(
	dataset_id int NOT NULL,
	owner_id int NOT NULL,
	owner_name varchar(70) NULL,
	address varchar(max),
	total_due numeric(14,2),	
	CONSTRAINT PK_dpr_owner PRIMARY KEY CLUSTERED (dataset_id, owner_id)
)

CREATE TABLE ##dpr_property
(
	dataset_id int NOT NULL,
	prop_id int NOT NULL,
	owner_id int NULL,
	geo_id varchar(50) NULL,
	situs_display varchar(175) NULL,
	legal_desc varchar(255) NULL,
	CONSTRAINT PK_dpr_property PRIMARY KEY CLUSTERED (dataset_id, prop_id)
)

CREATE TABLE ##dpr_statement
(
	dataset_id int NOT NULL,
	prop_id int NOT NULL,
	statement_id int NOT NULL,
	year numeric(4,0) NOT NULL,
	base_levy_due numeric(14,2), 
	base_sa_due numeric(14,2), 
	base_fees_due numeric(14,2), 
	penalty_due numeric(14,2),
	interest_due numeric(14,2),
	amount_paid numeric(14,2), 
	CONSTRAINT CPK_dpr_statement PRIMARY KEY CLUSTERED (dataset_id, prop_id, statement_id, year)
)

create table ##tif_property_report
(
	dataset_id int not null,
	tif_area_id int not null,
	name varchar(50) null,
	prop_id int not null,
	year numeric(4,0) not null,
	owner_name varchar(70) null,
	situs_display varchar(173) null,
	land_market numeric(14,0) null,
	imprv_market numeric(14,0) null,
	ag_market numeric(14,0) null,
	market numeric(14,0) null,
	taxable numeric(14,0) null,
	base_value numeric(14,0) null,
	levies varchar(max) null,
	tax_area_id int null,
	tax_area_number varchar(23) null,
	tax_area_description varchar(255) null
)

create table ##tif_report
(
	dataset_id int not null,
	year numeric(4,0) not null,
	tif_area_id int not null,
	tif_area_name varchar(50) null,
	base_value numeric(14,0) null,
	taxable_value numeric(14,0) null,
	market numeric(14,0) null,
	nc numeric(14,0) null,
	state_increase numeric(14,0) null,
	increment numeric(14,0) null,
	tax_area_numbers varchar(max) null,
	tax_districts varchar(max) null
)

create table ##tifcol_levy
(
	dataset_id int not null,
	levy_id int identity(1,1) not null,
	tif_area_id int,
	year numeric(4,0),
	tax_district_id int,
	levy_cd varchar(10),
	linked_tax_district_id int,
	linked_levy_cd varchar(10),
	tif_area_name varchar(50),
	tax_district_desc varchar(50),
	linked_tax_district_desc varchar(50)

	primary key (dataset_id, levy_id)
)

create table ##tifcol_bill
(
	dataset_id int not null,
	levy_id int not null,
	bill_id int not null,
	prop_id int null,
	owner_name varchar(70) null,
	original_tax numeric(14,2) null,
	adjusted_tax numeric(14,2) null,
	base_paid numeric(14,2) null,
	penalty_paid numeric(14,2) null,
	interest_paid numeric(14,2) null,
	current_paid numeric(14,2) null,
	prior_paid numeric(14,2) null,
	tax_due numeric(14,2) null,

	primary key (dataset_id, levy_id, bill_id)
)

create table ##tif_fiscal
(
	dataset_id int not null,
	tif_area_id int not null,
	tif_area_name varchar(50),

	constraint cpk_tif_fiscal primary key clustered (dataset_id, tif_area_id) 
)

create table ##tif_fiscal_area
(
	dataset_id int not null,
	tif_area_id int not null,
	year_due varchar(50) not null,
	group_by int null,
	uncollected_balance_begin numeric(14,2) null,
	additions_balance numeric(14,2) null,
	collections_balance numeric(14,2) null,
	cancellations_balance numeric(14,2) null,
	uncollected_balance_end numeric(14,2) null,

	constraint cpk_tif_fiscal_area primary key clustered (dataset_id, tif_area_id, year_due)
)

create table ##mass_update_half_pay_status_report
(
	dataset_id int not null,
	run_id int not null,
	county_name varchar(30) null,
	created_by_name varchar(30) null,
	created_date datetime,
	years_text varchar(max) null,
	new_status varchar(10) null,

	constraint cpk_mass_update_half_pay_status_report primary key clustered (dataset_id)
)

create table ##mass_update_half_pay_status_prop
(
	dataset_id int not null,	
	prop_id int not null,
	statement_id int not null,
	year numeric(4,0) not null,
	owner_id int not null,
	owner_name varchar(70) null,
	billfee_count int null,

	constraint cpk_mass_update_half_pay_status_prop primary key clustered (dataset_id, prop_id, statement_id, year, owner_id)
)

--------------------------------------------------------------------------------
-- Begin - Payment Import Tables
--------------------------------------------------------------------------------

CREATE TABLE ##prepare_run_calc_items
(
	payment_run_id int not null,
	trans_group_id int not null,
	is_bill bit,
	payment_date datetime,

	CONSTRAINT CPK_prepare_run_calc_items PRIMARY KEY CLUSTERED (payment_run_id, trans_group_id)
)

--------------------------------------------------------------------------------
-- End - Payment Import Tables
--------------------------------------------------------------------------------

CREATE TABLE ##reet_import_reject_report
(
	dataset_id int NOT NULL,
	import_id varchar(10) NOT NULL,
	agency_id decimal(4, 0) NOT NULL,
	instrument_type_cd char(10) NULL,
	sale_date datetime NOT NULL,
	sale_price numeric(11, 2) NOT NULL,
	reet_import_reject_cd varchar(30) NOT NULL,
	reet_import_reject_desc varchar(100) NULL,
	CONSTRAINT CPK_reet_import_reject_report PRIMARY KEY CLUSTERED (dataset_id, import_id)
)

GO

