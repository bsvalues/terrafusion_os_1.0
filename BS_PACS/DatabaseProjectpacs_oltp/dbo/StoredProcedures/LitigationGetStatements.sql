
create procedure LitigationGetStatements
	@lLitigationID int
as

	select distinct
		bill.statement_id,
		bill.year,
		a.file_as_name,
		bill.prop_id
	from litigation_statement_assoc as lba with(nolock)
	join bill with(nolock) on
		lba.statement_id = bill.statement_id and lba.year = bill.year
	left outer join account as a with(nolock) on
		bill.owner_id = a.acct_id
	where
		lba.litigation_id = @lLitigationID
	order by
		bill.statement_id asc

GO

