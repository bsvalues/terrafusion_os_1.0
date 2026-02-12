
create view query_builder_entity_phone_vw
as

	select
		e.entity_id, e.entity_cd, e.entity_type_cd, e.entity_disb_bal, e.taxing_unit_num, e.mbl_hm_submission, e.freeports_allowed, e.ptd_multi_unit, e.appr_company_entity_cd, e.refund_default_flag, e.weed_control, e.fiscal_begin_date, e.fiscal_end_date, e.fiscal_year, e.county_taxing_unit_ind, e.collector_id, e.rendition_entity, e.enable_timber_78,
		phone.phone_id, phone.phone_type_cd, phone.phone_num
	from entity as e with(nolock)
	left outer join phone with(nolock) on
		phone.acct_id = e.entity_id

GO

