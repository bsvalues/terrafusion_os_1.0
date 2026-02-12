
create procedure TATransactionQueueArchive
	@lTransactionEndMax int
as

set nocount on

	declare @dtTransactionEndMax datetime
	set @dtTransactionEndMax = dateadd(second, @lTransactionEndMax, '01/01/1970')

	begin transaction

	insert tb_ta_transaction_queue_archive with(tablockx) (
		lYear, lMonth, lDay,
		lEnvironmentID, lTransactionComponentID, lPriority,
		szSlaveMachineName, bLargeJob, bSuccess,
		l64TransactionCount,
		lMinSecondsQueue, lMinSecondsTransaction, lMinSecondsTotal,
		lMaxSecondsQueue, lMaxSecondsTransaction, lMaxSecondsTotal,
		lAvgSecondsQueue, lAvgSecondsTransaction, lAvgSecondsTotal
	)
	select distinct
		datepart(year, dtTransactionEnd), datepart(month, dtTransactionEnd), datepart(day, dtTransactionEnd),
		lEnvironmentID, lTransactionComponentID, lPriority,
		isnull(szSlaveMachineName, ''), bLargeJob, isnull(bSuccess, 0),
		count_big(l64TransactionQueueID),
		min( datediff(second, dtQueued, dtTransactionBegin) ),
		min( datediff(second, dtTransactionBegin, dtTransactionEnd) ),
		min( datediff(second, dtQueued, dtTransactionEnd) ),
		max( datediff(second, dtQueued, dtTransactionBegin) ),
		max( datediff(second, dtTransactionBegin, dtTransactionEnd) ),
		max( datediff(second, dtQueued, dtTransactionEnd) ),
		avg( datediff(second, dtQueued, dtTransactionBegin) ),
		avg( datediff(second, dtTransactionBegin, dtTransactionEnd) ),
		avg( datediff(second, dtQueued, dtTransactionEnd) )
	from tb_ta_transaction_queue with(tablockx)
	where
		dtTransactionEnd < @dtTransactionEndMax
	group by
		datepart(year, dtTransactionEnd), datepart(month, dtTransactionEnd), datepart(day, dtTransactionEnd),
		lEnvironmentID, lTransactionComponentID, lPriority,
		isnull(szSlaveMachineName, ''), bLargeJob, isnull(bSuccess, 0)
	order by
		1 asc, 2 asc, 3 asc, 4 asc, 5 asc

	delete tps with(tablockx)
	from tb_ta_profile_sql as tps with(tablockx)
	join tb_ta_transaction_queue as tq with(tablockx) on
		tq.l64TransactionQueueID = tps.l64TransactionQueueID and
		tq.dtTransactionEnd < @dtTransactionEndMax

	delete tb_ta_transaction_queue with(tablockx)
	where
		dtTransactionEnd < @dtTransactionEndMax

	commit transaction

	return(0)

GO

