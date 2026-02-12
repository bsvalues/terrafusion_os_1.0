

create procedure LitigationDeleteFee
	@lFeeID int
as

set nocount on

	delete fee_litigation_assoc with(rowlock)
	where
		fee_id = @lFeeID

	delete fee with(rowlock)
	where
		fee_id = @lFeeID
	
set nocount off

GO

