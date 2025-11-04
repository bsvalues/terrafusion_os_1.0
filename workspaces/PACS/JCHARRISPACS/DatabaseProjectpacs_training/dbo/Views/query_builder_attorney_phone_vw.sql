
create view query_builder_attorney_phone_vw
as

	select
		attorney.attorney_id,
		phone.phone_id, phone.phone_type_cd, phone.phone_num
	from attorney with(nolock)
	left outer join phone with(nolock) on
		phone.acct_id = attorney.attorney_id

GO

