
create procedure TATransactionQueueSelectMaxID
	@l64TransactionQueueIDMax bigint output
as

set nocount on

	set @l64TransactionQueueIDMax = null

	select @l64TransactionQueueIDMax = max(l64TransactionQueueID)
	from tb_ta_transaction_queue with(nolock)

	if ( @l64TransactionQueueIDMax is null )
	begin
		set @l64TransactionQueueIDMax = 0
	end

	return(0)

GO

