

CREATE PROCEDURE SetImpAdjustments

	@input_prop_id          int,
	@input_prop_yr          int,
	@input_sup_num          int,
	@input_sale_id          int,
	@input_mass_adj_pct     numeric(5,2)

AS

declare @imprv_id		int
declare @imprv_det_id    	int

declare @prev_imprv_det_id		int
declare @curr_imprv_det_id		int
declare @imprv_det_adj_pc		numeric(14,2)
declare @imprv_det_adj_amt		numeric(14)
declare @imprv_det_adj_usage_amt 	numeric(14)
declare @imprv_det_adj_usage_pct 	numeric(5,2)
declare @imprv_det_adj_usage     	char(1)
declare @imprv_det_adj_lid_year_added 	numeric(4)
declare @imprv_det_adj_lid_orig_value 	numeric(14)
declare @imprv_det_adj_lid_econ_life 	numeric(4)
declare @imprv_det_adj_lid_residual_pct numeric(14,2)
declare @imprv_det_adj_seq		int

declare @prev_imprv_id		int
declare @curr_imprv_id		int
declare @imprv_adj_pc		numeric(5,2)
declare @imprv_adj_amt		numeric(14)
declare @imprv_adj_type_amt	numeric(14)
declare @imprv_adj_type_pct	numeric(5,2)
declare @imprv_adj_usage	char(1)

declare @imprv_adj_percent	numeric(5,2)
declare @imprv_econ_pct		numeric(5,2)
declare	@imprv_phys_pct		numeric(5,2)
declare	@imprv_func_pct		numeric(5,2)
declare @imprv_percent_complete numeric(5,2)
declare @imprv_type_cd		varchar(10)

declare @imprv_det_adj_percent	numeric(8,6)
declare @imprv_det_econ_pct  	numeric(5,2)
declare @imprv_det_phys_pct	numeric(5,2)
declare @imprv_det_func_pct	numeric(5,2)
declare @imprv_det_percent_complete numeric(5,2)
declare @imprv_det_dep_pct numeric(5,2)
declare @imprv_det_size_adj_pct numeric(5,2)
declare @imprv_det_econ_override char(1)
declare @imprv_det_phys_override char(1)
declare @imprv_det_func_override char(1)
declare @imprv_det_percent_complete_override char(1)
declare @imprv_det_dep_pct_override char(1)
declare @imprv_det_size_adj_pct_override char(1)
declare @imprv_det_meth_cd varchar(20)

declare @adj_amount   		numeric(14)
declare @adj_percent  		numeric(8,6)
declare @count			int
declare @phys_pct		numeric(5,2)
declare @phys_pct_source varchar(1)
declare @dep_pct		numeric(5,2)
declare @size_adj_pct	numeric(5,2)

declare @factor_flag char(1)
declare @slope_intercept_flag bit
declare @slope_intercept_deprec_pct numeric(5,2)
declare @slope_intercept_size_adj_pct numeric(5,2)

/***************************** update the adjustment factors for the  ****************************/
/***************************** improvement detail first               ****************************/
/* now initialize all the imprv_detail associated with this property with the beginning adj factors 
   this cannot be in the adj_loop because some details segments might not have local adjustments */
SET NOCOUNT ON

SELECT TOP 1 @factor_flag = ISNULL(factor_flag, '*')
FROM pacs_system
WHERE system_type IN ('A', 'B')

select @count       = 0
select @curr_imprv_det_id  = 0
select @curr_imprv_id = 0
select @adj_amount  = 0

if @factor_flag = '*'
begin
	set @adj_percent = 1.00
end
else
begin
	set @adj_percent = 0.00
end



update imprv_detail  set imprv_det_adj_factor = @adj_percent,
                         imprv_det_adj_amt    = @adj_amount
where   prop_id     = @input_prop_id
and     prop_val_yr = @input_prop_yr
and     sup_num     = @input_sup_num
and     sale_id     = @input_sale_id

DECLARE IMPRV_DETAIL_ADJ_VW CURSOR FAST_FORWARD
FOR select imprv_id, 
    imprv_det_id,    
    imprv_det_adj_seq,
    imprv_det_adj_pc, 
    imprv_det_adj_amt, 
    imprv_adj_type_amt, 
    imprv_adj_type_pct,
    imprv_adj_type_usage,
    imprv_det_adj_lid_year_added, 
    imprv_det_adj_lid_orig_value, 
    imprv_det_adj_lid_econ_life, 
    imprv_det_adj_lid_residual_pct
    from   imp_detail_adj_vw
    where   prop_id     = @input_prop_id
    and     prop_val_yr = @input_prop_yr
    and     sup_num     = @input_sup_num
    and     sale_id     = @input_sale_id

OPEN IMPRV_DETAIL_ADJ_VW
FETCH NEXT FROM IMPRV_DETAIL_ADJ_VW into @imprv_id,
				   	@imprv_det_id,
				   	@imprv_det_adj_seq,
				 	@imprv_det_adj_pc,
				 	@imprv_det_adj_amt,
				 	@imprv_det_adj_usage_amt,
				 	@imprv_det_adj_usage_pct,
					@imprv_det_adj_usage,
					@imprv_det_adj_lid_year_added, 
    					@imprv_det_adj_lid_orig_value, 
    					@imprv_det_adj_lid_econ_life, 
    					@imprv_det_adj_lid_residual_pct 

while (@@FETCH_STATUS = 0)
begin

	if (@imprv_det_id <> @curr_imprv_det_id)
	begin
		if (@count > 0)
		begin
			update imprv_detail  set imprv_det_adj_factor = @adj_percent,
						     		 imprv_det_adj_amt    = @adj_amount
			where   prop_id      = @input_prop_id
			and     prop_val_yr  = @input_prop_yr
			and     sup_num      = @input_sup_num
			and     sale_id      = @input_sale_id
			and     imprv_det_id = @curr_imprv_det_id
			and     imprv_id     = @curr_imprv_id
		end
	
		select @curr_imprv_id      = @imprv_id
		select @curr_imprv_det_id  = @imprv_det_id
		select @adj_amount  = 0
		if @factor_flag = '*'
		begin
			set @adj_percent = 1.00
		end
		else
		begin
			set @adj_percent = 0.00
		end
	end

	select @prev_imprv_id     = @imprv_id
	select @prev_imprv_det_id = @imprv_det_id
	select @count      = @count + 1
	
	/* user defined */
	if (@imprv_det_adj_usage = 'U')
	begin
		if (@imprv_det_adj_amt is not null)
		begin 
			select @adj_amount = @adj_amount + @imprv_det_adj_amt
		end
		
		if @factor_flag = '*'
		begin
			if (@imprv_det_adj_pc > 0) and (@imprv_det_adj_pc is not null)
			begin
				set @adj_percent = @adj_percent * (@imprv_det_adj_pc/100)
			end
		end
		else
		begin
			set @adj_percent = @adj_percent + (ISNULL(@imprv_det_adj_pc,0)/100)
		end
	end
	/* amount */
	else if (@imprv_det_adj_usage = 'A')
	begin 
		if (@imprv_det_adj_usage_amt is not null)
		begin
			select @adj_amount = @adj_amount + @imprv_det_adj_usage_amt
		end
	end
	/* percent */
	else if (@imprv_det_adj_usage = 'P')
	begin
		if @factor_flag = '*'
		begin
			if (@imprv_det_adj_usage_pct > 0) and (@imprv_det_adj_usage_pct is not null)
			begin
				set @adj_percent = @adj_percent * (@imprv_det_adj_usage_pct/100)
			end
		end
		else
		begin
			set @adj_percent = @adj_percent + (ISNULL(@imprv_det_adj_usage_pct,0)/100)
		end
	end
	/* straight line adjustment */
	else if (@imprv_det_adj_usage = 'S')
	begin

		if (@imprv_det_adj_lid_year_added is null)
		begin
			select @imprv_det_adj_lid_year_added = 0
		end
		
		if (@imprv_det_adj_lid_orig_value is null)
		begin
			select @imprv_det_adj_lid_orig_value = 0
		end
		
		if (@imprv_det_adj_lid_econ_life is null)
		begin
			select @imprv_det_adj_lid_econ_life = 0
		end
		
		if (@imprv_det_adj_lid_residual_pct is null)
		begin
			select @imprv_det_adj_lid_residual_pct = 0
		end

		if (@imprv_det_adj_lid_orig_value <> 0 and
			@imprv_det_adj_lid_year_added > 1900 and 
			@imprv_det_adj_lid_econ_life > 0 and
			@imprv_det_adj_lid_residual_pct >= 0)
		begin
		
		-- this exact code is taken from ImprovDetailAdjDetaildlg.cpp line 480
		declare @nYearPct 		numeric(14,6)
		declare @nResidualValue 	numeric(14)
		declare @nInitValue		numeric(14)
		declare @nDeprecValue		numeric(14)
		
		select @nYearPct       = 1 - ((@input_prop_yr - @imprv_det_adj_lid_year_added)/@imprv_det_adj_lid_econ_life)
		select @nResidualValue = @imprv_det_adj_lid_orig_value * (@imprv_det_adj_lid_residual_pct/100)
		select @nInitValue     = @imprv_det_adj_lid_orig_value - @nResidualValue
		
		select @nDeprecValue   =  ((@nInitValue * @nYearPct) + @nResidualValue)
		
		select nDeprecValue = @nDeprecValue
		
		if ((@input_prop_yr - @imprv_det_adj_lid_year_added > @imprv_det_adj_lid_econ_life) or
			(@imprv_det_adj_lid_year_added > @input_prop_yr))
		begin
			select @nDeprecValue = @nResidualValue
		end
		
		--select nDeprecValue = @nDeprecValue
		
		if (@nDeprecValue is not null)
		begin
			select @adj_amount = @adj_amount + @nDeprecValue


		end
		
		-- since this adjustment is calculated on the fly we need to update the adjustment table with the new value
		update imprv_det_adj
		set       imprv_det_adj_amt = @nDeprecValue
		where prop_id 		  = @input_prop_id
		and     prop_val_yr 	  = @input_prop_yr
		and     imprv_id	   	  = @imprv_id
		and     imprv_det_id 	  = @imprv_det_id
		and     imprv_det_adj_seq = @imprv_det_adj_seq
		and     sale_id		  = @input_sale_id
		and     sup_num	 	  = @input_sup_num
		end		
   end
      
   FETCH NEXT FROM IMPRV_DETAIL_ADJ_VW into @imprv_id,
				 	@imprv_det_id,
					@imprv_det_adj_seq,
				 	@imprv_det_adj_pc,
				 	@imprv_det_adj_amt,
				 	@imprv_det_adj_usage_amt,
				 	@imprv_det_adj_usage_pct,
					@imprv_det_adj_usage,
					@imprv_det_adj_lid_year_added, 
    					@imprv_det_adj_lid_orig_value, 
    					@imprv_det_adj_lid_econ_life, 
    					@imprv_det_adj_lid_residual_pct 
end



/* if the count is greater than 0 then update the last record that 
   would have been generated from the cursor */
if (@count > 0)
begin 

	update imprv_detail  set imprv_det_adj_factor = @adj_percent,
                         	 imprv_det_adj_amt    = @adj_amount
	where   prop_id      = @input_prop_id
		and     prop_val_yr  = @input_prop_yr
		and     sup_num      = @input_sup_num
		and     sale_id      = @input_sale_id
		and     imprv_det_id = @prev_imprv_det_id
		and     imprv_id     = @prev_imprv_id
--select adj_amt = @adj_amount
--select adj_pct = @adj_percent


end

CLOSE IMPRV_DETAIL_ADJ_VW
DEALLOCATE IMPRV_DETAIL_ADJ_VW

/***************************** update the adjustment factors for the  ****************************/
/***************************** properties improvements                ****************************/
/* now initialize all the imprv_detail associated with this property with the beginning adj factors 
   this cannot be in the adj_loop because some details segments might not have local adjustments */

select @count       = 0
select @curr_imprv_det_id  = 0
select @adj_amount  = 0

set @adj_percent = 1.00

/* initialize the adj factors, also go ahead and set the mass adj factor for the improvements */
update imprv         set imprv_adj_factor = @adj_percent,
                         imprv_adj_amt    = @adj_amount,
			 imprv_mass_adj_factor = @input_mass_adj_pct
where   prop_id     = @input_prop_id
and     prop_val_yr = @input_prop_yr
and     sup_num     = @input_sup_num
and     sale_id     = @input_sale_id

DECLARE IMPRV_ADJ_VW CURSOR FAST_FORWARD
FOR select imprv_id, 
    imprv_adj_pc, 
    imprv_adj_amt, 
    imprv_adj_type_amt, 
    imprv_adj_type_pct,
    imprv_adj_type_usage
    from   imp_adj_vw
    where   prop_id     = @input_prop_id
    and     prop_val_yr = @input_prop_yr
    and     sup_num     = @input_sup_num
    and     sale_id     = @input_sale_id

OPEN IMPRV_ADJ_VW
FETCH NEXT FROM IMPRV_ADJ_VW into @imprv_id,
				  @imprv_adj_pc,
				  @imprv_adj_amt,
				  @imprv_adj_type_amt,
				  @imprv_adj_type_pct,
				  @imprv_adj_usage

while (@@FETCH_STATUS = 0)
begin

	if (@imprv_id <> @curr_imprv_id)
	begin
		if (@count > 0)
		begin
			update imprv  set imprv_adj_factor = @adj_percent,
			     	  imprv_adj_amt    = @adj_amount
			where   prop_id      = @input_prop_id
			and     prop_val_yr  = @input_prop_yr
			and     sup_num      = @input_sup_num
			and     sale_id      = @input_sale_id
			and     imprv_id     = @curr_imprv_id
		end
			
			
			select @curr_imprv_id  = @imprv_id
			select @adj_amount  = 0

			set @adj_percent = 1.00
	end
		
	select @prev_imprv_id = @imprv_id
	select @count      = @count + 1
	
	/* user defined */
	if (@imprv_adj_usage = 'U')
	begin 
		if (@imprv_adj_amt is not null)
		begin 
			select @adj_amount = @adj_amount + @imprv_adj_amt
		end
	
		if (@imprv_adj_pc > 0) and (@imprv_adj_pc is not null)
		begin
				set @adj_percent = @adj_percent * (@imprv_adj_pc/100)
		end
	end
	/* amount */
	else if (@imprv_adj_usage = 'A')
	begin
		if (@imprv_adj_type_amt is not null)
		begin
			select @adj_amount = @adj_amount + @imprv_adj_type_amt
		end
	end
	/* percent */
	else if (@imprv_adj_usage = 'P')
	begin   	
		if (@imprv_adj_type_pct > 0) and (@imprv_adj_type_pct is not null)
		begin
				set @adj_percent = @adj_percent * (@imprv_adj_type_pct/100)
		end
	end
      
	FETCH NEXT FROM IMPRV_ADJ_VW into @imprv_id,
				     @imprv_adj_pc,
				     @imprv_adj_amt,
				     @imprv_adj_type_amt,
				     @imprv_adj_type_pct,
				     @imprv_adj_usage
end

if (@input_mass_adj_pct is null)
begin
	set @input_mass_adj_pct = 1.00
end

/* if the count is greater than 0 then update the last record that 
   would have been generated from the cursor */
if (@count > 0)
begin 

	update imprv set imprv_adj_factor = @adj_percent,
					imprv_adj_amt    = @adj_amount,
					imprv_mass_adj_factor = @input_mass_adj_pct
	where   prop_id      = @input_prop_id
	and     prop_val_yr  = @input_prop_yr
	and     sup_num      = @input_sup_num
	and     sale_id      = @input_sale_id
	and     imprv_id = @prev_imprv_id
		
end

CLOSE IMPRV_ADJ_VW
DEALLOCATE IMPRV_ADJ_VW

/***************************** update the adjustment factors for the  ****************************/
/***************************** properties improvements / details      ****************************/
/* Part I:
 Initialize all the imprv_detail associated with this property taking into account the
 new adjustment factors: a) Economic, b) Physical, c) Functional, and d) Percent Complete

 Part II:
 Initialize all the imprv associated with this property taking into account the
 new adjustment factors: a) Economic, b) Physical, c) Functional, and d) Percent Complete
*/

DECLARE IMPRV CURSOR FAST_FORWARD
FOR select imprv_id,
			imprv_adj_factor,
			economic_pct,
			physical_pct,
			functional_pct,
			percent_complete,
			imprv_type_cd
	from imprv
	where prop_id 		= @input_prop_id
	and   prop_val_yr	= @input_prop_yr
	and   sup_num		= @input_sup_num
	and   sale_id		= @input_sale_id

OPEN IMPRV
FETCH NEXT FROM IMPRV into 	@imprv_id,
				@imprv_adj_percent,
				@imprv_econ_pct,
				@imprv_phys_pct,
				@imprv_func_pct,
				@imprv_percent_complete,
				@imprv_type_cd

while (@@FETCH_STATUS = 0)
begin

	if (@imprv_econ_pct is null)
	begin
		select @imprv_econ_pct = 100
	end

	if (@imprv_phys_pct is null)
	begin
		select @imprv_phys_pct = 100
	end

	if (@imprv_func_pct is null)
	begin
		select @imprv_func_pct = 100
	end

	if (@imprv_percent_complete is null)
	begin
		select @imprv_percent_complete = 100
	end

	if @factor_flag = '*'
	begin
		set @imprv_adj_percent = @imprv_adj_percent * (@imprv_econ_pct/100) * (@imprv_phys_pct/100) * (@imprv_func_pct/100) * (@imprv_percent_complete/100)
	end
	else
	begin
		set @imprv_adj_percent = @imprv_adj_percent + @imprv_econ_pct + @imprv_phys_pct + @imprv_func_pct + @imprv_percent_complete
	end

	/*
	update imprv set imprv_adj_factor = @imprv_adj_percent
		where 	prop_id 	= @input_prop_id
		and	prop_val_yr	= @input_prop_yr
		and	sup_num		= @input_sup_num
		and 	sale_id		= @input_sale_id
		and	imprv_id	= @imprv_id
	*/	

	/* Now get the improvment detail information */	
	DECLARE IMPRV_DETAIL CURSOR FAST_FORWARD
	FOR select imprv_det_id,
				imprv_det_adj_factor,
				economic_pct,
				physical_pct,
				functional_pct,
				percent_complete,
				dep_pct,
				size_adj_pct,
				economic_pct_override,
				physical_pct_override,
				functional_pct_override,
				percent_complete_override,
				dep_pct_override,
				size_adj_pct_override,
				imprv_det_meth_cd
				
		from imprv_detail
		where prop_id 		= @input_prop_id
		and   prop_val_yr	= @input_prop_yr
		and   sup_num		= @input_sup_num
		and   sale_id		= @input_sale_id
		and   imprv_id		= @imprv_id

	OPEN IMPRV_DETAIL
	FETCH NEXT FROM IMPRV_DETAIL into @imprv_det_id,
					@imprv_det_adj_percent,
					@imprv_det_econ_pct,
					@imprv_det_phys_pct,
					@imprv_det_func_pct,
					@imprv_det_percent_complete,
					@imprv_det_dep_pct,
					@imprv_det_size_adj_pct,
					@imprv_det_econ_override,
					@imprv_det_phys_override,
					@imprv_det_func_override,
					@imprv_det_percent_complete_override,
					@imprv_det_dep_pct_override,
					@imprv_det_size_adj_pct_override,
					@imprv_det_meth_cd

	while (@@FETCH_STATUS = 0)
	begin
		/*
		 * This SP will return a flag indicating whether or not the improvement schedule
		 * is setup for the slope/intercept method or not.  This SP does NOT update
		 * anything and will do nothing if the slope/intercept method is not set.
		 */
	
		exec GetSlopeInterceptAdjFactors @input_prop_id, @input_prop_yr, @input_sup_num,
									@input_sale_id, @imprv_id, @imprv_det_id,
									@imprv_det_meth_cd, 
									@slope_intercept_deprec_pct output, @slope_intercept_size_adj_pct output,
									@slope_intercept_flag output

		if @imprv_det_dep_pct_override = 'T'
		begin
			set @slope_intercept_deprec_pct = @imprv_det_dep_pct
		end

		if @imprv_det_size_adj_pct_override = 'T'
		begin
			set @slope_intercept_size_adj_pct = @imprv_det_size_adj_pct
		end

		if (@imprv_det_econ_pct is null)
		begin
			set @imprv_det_econ_pct = 100
		end

		if @factor_flag <> '+' and @slope_intercept_deprec_pct = 0
		begin
			set @slope_intercept_deprec_pct = 100
		end

		if @factor_flag <> '+' and @slope_intercept_size_adj_pct = 0
		begin
			set @slope_intercept_size_adj_pct = 100
		end


		if (@imprv_det_phys_pct is null)
		begin
			set @imprv_det_phys_pct = 100
		end

		if (@imprv_det_func_pct is null)
		begin
			set @imprv_det_func_pct = 100
		end

		if (@imprv_det_percent_complete is null)
		begin
			set @imprv_det_percent_complete = 100
		end

		if @factor_flag = '+'
		begin
			set @imprv_det_adj_percent = @imprv_det_adj_percent + (@slope_intercept_deprec_pct / 100)
			set @imprv_det_adj_percent = @imprv_det_adj_percent + (@slope_intercept_size_adj_pct / 100)
		end
		else
		begin
			set @imprv_det_adj_percent = @imprv_det_adj_percent * (@slope_intercept_deprec_pct / 100)
			set @imprv_det_adj_percent = @imprv_det_adj_percent * (@slope_intercept_size_adj_pct / 100)
		end

		if (@imprv_det_econ_override = 'T')
		begin
			if @factor_flag = '+'
			begin
				set @imprv_det_adj_percent = @imprv_det_adj_percent + (@imprv_det_econ_pct/100)
			end
			else
			begin
				set @imprv_det_adj_percent = @imprv_det_adj_percent * (@imprv_det_econ_pct/100)
			end
		end
		else
		begin
			if @factor_flag = '+'
			begin
				set @imprv_det_adj_percent = @imprv_det_adj_percent + (@imprv_econ_pct/100)
			end
			else
			begin
				set @imprv_det_adj_percent = @imprv_det_adj_percent * (@imprv_econ_pct/100)
			end
		end

		if (@imprv_det_phys_override = 'T')
		begin
			if @factor_flag = '+'
			begin
				set @imprv_det_adj_percent = @imprv_det_adj_percent + (@imprv_det_phys_pct/100)
			end
			else
			begin
				set @imprv_det_adj_percent = @imprv_det_adj_percent * (@imprv_det_phys_pct/100)
			end
		end
		else
		begin
			select @phys_pct = null

			if @slope_intercept_flag <> 1
			begin
				--Execute the GetImprvDetailDeprec stored procedure to get the physical_pct value
				exec GetImprvDetailDeprec @imprv_id, @imprv_det_id, @input_prop_id, @input_sup_num, @input_prop_yr, @input_sale_id, @phys_pct OUTPUT, @phys_pct_source OUTPUT
			end

			--select phy_pct = @phys_pct

			if (@phys_pct is not null)
			begin
				if @factor_flag = '+'
				begin
					set @imprv_det_adj_percent = @imprv_det_adj_percent + (@phys_pct/100)
				end
				else
				begin
					set @imprv_det_adj_percent = @imprv_det_adj_percent * (@phys_pct/100)
				end
			end
			else
			begin
				if @factor_flag = '+'
				begin
					set @imprv_det_adj_percent = @imprv_det_adj_percent + (@imprv_phys_pct/100)
				end
				else
				begin
					set @imprv_det_adj_percent = @imprv_det_adj_percent * (@imprv_phys_pct/100)
				end
			end
		end

		if (@imprv_det_func_override = 'T')
		begin
			if @factor_flag = '+'
			begin
				set @imprv_det_adj_percent = @imprv_det_adj_percent + (@imprv_det_func_pct/100)
			end
			else
			begin
				set @imprv_det_adj_percent = @imprv_det_adj_percent * (@imprv_det_func_pct/100)
			end
		end
		else
		begin
			if @factor_flag = '+'
			begin
				set @imprv_det_adj_percent = @imprv_det_adj_percent + (@imprv_func_pct/100)
			end
			else
			begin
				set @imprv_det_adj_percent = @imprv_det_adj_percent * (@imprv_func_pct/100)
			end
		end

		if (@imprv_det_percent_complete_override = 'T')
		begin
			set @imprv_det_adj_percent = @imprv_det_adj_percent * (@imprv_det_percent_complete/100)
		end
		else
		begin
			set @imprv_det_adj_percent = @imprv_det_adj_percent * (@imprv_percent_complete/100)
		end

		if @slope_intercept_flag = 1
		begin
			set @dep_pct = @slope_intercept_deprec_pct
			set @size_adj_pct = @slope_intercept_size_adj_pct
--			set @imprv_det_adj_percent = @imprv_det_adj_percent / 100
			set @phys_pct_source = NULL
		end
		else
		begin
			if @imprv_det_dep_pct_override = 'T'
			begin
				set @dep_pct = @slope_intercept_deprec_pct
			end
			else
			begin
				set @dep_pct = 0
			end

			if @imprv_det_size_adj_pct_override = 'T'
			begin
				set @size_adj_pct = @slope_intercept_size_adj_pct
			end
			else
			begin
				set @size_adj_pct = 0
			end
		end

		if @slope_intercept_flag = 1
		begin
			-- the phys_pct_source will get set to null when this
 			-- is a slope intercept calculation	
			update imprv_detail set imprv_det_adj_factor = @imprv_det_adj_percent,
						dep_pct = @dep_pct,
						size_adj_pct = @size_adj_pct,
						physical_pct_source = @phys_pct_source
			where prop_id 	= @input_prop_id
			and	prop_val_yr	= @input_prop_yr
			and	sup_num		= @input_sup_num
			and sale_id		= @input_sale_id
			and	imprv_det_id	= @imprv_det_id
			and imprv_id	= @imprv_id
		end
		else
		begin
			-- don't update the physical pct source if this is not a slope intercept 
			-- calculation. The GetImprvDetailDeprec will handle this			
			update imprv_detail set imprv_det_adj_factor = @imprv_det_adj_percent,
						dep_pct = @dep_pct,
						size_adj_pct = @size_adj_pct
			where prop_id 	= @input_prop_id
			and	prop_val_yr	= @input_prop_yr
			and	sup_num		= @input_sup_num
			and sale_id		= @input_sale_id
			and	imprv_det_id	= @imprv_det_id
			and imprv_id	= @imprv_id
		end
			
			

		FETCH NEXT FROM IMPRV_DETAIL into @imprv_det_id,
					@imprv_det_adj_percent,
					@imprv_det_econ_pct,
					@imprv_det_phys_pct,
					@imprv_det_func_pct,
					@imprv_det_percent_complete,
					@imprv_det_dep_pct,
					@imprv_det_size_adj_pct,
					@imprv_det_econ_override,
					@imprv_det_phys_override,
					@imprv_det_func_override,
					@imprv_det_percent_complete_override,
					@imprv_det_dep_pct_override,
					@imprv_det_size_adj_pct_override,
					@imprv_det_meth_cd
		
	end

    CLOSE IMPRV_DETAIL
	DEALLOCATE IMPRV_DETAIL

	FETCH NEXT FROM IMPRV into @imprv_id,
				@imprv_adj_percent,
				@imprv_econ_pct,
				@imprv_phys_pct,
				@imprv_func_pct,
				@imprv_percent_complete,
				@imprv_type_cd
end

CLOSE IMPRV
DEALLOCATE IMPRV

GO

