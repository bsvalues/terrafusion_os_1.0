
create procedure TATransactionMonitorSelectQueue

as

	select *
	from tb_ta_transaction_queue
	order by l64TransactionQueueID desc

	return(@@rowcount)

GO

