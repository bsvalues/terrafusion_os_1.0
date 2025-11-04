
create procedure LayerDeleteTableAgentAssoc
	@lYear numeric(4,0),
	@lPropID int,

	@lOwnerID int = null -- A specific owner
as

set nocount on


	delete aa
	from dbo.agent_assoc as aa with(rowlock)
	where
		aa.owner_tax_yr = @lYear and
		aa.prop_id = @lPropID and
		(@lOwnerID is null or aa.owner_id = @lOwnerID)


	return(0)

GO

