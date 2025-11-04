
create view query_builder_owner_jan1_vw
as

	select
		o.owner_id, o.owner_tax_yr, o.prop_id, o.updt_dt, o.pct_ownership, o.owner_cmnt, o.over_65_defer, o.over_65_date, o.ag_app_filed, o.apply_pct_exemptions, o.type_of_int, o.hs_prop, o.birth_dt, o.roll_exemption, o.roll_state_cd, o.roll_entity, o.pct_imprv_hs, o.pct_imprv_nhs, o.pct_land_hs, o.pct_land_nhs, o.pct_ag_use, o.pct_ag_mkt, o.pct_tim_use, o.pct_tim_mkt, o.pct_pers_prop, o.udi_child_prop_id, o.percent_type, o.sup_num,
		a.first_name, a.last_name, a.file_as_name, a.dl_num, a.dl_state, a.dl_expir_dt, a.merged_acct_id, a.acct_create_dt, a.opening_balance, a.comment, a.misc_code, a.ref_id1, a.source, a.ref_acct_id, a.confidential_flag, a.confidential_file_as_name, a.confidential_first_name, a.confidential_last_name, a.dist_m_n_o, a.dist_i_n_s, a.dist_pi, a.dist_atty_fees, a.dist_overages, a.dist_tax_cert_fees, a.dist_misc_fees, a.dist_vit, a.email_addr, a.web_addr, a.ftp_addr, a.update_dt, a.web_suppression, a.appr_company_id
	from owner_jan1 as o with(nolock)
	join account as a with(nolock) on
		a.acct_id = o.owner_id

GO

