


CREATE PROCEDURE GetLandFFUnitPrice 
@input_ls_id  		int, 
@input_ls_yr		numeric(4),
@input_size  		numeric(18,4), 
@output_unit_ft		numeric(14,4) OUTPUT,
@output_unit_price  	numeric(14,2) OUTPUT

AS

declare @ls_id           		int
declare @ls_code    			varchar(10)
declare @ls_method       		varchar(5)
declare @ls_ag_or_mkt  			char(1)
declare @ls_interpolate  		char(1)
declare @ls_up   			numeric(14,2)
declare @ls_base_price   		numeric(14,2)
declare @ls_std_depth  			numeric(14,4)
declare @ls_plus_dev_ft  		numeric(14,4)
declare @ls_plus_dev_amt  		numeric(14,2)
declare @ls_minus_dev_ft 		numeric(14,4)
declare @ls_minus_dev_amt 		numeric(14,2)
declare @ls_detail_id  			int
declare @ls_range_max  			numeric(18,4)
declare @ls_range_adj_price        	numeric(14,2)
declare @ls_range_interpolate_inc 	numeric(14,6)
declare @land_value  		  	numeric(14)

select @output_unit_price = 0

DECLARE land_sched_ff_detail_cursor SCROLL CURSOR
FOR select land_sched_ff_detail.ls_detail_id,
    	   land_sched_ff_detail.ls_id,      
    	   land_sched_ff_detail.ls_range_max,           
           land_sched_ff_detail.ls_range_adj_price,
	   land_sched_ff_detail.ls_range_interpolate_inc,
           land_sched.ls_interpolate,
	   land_sched.ls_method
    from   land_sched_ff_detail, land_sched
    where  land_sched_ff_detail.ls_id = @input_ls_id
    and    land_sched_ff_detail.ls_id = land_sched.ls_id
    and    land_sched_ff_detail.ls_year = land_sched.ls_year
    and    land_sched_ff_detail.ls_year = @input_ls_yr
    order by ls_range_max

   OPEN land_sched_ff_detail_cursor
   FETCH NEXT FROM land_sched_ff_detail_cursor into @ls_detail_id,
       @ls_id,
       @ls_range_max,
       @ls_range_adj_price,
       @ls_range_interpolate_inc,
       @ls_interpolate,
       @ls_method

   while (@@FETCH_STATUS = 0)
   begin
      
      if (@input_size <= @ls_range_max)
      begin  
 
	  select @output_unit_ft    = @ls_range_max
  	  select @output_unit_price = @ls_range_adj_price
     	  break 
     end
 
        
      FETCH NEXT FROM land_sched_ff_detail_cursor into @ls_detail_id,
                  	@ls_id,
          		@ls_range_max,
       			@ls_range_adj_price,
       			@ls_range_interpolate_inc,
			@ls_interpolate,
		    	@ls_method
 
end

CLOSE land_sched_ff_detail_cursor
DEALLOCATE land_sched_ff_detail_cursor

GO

