
CREATE PROCEDURE GetLandCalculatedValue

	@input_sched_id				int,
	@input_ls_yr				numeric(4),
	@input_show_output      	int,
	@input_acres				numeric(18,4),
	@input_sqft					numeric(18,4),
	@input_sum_acres            numeric(18,4),
	@input_eff_acres			numeric(18,4),
	@input_sum_sqft           	numeric(18,2),
	@input_effective_front    	numeric(18,2),
	@input_effective_depth    	numeric(18,2),
	@input_special_unit_price 	numeric(18,2),
	@input_num_lots				numeric(7,2),
	@output_land_value        	numeric(18) OUTPUT,
	@output_unit_price   		numeric(18,2) OUTPUT

AS


declare @ls_id           	int
declare @ls_code    		varchar(10)
declare @ls_method       	varchar(5)
declare @ls_ag_or_mkt  		char(1)
declare @ls_interpolate  	char(1)
declare @ls_up   		numeric(14,2)
declare @ls_base_price   	numeric(14,2)
declare @ls_std_depth  		numeric(14,4)
declare @ls_plus_dev_ft  	numeric(14,4)
declare @ls_plus_dev_amt  	numeric(14,2)
declare @ls_minus_dev_ft 	numeric(14,4)
declare @ls_minus_dev_amt 	numeric(14,2)
declare @ls_detail_id  		int
declare @ls_range_max  		numeric(18)
declare @ls_range_price  	numeric(14,2)
declare @land_value  		numeric(14)
declare @base_price  		numeric(14, 2)
declare @unit_price  		numeric(14,2)
declare @size_acres		numeric(18,4)
declare @size_sqft		numeric(18,4)
declare @eff_sqft		numeric(18,4)
declare @dev_ft 		numeric(14,4)
declare @dev_amt 		numeric(14,2)
declare @ls_ff_type		char(1)
declare @ls_slope_intercept bit


/* initialize variables */
select @land_value = 0
select @unit_price = 0

SELECT @ls_id = ls_id,
		@ls_code = ls_code,
		@ls_method = ls_method,
		@ls_ag_or_mkt = ls_ag_or_mkt,
		@ls_interpolate = ls_interpolate,
		@ls_up = ls_up,
		@ls_base_price = ls_base_price,
		@ls_std_depth = ls_std_depth,
		@ls_plus_dev_ft = ls_plus_dev_ft,
		@ls_plus_dev_amt = ls_plus_dev_amt,
		@ls_minus_dev_ft = ls_minus_dev_ft,
		@ls_minus_dev_amt = ls_minus_dev_amt,
		@ls_ff_type = ls_ff_type,
		@ls_slope_intercept = ls_slope_intercept
FROM land_sched
WITH (NOLOCK)
WHERE ls_id = @input_sched_id
AND ls_year = @input_ls_yr

/*
 * I don't see why we need a cursor here.  There can only be one
 * land_sched row per id and year combination as it's the primary
 * key.
 *
 * Rich 04/02/2003
 *

DECLARE LAND_SCHED CURSOR FAST_FORWARD
FOR select	ls_id,
			ls_code,
			ls_method, 
			ls_ag_or_mkt, 
			ls_interpolate,
			ls_up,  
			ls_base_price,
			ls_std_depth,
			ls_plus_dev_ft,
			ls_plus_dev_amt,
			ls_minus_dev_ft,
			ls_minus_dev_amt,
			ls_ff_type,
			ls_slope_intercept
    from   land_sched 
	WITH (NOLOCK)
    where  ls_id = @input_sched_id
    and    ls_year = @input_ls_yr

OPEN LAND_SCHED
FETCH NEXT FROM LAND_SCHED into @ls_id,           
     	@ls_code,    
     	@ls_method,       
     	@ls_ag_or_mkt,  
     	@ls_interpolate,  
     	@ls_up,   
     	@ls_base_price,   
     	@ls_std_depth,  
     	@ls_plus_dev_ft,  
     	@ls_plus_dev_amt,  
     	@ls_minus_dev_ft, 
    	@ls_minus_dev_amt,
		@ls_ff_type,
		@ls_slope_intercept

if (@@FETCH_STATUS = 0)
begin
*/

	if @ls_slope_intercept = 1
	begin
		set @size_acres = ISNULL(@input_eff_acres, 0)
		if @size_acres = 0
		begin
			set @size_acres = @input_sum_acres
		end
		exec GetLandUnitPriceSlopeIntercept @ls_id, @input_ls_yr, @size_acres, @unit_price OUTPUT
		set @land_value = @input_acres * @unit_price
	end
    else if (@ls_method = 'A')
    begin
		/* calculate the acres size to use to find the unit price */
	  	if (@input_eff_acres > @input_sum_acres) and (@input_eff_acres is not null)
        begin
			select @size_acres = @input_eff_acres
		end
		else
		begin
			select @size_acres = @input_sum_acres
		end
 
        if (@ls_code = 'Special')
        begin
			select @land_value = @input_acres * @input_special_unit_price
			select @unit_price = @input_special_unit_price
        end
        else
        begin
			exec GetLandUnitPrice @ls_id, @input_ls_yr, @size_acres, @unit_price OUTPUT
			select @land_value = @input_acres * @unit_price
        end
    end
    else if (@ls_method = 'SQ')
    begin
	
		select @eff_sqft = @input_eff_acres * 43560
	
       	/* calculate the sqft size to use to find the unit price */
	  	if (@eff_sqft > @input_sum_sqft) and (@eff_sqft is not null)
	   	begin
			select @size_sqft = @eff_sqft
		end
		else
		begin
			select @size_sqft = @input_sum_sqft
	   	end
       
        if (@ls_code = 'Special')
        begin
			select @land_value = @input_sqft * @input_special_unit_price
			select @unit_price = @input_special_unit_price
        end
        else
        begin
			exec GetLandUnitPrice @ls_id, @input_ls_yr, @size_sqft, @unit_price OUTPUT
			select @land_value = @input_sqft * @unit_price
        end
    end
    else if (@ls_method = 'FF')
    begin
     
		if (@ls_code = 'Special')
		begin
	        select @base_price = @input_special_unit_price
			select @land_value = @input_effective_front * @base_price
			select @unit_price = @base_price
		end
		else
		begin
     		select @base_price = @ls_base_price
	
			/* look up the range */
			if (@ls_ff_type is not null and
			    @ls_ff_type = 'R')
			begin
				if (@ls_std_depth <> @input_effective_depth)
				begin
					exec GetLandFFUnitPrice @ls_id, @input_ls_yr, @input_effective_depth, @dev_ft OUTPUT, @dev_amt OUTPUT
					
					if (@dev_amt <> 0)
					begin
						select @base_price = @base_price * (@dev_amt/100)
					end
				end
				
				select @land_value = @input_effective_front * @base_price
	 			select @unit_price = @base_price
			end
			else
			begin
      			if (@input_effective_depth > @ls_std_depth) and (@ls_plus_dev_ft is not null and @ls_plus_dev_ft <> 0)
     			begin
    				select @base_price = @base_price + (((@input_effective_depth - @ls_std_depth)/@ls_plus_dev_ft) * @ls_plus_dev_amt)
     			end
     			else if (@input_effective_depth < @ls_std_depth) and (@ls_minus_dev_ft is not null and @ls_minus_dev_ft <> 0)
     			begin
    				select @base_price = @base_price + (((@input_effective_depth - @ls_std_depth)/@ls_minus_dev_ft) * @ls_minus_dev_amt)
      			end
	
				if (@base_price < 0)
				begin
					set @base_price = 0
				end
	
				select @land_value = @input_effective_front * @base_price
	 			select @unit_price = @base_price
			end
		end
    end
    else if (@ls_method = 'LOT')
    begin
		if (@ls_code = 'Special')
        begin
           	select @land_value = isnull(@input_special_unit_price, 0) * isnull(@input_num_lots, 1)
           	select @unit_price = isnull(@input_special_unit_price, 0)
        end
        else
        begin
			select @land_value = @ls_up * @input_num_lots
        	select @unit_price = @ls_up
    	end
    end
/*
end

CLOSE LAND_SCHED
DEALLOCATE LAND_SCHED
*/

select @output_land_value = @land_value
select @output_unit_price = @unit_price

if (@input_show_output = 1)
begin
	select land_value = @output_land_value,
			unit_price = @output_unit_price
end

GO

