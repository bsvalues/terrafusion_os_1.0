
create procedure TAAgentJobSelect

as

	select
		taj.l64AgentJobID,
		taj.szAgentJobDescription,
		taj.lLoginIDRunAs,
		taj.lEnvironmentID,
		taj.lTransactionComponentID,
		taj.lPriority,
		taj.bPersistTransactionCompleteCallback,
		convert(int, datalength(taj.binParamsIn)),
		taj.binParamsIn
	from tb_ta_agent_job as taj with(nolock)
	join tb_ta_transaction_environment as te with(nolock) on
		taj.lEnvironmentID = te.lEnvironmentID
	where
		taj.bEnabled = 1 and
		te.bEnabled = 1
	order by
		taj.l64AgentJobID asc

	return( @@rowcount )

GO

