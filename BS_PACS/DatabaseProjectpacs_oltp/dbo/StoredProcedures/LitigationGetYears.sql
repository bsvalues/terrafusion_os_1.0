
create procedure LitigationGetYears
	@lLitigationID int
as

	select distinct bill.year
	from litigation_statement_assoc as lba with(nolock)
	join bill with(nolock) on
		lba.statement_id = bill.statement_id and lba.year = bill.year
	where
		lba.litigation_id = @lLitigationID
	order by
		1 asc

GO

