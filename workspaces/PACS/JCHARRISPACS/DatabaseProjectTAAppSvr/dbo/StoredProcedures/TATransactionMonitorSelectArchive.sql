
create procedure TATransactionMonitorSelectArchive

as

	select *
	from tb_ta_transaction_queue_archive
	order by
		lYear desc,
		lMonth desc,
		lDay desc,
		lEnvironmentID asc,
		lTransactionComponentID asc,
		lPriority asc,
		szSlaveMachineName asc,
		bLargeJob asc,
		bSuccess asc
	
	return(@@rowcount)

GO

