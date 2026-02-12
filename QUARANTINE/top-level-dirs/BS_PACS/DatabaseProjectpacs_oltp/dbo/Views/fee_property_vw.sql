
create view fee_property_vw
as

	select fee_id, prop_id
	from fee_prop_assoc with(nolock)

	union

	select bfa.fee_id, b.prop_id
	from bill_fee_assoc as bfa with(nolock)
	join bill as b with(nolock) on
		b.bill_id = bfa.bill_id

	union
	
	select fee_id, prop_id = 0
	from reet_fee_assoc
	with (nolock)
	
	union
	
	select fee_id, prop_id = 0
	from fee_acct_assoc
	with (nolock)

GO

