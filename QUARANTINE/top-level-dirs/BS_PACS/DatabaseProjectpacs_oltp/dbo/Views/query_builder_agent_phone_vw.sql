
create view query_builder_agent_phone_vw
as

	select
		agent.agent_id, agent.agent_cd, agent.arb_docket_id, agent.inactive_flag,
		phone.phone_id, phone.phone_type_cd, phone.phone_num
	from agent with(nolock)
	left outer join phone with(nolock) on
		phone.acct_id = agent.agent_id

GO

