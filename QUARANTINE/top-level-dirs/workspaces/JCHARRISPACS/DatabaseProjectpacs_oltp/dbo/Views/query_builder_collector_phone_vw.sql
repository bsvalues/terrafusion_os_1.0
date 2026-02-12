
create view query_builder_collector_phone_vw
as

	select
		collector.collector_id,
		phone.phone_id, phone.phone_type_cd, phone.phone_num
	from collector with(nolock)
	left outer join phone with(nolock) on
		phone.acct_id = collector.collector_id

GO

