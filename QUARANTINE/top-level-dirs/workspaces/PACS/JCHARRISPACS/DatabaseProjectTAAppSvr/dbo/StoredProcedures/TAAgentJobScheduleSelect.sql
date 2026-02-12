
create procedure TAAgentJobScheduleSelect

as

	select
		tajs.l64AgentJobScheduleID,
		tajs.l64AgentJobID,
		tajs.dtTime,
		tajs.lDaysMask
	from tb_ta_agent_job_schedule as tajs with(nolock)
	join tb_ta_agent_job as taj with(nolock) on
		tajs.l64AgentJobID = taj.l64AgentJobID
	join tb_ta_transaction_environment as te with(nolock) on
		taj.lEnvironmentID = te.lEnvironmentID
	where
		tajs.bEnabled = 1 and
		taj.bEnabled = 1 and
		te.bEnabled = 1
	order by
		tajs.l64AgentJobID asc, tajs.l64AgentJobScheduleID asc

	return( @@rowcount )

GO

