
create procedure LitigationSearchProperty
	@lPropID int
as

	select distinct
		l.litigation_id,
		l.cause_num,
		l.bankruptcy_num,
		l.bankruptcy_status,
		l.status
	from litigation as l with(nolock)
	join litigation_statement_assoc as lba with(nolock) on
		l.litigation_id = lba.litigation_id
	join bill as b with(nolock) on
		lba.statement_id = b.statement_id and lba.year = b.year
	where
		b.prop_id = @lPropID
	order by
		l.litigation_id asc

GO

