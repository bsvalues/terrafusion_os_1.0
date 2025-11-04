
create procedure LitigationRemoveBill
	@lLitigationID int,
	@lBillID int
as

set nocount on

	delete litigation_statement_assoc with(rowlock)
	from litigation_statement_assoc lsa with(rowlock)
	inner join bill b with (nolock) 
		on lsa.statement_id = b.statement_id and lsa.year = b.year
	where
		lsa.litigation_id = @lLitigationID and
		b.bill_id = @lBillID

set nocount off

GO

