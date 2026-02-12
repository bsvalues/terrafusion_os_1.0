
create procedure LayerCopyTableOwner
	@lYear_From numeric(4,0),
	@lSupNum_From int,
	@lPropID_From int,
	@lYear_To numeric(4,0),
	@lSupNum_To int,
	@lPropID_To int,

	@lOwnerIDFrom int = null, -- A specific owner
	@bCopyRollExemptionStateCodeEntity bit = 0 -- whether or not to copy roll_* columns
as

set nocount on

	insert dbo.owner with(rowlock) (
		owner_id,
		owner_tax_yr,
		prop_id,
		updt_dt,
		pct_ownership,
		owner_cmnt,
		over_65_defer,
		over_65_date,
		ag_app_filed,
		apply_pct_exemptions,
		sup_num,
		type_of_int,
		hs_prop,
		birth_dt,
		pct_imprv_hs,
		pct_imprv_nhs,
		pct_land_hs,
		pct_land_nhs,
		pct_ag_use,
		pct_ag_mkt,
		pct_tim_use,
		pct_tim_mkt,
		pct_pers_prop,
		udi_child_prop_id,
		percent_type,
		roll_exemption,
		roll_state_code,
		roll_entity,
		pct_ag_use_hs,
		pct_ag_mkt_hs,
		pct_tim_use_hs,
		pct_tim_mkt_hs,
		linked_cd
	)
	select
		owner_id,
		@lYear_To,
		@lPropID_To,
		updt_dt,
		pct_ownership,
		owner_cmnt,
		over_65_defer,
		over_65_date,
		ag_app_filed,
		apply_pct_exemptions,
		@lSupNum_To,
		type_of_int,
		hs_prop,
		birth_dt,
		pct_imprv_hs,
		pct_imprv_nhs,
		pct_land_hs,
		pct_land_nhs,
		pct_ag_use,
		pct_ag_mkt,
		pct_tim_use,
		pct_tim_mkt,
		pct_pers_prop,
		udi_child_prop_id,
		percent_type,
		case when @bCopyRollExemptionStateCodeEntity = 1 then roll_exemption else null end,
		case when @bCopyRollExemptionStateCodeEntity = 1 then roll_state_code else null end,
		case when @bCopyRollExemptionStateCodeEntity = 1 then roll_entity else null end,
		pct_ag_use_hs,
		pct_ag_mkt_hs,
		pct_tim_use_hs,
		pct_tim_mkt_hs,
		linked_cd
	from dbo.owner as o with(nolock)
	where
		o.owner_tax_yr = @lYear_From and
		o.sup_num = @lSupNum_From and
		o.prop_id = @lPropID_From and
		(@lOwnerIDFrom is null or o.owner_id = @lOwnerIDFrom)

	if ( @lOwnerIDFrom is null )
	begin
		insert dbo.prop_linked_owner with(rowlock) (
			prop_val_yr,
			sup_num,
			prop_id,
			owner_id,
			owner_desc,
			link_type_cd
		)
		select
			@lYear_To,
			@lSupNum_To,
			@lPropID_To,
			owner_id,
			owner_desc,
			link_type_cd
		from dbo.prop_linked_owner
		where
			prop_val_yr = @lYear_From and
			sup_num = @lSupNum_From and
			prop_id = @lPropID_From		
	end
	
	return(0)

GO

