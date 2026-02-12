
create view query_builder_mortgage_phone_vw
as

	select
		mc.mortgage_co_id, mc.mortgage_cd, mc.taxserver, mc.taxserver_id, mc.lender_num,
		phone.phone_id, phone.phone_type_cd, phone.phone_num
	from mortgage_co as mc with(nolock)
	left outer join phone with(nolock) on
		phone.acct_id = mc.mortgage_co_id

GO

