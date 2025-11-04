
create procedure TATransactionQueueSelect

as

set nocount on

	-- Delete non recoverable transactions that were active
	-- but not completed at the time of the last shutdown
	delete dbo.tb_ta_transaction_queue with(tablockx)
	where
		dtTransactionEnd is null and
		isnull(bRecoverable, 0) = 0

	-- If there were profiled transactions incomplete at last
	-- shutdown, they may have executed SQL that was then stored
	-- in the profile.  Since they were unfinished, clean up.
	delete tps with(tablockx)
	from dbo.tb_ta_profile_sql as tps with(tablockx)
	where not exists (
		select *
		from tb_ta_transaction_queue as tq with(tablockx)
		where tq.l64TransactionQueueID = tps.l64TransactionQueueID
	)
	
set nocount off

	select
		ttq.l64TransactionQueueID, ttq.lEnvironmentID, ttq.lTransactionComponentID,
		ttq.lPriority, ttq.szAppUser,
		tajs.l64AgentJobID,
		ttq.bPersistTransactionCompleteCallback, ttq.l64TransactionQueueIDCallback,
		ttq.lHResult,
		isnull(ttq.lLoginID, 0),
		datalength(tqd.binParamsIn),
		tqd.binParamsIn,
		convert(varchar(63), ttq.uuidClientTransaction)
	from tb_ta_transaction_queue as ttq with(nolock)
	join tb_ta_transaction_queue_data as tqd with(nolock) on
		tqd.l64TransactionQueueID = ttq.l64TransactionQueueID
	left outer join tb_ta_agent_job_schedule as tajs with(nolock) on
		tajs.l64AgentJobScheduleID = ttq.l64AgentJobScheduleID
	where ttq.dtTransactionEnd is null
	order by ttq.l64TransactionQueueID asc

	return( @@rowcount )

GO

