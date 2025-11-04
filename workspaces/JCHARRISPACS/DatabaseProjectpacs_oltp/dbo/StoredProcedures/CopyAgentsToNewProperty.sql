

CREATE PROCEDURE CopyAgentsToNewProperty
	@old_prop_id 		int,
	@old_prop_val_yr 	numeric(4,0),
	@new_prop_id 		int,
	@new_prop_val_yr 	numeric(4,0),
	@owner_id		int,
	@remove_old		bit = 0
AS


	exec dbo.LayerCopyTableAgentAssoc
		@old_prop_val_yr,
		@old_prop_id,
		@new_prop_val_yr,
		@new_prop_id,
		@owner_id -- A specific owner


if @remove_old = 1
begin
	delete	agent_assoc
	where	prop_id = @old_prop_id
	and	owner_tax_yr = @old_prop_val_yr
	and	owner_id = @owner_id
end

GO

