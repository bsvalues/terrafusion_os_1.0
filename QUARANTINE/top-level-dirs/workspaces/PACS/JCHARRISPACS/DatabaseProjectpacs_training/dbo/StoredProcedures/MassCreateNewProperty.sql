

-----------------------------------------------------------------------------
-- Procedure: MassCreateNewProperty
--
-- Purpose: Create a new property, developed for use by the new mass create
--	property function, but may be used for other purposes as well.
-----------------------------------------------------------------------------
CREATE PROCEDURE MassCreateNewProperty
	@in_batch_propid		int, -- property id that is set in mass_created_from 
	@in_owner_id			int,
	@in_year			numeric(4),
	@in_sup_num			int,

	@in_legal_desc			varchar(255),
	@in_legal_desc2			varchar(255),
	@in_geo_desc			varchar(50),
	@in_abssubdv			varchar(50),

	@in_block			varchar(50),
--/*hs22415	@in_lot_num			int,*/
	@in_lot_num			varchar(50),

	-- situs data
	@in_situs_num			varchar(15) = null,
	@in_situs_unit			varchar(5) = null,
	@in_situs_street_prefix		varchar(10) = null,
	@in_situs_street		varchar(50) = null,
	@in_situs_street_suffix		varchar(10) = null,
	@in_situs_city			varchar(30) = null,
	@in_situs_state			varchar(2) = null,
	@in_situs_zip			varchar(10) = null,

	-- property_val data
	@in_neighborhood		varchar(50) = null,
	@in_region			varchar(50) = null,
	@in_subset			varchar(50) = null,
	@in_mapid			varchar(20) = null,
	@in_mapsco			varchar(20) = null,
	@in_ref_id1			varchar(50) = null,
	@in_ref_id2			varchar(50) = null,

	@in_state_cd			varchar(5) = null,

	--
	@in_size_acres			numeric(18,4) = null,
	@in_size_sqft			numeric(18,2) = null,

	@in_land_type_code		varchar(10) = null, -- land_detail ??
	
	@in_condo_pct			numeric(13,10) = null, -- new table field
	@in_entity_list			varchar(2000) = null,
	@in_flag_acres_sqft		bit = null,
	@in_ls_mkt_id			int = null,
	@in_is_a_condo			bit = null,
	@in_event_id			int = null,
	@in_parent_propid 		int = null,
	
	@out_prop_id			int OUTPUT

AS
SET NOCOUNT ON

declare @situs_id			int
declare @primary_situs		char
declare @size_acres			numeric(18,4)
declare @size_sqft			numeric(18,2)
declare @in_prop_type_cd	char
declare @land_seg_id		int
declare @sale_id			int
declare @land_seg_sl_lock	char
declare @is_a_condo			int
declare @sid				int		--splitID


-- Set the correct size dimension
select @land_seg_id = 0
select @sale_id = 0
select @land_seg_sl_lock = 'N'
select @sid = 0



-- TODO: Check that these values are the ones I should use
select @primary_situs = 'Y'
select @situs_id = 1
select @in_prop_type_cd = 'R'

	-- Get the next available property id
	exec dbo.GetUniqueID 'property', @out_prop_id output, 1, 0

	-- Get the next available land seg id
	exec dbo.GetUniqueID 'land_detail', @land_seg_id output, 1, 0

	if @in_batch_propid = 0
		select @in_batch_propid = @out_prop_id

	--Now create a new property using:
	--CREATE PROCEDURE CreatePropertySupplementLayer 
	-- @input_prop_id        int,
	-- @input_current_supp 	 int,
	-- @input_tax_yr	 int,
	-- @input_new_supp     	 int,
	-- @input_new_yr	 int,
	-- @input_new_prop_id	 int = @input_prop_id

--	exec CreatePropertySupplementLayer @out_prop_id, 
--		@in_sup_num, @in_year, @in_sup_num, 
--		@in_year, @out_prop_id

	-- Insert newly created property with input values
	insert into property
	(
		prop_id,
		prop_type_cd,
		mass_created_from,
		geo_id,
		ref_id1,
		ref_id2,
		state_cd,
		prop_create_dt
	)
	Values
	(
		@out_prop_id,
		@in_prop_type_cd,
		@in_batch_propid,
		@in_geo_desc,
		@in_ref_id1,
		@in_ref_id2,
		@in_state_cd,
		GetDate()
	)
	-- Insert the newly created property's property_val data
	insert into property_val
	(
		abs_subdv_cd, 
		block,
		tract_or_lot,
		hood_cd,
		rgn_cd,
		subset_cd,
		map_id,
		mapsco,
		legal_desc,
		legal_desc_2,
		condo_pct,
		prop_id,
		sup_num,
		prop_val_yr,
		auto_build_legal,
		appr_method,
		recalc_flag
	)
	values
	(
		@in_abssubdv, 
		@in_block,
		@in_lot_num,
		@in_neighborhood,
		@in_region,
		@in_subset,
		@in_mapid,
		@in_mapsco,
		@in_legal_desc,
		@in_legal_desc2,
		@in_condo_pct,
		@out_prop_id,
		@in_sup_num,
		@in_year,
		'T',
		'C',
		'M'
	)
	-- Insert the newly created property's owner data
	-- Insert the newly created property's owner data
	insert into owner
	(
		owner_id,
		prop_id,
		sup_num,
		owner_tax_yr,
		updt_dt,
		pct_ownership,
		percent_type
	)
	values
	(
		@in_owner_id,
		@out_prop_id,
		@in_sup_num,
		@in_year,
		GetDate(),
		100,
		'O'
	)

	insert into prop_supp_assoc
	(
		prop_id,
		owner_tax_yr,
		sup_num
	)
	values
	(
		@out_prop_id,
		@in_year,
		@in_sup_num
	)


	-- Is this a condo ?
--	exec IsAbstractSubACondo @in_abssubdv, @is_a_condo

	if @in_is_a_condo = 0
	begin
		--Update the land detail table entry for the newly created property
		insert into land_detail
		(
			size_acres,
			size_square_feet,
			size_useable_acres,
			size_useable_square_feet,
			land_type_cd,
			prop_id,
			sup_num,
			prop_val_yr,
			land_seg_id,
			sale_id,
			land_seg_sl_lock,
			state_cd,
			ls_mkt_id,
			num_lots
		)
		values
		(
			@in_size_acres,
			@in_size_sqft,
			@in_size_acres,		--Useable acres is initialized with the same value as acres
			@in_size_sqft,		--Useable square feet is initialized with the same value as square feet
			@in_land_type_code,
			@out_prop_id,
			@in_sup_num,
			@in_year,
			@land_seg_id, 	-- land_seg_id
			@sale_id,
			@land_seg_sl_lock,
			@in_state_cd,
			@in_ls_mkt_id,
			1			
		)
	end
	--Insert a new situs table record
	if @in_situs_street is not null
	begin
		
		insert into situs (
			prop_id,
			situs_id,
			primary_situs,
			situs_num,
			situs_street_prefx,
			situs_street,
			situs_street_sufix,
			situs_unit,
			situs_city,
			situs_state,
			situs_zip
			)
		values
		(
			@out_prop_id,
			@situs_id,
			@primary_situs,
			@in_situs_num,
			@in_situs_street_prefix,
			@in_situs_street,
			@in_situs_street_suffix,
			@in_situs_unit,
			@in_situs_city,
			@in_situs_state,
			@in_situs_zip
		)
		

	end

	--TODO: Add entites to property
	execute AddEntitiesToProperty @out_prop_id, @in_sup_num, 
		@in_year, @in_entity_list

	--HS22415
	if @in_event_id !=0  
	begin
		insert into prop_event_assoc values (@out_prop_id,@in_event_id)
	end
	--HS 23664
	if @in_parent_propid !=0
	begin
		select top 1 @sid = split_id from split_assoc with(NOLOCK) where prop_id = @in_parent_propid
			

		if (@@ROWCOUNT =0)
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
				@in_parent_propid,
				@sid,
				GETDATE(),
				@in_size_acres,
				@in_legal_desc,
				(select top 1 a.file_as_name from account a with (nolock), owner o with (nolock) where a.acct_id = o.owner_id and o.prop_id = @in_parent_propid and o.owner_tax_yr = @in_year),
				@in_size_acres,
				@in_legal_desc,
				(select top 1 a.file_as_name from account a with (nolock), owner o with (nolock) where a.acct_id = o.owner_id and o.prop_id = @in_parent_propid and o.owner_tax_yr = @in_year)
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
			@in_parent_propid,
			@out_prop_id,
			@in_size_acres,
			@in_legal_desc,
			(select top 1 a.file_as_name from account a with (nolock), owner o with (nolock) where a.acct_id = o.owner_id and o.prop_id = @in_parent_propid and o.owner_tax_yr = @in_year)
	end


update property
set col_owner_id = owner.owner_id
from property,owner
where owner.prop_id = property.prop_id
and owner.sup_num = @in_sup_num
and owner.owner_tax_yr = @in_year
and property.prop_id = @out_prop_id

GO

