
create procedure LayerCopyTableProperty
	@lPropID_From int,
	@lPropID_To int,
	@bDefaultColAgentOwnerOverride bit = 0
as

set nocount on

	if exists (
		select prop_id
		from dbo.property with(nolock)
		where prop_id = @lPropID_To
	)
	begin
		return(0)
	end


	/*
		Note that we do not copy the following:
			mass_created_from
			simple_geo_id
			reference_flag
			penpad_run_id
			reference_desc
			col_owner_id
			col_agent_id
			col_owner_yr
			col_owner_update_dt
			col_agent_update_dt
	*/

	insert dbo.property with(rowlock) (
		prop_id,
		prop_type_cd,
		prop_create_dt,
		ref_id1,
		ref_id2,
		geo_id,
		ams_load_dt,
		prop_cmnt,
		prop_sic_cd,
		dba_name,
		alt_dba_name,
		exmpt_reset,
		gpm_irrig,
		utilities,
		topography,
		road_access,
		other,
		zoning,
		remarks,
		state_cd,
		col_owner_override,
		col_agent_override
	)
	select
		@lPropID_To,
		prop_type_cd,
		/* prop_create_dt = */ getdate(),
		ref_id1,
		ref_id2,
		geo_id,
		ams_load_dt,
		prop_cmnt,
		prop_sic_cd,
		dba_name,
		alt_dba_name,
		exmpt_reset,
		gpm_irrig,
		utilities,
		topography,
		road_access,
		other,
		zoning,
		remarks,
		state_cd,
		case when @bDefaultColAgentOwnerOverride = 0 then col_owner_override else 1 end,
		case when @bDefaultColAgentOwnerOverride = 0 then col_agent_override else 1 end
	from dbo.property as p with(nolock)
	where
		p.prop_id = @lPropID_From


	return(0)

GO

