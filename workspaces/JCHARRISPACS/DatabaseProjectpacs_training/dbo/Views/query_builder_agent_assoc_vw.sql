
create view query_builder_agent_assoc_vw
as

	select
		aa.owner_tax_yr, aa.agent_id, aa.arb_mailings, aa.prop_id, aa.ca_mailings, aa.owner_id, aa.expired_dt_tm, aa.ent_mailings, aa.appl_dt, aa.eff_dt, aa.exp_dt, aa.agent_cmnt, aa.purge_dt, aa.auth_to_protest, aa.auth_to_resolve, aa.auth_confidential, aa.auth_other,
		agent.agent_cd, agent.arb_docket_id, agent.inactive_flag,
		a.first_name, a.last_name, a.file_as_name, a.dl_num, a.dl_state, a.dl_expir_dt, a.merged_acct_id, a.acct_create_dt, a.opening_balance, a.comment, a.misc_code, a.ref_id1, a.source, a.ref_acct_id, a.confidential_flag, a.confidential_file_as_name, a.confidential_first_name, a.confidential_last_name, a.dist_m_n_o, a.dist_i_n_s, a.dist_pi, a.dist_atty_fees, a.dist_overages, a.dist_tax_cert_fees, a.dist_misc_fees, a.dist_vit, a.email_addr, a.web_addr, a.ftp_addr, a.update_dt, a.web_suppression, a.appr_company_id
	from agent_assoc as aa with(nolock)
	join agent with(nolock) on
		agent.agent_id = aa.agent_id
	join account as a with(nolock) on
		a.acct_id = aa.agent_id

GO

