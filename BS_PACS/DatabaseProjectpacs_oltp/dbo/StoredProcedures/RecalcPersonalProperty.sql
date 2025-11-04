-- HISTORY
-- 1.1	3/01/2004 Rossk Addition of special pricing and SubSeg calculations  modify GetPPOrigCostDeprec to return @dep_pct
-- 1.2	3/13/2004 Rossk Special pricing is now multiplied by the depreciation percentages


CREATE PROCEDURE RecalcPersonalProperty

	@input_prop_id 		int,
	@input_sup_yr  		numeric(4),
	@input_sup_num 		int,
	@input_sale_id		int,
	@input_rounding_factor	numeric(1),
	@output_pp_val_total	numeric(14,0) output,
	@output_pp_new_val		numeric(14,0) output

AS

-- Personal Property Segment variables
declare @pp_sup_num		int
declare @pp_seg_id   		int
declare @pp_sale_id		int
declare @pp_sched_cd 		char(10)
declare @pp_table_meth_cd	char(5)
declare @pp_type_cd		char(5)
declare @pp_class_cd		char(5)
declare @pp_density_cd		char(5)
declare @pp_adj_cd		char(5)
declare @pp_area		numeric(12,0)
declare @pp_unit_count		numeric(16,4)
declare @pp_yr_acquired		numeric(4,0)
declare @pp_dep_method		char(5)
declare @pp_pct_good		numeric(5,2)
declare @pp_orig_cost		numeric(14,0)
declare @pp_economic_pct	numeric(5,2)
declare @pp_physical_pct	numeric(5,2)
declare @pp_flat_val		numeric(14,0)
declare @pp_rendered_val	numeric(14,0)
declare @pp_prior_yr_val	numeric(14,0)
declare @pp_last_notice_val	numeric(14,0)
declare @pp_method_val		numeric(14,0)
declare @pp_appraised_val	numeric(14,0)
declare @pp_appraise_meth	char(5)
declare @pp_new_val		numeric(14,0)
declare @pp_new_val_yr		numeric(4,0)
declare @pp_mkt_val		numeric(14,0)
declare @pp_comment		varchar(500)
declare @pp_unit_price		numeric(14,2)
declare @pp_qual_cd		char(5)
declare @pp_description		varchar(255)
declare @pp_sic_cd		char(5)
declare @pp_state_cd		char(5)
declare @pp_deprec_type_cd	char(5)
declare @pp_deprec_deprec_cd	char(10)
declare @pp_deprec_override	char(1)
declare @pp_deprec_pct		numeric(5,2)
declare @pp_active_flag		char(1)
declare @pp_special_val		numeric(14,0)
declare @pp_subseg_val		numeric(14,0)
declare @sp_per_unit_val	numeric(14,0)
declare @sp_per_area_val	numeric(14,0)
declare @sp_units_area_number	numeric(14,0)
declare @sp_method		char(1)


-- Personal Property Sub Segment variables
declare @ppss_sub_seg_id		 int
declare @ppss_orig_cost		 numeric(14,0)
declare @ppss_yr_acquired		 numeric(4,0)
declare @ppss_new_used		 varchar(10)
declare @ppss_type_cd			 char(10)
declare @ppss_dep_pct			 numeric(5,2)
declare @ppss_pct_good		 numeric(5,2)
declare @ppss_economic_pct	 numeric(5,2)
declare @ppss_physical_pct	 numeric(5,2)
declare @ppss_flat_val		 numeric(14,0)
declare @ppss_rendered_val	 numeric(14,0)
declare @ppss_mkt_val			 numeric(14,0)
declare @ppss_calc_method_flag	 char(1)
declare @ppss_sic_cd			 varchar(10)
declare @ppss_dep_type_cd		 char(5)
declare @ppss_dep_deprec_cd	 char(10)







-- Personal Property Segment/Schedule Association variables
declare @pp_sched_id		int
declare @pp_value_method	char(5)
declare @pp_table_code		char(5)
declare @pp_segment_type	char(5)
declare @active_flag		char(1)
declare @unit_price		numeric(14,2)
declare @flat_price_flag	char(1)


-- Calculation variables
declare @calc_appraised_val	numeric(14,2)
declare @pp_val			numeric(14,0)
declare @error_ct		int
declare @recalc_flag		char(1)
declare @age			numeric(3,0)
declare @active_flat_price_flag char(1)

declare @sum_pp_new_val numeric(14,0)

--Initialize variables
set @output_pp_val_total = 0
set @active_flat_price_flag = 'F'
set @sum_pp_new_val = 0
set @output_pp_new_val = 0

--Get the Personal Property Segment using key values
DECLARE PERS_PROP_SEGMENT SCROLL CURSOR
FOR select 	sup_num,
		pp_seg_id,
		sale_id,
		pp_sched_cd,
		pp_table_meth_cd,
		pp_type_cd,
		pp_class_cd,
		pp_density_cd,
		pp_adj_cd,
		pp_area,
		pp_unit_count,
		pp_yr_aquired,
		pp_dep_method,
		pp_pct_good,
		pp_orig_cost,
		pp_economic_pct,
		pp_physical_pct,
		pp_flat_val,
		pp_rendered_val,
		pp_prior_yr_val,
		pp_last_notice_val,
		pp_method_val,
		pp_appraised_val,
		pp_appraise_meth,
		pp_new_val,
		pp_new_val_yr,
		pp_mkt_val,
		pp_comment,
		pp_unit_price,
		pp_qual_cd,
		pp_description,
		pp_sic_cd,
		pp_state_cd,
		pp_deprec_type_cd,
		pp_deprec_deprec_cd,
		pp_deprec_override,
		pp_deprec_pct,
		pp_active_flag,
		pp_special_val,
		pp_subseg_val,
		sp_per_unit_val,
		sp_per_area_val,
		sp_units_area_number,
		sp_method
	   
    from pers_prop_seg
	with (nolock)
    where prop_id     = @input_prop_id
    and	  prop_val_yr = @input_sup_yr
    and	  sup_num     = @input_sup_num     
    and	  sale_id     = @input_sale_id

OPEN PERS_PROP_SEGMENT
FETCH NEXT FROM PERS_PROP_SEGMENT into	@pp_sup_num,
					@pp_seg_id,
					@pp_sale_id,
					@pp_sched_cd,
					@pp_table_meth_cd,
					@pp_type_cd,
					@pp_class_cd,
					@pp_density_cd,
					@pp_adj_cd,
					@pp_area,
					@pp_unit_count,
					@pp_yr_acquired,
					@pp_dep_method,
					@pp_pct_good,
					@pp_orig_cost,
					@pp_economic_pct,
					@pp_physical_pct,
					@pp_flat_val,
					@pp_rendered_val,
					@pp_prior_yr_val,
					@pp_last_notice_val,
					@pp_method_val,
					@pp_appraised_val,
					@pp_appraise_meth,
					@pp_new_val,
					@pp_new_val_yr,
					@pp_mkt_val,
					@pp_comment,
					@pp_unit_price,
					@pp_qual_cd,
					@pp_description,
					@pp_sic_cd,
					@pp_state_cd,
					@pp_deprec_type_cd,

					@pp_deprec_deprec_cd,
					@pp_deprec_override,
					@pp_deprec_pct,
					@pp_active_flag,
					@pp_special_val,	
					@pp_subseg_val,	
					@sp_per_unit_val,
					@sp_per_area_val,
					@sp_units_area_number,
					@sp_method	



-- Get the Personal Property Segment Schedule Association information using key values
while (@@FETCH_STATUS = 0)
begin
	if (@pp_active_flag = 'T')
	begin
		-- recalc special prop method

		if(@sp_method = 'U' or @sp_method = 'A')
		begin
			declare @ppseg_deprec_pct numeric(5,2) 

			exec GetPPOrigCostDeprec @input_sup_yr, @pp_yr_acquired, @pp_deprec_type_cd, @pp_deprec_deprec_cd, @ppseg_deprec_pct output,0

			update pers_prop_seg set pers_prop_seg.pp_deprec_pct = isnull(@ppseg_deprec_pct, 0)
				where
					pers_prop_seg.prop_id		= @input_prop_id
					and	pers_prop_seg.prop_val_yr	= @input_sup_yr
					and	pers_prop_seg.sup_num		= @input_sup_num
					and	pers_prop_seg.pp_seg_id		= @pp_seg_id
					and	pers_prop_seg.sale_id		= @input_sale_id

			if(@sp_method = 'U')
			begin
				SET @pp_special_val = @sp_units_area_number * @sp_per_unit_val
			end
			else if(@sp_method = 'A')
			begin
				SET @pp_special_val = @sp_units_area_number * @sp_per_area_val
			end
								
			set @pp_special_val = @pp_special_val *
				case when isnull(@ppseg_deprec_pct, 0) > 0 then (@ppseg_deprec_pct / 100) else 1 end *
				case when isnull(@pp_pct_good, 0) > 0 then (@pp_pct_good / 100) else 1 end *
				case when isnull(@pp_physical_pct, 0) > 0 then (@pp_physical_pct / 100) else 1 end *
				case when isnull(@pp_economic_pct, 0) > 0 then (@pp_economic_pct / 100) else 1 end
		end



		SET @pp_subseg_val = 0
	
		-- recalc sub Seg prop  for each segment
		DECLARE PERS_PROP_SUBSEGMENT CURSOR FAST_FORWARD
		FOR select 
			pp_sub_seg_id,
			pp_orig_cost,
			pp_yr_aquired,
			pp_new_used   ,
			pp_type_cd	,
			pp_dep_pct,
			pp_pct_good,
			pp_economic_pct,
			pp_physical_pct,
			pp_flat_val,
			pp_rendered_val,
			pp_mkt_val,
			calc_method_flag,
			pp_sic_cd,
			pp_dep_type_cd,
			pp_dep_deprec_cd

			 from pers_prop_sub_seg
			 where prop_id     = @input_prop_id
			 and   pp_seg_id   = @pp_seg_id
			 and	  prop_val_yr = @input_sup_yr
			 and	  sup_num     = @input_sup_num     

		OPEN PERS_PROP_SUBSEGMENT
		FETCH NEXT FROM PERS_PROP_SUBSEGMENT into	
			@ppss_sub_seg_id,
			@ppss_orig_cost,
			@ppss_yr_acquired,
			@ppss_new_used   ,
			@ppss_type_cd		,
			@ppss_dep_pct,
			@ppss_pct_good,
			@ppss_economic_pct,
			@ppss_physical_pct,
			@ppss_flat_val,
			@ppss_rendered_val,
			@ppss_mkt_val,
			@ppss_calc_method_flag,
			@ppss_sic_cd,
			@ppss_dep_type_cd,
			@ppss_dep_deprec_cd

		while (@@FETCH_STATUS = 0)
		begin

			set @ppss_mkt_val	= 0

			if(@ppss_calc_method_flag='C')
			begin
				exec GetPPOrigCostDeprec @input_sup_yr, @ppss_yr_acquired, @ppss_dep_type_cd, @ppss_dep_deprec_cd, @ppss_dep_pct output,0

				set @ppss_rendered_val = @ppss_orig_cost *
					case when isnull(@ppss_dep_pct, 0) > 0 then (@ppss_dep_pct / 100) else 1 end *
					case when isnull(@ppss_pct_good, 0) > 0 then (@ppss_pct_good / 100) else 1 end *
					case when isnull(@ppss_physical_pct, 0) > 0 then (@ppss_physical_pct / 100) else 1 end *
					case when isnull(@ppss_economic_pct, 0) > 0 then (@ppss_economic_pct / 100) else 1 end

				set @ppss_mkt_val	= @ppss_rendered_val

				UPDATE pers_prop_sub_seg 
				SET	pp_mkt_val = @ppss_rendered_val,
					pp_rendered_val = @ppss_rendered_val,
					pp_dep_pct = @ppss_dep_pct
				where prop_id        = @input_prop_id
				and   pp_seg_id      = @pp_seg_id
				and   prop_val_yr    = @input_sup_yr
				and   sup_num		  = @input_sup_num     
				and   pp_sub_seg_id  = @ppss_sub_seg_id

			end
			else if(@ppss_calc_method_flag='F')
			begin
				set @ppss_mkt_val	= @ppss_flat_val

				UPDATE pers_prop_sub_seg 
				SET pp_mkt_val = @ppss_flat_val
				where prop_id        = @input_prop_id
				and   pp_seg_id      = @pp_seg_id
				and   prop_val_yr    = @input_sup_yr
				and   sup_num		  = @input_sup_num     
				and   pp_sub_seg_id  = @ppss_sub_seg_id
			end

			set @pp_subseg_val = @pp_subseg_val + @ppss_mkt_val

		FETCH NEXT FROM PERS_PROP_SUBSEGMENT into	
			@ppss_sub_seg_id,
			@ppss_orig_cost,
			@ppss_yr_acquired,
			@ppss_new_used   ,
			@ppss_type_cd		,
			@ppss_dep_pct,
			@ppss_pct_good,
			@ppss_economic_pct,
			@ppss_physical_pct,
			@ppss_flat_val,
			@ppss_rendered_val,
			@ppss_mkt_val,
			@ppss_calc_method_flag,
			@ppss_sic_cd,
			@ppss_dep_type_cd,
			@ppss_dep_deprec_cd

		end	--re-calc sub segments

	
		CLOSE PERS_PROP_SUBSEGMENT
		DEALLOCATE PERS_PROP_SUBSEGMENT

-- moved below
--		update pers_prop_seg set	pers_prop_seg.pp_subseg_val = isnull(@pp_subseg_val, 0),
--									pers_prop_seg.pp_special_val = isnull(@pp_special_val,0)
--			where
--				pers_prop_seg.prop_id		= @input_prop_id
--				and	pers_prop_seg.prop_val_yr	= @input_sup_yr
--				and	pers_prop_seg.sup_num		= @input_sup_num
--				and	pers_prop_seg.pp_seg_id		= @pp_seg_id
--				and	pers_prop_seg.sale_id		= @input_sale_id




		SET @calc_appraised_val = 0

		DECLARE PERS_PROP_SEGMENT_SCHEDULE_ASSOC CURSOR FAST_FORWARD
		FOR select 	pp_sched_id,
					value_method,
					table_code,
					segment_type,
					active_flag,
					unit_price,
					flat_price_flag
			
			from pp_seg_sched_assoc
			with (nolock)
			where prop_id     = @input_prop_id
			and   pp_seg_id   = @pp_seg_id
			and	  prop_val_yr = @input_sup_yr
			and	  sup_num     = @input_sup_num     
			and	  sale_id     = @input_sale_id

		OPEN PERS_PROP_SEGMENT_SCHEDULE_ASSOC
		FETCH NEXT FROM PERS_PROP_SEGMENT_SCHEDULE_ASSOC into	@pp_sched_id,
									@pp_value_method,
									@pp_table_code,
									@pp_segment_type,
									@active_flag,
									@unit_price,
									@flat_price_flag
		--select pp_sched_id = @pp_sched_id

		while (@@FETCH_STATUS = 0)
		begin
			-- select flat_price_flag = @flat_price_flag

			if ((@flat_price_flag <> 'T') or (@flat_price_flag is null))
			begin
				--If there is a record, go get the first schedule record and read the pp_schedule_order table

				declare @module1 char(5)
				declare @module2 char(5)
				declare @module3 char(5)
				declare @module4 char(5)
				declare @module5 char(5)
				declare @module6 char(5)

				exec GetPPSchedOrder @pp_sched_id, @input_sup_yr, @module1 output, @module2 output, @module3 output, @module4 output, @module5 output, @module6 output

				/*
				select module1 = @module1
				select module2 = @module2
				select module3 = @module3
				select module4 = @module4
				select module5 = @module5
				select module6 = @module6
				*/

				--Initialize the @unit_price variable to 0
				set @unit_price = 0

				--If the first module code is X, then execute it...
				if (@module1 = 'QYDY')
				begin
					--select MOD1_QYDY_BEFORE = @unit_price
					exec GetPPSchedQualityDensity @pp_sched_id, @input_sup_yr, @pp_qual_cd, @pp_density_cd, @unit_price output
					--select MOD1_QYDY_AFTER = @unit_price
				end
				else if (@module1 = 'AREA')
				begin
					exec GetPPSchedArea @pp_sched_id, @input_sup_yr, @pp_area, @unit_price output
				end
				else if (@module1 = 'CLAS')
				begin
					exec GetPPSchedClass @pp_sched_id, @input_sup_yr, @pp_class_cd, @unit_price output
				end
				else if (@module1 = 'DPRC')
				begin
					exec GetPPSchedDeprec @pp_sched_id, @input_prop_id, @input_sup_yr, @pp_seg_id, @pp_sale_id, @pp_sup_num, @active_flag, @unit_price output
				end
				else if (@module1 = 'UNIT')
				begin
					exec GetPPSchedUnit @pp_sched_id, @input_sup_yr, @pp_unit_count, @unit_price output
				end
				else if (@module1 = 'ADJT')
				begin
					--select MOD1_ADJT_BEFORE = @unit_price
					exec GetPPSchedAdjustments @pp_sched_id, @input_sup_yr, @unit_price output
					--select MOD1_ADJT_AFTER = @unit_price
				end

				--If the second module code is X, then execute it...
				if (@module2 = 'QYDY')
				begin
					exec GetPPSchedQualityDensity @pp_sched_id, @input_sup_yr, @pp_qual_cd, @pp_density_cd, @unit_price output
				end
				else if (@module2 = 'AREA')
				begin
					--select MOD2_AREA_BEFORE = @unit_price
					exec GetPPSchedArea @pp_sched_id, @input_sup_yr, @pp_area, @unit_price output
					--select MOD2_AREA_AFTER = @unit_price
				end
				else if (@module2 = 'CLAS')
				begin
					exec GetPPSchedClass @pp_sched_id, @input_sup_yr, @pp_class_cd, @unit_price output
				end
				else if (@module2 = 'DPRC')
				begin
					exec GetPPSchedDeprec @pp_sched_id, @input_prop_id, @input_sup_yr, @pp_seg_id, @pp_sale_id, @pp_sup_num, @active_flag, @unit_price output
				end
				else if (@module2 = 'UNIT')
				begin
					exec GetPPSchedUnit @pp_sched_id, @input_sup_yr, @pp_unit_count, @unit_price output
				end
				else if (@module2 = 'ADJT')
				begin
					exec GetPPSchedAdjustments @pp_sched_id, @input_sup_yr, @unit_price output
				end

				--If the third module code is X, then execute it...
				if (@module3 = 'QYDY')
				begin
					exec GetPPSchedQualityDensity @pp_sched_id, @input_sup_yr, @pp_qual_cd, @pp_density_cd, @unit_price output
				end
				else if (@module3 = 'AREA')
				begin
					exec GetPPSchedArea @pp_sched_id, @input_sup_yr, @pp_area, @unit_price output
				end
				else if (@module3 = 'CLAS')
				begin
					--select MOD3_CLAS_BEFORE = @unit_price
					exec GetPPSchedClass @pp_sched_id, @input_sup_yr, @pp_class_cd, @unit_price output
					--select MOD3_CLAS_AFTER = @unit_price
				end
				else if (@module3 = 'DPRC')
				begin
					exec GetPPSchedDeprec @pp_sched_id, @input_prop_id, @input_sup_yr, @pp_seg_id, @pp_sale_id, @pp_sup_num, @active_flag, @unit_price output
				end
				else if (@module3 = 'UNIT')
				begin
					exec GetPPSchedUnit @pp_sched_id, @input_sup_yr, @pp_unit_count, @unit_price output
				end
				else if (@module3 = 'ADJT')

				begin
					exec GetPPSchedAdjustments @pp_sched_id, @input_sup_yr, @unit_price output
				end

				--If the fourth module code is X, then execute it...
				if (@module4 = 'QYDY')
				begin
					exec GetPPSchedQualityDensity @pp_sched_id, @input_sup_yr, @pp_qual_cd, @pp_density_cd, @unit_price output
				end
				else if (@module4 = 'AREA')
				begin
					exec GetPPSchedArea @pp_sched_id, @input_sup_yr, @pp_area, @unit_price output
				end
				else if (@module4 = 'CLAS')
				begin
					exec GetPPSchedClass @pp_sched_id, @input_sup_yr, @pp_class_cd, @unit_price output
				end
				else if (@module4 = 'DPRC')
				begin
					--select MOD4_DPRC_BEFORE = @unit_price
					exec GetPPSchedDeprec @pp_sched_id, @input_prop_id, @input_sup_yr, @pp_seg_id, @pp_sale_id, @pp_sup_num, @active_flag, @unit_price output
					--select MOD4_DPRC_BEFORE = @unit_price
				end
				else if (@module4 = 'UNIT')
				begin
					--select MOD1_UNIT_BEFORE = @unit_price
					exec GetPPSchedUnit @pp_sched_id, @input_sup_yr, @pp_unit_count, @unit_price output
					--select MOD1_UNIT_AFTER = @unit_price
				end
				else if (@module4 = 'ADJT')
				begin
					exec GetPPSchedAdjustments @pp_sched_id, @input_sup_yr, @unit_price output
				end

				--If the fifth module code is X, then execute it...
				if (@module5 = 'QYDY')
				begin
					--select MOD1_QYDY_BEFORE = @unit_price
					exec GetPPSchedQualityDensity @pp_sched_id, @input_sup_yr, @pp_qual_cd, @pp_density_cd, @unit_price output
					--select MOD1_QYDY_AFTER = @unit_price
				end
				else if (@module5 = 'AREA')
				begin
					exec GetPPSchedArea @pp_sched_id, @input_sup_yr, @pp_area, @unit_price output
				end
				else if (@module5 = 'CLAS')
				begin
					exec GetPPSchedClass @pp_sched_id, @input_sup_yr, @pp_class_cd, @unit_price output
				end
				else if (@module5 = 'DPRC')
				begin
					exec GetPPSchedDeprec @pp_sched_id, @input_prop_id, @input_sup_yr, @pp_seg_id, @pp_sale_id, @pp_sup_num, @active_flag, @unit_price output
				end
				else if (@module5 = 'UNIT')
				begin
					--select MOD5_UNIT_BEFORE = @unit_price
					exec GetPPSchedUnit @pp_sched_id, @input_sup_yr, @pp_unit_count, @unit_price output
					--select MOD5_UNIT_AFTER = @unit_price
				end
				else if (@module5 = 'ADJT')
				begin
					exec GetPPSchedAdjustments @pp_sched_id, @input_sup_yr, @unit_price output
				end

				--If the sixth module code is X, then execute it...
				if (@module6 = 'QYDY')
				begin
					exec GetPPSchedQualityDensity @pp_sched_id, @input_sup_yr, @pp_qual_cd, @pp_density_cd, @unit_price output
				end
				else if (@module6 = 'AREA')
				begin
					exec GetPPSchedArea @pp_sched_id, @input_sup_yr, @pp_area, @unit_price output
				end
				else if (@module6 = 'CLAS')
				begin
					exec GetPPSchedClass @pp_sched_id, @input_sup_yr, @pp_class_cd, @unit_price output
				end
				else if (@module6 = 'DPRC')
				begin
					--select MOD1_DPRC_BEFORE = @unit_price
					exec GetPPSchedDeprec @pp_sched_id, @input_prop_id, @input_sup_yr, @pp_seg_id, @pp_sale_id, @pp_sup_num, @active_flag, @unit_price output
					--select MOD1_DPRC_AFTER = @unit_price

					--select  pp_deprec_pct from pers_prop_seg
					--where
					--	pers_prop_seg.prop_id		= @input_prop_id
					--and	pers_prop_seg.prop_val_yr	= @input_sup_yr
					--and	pers_prop_seg.sup_num		= @input_sup_num
					--and	pers_prop_seg.pp_seg_id		= @pp_seg_id
					--and	pers_prop_seg.sale_id		= @input_sale_id
				end
				else if (@module6 = 'UNIT')
				begin
					exec GetPPSchedUnit @pp_sched_id, @input_sup_yr, @pp_unit_count, @unit_price output
				end
				else if (@module6 = 'ADJT')
				begin
					--select MOD6_ADJT_BEFORE = @unit_price
					exec GetPPSchedAdjustments @pp_sched_id, @input_sup_yr, @unit_price output
					--select MOD6_ADJT_BEFORE = @unit_price
				end


				--now update the unit price of each segment/schedule association record
				update pp_seg_sched_assoc 
				set pp_seg_sched_assoc.unit_price = @unit_price
				where pp_seg_sched_assoc.prop_id	= @input_prop_id
				and pp_seg_sched_assoc.pp_seg_id	= @pp_seg_id
				and	pp_seg_sched_assoc.prop_val_yr	= @input_sup_yr
				and pp_seg_sched_assoc.sup_num	= @input_sup_num
				and	pp_seg_sched_assoc.sale_id	= @input_sale_id
				and	pp_seg_sched_assoc.pp_sched_id	= @pp_sched_id
				and	pp_seg_sched_assoc.value_method	= @pp_value_method
				and	pp_seg_sched_assoc.table_code	= @pp_table_code
				and	pp_seg_sched_assoc.segment_type	= @pp_segment_type

			end
			else
			begin
				exec GetPPSchedDeprec @pp_sched_id, @input_prop_id, @input_sup_yr, @pp_seg_id, @pp_sale_id, @pp_sup_num, @active_flag, @unit_price output
			end

			--if the schedule is flagged as being active, then push the value up to the pers_prop_seg table
			if (@active_flag = 'T')
			begin
				--if the schedule is active and the flat price flag is true, then I want to set a flag here since I don't want
				--to depreciate if the flat value method is chosen.
				if (@flat_price_flag = 'T')
				begin
					set @active_flat_price_flag = 'T'
				end

				update 	pers_prop_seg set pers_prop_seg.pp_unit_price = @unit_price
				where pers_prop_seg.prop_id		= @input_prop_id
				and	pers_prop_seg.prop_val_yr	= @input_sup_yr
				and	pers_prop_seg.sup_num		= @input_sup_num
				and	pers_prop_seg.pp_seg_id		= @pp_seg_id
				and	pers_prop_seg.sale_id		= @input_sale_id

				select @pp_deprec_pct = pp_deprec_pct from pers_prop_seg
				where pers_prop_seg.prop_id		= @input_prop_id
				and	pers_prop_seg.prop_val_yr	= @input_sup_yr
				and	pers_prop_seg.sup_num		= @input_sup_num
				and	pers_prop_seg.pp_seg_id		= @pp_seg_id
				and	pers_prop_seg.sale_id		= @input_sale_id

				--calculate and update the appraised value of the segment
				set @calc_appraised_val = isnull(@unit_price,0)

				if (@pp_area > 0)
				begin
					set @calc_appraised_val = @calc_appraised_val * @pp_area
				end

				if (@pp_unit_count > 0)
				begin
					set @calc_appraised_val = @calc_appraised_val * @pp_unit_count
				end

				if (@pp_pct_good > 0)
				begin
					set @calc_appraised_val = @calc_appraised_val * (@pp_pct_good/100)
				end

				if (@pp_economic_pct > 0)
				begin
					set @calc_appraised_val = @calc_appraised_val * (@pp_economic_pct/100)
				end

				if (@pp_physical_pct > 0)
				begin
					set @calc_appraised_val = @calc_appraised_val * (@pp_physical_pct/100)
				end

				--select deprec_pct = @pp_deprec_pct, flag = @pp_deprec_override

				if ((@pp_deprec_pct > 0) and (@pp_deprec_pct is not null) and ((@pp_deprec_override = 'F') or (@pp_deprec_override is null)))
				begin
					set @calc_appraised_val = @calc_appraised_val * (@pp_deprec_pct/100)
				end

				if (@pp_deprec_override = 'T') and (@pp_deprec_override is not null)
				begin
					if (@pp_yr_acquired is not null)
					begin
						--calculate the age to be used in finding the depreciation percent
						set @age = @input_sup_yr - @pp_yr_acquired
						--select age = @age
						--select before_calc_appraised_val = @calc_appraised_val

						exec GetDeprecAmount @input_sup_yr, @pp_deprec_type_cd, @pp_deprec_deprec_cd, @age, @calc_appraised_val output, @pp_deprec_pct output

						update pers_prop_seg set pers_prop_seg.pp_deprec_pct = @pp_deprec_pct
						where pers_prop_seg.prop_id		= @input_prop_id
						and	pers_prop_seg.prop_val_yr	= @input_sup_yr
						and	pers_prop_seg.sup_num		= @input_sup_num
						and	pers_prop_seg.pp_seg_id		= @pp_seg_id
						and	pers_prop_seg.sale_id		= @input_sale_id
					end
				end
				
				set @calc_appraised_val = round(@calc_appraised_val, @input_rounding_factor)

				update 	pers_prop_seg set pers_prop_seg.pp_appraised_val = @calc_appraised_val
				where pers_prop_seg.prop_id		= @input_prop_id
				and	pers_prop_seg.prop_val_yr	= @input_sup_yr
				and	pers_prop_seg.sup_num		= @input_sup_num
				and	pers_prop_seg.pp_seg_id		= @pp_seg_id
				and	pers_prop_seg.sale_id		= @input_sale_id
			end
			

			FETCH NEXT FROM PERS_PROP_SEGMENT_SCHEDULE_ASSOC into	@pp_sched_id,
										@pp_value_method,
										@pp_table_code,
										@pp_segment_type,
										@active_flag,
										@unit_price,
										@flat_price_flag

		end

		--update pers_prop_seg table with the chosen value...
		set @pp_val = 0
		
		if (@pp_appraise_meth = 'P')
		begin
			set @pp_val = @pp_prior_yr_val
		end
		else if (@pp_appraise_meth = 'L')
		begin
			set @pp_val = @pp_last_notice_val
		end
		else if (@pp_appraise_meth = 'O')
		begin
			declare @deprec_pct numeric(5,2) 

			exec GetPPOrigCostDeprec @input_sup_yr, @pp_yr_acquired, @pp_deprec_type_cd, @pp_deprec_deprec_cd, @deprec_pct output, 0

			update pers_prop_seg 
			set pp_deprec_pct = isnull(@deprec_pct, 0)
			where prop_id = @input_prop_id
			and	prop_val_yr = @input_sup_yr
			and	sup_num = @input_sup_num
			and	pp_seg_id = @pp_seg_id
			and	sale_id = @input_sale_id

			set @pp_val = @pp_orig_cost *
					case when isnull(@deprec_pct, 0) > 0 then (@deprec_pct / 100) else 1 end *
					case when isnull(@pp_pct_good, 0) > 0 then (@pp_pct_good / 100) else 1 end
		end
		else if (@pp_appraise_meth = 'F')
		begin
			set @pp_val = @pp_flat_val
		end
		else if (@pp_appraise_meth = 'R')
		begin
			set @pp_val = @pp_rendered_val
		end
		else if (@pp_appraise_meth = 'SUB')
		begin
			set @pp_val = @pp_subseg_val
		end
		else if (@pp_appraise_meth = 'SP') 
		begin
			set @pp_val = @pp_special_val
		end
		else if (@pp_appraise_meth = 'A')
		begin
		/*	if (@pp_deprec_override = 'T') and (@pp_deprec_override is not null)
			begin
				if (@pp_yr_acquired is not null)
				begin
					--calculate the age to be used in finding the depreciation percent
					select @age = @input_sup_yr - @pp_yr_acquired
					--select age = @age
					--select before_calc_appraised_val = @calc_appraised_val

					exec GetDeprecAmount @input_sup_yr, @pp_deprec_type_cd, @pp_deprec_deprec_cd, @age, @calc_appraised_val output, @pp_deprec_pct output

					update pers_prop_seg set pers_prop_seg.pp_deprec_pct = @pp_deprec_pct
					where
							pers_prop_seg.prop_id		= @input_prop_id
						and	pers_prop_seg.prop_val_yr	= @input_sup_yr
						and	pers_prop_seg.sup_num		= @input_sup_num
						and	pers_prop_seg.pp_seg_id		= @pp_seg_id
						and	pers_prop_seg.sale_id		= @input_sale_id

					--select after_calc_appraised_val = @calc_appraised_val
					select @pp_val = @calc_appraised_val
				end
			end
			else
			begin
				select @pp_val = @calc_appraised_val
			end */

			/* this would indicate that the property did not have any schedules associated
		           with is so therefore a calculated value could not be figured out */
			if isnull(@calc_appraised_val,0) = 0
			begin
				set @calc_appraised_val = 0 

				update pers_prop_seg 
				set pers_prop_seg.pp_appraised_val = @calc_appraised_val
				where pers_prop_seg.prop_id		= @input_prop_id
				and	pers_prop_seg.prop_val_yr	= @input_sup_yr
				and	pers_prop_seg.sup_num		= @input_sup_num
				and	pers_prop_seg.pp_seg_id		= @pp_seg_id
				and	pers_prop_seg.sale_id		= @input_sale_id
			end

			set @pp_val = @calc_appraised_val
		end

		set @pp_val = round(@pp_val, @input_rounding_factor)

		update pers_prop_seg 
		set pers_prop_seg.pp_mkt_val		= isnull(@pp_val,		   0),
			pers_prop_seg.pp_flat_val		= isnull(@pp_flat_val,	   0),
			pers_prop_seg.pp_appraised_val	= isnull(@calc_appraised_val, 0),
			pers_prop_seg.pp_orig_cost		= isnull(@pp_orig_cost,	   0),
			pers_prop_seg.pp_rendered_val	= isnull(@pp_rendered_val, 0),
			pers_prop_seg.pp_special_val	= isnull(@pp_special_val,  0),
			pers_prop_seg.pp_subseg_val		= isnull(@pp_subseg_val	,  0)

		where pers_prop_seg.prop_id		= @input_prop_id
		and	pers_prop_seg.prop_val_yr	= @input_sup_yr
		and	pers_prop_seg.sup_num		= @input_sup_num
		and	pers_prop_seg.pp_seg_id		= @pp_seg_id
		and	pers_prop_seg.sale_id		= @input_sale_id

		--Keep track of the cumulative total of all the segments...
		if (@pp_val is not null)
		begin
			set @output_pp_val_total = @output_pp_val_total + @pp_val
		end

		--Update the recalculation date to the current date/time
		update pers_prop_seg 
		set pers_prop_seg.pp_recalc_date = GetDate()
		where pers_prop_seg.prop_id		= @input_prop_id
		and	pers_prop_seg.prop_val_yr	= @input_sup_yr
		and	pers_prop_seg.sup_num		= @input_sup_num
		and	pers_prop_seg.pp_seg_id		= @pp_seg_id
		and	pers_prop_seg.sale_id		= @input_sale_id

		CLOSE PERS_PROP_SEGMENT_SCHEDULE_ASSOC
		DEALLOCATE PERS_PROP_SEGMENT_SCHEDULE_ASSOC

		if isnull(@pp_new_val_yr,0) = @input_sup_yr
		begin
			set @sum_pp_new_val = @sum_pp_new_val + @pp_new_val
		end
	end

	FETCH NEXT FROM PERS_PROP_SEGMENT into	@pp_sup_num,
				@pp_seg_id,
				@pp_sale_id,
				@pp_sched_cd,
				@pp_table_meth_cd,
				@pp_type_cd,
				@pp_class_cd,
				@pp_density_cd,
				@pp_adj_cd,
				@pp_area,
				@pp_unit_count,
				@pp_yr_acquired,
				@pp_dep_method,
				@pp_pct_good,
				@pp_orig_cost,
				@pp_economic_pct,
				@pp_physical_pct,
				@pp_flat_val,
				@pp_rendered_val,
				@pp_prior_yr_val,
				@pp_last_notice_val,
				@pp_method_val,
				@pp_appraised_val,
				@pp_appraise_meth,
				@pp_new_val,
				@pp_new_val_yr,
				@pp_mkt_val,
				@pp_comment,
				@pp_unit_price,
				@pp_qual_cd,
				@pp_description,
				@pp_sic_cd,
				@pp_state_cd,
				@pp_deprec_type_cd,
				@pp_deprec_deprec_cd,
				@pp_deprec_override,
				@pp_deprec_pct,
				@pp_active_flag,
				@pp_special_val,		
				@pp_subseg_val,
				@sp_per_unit_val,
				@sp_per_area_val,
				@sp_units_area_number,
				@sp_method		

end

set @output_pp_new_val = round(@sum_pp_new_val, @input_rounding_factor)
/*
--Find out if there are any errors that occured in the recalculation process
select  @error_ct = count(prop_recalc_errors.prop_id)
	from  prop_recalc_errors
	where prop_recalc_errors.prop_id = @input_prop_id
	and   prop_recalc_errors.sup_num = @input_sup_num
	and   prop_recalc_errors.sup_yr  =  @input_sup_yr

	if (@error_ct > 0)
	begin
		select @recalc_flag = 'E'
	end
	else
	begin
		select @recalc_flag = 'C'
	end

--Update the property_val table with the appraised value, assessed value, and the recalculation status
update property_val set property_val.appraised_val = @output_pp_val_total,
		 	property_val.assessed_val  = @output_pp_val_total,
			property_val.market	   = @output_pp_val_total,
			property_val.recalc_flag   = @recalc_flag
	where property_val.prop_id     = @input_prop_id
	and   property_val.sup_num     = @input_sup_num
	and   property_val.prop_val_yr = @input_sup_yr */


CLOSE PERS_PROP_SEGMENT
DEALLOCATE PERS_PROP_SEGMENT

GO

