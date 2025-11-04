
create procedure LayerCopyTableAgentAssoc
	@lYear_From numeric(4,0),
	@lPropID_From int,
	@lYear_To numeric(4,0),
	@lPropID_To int,

	@lOwnerID int = null -- A specific owner
as

set nocount on

	if exists (
		select owner_tax_yr
		from agent_assoc with(nolock)
		where
			owner_tax_yr = @lYear_To and
			prop_id = @lPropID_To and
			(@lOwnerID is null or owner_id = @lOwnerID)
	)
	begin
		return(0)
	end

	insert dbo.agent_assoc with(rowlock) (
		owner_tax_yr,
		agent_id,
		arb_mailings,
		prop_id,
		ca_mailings,
		owner_id,
		expired_dt_tm,
		ent_mailings,
		appl_dt,
		eff_dt,
		exp_dt,
		agent_cmnt,
		purge_dt,
		auth_to_protest,
		auth_to_resolve,
		auth_confidential,
		auth_other
	)
	select
		@lYear_To,
		agent_id,
		arb_mailings,
		@lPropID_To,
		ca_mailings,
		owner_id,
		expired_dt_tm,
		ent_mailings,
		appl_dt,
		eff_dt,
		exp_dt,
		agent_cmnt,
		purge_dt,
		auth_to_protest,
		auth_to_resolve,
		auth_confidential,
		auth_other
	from dbo.agent_assoc as aa with(nolock)
	where
		aa.owner_tax_yr = @lYear_From and
		aa.prop_id = @lPropID_From and
		(@lOwnerID is null or aa.owner_id = @lOwnerID)


	return(0)

GO

