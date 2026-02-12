
create view query_builder_entity_prop_assoc_vw
as

	select
		epa.entity_id, epa.prop_id, epa.entity_prop_id, epa.entity_prop_pct, epa.conv_taxable_val, epa.conv_taxable_value, epa.sup_num, epa.tax_yr, epa.annex_yr, epa.entity_taxable_val, epa.pct_imprv_hs, epa.pct_imprv_nhs, epa.pct_land_hs, epa.pct_land_nhs, epa.pct_ag_use, epa.pct_ag_mkt, epa.pct_tim_use, epa.pct_tim_mkt,
		e.entity_cd, e.entity_type_cd, e.entity_disb_bal, e.taxing_unit_num, e.mbl_hm_submission, e.freeports_allowed, e.ptd_multi_unit, e.appr_company_entity_cd, e.refund_default_flag, e.weed_control, e.fiscal_begin_date, e.fiscal_end_date, e.fiscal_year, e.county_taxing_unit_ind, e.collector_id, e.rendition_entity, e.enable_timber_78,
		a.first_name, a.last_name, a.file_as_name, a.dl_num, a.dl_state, a.dl_expir_dt, a.merged_acct_id, a.acct_create_dt, a.opening_balance, a.comment, a.misc_code, a.ref_id1, a.source, a.ref_acct_id, a.confidential_flag, a.confidential_file_as_name, a.confidential_first_name, a.confidential_last_name, a.dist_m_n_o, a.dist_i_n_s, a.dist_pi, a.dist_atty_fees, a.dist_overages, a.dist_tax_cert_fees, a.dist_misc_fees, a.dist_vit, a.email_addr, a.web_addr, a.ftp_addr, a.update_dt, a.web_suppression, a.appr_company_id,
		entityCodeList = dbo.fn_GetEntities(epa.prop_id, epa.tax_yr, epa.sup_num)
	from entity_prop_assoc as epa with(nolock)
	join entity as e with(nolock) on
		e.entity_id = epa.entity_id
	join account as a with(nolock) on
		a.acct_id = epa.entity_id

GO

