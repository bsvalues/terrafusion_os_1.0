
CREATE  PROCEDURE MassCreateNewProperties

	@source_prop_id			int,
	@source_year			numeric(4),
	@source_sup_num			int,
	@source_abssubdv		varchar(50),
	@source_block			varchar(50),
	@source_starting_lot_num	int,
	@source_number_of_props		int,
	@copy_agent_info_flag		bit = 0,
	@copy_situs_info_flag		bit = 0,
	@copy_property_groups_flag	bit = 0,
	@copy_ownership_history_flag 	bit = 0,
	@copy_property_links_flag	bit = 0,
	@auto_build_geo_format_id	int = 0,
	@parent_propid				int = 0

AS

SET NOCOUNT ON

declare @counter		int
declare @next_property_id	int
declare @strGeo	varchar(50)
declare @sid				int		--splitID
declare @legal_acre	numeric(14,4)
declare @legal_desc varchar(255)

select @sid = 0
select @counter = 1
select @legal_acre = 0.0
select @legal_desc = ''

WHILE (@counter <= @source_number_of_props)
BEGIN
	--Get the next_property_id
	exec dbo.GetUniqueID 'property', @next_property_id output, 1, 0

	--Now create a new property using noted stored procedure...
	--CREATE PROCEDURE CreatePropertySupplementLayer 
	-- @input_prop_id        int,
	-- @input_current_supp 	 int,
	-- @input_tax_yr	 int,
	-- @input_new_supp     	 int,
	-- @input_new_yr	 int,
	-- @input_new_prop_id	 int = @input_prop_id

	exec CreatePropertySupplementLayer @source_prop_id, @source_sup_num, @source_year, @source_sup_num, @source_year, @next_property_id

	--Auto build geo if necessary
	if @auto_build_geo_format_id <> 0
	begin
		exec MassCreatePropertiesAutoBuildGeo @source_abssubdv, @source_block, @source_starting_lot_num, @auto_build_geo_format_id, @strGeo OUTPUT

		update property
		set geo_id = @strGeo
		where prop_id = @next_property_id
	end

	--Update the newly created property with the mass_created_from value...
	update property
	set    mass_created_from = @source_prop_id,
			geo_id = CASE WHEN LEN(@strGeo) > 0 THEN @strGeo ELSE geo_id END
	where  prop_id = @next_property_id

	--Update the newly created property with the new Abs/Subdv code, Block number, and increment the Lot number...
	update property_val
	set 	abs_subdv_cd 	= @source_abssubdv, 
		block 		= @source_block,
		tract_or_lot 	= @source_starting_lot_num,
		recalc_flag	= 'M'
	where   prop_id 	= @next_property_id
	and     sup_num 	= @source_sup_num
	and	prop_val_yr 	= @source_year
	
	--Execute the auto-build legal procedure to update the legal description for this newly created property...
	exec AutoBuildLegal @next_property_id, @source_year

	--Copy agent information if necessary
	if @copy_agent_info_flag = 1
	begin
		insert into agent_assoc (
			owner_tax_yr, agent_id, arb_mailings, prop_id, ca_mailings, owner_id, expired_dt_tm, ent_mailings, appl_dt, eff_dt, exp_dt, agent_cmnt, purge_dt, auth_to_protest, auth_to_resolve, auth_confidential, auth_other
		)
		SELECT aa.owner_tax_yr,
				aa.agent_id,
				aa.arb_mailings,
				@next_property_id,
				aa.ca_mailings,
				aa.owner_id,
				aa.expired_dt_tm,
				aa.ent_mailings,
				aa.appl_dt,
				aa.eff_dt,
				aa.exp_dt,
				aa.agent_cmnt,
				aa.purge_dt,
				aa.auth_to_protest,
				aa.auth_to_resolve,
				aa.auth_confidential,
				aa.auth_other
		from agent_assoc as aa WITH (NOLOCK)
		where prop_id = @source_prop_id
		and owner_tax_yr = @source_year
	end

	--Copy situs information if necessary, street, city and zip only
	if @copy_situs_info_flag = 1
	begin
		exec MassCreateNewPropertiesCopySitusInfo @source_prop_id, @next_property_id
	end

	--Copy property groups if necessary
	if @copy_property_groups_flag = 1
	begin
		insert into prop_group_assoc (
			prop_id, prop_group_cd
		)
		select @next_property_id, prop_group_cd
		from prop_group_assoc WITH (NOLOCK)
		where prop_id = @source_prop_id
	end

	--Copy ownership history if necessary
	if @copy_ownership_history_flag = 1
	begin
		exec MassCreateNewPropertiesCopyOwnershipHistoryInfo @source_prop_id, @next_property_id
	end

	--Copy property links if necessary
	if @copy_property_links_flag = 1
	begin
		--Copy links from this property
		insert into property_assoc (
			parent_prop_id, child_prop_id, prop_val_yr, sup_num, 
			link_type_cd, link_sub_type_cd
		)
		select @next_property_id, child_prop_id, @source_year, @source_sup_num,
			link_type_cd, link_sub_type_cd
		from property_assoc WITH (NOLOCK)
		where parent_prop_id = @source_prop_id
		and prop_val_yr = @source_year
		and sup_num = @source_sup_num

		--Reverse the links
		insert into property_assoc (
			parent_prop_id, child_prop_id, prop_val_yr, sup_num,
			link_type_cd, link_sub_type_cd
		)
		select child_prop_id, @next_property_id, @source_year, @source_sup_num,
			link_type_cd, link_sub_type_cd
		from property_assoc WITH (NOLOCK)
		where parent_prop_id = @source_prop_id
		and prop_val_yr = @source_year
		and sup_num = @source_sup_num
	end



	--HS 23664
	if @parent_propid !=0
	begin
		select top 1 @sid = split_id from split_assoc with(NOLOCK) where prop_id = @parent_propid
			

		select top 1 @legal_acre = legal_acreage, @legal_desc = legal_desc from property_val with (nolock) where prop_id = @next_property_id and sup_num = 0 and prop_val_yr = @source_year

		if (@counter =1)
		begin
			exec dbo.GetUniqueID 'split_assoc', @sid output, 1, 0

			insert into split_assoc(
				prop_id,	
				split_id,
				split_dt,
				before_legal_acres,
				before_legal_desc,
				before_owner,
				after_legal_acres,
				after_legal_desc,
				after_owner
				)
			select
				@parent_propid,
				@sid,
				GETDATE(),
				@legal_acre,
				@legal_desc,
				(select top 1 a.file_as_name from account a with (nolock), owner o with (nolock) where a.acct_id = o.owner_id and o.prop_id = @parent_propid and o.owner_tax_yr = @source_year),
				@legal_acre,
				@legal_desc,
				(select top 1 a.file_as_name from account a with (nolock), owner o with (nolock) where a.acct_id = o.owner_id and o.prop_id = @parent_propid and o.owner_tax_yr = @source_year)
		end
		

		insert into split_into (
			split_id,
			parent_id,
			child_id,
			legal_acres,
			legal_desc,
			owner
			)
		select
			@sid,
			@parent_propid,
			@next_property_id,
			@legal_acre,
			@legal_desc,
			(select top 1 a.file_as_name from account a with (nolock), owner o with (nolock) where a.acct_id = o.owner_id and o.prop_id = @parent_propid and o.owner_tax_yr = @source_year)
	end


update property
set col_owner_id = owner.owner_id
from property,owner
where owner.prop_id = property.prop_id
and owner.sup_num = @source_sup_num
and owner.owner_tax_yr = @source_year
and property.prop_id = @next_property_id




	--Increment the Lot number for the next property...
	select @source_starting_lot_num = @source_starting_lot_num + 1

	--Increment the main counter so we'll know when to stop creating new property
	select @counter = @counter + 1
END

GO

