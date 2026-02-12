
create procedure LitigationRemoveProperty
	@lLitigationID int,
	@lPropID int
as

set nocount on

	delete litigation_statement_assoc with(rowlock)
	from litigation_statement_assoc with(rowlock)
	join bill with(rowlock) on
		litigation_statement_assoc.statement_id = bill.statement_id 
		and litigation_statement_assoc.year = bill.year
	where
		litigation_statement_assoc.litigation_id = @lLitigationID and
		bill.prop_id = @lPropID

set nocount off

GO

