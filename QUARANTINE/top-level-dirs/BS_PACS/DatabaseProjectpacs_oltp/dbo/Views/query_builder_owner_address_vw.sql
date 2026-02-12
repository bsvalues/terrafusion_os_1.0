
create view query_builder_owner_address_vw
as

	select
		o.owner_id, o.owner_tax_yr, o.prop_id, o.updt_dt, o.pct_ownership, o.owner_cmnt, o.over_65_defer, o.over_65_date, o.ag_app_filed, o.apply_pct_exemptions, o.sup_num, o.type_of_int, o.hs_prop, o.birth_dt, o.roll_exemption, o.roll_state_code, o.roll_entity, o.pct_imprv_hs, o.pct_imprv_nhs, o.pct_land_hs, o.pct_land_nhs, o.pct_ag_use, o.pct_ag_mkt, o.pct_tim_use, o.pct_tim_mkt, o.pct_pers_prop, o.udi_child_prop_id, o.percent_type,
		address.addr_type_cd, address.primary_addr, address.addr_line1, address.addr_line2, address.addr_line3, address.addr_city, address.addr_state, address.country_cd, address.ml_returned_dt, address.ml_type_cd, address.ml_deliverable, address.ml_return_type_cd, address.ml_returned_reason, address.cass_dt, address.delivery_point, address.carrier_route, address.check_digit, address.update_flag, address.chg_reason_cd, address.last_change_dt, address.zip, address.cass, address.route, address.addr_zip, address.zip_4_2, address.is_international
	from owner as o with(nolock)
	left outer join address with(nolock) on
		address.acct_id = o.owner_id

GO

