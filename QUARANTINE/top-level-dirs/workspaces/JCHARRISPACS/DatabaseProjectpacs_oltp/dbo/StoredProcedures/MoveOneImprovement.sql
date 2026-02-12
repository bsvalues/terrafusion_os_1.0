
CREATE procedure [dbo].[MoveOneImprovement]

	@imprv_id			int,
	@source_prop_id		int,
	@source_sup_num		int,
	@source_owner_id		int,

	@dest_prop_id		int,
	@dest_sup_num		int,
	@dest_year			int,

	@tax_yr				int,
	@owner_id			int,
	@event_type			varchar(20),
	@event_desc			varchar(30),
	@user_id			int,

	@new_imprv_id		int
AS
	SET XACT_ABORT ON
	SET NOCOUNT ON

	BEGIN TRAN
	
	DECLARE @sale_id	int
	DECLARE @isImprovementLocked bit
	DECLARE @sourceHasLockedImprovements bit 
	DECLARE @sourceHasLockedLand bit 
	
	SET @sale_id = 0
	SET @isImprovementLocked = 0
	SET @sourceHasLockedImprovements  = 0
	SET @sourceHasLockedLand  = 0	
	
		
	if exists(select 1 from imprv 
	where prop_id = @source_prop_id and	
	prop_val_yr = @tax_yr and
	imprv_id = @imprv_id and
	sup_num = @source_sup_num  and
	sale_id = @sale_id	and
	locked_val is not null)
	begin
	  set @isImprovementLocked = 1
	end
	
	
	

	INSERT INTO imprv
			 ([prop_id]
           ,[prop_val_yr]
           ,[imprv_id]
           ,[sup_num]
           ,[sale_id]
           ,[imprv_type_cd]
           ,[imprv_sl_locked]
           ,[primary_imprv]
           ,[imprv_state_cd]
           ,[imprv_homesite]
           ,[imprv_desc]
           ,[imprv_val]
           ,[misc_cd]
           ,[imp_new_yr]
           ,[imp_new_val]
           ,[imp_new_val_override]
           ,[original_val]
           ,[base_val]
           ,[calc_val]
           ,[adjusted_val]
           ,[living_area_up]
           ,[err_flag]
           ,[imprv_image_url]
           ,[imprv_cmnt]
           ,[mbl_hm_make]
           ,[mbl_hm_model]
           ,[mbl_hm_sn]
           ,[mbl_hm_hud_num]
           ,[mbl_hm_title_num]
           ,[imp_new_pc]
           ,[flat_val]
           ,[value_type]
           ,[imprv_adj_amt]
           ,[imprv_adj_factor]
           ,[imprv_mass_adj_factor]
           ,[imprv_val_source]
           ,[economic_pct]
           ,[physical_pct]
           ,[functional_pct]
           ,[economic_cmnt]
           ,[physical_cmnt]
           ,[functional_cmnt]
           ,[effective_yr_blt]
           ,[percent_complete]
           ,[percent_complete_cmnt]
           ,[ref_id1]
           ,[num_imprv]
           ,[mbl_hm_sn_2]
           ,[mbl_hm_sn_3]
           ,[mbl_hm_hud_num_2]
           ,[mbl_hm_hud_num_3]
           ,[stories]
           ,[arb_val]
           ,[dep_pct]
           ,[dep_cmnt]
           ,[dist_val]
           ,[hs_pct]
           ,[hs_pct_override]
           ,[primary_use_cd]
           ,[primary_use_override]
           ,[secondary_use_cd]
           ,[secondary_use_override]
           ,[actual_year_built]
           ,[building_number]
           ,[building_name]
           ,[flat_value_comment]
           ,[flat_value_user_id]
           ,[flat_value_date]
           ,[building_id]
		   ,[locked_val]
	)
    SELECT
			@dest_prop_id
			,@dest_year
           ,@new_imprv_id
           ,@dest_sup_num
           ,@sale_id
           ,[imprv_type_cd]
           ,[imprv_sl_locked]
           ,[primary_imprv]
           ,[imprv_state_cd]
           ,[imprv_homesite]
           ,[imprv_desc]
           ,[imprv_val]
           ,[misc_cd]
           ,[imp_new_yr]
           ,[imp_new_val]
           ,[imp_new_val_override]
           ,[original_val]
           ,[base_val]
           ,[calc_val]
           ,[adjusted_val]
           ,[living_area_up]
           ,[err_flag]
           ,[imprv_image_url]
           ,[imprv_cmnt]
           ,[mbl_hm_make]
           ,[mbl_hm_model]
           ,[mbl_hm_sn]
           ,[mbl_hm_hud_num]
           ,[mbl_hm_title_num]
           ,[imp_new_pc]
           ,[flat_val]
           ,[value_type]
           ,[imprv_adj_amt]
           ,[imprv_adj_factor]
           ,[imprv_mass_adj_factor]
           ,[imprv_val_source]
           ,[economic_pct]
           ,[physical_pct]
           ,[functional_pct]
           ,[economic_cmnt]
           ,[physical_cmnt]
           ,[functional_cmnt]
           ,[effective_yr_blt]
           ,[percent_complete]
           ,[percent_complete_cmnt]
           ,[ref_id1]
           ,[num_imprv]
           ,[mbl_hm_sn_2]
           ,[mbl_hm_sn_3]
           ,[mbl_hm_hud_num_2]
           ,[mbl_hm_hud_num_3]
           ,[stories]
           ,[arb_val]
           ,[dep_pct]
           ,[dep_cmnt]
           ,[dist_val]
           ,[hs_pct]
           ,[hs_pct_override]
           ,[primary_use_cd]
           ,[primary_use_override]
           ,[secondary_use_cd]
           ,[secondary_use_override]
           ,[actual_year_built]
           ,[building_number]
           ,[building_name]
           ,[flat_value_comment]
           ,[flat_value_user_id]
           ,[flat_value_date]
           ,@imprv_id
		   ,[locked_val]
           
	FROM imprv with(nolock)
	WHERE
	prop_id = @source_prop_id and	
	prop_val_yr = @tax_yr and
	imprv_id = @imprv_id and
	sup_num = @source_sup_num  and
	sale_id = @sale_id	

-- imprv_adj
	UPDATE imprv_adj
	SET
	prop_id = @dest_prop_id,
	sup_num = @dest_sup_num,
	prop_val_yr = @dest_year,
	imprv_id = @new_imprv_id
    WHERE
	prop_id = @source_prop_id and	
	prop_val_yr = @tax_yr and
	sup_num = @source_sup_num and
	sale_id = @sale_id and
	imprv_id = @imprv_id

-- imprv_owner_assoc
	UPDATE imprv_owner_assoc
	SET
	prop_id = @dest_prop_id,
	sup_num = @dest_sup_num,
	prop_val_yr = @dest_year,
	imprv_id = @new_imprv_id,
	owner_id = @owner_id,
	owner_pct = 100
    WHERE
	prop_id = @source_prop_id and	
	prop_val_yr = @tax_yr and
	sup_num = @source_sup_num and
	sale_id = @sale_id and
	imprv_id = @imprv_id and
	owner_id = @source_owner_id
	
-- imprv_sketch
	UPDATE imprv_sketch
	SET
	prop_id = @dest_prop_id,
	sup_num = @dest_sup_num,
	prop_val_yr = @dest_year,
	imprv_id = @new_imprv_id
    WHERE
	prop_id = @source_prop_id and	
	prop_val_yr = @tax_yr and
	sup_num = @source_sup_num and
	sale_id = @sale_id and
	imprv_id = @imprv_id
	
-- pacs_image (improvement sketch images)
	UPDATE pacs_image
	SET
	ref_id = @dest_prop_id,
	ref_year = @dest_year,
	ref_id1 = @new_imprv_id,
	ref_id2 = @dest_sup_num
	WHERE
	ref_type in ('SKTCH', 'PI') and
	ref_id = @source_prop_id and
	ref_year = @tax_yr and
	ref_id1 = @imprv_id and
	ref_id2 = @source_sup_num and
	ref_id3 = @sale_id
	
-- imprv_remodel
	UPDATE imprv_remodel
	SET
	prop_id = @dest_prop_id,
	sup_num = @dest_sup_num,
	[year] = @dest_year,
	imprv_assoc = @new_imprv_id
    WHERE
	prop_id = @source_prop_id and	
	[year] = @tax_yr and
	sup_num = @source_sup_num and
	imprv_assoc = @imprv_id
	
-- reet_mobile_home_imprv
	UPDATE reet_mobile_home_imprv
	SET
	prop_id = @dest_prop_id,
	sup_num = @dest_sup_num,
	[year] = @dest_year,
	imprv_id = @new_imprv_id
    WHERE
	prop_id = @source_prop_id and	
	[year] = @tax_yr and
	sup_num = @source_sup_num and
	imprv_id = @imprv_id

-- Updating Details relating to Improvement which is moved
	declare @imprv_detail_id int
	declare @new_imprv_detail_id int

	declare imprv_detail_cursor cursor for
	select imprv_det_id
	from
	imprv_detail with(nolock)
	where
	prop_id = @source_prop_id and	
	prop_val_yr = @tax_yr and
	sup_num = @source_sup_num and
	sale_id = @sale_id and
	imprv_id = @imprv_id
	order by
	imprv_det_id

	open imprv_detail_cursor
	fetch next from imprv_detail_cursor into @imprv_detail_id
	while @@fetch_status = 0
	begin
		exec dbo.GetUniqueID 'imprv_detail', @new_imprv_detail_id output, 1, 0
		
		Exec MoveOneImprovementDetail
		@source_prop_id,	
		@imprv_id,
		@source_sup_num,	
		
		@dest_prop_id,		
		@new_imprv_id,		
		@dest_sup_num,		
		@dest_year,

		@imprv_detail_id,	
		@tax_yr,
		@event_type,
		@event_desc,
		@user_id,
		@new_imprv_detail_id,
		0 -- do not create events for the details
		
		fetch next from imprv_detail_cursor into @imprv_detail_id
	end
	close imprv_detail_cursor

	deallocate imprv_detail_cursor

	DELETE imprv_exemption_assoc
	WHERE
	prop_id = @source_prop_id and	
	prop_val_yr = @tax_yr and
	imprv_id = @imprv_id and
	sup_num = @source_sup_num  and
	sale_id = @sale_id

	DELETE imprv_entity_assoc
	WHERE
	prop_id = @source_prop_id and	
	prop_val_yr = @tax_yr and
	imprv_id = @imprv_id and
	sup_num = @source_sup_num  and
	sale_id = @sale_id
	
	DELETE income_imprv_assoc
	WHERE
	income_yr = @tax_yr and
	sup_num = @source_sup_num and
	prop_id = @source_prop_id and
	imprv_id = @imprv_id
	
	DELETE imprv
	WHERE
		prop_id = @source_prop_id and	
		prop_val_yr = @tax_yr and
		imprv_id = @imprv_id and
		sup_num = @source_sup_num  and
		sale_id = @sale_id

	exec dbo.InsertEvent
	@source_prop_id,		
	@event_type,	
	@event_desc,	
	@user_id,
	'A',
	@RefID1 = @imprv_id,
	@RefID3 = @source_prop_id,
	@RefID4 = @dest_prop_id

	IF (@source_prop_id <> @dest_prop_id)
	BEGIN
		exec dbo.InsertEvent
		@dest_prop_id,		
		@event_type,	
		@event_desc,	
		@user_id,
		'A',
		@RefID1 = @imprv_id,
		@RefID3 = @source_prop_id,
		@RefID4 = @dest_prop_id	
	END 
	
	update property_val
	set recalc_flag = 'M'
	where prop_val_yr = @dest_year
	and sup_num = @dest_sup_num
	and prop_id = @dest_prop_id
	and recalc_flag = 'C'
	
	if @isImprovementLocked = 1
	begin
	update property_val
	set 
	has_locked_values = 1 
	where prop_val_yr = @dest_year
	and sup_num = @dest_sup_num
	and prop_id = @dest_prop_id
	end
	
	if exists(select 1 from imprv 
	where prop_id = @source_prop_id and	
	prop_val_yr = @tax_yr  and
	sup_num = @source_sup_num  
    and locked_val is not null)
	begin
	  set @sourceHasLockedImprovements = 1
	end
	
	if exists(select 1 from land_detail 
	where prop_id = @source_prop_id and	
	prop_val_yr = @tax_yr and
	sup_num = @source_sup_num and
	locked_val is not null)
	begin
	  set @sourceHasLockedLand = 1
	end
		
	IF (@sourceHasLockedImprovements = 0 and @sourceHasLockedLand = 0)
	 BEGIN
			 update property_val
			 set has_locked_values = 0 
			 where prop_id = @source_prop_id and	
	         prop_val_yr = @tax_yr and
	         sup_num = @source_sup_num 
     END
	
	
   
	
	COMMIT TRAN

GO

