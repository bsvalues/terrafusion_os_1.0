
create view query_builder_taxserver_phone_vw
as

	select
		ts.taxserver_id, ts.taxserver_cd,
		phone.phone_id, phone.phone_type_cd, phone.phone_num
	from taxserver as ts with(nolock)
	left outer join phone with(nolock) on
		phone.acct_id = ts.taxserver_id

GO

