

CREATE PROCEDURE GetImprvDetailDeprec

	@input_imprv_id		int,
	@input_imprv_det_id	int,
	@input_prop_id		int,
	@input_sup_num		int,
	@input_sup_yr		numeric(4),
	@input_sale_id		int,
	@phys_pct		numeric(5,2) OUTPUT,
	@phys_pct_source	varchar(1) OUTPUT

AS

--Improvement Detail variables
declare @imprv_det_class_cd		char(10)
declare @imprv_det_meth_cd		char(5)
declare @imprv_det_type_cd		char(10)
declare @condition_cd			char(5)
declare @depreciation_yr		numeric(4)
declare @depreciation_yr_override	char(1)
declare @physical_pct_override		char(1)

--Improvement Schedule variables
declare @imprv_sched_deprec_cd		char(10)
declare @imprv_phys_pct			numeric(5,2)

--Depreciation Detail variables
declare @deprec_year_max  		numeric(3)
declare @depreciation_pct 		numeric(5,2)

--Stored Procedure variables
declare @age				numeric(4)
declare @match_found			char(1)
declare @error				char(100)
declare @physical_pct			numeric(5,2)

declare @temp_phys_source		char(1)

declare @pacs_depreciation_yr		numeric(4)

--Initialize variables
select @match_found = 'F'


-- set the depreciation year

if exists (select * from pacs_system_year where pacs_yr = @input_sup_yr)
begin
	select @pacs_depreciation_yr = depreciation_yr
	from pacs_system_year
	where pacs_yr = @input_sup_yr
end
else
begin
	select @pacs_depreciation_yr = @input_sup_yr
end

IF EXISTS (select condition_cd,
		depreciation_yr,
		depreciation_yr_override,
		imprv_det_class_cd,
		imprv_det_meth_cd,
		imprv_det_type_cd,
		physical_pct_override
	from 	imprv_detail
	where 	prop_id 	= @input_prop_id
	and	prop_val_yr	= @input_sup_yr
	and	imprv_id	= @input_imprv_id
	and	imprv_det_id	= @input_imprv_det_id
	and	sup_num		= @input_sup_num
	and	sale_id		= @input_sale_id 
	and     condition_cd    <> 'MAD')
and  not exists (select		*
		from 	imprv_detail, imprv_sched
		where 	imprv_detail.imprv_det_class_cd   = imprv_sched.imprv_det_class_cd
		and     imprv_detail.imprv_det_meth_cd    = imprv_sched.imprv_det_meth_cd
		and     imprv_detail.imprv_det_type_cd    = imprv_sched.imprv_det_type_cd
		and     imprv_sched.imprv_sched_deprec_cd = 'MAD'
		and     imprv_detail.prop_id 		= @input_prop_id
		and	imprv_detail.prop_val_yr	  	= @input_sup_yr
		and	imprv_detail.imprv_id		= @input_imprv_id
		and	imprv_detail.imprv_det_id	  	= @input_imprv_det_id
		and	imprv_detail.sup_num		= @input_sup_num
		and	imprv_detail.sale_id		= @input_sale_id) 

begin
	select 	@condition_cd 			= condition_cd,
		@depreciation_yr 		= depreciation_yr,
		@depreciation_yr_override 	= depreciation_yr_override,
		@imprv_det_class_cd		= imprv_det_class_cd,
		@imprv_det_meth_cd		= imprv_det_meth_cd,
		@imprv_det_type_cd		= imprv_det_type_cd,
		@physical_pct_override		= physical_pct_override
	from 	imprv_detail
	where 	prop_id 	= @input_prop_id
	and	prop_val_yr	= @input_sup_yr
	and	imprv_id	= @input_imprv_id
	and	imprv_det_id	= @input_imprv_det_id
	and	sup_num		= @input_sup_num
	and	sale_id		= @input_sale_id

	/*
	select condition_cd 			= @condition_cd
	select depreciation_yr 			= @depreciation_yr
	select depreciation_yr_override 	= @depreciation_yr_override
	select imprv_det_class_cd		= @imprv_det_class_cd
	select imprv_det_meth_cd		= @imprv_det_meth_cd
	select imprv_det_type_cd		= @imprv_det_type_cd
	select physical_pct_override		= @physical_pct_override
	*/

	--If the physical_pct_override flag is set, then don't bother getting the deprecation stuff....
	if ((@physical_pct_override <> 'T') or (@physical_pct_override is null))
	begin
		--Now go get the imprv_sched_deprec_cd from the imprv_sched table
		IF EXISTS (select imprv_sched_deprec_cd
				from 	imprv_sched
				where 	imprv_det_class_cd	= @imprv_det_class_cd
				and	imprv_det_meth_cd	= @imprv_det_meth_cd
				and	imprv_det_type_cd	= @imprv_det_type_cd
				and	imprv_yr		= @input_sup_yr)
		begin
			select @imprv_sched_deprec_cd = imprv_sched_deprec_cd
			from 	imprv_sched
			where 	imprv_det_class_cd	= @imprv_det_class_cd
			and	imprv_det_meth_cd	= @imprv_det_meth_cd
			and	imprv_det_type_cd	= @imprv_det_type_cd
			and	imprv_yr		= @input_sup_yr

			/*
			select imprv_sched_deprec_cd 		= @imprv_sched_deprec_cd
			select imprv_det_class_cd		= @imprv_det_class_cd
			select imprv_det_meth_cd		= @imprv_det_meth_cd
			select imprv_det_type_cd		= @imprv_det_type_cd
			*/
			
			if (@imprv_sched_deprec_cd is not null)
			begin
				--Now check and see if there is a depreciation table with a deprec_cd of @imprv_sched_deprec_cd
				IF EXISTS(select type_cd
						from 	depreciation
						where 	prop_type_cd 	= 'R'
						and 	deprec_cd 	= @imprv_sched_deprec_cd
						and     year		= @input_sup_yr) --Added by EricZ 02/10/2003, reported by Grayson CAD - HelpSTAR #8059
				begin
					--OK.  There is a depreciation table with a type_cd of @imprv_sched_deprec_cd, so now try and find the
					--percent based on the @depreciation_yr.
					if (@depreciation_yr_override = 'T')
					begin
						if (@depreciation_yr is not null)
						begin
							select @age = @pacs_depreciation_yr - @depreciation_yr
						end
						else
						begin
							select @error = 'Effective Year Built is null; Depreciation cannot be calculated.'
							insert 
							into prop_recalc_errors
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
							@input_sup_num,
							@input_sup_yr,
							@input_sale_id,
							@input_imprv_id,
							@input_imprv_det_id,
							0,
							@error
							)
						end
					end
					else
					begin
						--Since the override flag isn't checked, I need to go get the effective_yr_blt from the imprv.
						IF EXISTS (select effective_yr_blt, physical_pct
							from 	imprv
							where 	prop_id		= @input_prop_id
							and	prop_val_yr 	= @input_sup_yr
							and	imprv_id 	= @input_imprv_id
							and	sup_num		= @input_sup_num
							and	sale_id 	= @input_sale_id)
						begin
							select  @depreciation_yr = effective_yr_blt,
								@imprv_phys_pct = physical_pct
								from 	imprv
								where 	prop_id		= @input_prop_id
								and	prop_val_yr 	= @input_sup_yr
								and	imprv_id 	= @input_imprv_id
								and	sup_num		= @input_sup_num
								and	sale_id 	= @input_sale_id
							
							if (@depreciation_yr is not null)
							begin
								select @age = @pacs_depreciation_yr - @depreciation_yr
							end
							else
							begin
								select @error = 'Effective Year Built is null; Depreciation cannot be calculated.'
								insert 
								into prop_recalc_errors
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
						 		 @input_sup_num,
						 		 @input_sup_yr,
						 		 @input_sale_id,
								 @input_imprv_id,
								 @input_imprv_det_id,
						 		 0,
						 		 @error
								)
							end
						end
					end

				
					--Now check to see if a depreciation_detail record exists for the @age we calculated.
					if (@age > 0)
					begin
						--Try to find a pure match on the deprec_cd and type_cd
						DECLARE DEPREC_DETAIL_PURE SCROLL CURSOR
						FOR select deprec_year_max, deprec_year_pct
							from depreciation_detail 
							where 	prop_type_cd 	= 'R'
							and 	type_cd 	= @condition_cd
							and	deprec_cd	= @imprv_sched_deprec_cd
							and   year		= @input_sup_yr
   		        				order by deprec_year_max

						OPEN DEPREC_DETAIL_PURE
						FETCH NEXT FROM DEPREC_DETAIL_PURE into @deprec_year_max, @depreciation_pct

						while (@@FETCH_STATUS = 0)
						begin
							if (@age <= @deprec_year_max)
							begin
								select @physical_pct = @depreciation_pct
								select @match_found = 'T'
								break				
							end

							FETCH NEXT FROM DEPREC_DETAIL_PURE into @deprec_year_max, @depreciation_pct
						end
			
						CLOSE DEPREC_DETAIL_PURE
						DEALLOCATE DEPREC_DETAIL_PURE			

						--Now try to find a match on the deprec_cd and a type_cd of '*' if the pure_match is 'F'
						if (@match_found <> 'T')
						begin
							DECLARE DEPREC_DETAIL_WILD SCROLL CURSOR
							FOR select deprec_year_max, deprec_year_pct
								from depreciation_detail 
								where 	prop_type_cd 	= 'R'
								and 	type_cd 	= '*'
								and	deprec_cd	= @imprv_sched_deprec_cd
								and   year		= @input_sup_yr
   			        				order by deprec_year_max

							OPEN DEPREC_DETAIL_WILD
							FETCH NEXT FROM DEPREC_DETAIL_WILD into @deprec_year_max, @depreciation_pct

							while (@@FETCH_STATUS = 0)
							begin
								if (@age <= @deprec_year_max)
								begin
									select @physical_pct = @depreciation_pct
									select @match_found = 'T'
									break				
								end
			
								FETCH NEXT FROM DEPREC_DETAIL_WILD into @deprec_year_max, @depreciation_pct
							end
			
							CLOSE DEPREC_DETAIL_WILD
							DEALLOCATE DEPREC_DETAIL_WILD				
						end

						--If a match is found, go update the improvement detail record with the @deprecation_pct (if override is <> 'T')
						if (@match_found = 'T')
						begin

							select @phys_pct = @physical_pct
					

							update imprv_detail
							set	physical_pct 		= @phys_pct,
								physical_pct_source 	= 'D'
							where 	prop_id 	= @input_prop_id
							and	prop_val_yr	= @input_sup_yr
							and	imprv_id	= @input_imprv_id
							and	imprv_det_id	= @input_imprv_det_id
							and	sup_num		= @input_sup_num
							and	sale_id		= @input_sale_id
						end
						else
						begin
							if (@imprv_phys_pct is not null)
							begin
								select @phys_pct = @imprv_phys_pct
							end
							else
							begin
								select @phys_pct = 100
							end
									

							update imprv_detail
							set	physical_pct 		= @phys_pct,
								physical_pct_source 	= 'I'
							where 	prop_id 	= @input_prop_id
							and	prop_val_yr	= @input_sup_yr
							and	imprv_id	= @input_imprv_id
							and	imprv_det_id	= @input_imprv_det_id
							and	sup_num		= @input_sup_num
							and	sale_id		= @input_sale_id
						end
					end
				end
				else
				begin --Added by EricZ 02/10/2003, reported by Grayson CAD - HelpSTAR #8059
					IF EXISTS (select physical_pct
					from 	imprv
					where 	prop_id		= @input_prop_id
					and	prop_val_yr 	= @input_sup_yr
					and	imprv_id 	= @input_imprv_id
					and	sup_num		= @input_sup_num
					and	sale_id 	= @input_sale_id)
	
					begin
						select  @imprv_phys_pct = physical_pct
							from 	imprv
							where 	prop_id		= @input_prop_id
							and	prop_val_yr 	= @input_sup_yr
							and	imprv_id 	= @input_imprv_id
							and	sup_num		= @input_sup_num
							and	sale_id 	= @input_sale_id
	
						if (@imprv_phys_pct is not null)
						begin
							select @phys_pct = @imprv_phys_pct
						end
						else
						begin
							select @phys_pct = 100
						end
					end
					else
					begin
						select @phys_pct = 100
					end
					
	
					update imprv_detail
					set	physical_pct 	= @phys_pct,
						physical_pct_source = 'I'
					where 	prop_id 	= @input_prop_id
					and	prop_val_yr	= @input_sup_yr
					and	imprv_id	= @input_imprv_id
					and	imprv_det_id	= @input_imprv_det_id
					and	sup_num		= @input_sup_num
					and	sale_id		= @input_sale_id
				end
			end
			else
			begin
				IF EXISTS (select physical_pct
					from 	imprv
					where 	prop_id		= @input_prop_id
					and	prop_val_yr 	= @input_sup_yr
					and	imprv_id 	= @input_imprv_id
					and	sup_num		= @input_sup_num
					and	sale_id 	= @input_sale_id)

				begin
					select  @imprv_phys_pct = physical_pct
						from 	imprv
						where 	prop_id		= @input_prop_id
						and	prop_val_yr 	= @input_sup_yr
						and	imprv_id 	= @input_imprv_id
						and	sup_num		= @input_sup_num
						and	sale_id 	= @input_sale_id

					if (@imprv_phys_pct is not null)
					begin
						select @phys_pct = @imprv_phys_pct
					end
					else
					begin
						select @phys_pct = 100
					end
				end
				else
				begin
					select @phys_pct = 100
				end
				

				update imprv_detail
				set	physical_pct 	= @phys_pct,
					physical_pct_source = 'I'
				where 	prop_id 	= @input_prop_id
				and	prop_val_yr	= @input_sup_yr
				and	imprv_id	= @input_imprv_id
				and	imprv_det_id	= @input_imprv_det_id
				and	sup_num		= @input_sup_num
				and	sale_id		= @input_sale_id
			end
		end
		else
		begin
			IF EXISTS (select physical_pct
				from 	imprv
				where 	prop_id		= @input_prop_id
				and	prop_val_yr 	= @input_sup_yr
				and	imprv_id 	= @input_imprv_id
				and	sup_num		= @input_sup_num
				and	sale_id 	= @input_sale_id)

			begin
				select  @imprv_phys_pct = physical_pct
					from 	imprv
					where 	prop_id		= @input_prop_id
					and	prop_val_yr 	= @input_sup_yr
					and	imprv_id 	= @input_imprv_id
					and	sup_num		= @input_sup_num
					and	sale_id 	= @input_sale_id

				if (@imprv_phys_pct is not null)
				begin
					select @phys_pct = @imprv_phys_pct
				end
				else
				begin
					select @phys_pct = 100
				end
			end
			else
			begin
				select @phys_pct = 100
			end

			
			update imprv_detail
			set	physical_pct 	= @phys_pct,
				physical_pct_source = 'I'
			where 	prop_id 	= @input_prop_id
			and	prop_val_yr	= @input_sup_yr
			and	imprv_id	= @input_imprv_id
			and	imprv_det_id	= @input_imprv_det_id
			and	sup_num		= @input_sup_num
			and	sale_id		= @input_sale_id
		end
	end
end
else
begin
	if (exists (select		*
		from 	imprv_detail, imprv_sched
		where 	imprv_detail.imprv_det_class_cd   = imprv_sched.imprv_det_class_cd
		and     imprv_detail.imprv_det_meth_cd    = imprv_sched.imprv_det_meth_cd
		and     imprv_detail.imprv_det_type_cd    = imprv_sched.imprv_det_type_cd
		and     imprv_sched.imprv_sched_deprec_cd = 'MAD'
		and     imprv_detail.prop_id 		  = @input_prop_id
		and	imprv_detail.prop_val_yr	  = @input_sup_yr
		and	imprv_detail.imprv_id		  = @input_imprv_id
		and	imprv_detail.imprv_det_id	  = @input_imprv_det_id
		and	imprv_detail.sup_num		  = @input_sup_num
		and	imprv_detail.sale_id		  = @input_sale_id
		and       imprv_detail.physical_pct_override <> 'T')  or
           EXISTS (select condition_cd,
			depreciation_yr,
			depreciation_yr_override,
			imprv_det_class_cd,
			imprv_det_meth_cd,
			imprv_det_type_cd,
			physical_pct_override
		from 	imprv_detail
		where 	prop_id 	= @input_prop_id
		and	prop_val_yr	= @input_sup_yr
		and	imprv_id	= @input_imprv_id
		and	imprv_det_id	= @input_imprv_det_id
		and	sup_num		= @input_sup_num
		and	sale_id		= @input_sale_id 
		and       condition_cd    = 'MAD' 
		and       imprv_detail.physical_pct_override <> 'T'))
           
	begin
		
		select @phys_pct = null

		select @phys_pct = physical_pct 
		from imprv_detail, imprv_det_type
		where imprv_detail.prop_id 		  = @input_prop_id
		and   imprv_detail.prop_val_yr	  	  = @input_sup_yr
		and   imprv_detail.imprv_id		  = @input_imprv_id
		and   imprv_detail.sup_num		  = @input_sup_num
		and   imprv_detail.sale_id		 	  = @input_sale_id
		and   imprv_detail.imprv_det_type_cd 	  = imprv_det_type.imprv_det_type_cd 
		and   imprv_det_type.main_area = 'T'
		and   imprv_detail.physical_pct is not null
		and   imprv_detail.physical_pct_source = 'D'
		and   imprv_detail.use_up_for_pct_base = 'T'

		if (@phys_pct is null)
		begin
			select @phys_pct = physical_pct 
			from imprv
			where imprv.prop_id 		  = @input_prop_id
			and   imprv.prop_val_yr	  	  = @input_sup_yr
			and   imprv.imprv_id		  = @input_imprv_id
			and   imprv.sup_num		  = @input_sup_num
			and   imprv.sale_id		  = @input_sale_id

			 select @temp_phys_source = 'I'
		end
		else
		begin
			select @temp_phys_source = 'D'
		end

		set @phys_pct_source = @temp_phys_source

		update imprv_detail
		set	physical_pct 		= @phys_pct,
			physical_pct_source 	= @temp_phys_source
		where 	prop_id 	= @input_prop_id
		and	prop_val_yr	= @input_sup_yr
		and	imprv_id	= @input_imprv_id
		and	imprv_det_id	= @input_imprv_det_id
		and	sup_num		= @input_sup_num
		and	sale_id		= @input_sale_id

	end
end

GO

