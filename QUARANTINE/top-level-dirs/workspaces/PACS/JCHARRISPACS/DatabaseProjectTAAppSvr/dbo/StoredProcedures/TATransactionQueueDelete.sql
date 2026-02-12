
create procedure TATransactionQueueDelete
	@l64TransactionQueueID bigint
as

set nocount on

	delete tb_ta_transaction_queue with(rowlock)
	where l64TransactionQueueID = @l64TransactionQueueID

GO

