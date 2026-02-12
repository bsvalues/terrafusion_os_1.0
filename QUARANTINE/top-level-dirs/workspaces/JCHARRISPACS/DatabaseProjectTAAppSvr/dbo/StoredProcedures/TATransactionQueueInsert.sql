
create procedure TATransactionQueueInsert
	@l64TransactionQueueID bigint,
	@lEnvironmentID tinyint,
	@lTransactionComponentID int,
	@lPriority tinyint,
	@bLargeJob bit,
	@szAppUser varchar(63),
	@lSubTransactionID int,
	@l64AgentJobScheduleID bigint,
	@bPersistTransactionCompleteCallback bit,
	@l64TransactionQueueIDCallback bigint,
	@lLoginID int,
	@lHResult int,
	@dtQueued datetime,
	@uuidClientTransaction varchar(63),
	@bRecoverable bit,
	@szDescription varchar(511),
	@binParamsIn image
as

set nocount on

	insert tb_ta_transaction_queue with(rowlock) (
		l64TransactionQueueID, lEnvironmentID, lTransactionComponentID, lPriority,
		dtQueued, szAppUser, bLargeJob, lSubTransactionID,
		l64AgentJobScheduleID,
		bPersistTransactionCompleteCallback,
		l64TransactionQueueIDCallback,
		lHResult, lLoginID, uuidClientTransaction,
		bRecoverable, szDescription
	) values (
		@l64TransactionQueueID, @lEnvironmentID, @lTransactionComponentID, @lPriority,
		@dtQueued, @szAppUser, @bLargeJob, @lSubTransactionID,
		case when @l64AgentJobScheduleID = 0 then null else @l64AgentJobScheduleID end,
		@bPersistTransactionCompleteCallback,
		case when @l64TransactionQueueIDCallback = 0 then null else @l64TransactionQueueIDCallback end,
		@lHResult, @lLoginID, @uuidClientTransaction,
		@bRecoverable, @szDescription
	)

	insert tb_ta_transaction_queue_data with(rowlock) (l64TransactionQueueID, binParamsIn)
	values (@l64TransactionQueueID, @binParamsIn)
	
	return(0)

GO

