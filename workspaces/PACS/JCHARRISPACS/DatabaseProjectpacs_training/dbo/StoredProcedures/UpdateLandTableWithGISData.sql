
CREATE PROCEDURE UpdateLandTableWithGISData

	@prop_id int,
	@land_seg_id int,
	@year numeric(4,0),
	@sup_num int,
	@split_prop_id int = 0,
	@pacs_user_id int,
	@sup_num_to int = 0
as

SET NOCOUNT ON
DECLARE @StartProc datetime
    SET @StartProc = getdate()
DECLARE @StartStep datetime
DECLARE @LogTotRows int
DECLARE @LogStatus varchar(200)
DECLARE @LogErrCode int
DECLARE @qry varchar(1000)
 declare @proc varchar(100)
 set @proc = object_name(@@procid)
 
 SET @qry = 'Start - ' + @proc  
 + ' @prop_id =' +  convert(varchar(30),@prop_id) + ','
 + ' @land_seg_id =' +  convert(varchar(30),@land_seg_id) + ','
 + ' @year =' +  convert(varchar(30),@year) + ','
 + ' @sup_num =' +  convert(varchar(30),@sup_num) + ','
 + ' @split_prop_id =' +  convert(varchar(30),@split_prop_id) + ','
 + ' @pacs_user_id =' +  convert(varchar(30),@pacs_user_id) + ','
 + ' @sup_num_to =' +  convert(varchar(30),@sup_num_to) 
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */
 

declare @ls_mkt_id int
declare @ls_ag_id int
declare @num_rows_updated int

declare @new_seg_id int
declare @property_id int
declare @land_id int
declare @acres numeric(18,4)
declare @market_unit_price numeric(14,2)
declare @current_use_unit_price numeric(14,2)
declare @land_seg_prop_id int

declare @set_ag_apply bit
declare @ag_apply char(1)
declare @set_ag_use_cd bit
declare @ag_use_cd char(5)
declare @set_application_number bit
declare @application_number varchar(16)
declare @change_land_type_cd bit
declare @new_land_type_cd char(10)

	
set @num_rows_updated = 0

set @StartStep = getdate()  --logging capture start time of step

select @ls_mkt_id = ls_id
from land_sched
with (nolock)
where ls_year = @year
and ls_code = 'SPECIAL'
and ls_ag_or_mkt = 'M'
and ls_method = 'A'

 
-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step

select @ls_ag_id = ls_id
from land_sched
with (nolock)
where ls_year = @year
and ls_code = 'SPECIAL'
and ls_ag_or_mkt = 'A'
and ls_method = 'A'

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 2 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step

-- this is used for the mass import

if @prop_id = -1 and @land_seg_id = -1
begin
	declare curLand cursor fast_forward
	for select lut.prop_id_field, lut.from_land_id_field, lut.acres, lut.market_unit_price, 
						lut.current_use_unit_price, ld.prop_id
			from land_update_table as lut
			with (nolock)
			join land_detail as ld
			with (nolock)
			on lut.year_field = ld.prop_val_yr
			and lut.from_land_id_field = ld.land_seg_id
			and ld.sale_id = 0
			and ld.sup_num = 0
			where year_field = @year
			and from_land_id_field > 0

	open curLand

	fetch next from curLand into @property_id, @land_id, @acres, @market_unit_price, @current_use_unit_price,
																@land_seg_prop_id

	while @@fetch_status = 0
	begin
		exec @new_seg_id = dbo.LayerCopyLand
			-- From
			@year,
			@sup_num,
			0,
			@land_seg_prop_id,
			-- To
			@year,
			@sup_num_to,
			0,
			@property_id,
	
			1, -- Assign new IDs
			@land_id, -- One land segment
			1, 1, 1 -- Skip entity/exemption/owner assoc

		update land_update_table
		set land_id_field = @new_seg_id,
				from_land_id_field = 0
		where prop_id_field = @property_id
		and year_field = @year
		and from_land_id_field = @land_id
		
		fetch next from curLand into @property_id, @land_id, @acres, @market_unit_price, @current_use_unit_price,
																@land_seg_prop_id
	end

	close curLand
	deallocate curLand
	
	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 3 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step

	update ld
	    set size_acres = lut.acres,
			size_square_feet = lut.acres * 43560,
			mkt_unit_price = lut.market_unit_price,
			ag_unit_price = case 
				when (ld.ag_apply = 'T' and lut.set_ag_apply = 0) or
					 (lut.ag_apply = 'T' and lut.set_ag_apply = 1) 
				then lut.current_use_unit_price 
				else null end,	             
			ls_mkt_id = @ls_mkt_id,
			ls_ag_id = case
				when (ld.ag_apply = 'T' and lut.set_ag_apply = 0) or
					 (lut.ag_apply = 'T' and lut.set_ag_apply = 1)				
				then @ls_ag_id
				else null end,	            
			last_import_user_id = @pacs_user_id,
			last_import_date = getdate(),
			--mkt_val_source = 'A',
			--ag_val_source = case
			--	when (ld.ag_apply = 'T' and lut.set_ag_apply = 0) or
			--		 (lut.ag_apply = 'T' and lut.set_ag_apply = 1)	 				
			--	then 'C'
			--	else ag_val_source end,
			ag_apply = case
				when lut.set_ag_apply = 1 then lut.ag_apply
				else ld.ag_apply end,				
			ag_use_cd = case
				when lut.set_ag_use_cd = 1 and 
					exists (select * from ag_use as au where au.ag_use_cd = lut.ag_use_cd)
				then lut.ag_use_cd
				else ld.ag_use_cd end,				
			application_number = case
				when lut.set_application_number = 1 
				then lut.application_number
				else ld.application_number end,			
			land_type_cd = case
				when lut.change_land_type_cd = 1 and
					exists (select * from land_type where land_type_cd = lut.new_land_type_cd)
				then lut.new_land_type_cd
				else ld.land_type_cd end			            
	from land_detail as ld
	     join 
         land_update_table as lut
	on ld.prop_val_yr = @year
	and ld.prop_val_yr = lut.year_field
    and ld.sup_num = @sup_num
    and ld.prop_id = lut.prop_id_field
	and ld.land_seg_id = lut.land_id_field

	set @num_rows_updated = @@ROWCOUNT

	-- logging end of step 
	SELECT @LogTotRows = @num_rows_updated, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 4 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step

	delete chg_log_user where machine = host_name()
	exec SetChgLogUser -1
	exec SetMachineLogChanges 0
		
	update pv
	set recalc_flag = 'M'
	from property_val as pv
	     join
         land_update_table as lut

	on pv.prop_val_yr = @year
   and pv.prop_val_yr = lut.year_field
   and pv.sup_num = @sup_num
   and pv.prop_id = lut.prop_id_field
   where recalc_flag <> 'M'

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 5 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step

    exec SetMachineLogChanges 1
end

-- this is used for a normal land_detail update
else if @land_seg_id > 0
begin
	update land_detail
	set size_acres = lut.acres,
			size_square_feet = lut.acres * 43560,
			mkt_unit_price = lut.market_unit_price,
			ag_unit_price = case
				when (ld.ag_apply = 'T' and lut.set_ag_apply = 0) or
					 (lut.ag_apply = 'T' and lut.set_ag_apply = 1)	 	
				then lut.current_use_unit_price 
				else null end,		
			ls_mkt_id = @ls_mkt_id,
			ls_ag_id = case
				when (ld.ag_apply = 'T' and lut.set_ag_apply = 0) or
					 (lut.ag_apply = 'T' and lut.set_ag_apply = 1)
				then @ls_ag_id
				else null end,
			last_import_user_id = @pacs_user_id,
			last_import_date = getdate(),
			--mkt_val_source = 'A',
			--ag_val_source = case 
			--	when (ld.ag_apply = 'T' and lut.set_ag_apply = 0) or
			--		 (lut.ag_apply = 'T' and lut.set_ag_apply = 1)
			--	then 'C'
			--	else ag_val_source end,
			ag_apply = case
				when lut.set_ag_apply = 1 then lut.ag_apply
				else ld.ag_apply end,				
			ag_use_cd = case
				when lut.set_ag_use_cd = 1 and
					exists (select * from ag_use as au where au.ag_use_cd = lut.ag_use_cd)
				then lut.ag_use_cd
				else ld.ag_use_cd end,				
			application_number = case
				when lut.set_application_number = 1 then lut.application_number
				else ld.application_number end,			
			land_type_cd = case
				when lut.change_land_type_cd = 1 and
					exists (select * from land_type where land_type_cd = lut.new_land_type_cd)
				then lut.new_land_type_cd
				else ld.land_type_cd end	
				
	from land_detail as ld
	with (nolock)
	join land_update_table as lut
	with (Nolock)
	on ld.prop_id = lut.prop_id_field
	and ld.prop_val_yr = lut.year_field
	and ld.land_seg_id = lut.land_id_field
	where prop_id = @prop_id
	and prop_val_yr = @year
	and sup_num = @sup_num
	and land_seg_id = @land_seg_id

	set @num_rows_updated = @@ROWCOUNT

	-- logging end of step 
	SELECT @LogTotRows = @num_rows_updated, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 6 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step

end

-- this is used for all land segments on a property
else if @prop_id > 0 and @land_seg_id = -1
begin
	declare curLand cursor fast_forward
	for select lut.prop_id_field, lut.from_land_id_field, lut.acres, lut.market_unit_price, 
							lut.current_use_unit_price, ld.prop_id
			from land_update_table as lut
			with (nolock)
			join land_detail as ld
			with (nolock)
			on lut.year_field = ld.prop_val_yr
			and lut.from_land_id_field = ld.land_seg_id
			and ld.sale_id = 0
			and ld.sup_num = 0
			where year_field = @year
			and prop_id_field = @prop_id
			and from_land_id_field > 0

	open curLand

	fetch next from curLand into @property_id, @land_id, @acres, @market_unit_price, 
																@current_use_unit_price, @land_seg_prop_id

	while @@fetch_status = 0
	begin
		exec @new_seg_id = dbo.LayerCopyLand
			-- From
			@year,
			@sup_num,
			0,
			@land_seg_prop_id,
			-- To
			@year,
			@sup_num_to,
			0,
			@property_id,
	
			1, -- Assign new IDs
			@land_id, -- One land segment
			1, 1, 1 -- Skip entity/exemption/owner assoc

		update land_update_table
		set land_id_field = @new_seg_id,
				from_land_id_field = 0
		where prop_id_field = @property_id
		and year_field = @year
		and from_land_id_field = @land_id

		fetch next from curLand into @property_id, @land_id, @acres, @market_unit_price, 
																	@current_use_unit_price, @land_seg_prop_id
	end

	close curLand
	deallocate curLand

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 7 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step
	
	update land_detail
	set size_acres = lut.acres,
			size_square_feet = lut.acres * 43560,
			mkt_unit_price = lut.market_unit_price,
			ag_unit_price = case 
				when (ld.ag_apply = 'T' and lut.set_ag_apply = 0) or
					 (lut.ag_apply = 'T' and lut.set_ag_apply = 1)
				then lut.current_use_unit_price
				else null end,
			ls_mkt_id = @ls_mkt_id,
			ls_ag_id = case 
				when (ld.ag_apply = 'T' and lut.set_ag_apply = 0) or
					 (lut.ag_apply = 'T' and lut.set_ag_apply = 1)
				then @ls_ag_id 
				else null end,
			last_import_user_id = @pacs_user_id,
			last_import_date = getdate(),
			--mkt_val_source = 'A',
			--ag_val_source = case
			--	when (ld.ag_apply = 'T' and lut.set_ag_apply = 0) or 
			--		 (lut.ag_apply = 'T' and lut.set_ag_apply = 1)
			--	then 'C' else ag_val_source end,
			ag_apply = case
				when lut.set_ag_apply = 1 then lut.ag_apply
				else ld.ag_apply end,				
			ag_use_cd = case
				when lut.set_ag_use_cd = 1 and
					exists (select * from ag_use as au where au.ag_use_cd = lut.ag_use_cd)
				then lut.ag_use_cd
				else ld.ag_use_cd end,				
			application_number = case
				when lut.set_application_number = 1 then lut.application_number
				else ld.application_number end,			
			land_type_cd = case
				when lut.change_land_type_cd = 1 and
					exists (select * from land_type where land_type_cd = lut.new_land_type_cd)
				then lut.new_land_type_cd
				else ld.land_type_cd end	
	from land_detail as ld
	with (nolock)
	join land_update_table as lut
	with (nolock)
	on ld.prop_id = lut.prop_id_field
	and ld.prop_val_yr = lut.year_field
	and ld.land_seg_id = lut.land_id_field
	where ld.prop_id = @prop_id
	and ld.prop_val_yr = @year
	and ld.sup_num = @sup_num

	set @num_rows_updated = @@ROWCOUNT
	-- logging end of step 
	SELECT @LogTotRows = @num_rows_updated, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 8 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step

end

-- this is used for the split wizard
else if @split_prop_id > 0
begin
	declare curLand cursor fast_forward
	for select from_land_id_field, acres, market_unit_price, current_use_unit_price,
						set_ag_apply, ag_apply,
						set_ag_use_cd, ag_use_cd,
						set_application_number, application_number,
						change_land_type_cd, new_land_type_cd	
			from land_update_table
			with (nolock)
			where prop_id_field = @prop_id
			and year_field = @year
			and from_land_id_field > 0

	open curLand

	fetch next from curLand into @land_id, @acres, @market_unit_price, @current_use_unit_price,								
									@set_ag_apply, @ag_apply,
									@set_ag_use_cd, @ag_use_cd,
									@set_application_number, @application_number,
									@change_land_type_cd, @new_land_type_cd

	while @@fetch_status = 0
	begin
		exec @new_seg_id = dbo.LayerCopyLand
			-- From
			@year,
			@sup_num,
			0,
			@split_prop_id,
			-- To
			@year,
			@sup_num_to,
			0,
			@prop_id,
	
			1, -- Assign new IDs
			@land_id, -- One land segment
			1, 1, 1 -- Skip entity/exemption/owner assoc

		update land_detail
		set size_acres = @acres,
				size_square_feet = @acres * 43560,
				mkt_unit_price = @market_unit_price,
				ag_unit_price = case 
					when (ag_apply = 'T' and @set_ag_apply = 0) or
						 (@ag_apply = 'T' and @set_ag_apply = 1)
					then @current_use_unit_price else null end,
				ls_mkt_id = @ls_mkt_id,
				ls_ag_id = case 
					when (ag_apply = 'T' and @set_ag_apply = 0) or
						 (@ag_apply = 'T' and @set_ag_apply = 1)
					then @ls_ag_id else null end,
				last_import_user_id = @pacs_user_id,
				last_import_date = getdate(),
				--mkt_val_source = 'A',
				--ag_val_source = case 
				--	when (ag_apply = 'T' and @set_ag_apply = 0) or
				--		 (@ag_apply = 'T' and @set_ag_apply = 1)
				--	then 'C' else ag_val_source end,
				ag_apply = case
					when @set_ag_apply = 1 then @ag_apply
					else ag_apply end,				
				ag_use_cd = case
					when @set_ag_use_cd = 1 and
						exists (select * from ag_use as au where au.ag_use_cd = @ag_use_cd)
					then @ag_use_cd
					else ag_use_cd end,				
				application_number = case
					when @set_application_number = 1 then @application_number
					else application_number end,			
				land_type_cd = case
					when @change_land_type_cd = 1 and
						exists (select * from land_type where land_type_cd = @new_land_type_cd)
					then @new_land_type_cd
					else land_type_cd end	
		where prop_val_yr = @year
		and sup_num = @sup_num
		and prop_id = @prop_id
		and land_seg_id = @new_seg_id

		update land_update_table
		set land_id_field = @new_seg_id,
				from_land_id_field = 0
		where prop_id_field = @prop_id
		and year_field = @year
		and from_land_id_field = @land_id

		fetch next from curLand into @land_id, @acres, @market_unit_price, @current_use_unit_price
	end

	close curLand
	deallocate curLand

	set @num_rows_updated = 1

	-- logging end of step 
	SELECT @LogTotRows = @num_rows_updated, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 9 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time of step

end

-- end of procedure update log
SET @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate()))
exec dbo.CurrentActivityLogInsert @proc, @qry,@num_rows_updated,@@ERROR
 

select @num_rows_updated as num_rows_updated

GO

