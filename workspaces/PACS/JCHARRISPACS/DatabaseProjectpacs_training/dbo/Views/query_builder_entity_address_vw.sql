
create view query_builder_entity_address_vw
as

	select
		e.entity_id, e.entity_cd, e.entity_type_cd, e.entity_disb_bal, e.taxing_unit_num, e.mbl_hm_submission, e.freeports_allowed, e.ptd_multi_unit, e.appr_company_entity_cd, e.refund_default_flag, e.weed_control, e.fiscal_begin_date, e.fiscal_end_date, e.fiscal_year, e.county_taxing_unit_ind, e.collector_id, e.rendition_entity, e.enable_timber_78,
		address.addr_type_cd, address.primary_addr, address.addr_line1, address.addr_line2, address.addr_line3, address.addr_city, address.addr_state, address.country_cd, address.ml_returned_dt, address.ml_type_cd, address.ml_deliverable, address.ml_return_type_cd, address.ml_returned_reason, address.cass_dt, address.delivery_point, address.carrier_route, address.check_digit, address.update_flag, address.chg_reason_cd, address.last_change_dt, address.zip, address.cass, address.route, address.addr_zip, address.zip_4_2, address.is_international
	from entity as e with(nolock)
	left outer join address with(nolock) on
		address.acct_id = e.entity_id

GO

