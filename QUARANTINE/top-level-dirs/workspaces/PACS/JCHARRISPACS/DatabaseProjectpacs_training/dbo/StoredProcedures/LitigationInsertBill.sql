
create procedure LitigationInsertBill
	@lLitigationID int,
	@lBillID int
as

set nocount on

	insert litigation_statement_assoc with(rowlock) 
	(litigation_id, statement_id, year)
	select @lLitigationID, b.statement_id, b.year 
	from bill b with (nolock)
	where b.bill_id = @lBillID

set nocount off

GO

