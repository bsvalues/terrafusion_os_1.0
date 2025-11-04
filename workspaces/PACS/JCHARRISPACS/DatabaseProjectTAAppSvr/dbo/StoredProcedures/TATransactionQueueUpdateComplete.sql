
create procedure TATransactionQueueUpdateComplete
	@l64TransactionQueueID bigint,
	@dtTransactionBegin datetime,
	@dtTransactionEnd datetime,
	@lHResult int,
	@szSlaveMachineName varchar(23),
	@l64JobCPU bigint,
	@l64SQLCPU bigint,
	@l64SQLIO bigint
as

set nocount on

	update tb_ta_transaction_queue with(rowlock) set
		dtTransactionBegin = @dtTransactionBegin,
		dtTransactionEnd = @dtTransactionEnd,
		lHResult = @lHResult,
		szSlaveMachineName = @szSlaveMachineName,
		l64JobCPU = @l64JobCPU,
		l64SQLCPU = @l64SQLCPU,
		l64SQLIO = @l64SQLIO
	where
		l64TransactionQueueID = @l64TransactionQueueID

GO

