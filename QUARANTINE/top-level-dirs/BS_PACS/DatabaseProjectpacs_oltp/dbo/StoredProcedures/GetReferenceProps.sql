

create procedure GetReferenceProps

as

	select distinct prop_id, reference_desc
	from property as p with(nolock)
	where
		p.reference_flag = 'T'
	order by p.prop_id asc

GO

