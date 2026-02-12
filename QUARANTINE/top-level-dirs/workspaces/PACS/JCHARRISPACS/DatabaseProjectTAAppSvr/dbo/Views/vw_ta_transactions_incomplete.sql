
create view vw_ta_transactions_incomplete

as

	select top 100 percent
		[Environment] = te.szEnvironmentName,
		[Component] = tc.szTransactionComponentName,
		[Priority] = case tq.lPriority
			when 3 then 'Lowest'
			when 2 then 'Low'
			when 1 then 'Medium'
			when 0 then 'Highest'
			else ''
		end,
		[User] = tq.szAppUser,
		[Large Job] = case tq.bLargeJob
			when 1 then 'Yes'
			else 'No'
		end,
		[Job Server] = tq.szSlaveMachineName,
		[Scheduled Job] = case
			when tq.l64AgentJobScheduleID > 0 then 'Yes'
			else 'No'
		end,
		[Vital Stats] = case
			when tq.szSlaveMachineName is null
			then 'Queued'
			else 'Execution Time = ' + convert(varchar(24), datediff(second, dtQueued, getutcdate())) + ' Seconds'
		end
	from tb_ta_transaction_queue as tq with(nolock)
	join tb_ta_transaction_environment as te with(nolock) on
		tq.lEnvironmentID = te.lEnvironmentID
	join tb_ta_transaction_component as tc with(nolock) on
		tq.lEnvironmentID = tc.lEnvironmentID and
		tq.lTransactionComponentID = tc.lTransactionComponentID
	where
		tq.dtTransactionEnd is null
	order by tq.l64TransactionQueueID asc

GO

