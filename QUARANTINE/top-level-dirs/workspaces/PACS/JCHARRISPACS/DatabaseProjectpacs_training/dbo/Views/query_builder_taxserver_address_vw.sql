
create view query_builder_taxserver_address_vw
as

	select
		ts.taxserver_id, ts.taxserver_cd,
		address.addr_type_cd, address.primary_addr, address.addr_line1, address.addr_line2, address.addr_line3, address.addr_city, address.addr_state, address.country_cd, address.ml_returned_dt, address.ml_type_cd, address.ml_deliverable, address.ml_return_type_cd, address.ml_returned_reason, address.cass_dt, address.delivery_point, address.carrier_route, address.check_digit, address.update_flag, address.chg_reason_cd, address.last_change_dt, address.zip, address.cass, address.route, address.addr_zip, address.zip_4_2, address.is_international
	from taxserver as ts with(nolock)
	left outer join address with(nolock) on
		address.acct_id = ts.taxserver_id

GO

