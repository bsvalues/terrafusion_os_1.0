




CREATE  PROCEDURE GetPPSchedDeprec

	@input_pp_sched_id 	int,
	@input_prop_id int,
	@input_sup_yr  	numeric(4,0),
	@input_pp_seg_id	int,
	@input_pp_sale_id	int,
	@input_pp_sup_num	int,
	@input_active_flag	char(1),
	@unit_price		numeric(14,2) output

AS

declare @type_cd	  char(5)
declare @deprec_cd	  char(10)
declare @age		  numeric(4)
declare @deprec_year_max  numeric(3)
declare @depreciation_pct numeric(3)
declare @deprec_pct	  numeric(3)
declare @error		  varchar(100)
declare @table_found	  char(1)
declare @value_found	  char(1)

declare @pp_yr_acquired		numeric(4,0)
declare @pp_deprec_type_cd	char(5)
declare @pp_deprec_deprec_cd	char(10)
declare @pp_deprec_override	char(1)

set @table_found = 'F'
set @value_found = 'F'


--Get the Personal Property Segment using key values
DECLARE DPRC_PERS_PROP_SEGMENT CURSOR FAST_FORWARD
FOR select 	pp_yr_aquired,
		pp_deprec_type_cd,
		pp_deprec_deprec_cd,
		pp_deprec_override
	
	 from pers_prop_seg
	 where pp_seg_id   = @input_pp_seg_id
	 and	  prop_val_yr = @input_sup_yr
	 and	  sup_num     = @input_pp_sup_num     
	 and	  sale_id     = @input_pp_sale_id

OPEN DPRC_PERS_PROP_SEGMENT
FETCH NEXT FROM DPRC_PERS_PROP_SEGMENT into	@pp_yr_acquired,
					@pp_deprec_type_cd,
					@pp_deprec_deprec_cd,
					@pp_deprec_override

if (@pp_deprec_override <> 'T')
begin
	IF EXISTS (select pp_schedule_deprec.pp_sched_deprec_type_cd, 
						pp_schedule_deprec.pp_sched_deprec_deprec_cd 
				from pp_schedule_deprec
				with (nolock)
				where pp_sched_id = @input_pp_sched_id
				and year = @input_sup_yr)

	begin

		select @type_cd = pp_schedule_deprec.pp_sched_deprec_type_cd,
				@deprec_cd	= pp_schedule_deprec.pp_sched_deprec_deprec_cd
		from pp_schedule_deprec
		with (nolock)
		where pp_sched_id = @input_pp_sched_id
		and year = @input_sup_yr


		--Update the depreciation schedule to be at the pers_prop_seg level
		if (@input_active_flag = 'T')
		begin
			update pers_prop_seg set pp_deprec_type_cd = @type_cd,
				 		  pp_deprec_deprec_cd = @deprec_cd,
						  pp_deprec_override = 'F'
	
			 where 	  pp_seg_id   = @input_pp_seg_id
			 and	  prop_val_yr = @input_sup_yr
			 and	  sup_num     = @input_pp_sup_num     
			 and	  sale_id     = @input_pp_sale_id
		end


		--calculate the age to be used in finding the depreciation percent
		set @age = @input_sup_yr - isnull(@pp_yr_acquired,0)

		if (@age > 0)
		begin

			--declare a cursor to be used later
			DECLARE DEPREC_DETAIL CURSOR FAST_FORWARD
			FOR select deprec_year_max, deprec_year_pct
			from depreciation_detail 
			with (nolock)
			where type_cd		= @type_cd
			and   deprec_cd		= @deprec_cd
			and   year		= @input_sup_yr
			order by deprec_year_max

			OPEN DEPREC_DETAIL
			FETCH NEXT FROM DEPREC_DETAIL into @deprec_year_max, @depreciation_pct

			while (@@FETCH_STATUS = 0)
			begin
				set @table_found = 'T'

				if (@age <= @deprec_year_max)
				begin
					set @deprec_pct = @depreciation_pct
					set @value_found = 'T'
					break				
				end

				FETCH NEXT FROM DEPREC_DETAIL into @deprec_year_max, @depreciation_pct
			end

			CLOSE DEPREC_DETAIL
			DEALLOCATE DEPREC_DETAIL

			if (@table_found <> 'T')
			begin
				--Now look for the wildcard value depreciation table...
				DECLARE DEPREC_DETAIL CURSOR FAST_FORWARD
				FOR select deprec_year_max, deprec_year_pct
				from depreciation_detail 
				with (nolock)
				where type_cd = '*'
				and deprec_cd = @deprec_cd
				and year = @input_sup_yr
				order by deprec_year_max

				OPEN DEPREC_DETAIL
				FETCH NEXT FROM DEPREC_DETAIL into @deprec_year_max, @depreciation_pct

				while (@@FETCH_STATUS = 0)
				begin
					set @table_found = 'T'

					if (@age <= @deprec_year_max)
					begin
						set @deprec_pct = @depreciation_pct
						set @value_found = 'T'
						break				

					end

					FETCH NEXT FROM DEPREC_DETAIL into @deprec_year_max, @depreciation_pct
				end
	
				CLOSE DEPREC_DETAIL
				DEALLOCATE DEPREC_DETAIL
			end
			
			if (@table_found <> 'T')
			begin
				--Now look for the other wildcard depreciation table...
				DECLARE DEPREC_DETAIL CURSOR FAST_FORWARD
				FOR select deprec_year_max, deprec_year_pct
				from depreciation_detail
				with (nolock)
				where type_cd = @type_cd
				and deprec_cd = '*'
				and year = @input_sup_yr
				order by deprec_year_max

				OPEN DEPREC_DETAIL
				FETCH NEXT FROM DEPREC_DETAIL into @deprec_year_max, @depreciation_pct

				while (@@FETCH_STATUS = 0)
				begin
					set @table_found = 'T'

					if (@age <= @deprec_year_max)
					begin
						set @deprec_pct = @depreciation_pct
						set @value_found = 'T'
						break				
					end

					FETCH NEXT FROM DEPREC_DETAIL into @deprec_year_max, @depreciation_pct
				end
	
				CLOSE DEPREC_DETAIL
				DEALLOCATE DEPREC_DETAIL
			end

			if (@table_found <> 'T')
			begin
				--Now look for the pure wildcard depreciation table...
				DECLARE DEPREC_DETAIL CURSOR FAST_FORWARD
				FOR select deprec_year_max, deprec_year_pct
				from depreciation_detail 
				with (nolock)
				where type_cd = '*'
				and deprec_cd = '*'
				and year = @input_sup_yr
				order by deprec_year_max

				OPEN DEPREC_DETAIL
				FETCH NEXT FROM DEPREC_DETAIL into @deprec_year_max, @depreciation_pct

				while (@@FETCH_STATUS = 0)
				begin
					if (@age <= @deprec_year_max)
					begin
						set @deprec_pct = @depreciation_pct
						set @value_found = 'T'
						break				
					end

					FETCH NEXT FROM DEPREC_DETAIL into @deprec_year_max, @depreciation_pct
				end
	
				CLOSE DEPREC_DETAIL
				DEALLOCATE DEPREC_DETAIL
			end
	
			if ((@table_found = 'T') and (@value_found = 'T'))
			begin
				--update the segment with the depreciation_pct
				update 	pers_prop_seg
				set 	pp_deprec_pct 	= @deprec_pct
				where 	pp_seg_id   	= @input_pp_seg_id
				and	prop_val_yr 	= @input_sup_yr
				and	sup_num     	= @input_pp_sup_num     
				and	sale_id     	= @input_pp_sale_id 
			end
			else if @table_found = 'T' and @value_found <> 'T'
			begin
				if isnull(@pp_yr_acquired, 0) = 0
				begin
					insert into prop_recalc_errors
					(
						prop_id, 
						sup_num, 
						sup_yr, 
						sale_id,
						imprv_id,
						imprv_detail_id,
						land_detail_id,
						error
					)
					values
					(
						@input_prop_id,
						@input_pp_sup_num,
						@input_sup_yr,
						@input_pp_sale_id,
						0,
						0,
						0,
						'Year acquired must be set to calculate depreciation.  Segment Id: ' + convert(varchar(10), @input_pp_seg_id)
					)
				end
				else
				begin
					insert into prop_recalc_errors
					(
						prop_id, 
						sup_num, 
						sup_yr, 
						sale_id,
						imprv_id,
						imprv_detail_id,
						land_detail_id,
						error
					)
					values
					(
						@input_prop_id,
						@input_pp_sup_num,
						@input_sup_yr,
						@input_pp_sale_id,
						0,
						0,
						0,
						'Unable to calculate depreciation.  Check depreciation table.  Segment Id: ' + convert(varchar(10), @input_pp_seg_id)
					)
				end
			end
			else
			begin
				--update the segment with the depreccation_pct
				update 	pers_prop_seg
				set 	pp_deprec_pct 		= null,
					pp_deprec_type_cd	= null,
					pp_deprec_deprec_cd	= null
				where 	pp_seg_id   	= @input_pp_seg_id
				and	prop_val_yr 	= @input_sup_yr
				and	sup_num     	= @input_pp_sup_num     
				and	sale_id     	= @input_pp_sale_id 
			end
		end
	end
	else
	begin
		
		--update the segment with the deprecication_pct
		update pers_prop_seg
		set pp_deprec_pct = null,
			pp_deprec_type_cd = null,
			pp_deprec_deprec_cd	= null
		where pp_seg_id   	= @input_pp_seg_id
		and	prop_val_yr 	= @input_sup_yr
		and	sup_num     	= @input_pp_sup_num     
		and	sale_id     	= @input_pp_sale_id 
	end
end

CLOSE DPRC_PERS_PROP_SEGMENT
DEALLOCATE DPRC_PERS_PROP_SEGMENT

GO

