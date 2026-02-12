






CREATE PROCEDURE GetLandUnitPrice 
@input_ls_id  		int, 
@input_ls_yr		numeric(4),
@input_size  		numeric(18,4), 
@output_unit_price  	numeric(14,2) OUTPUT

AS

declare @ls_id           			int
declare @ls_code    			varchar(10)
declare @ls_method       			varchar(5)
declare @ls_ag_or_mkt  			char(1)
declare @ls_interpolate  		              char(1)
declare @ls_up   			numeric(14,2)
declare @ls_base_price   		numeric(14,2)
declare @ls_std_depth  			numeric(14,4)
declare @ls_plus_dev_ft  		numeric(14,4)
declare @ls_plus_dev_amt  		numeric(14,2)
declare @ls_minus_dev_ft 		numeric(14,4)
declare @ls_minus_dev_amt 		numeric(14,2)
declare @ls_detail_id  			int
declare @ls_range_max  		numeric(18,4)
declare @ls_range_adj_price        	numeric(14,2)
declare @ls_range_interpolate_inc 	numeric(14,6)
declare @land_value  		  	numeric(14)

/* variables for interpolation */
declare @prev_range_max  	numeric(18,4)
declare @prev_range_price 	numeric(14,2)
declare @BegList  		int
declare @EndList  		int
declare @interpolate_price 	numeric(14,2)
declare @interpolate_range 	numeric(18)
declare @ratio   		numeric(18,4)

select @output_unit_price = 0
select @prev_range_max    = 0
select @prev_range_price  = 0

select @BegList = 1
select @EndList = 0

DECLARE LAND_SCHED_DETAIL SCROLL CURSOR
FOR select land_sched_detail.ls_detail_id,
    	   land_sched_detail.ls_id,      
    	   land_sched_detail.ls_range_max,           
           land_sched_detail.ls_range_adj_price,
	   land_sched_detail.ls_range_interpolate_inc,
           land_sched.ls_interpolate,
	land_sched.ls_method
    from   land_sched_detail, land_sched
    where  land_sched_detail.ls_id = @input_ls_id
    and    land_sched_detail.ls_id = land_sched.ls_id
    and    land_sched_detail.ls_year = land_sched.ls_year
    and    land_sched_detail.ls_year = @input_ls_yr
    order by ls_range_max

   OPEN LAND_SCHED_DETAIL
   FETCH NEXT FROM LAND_SCHED_DETAIL into @ls_detail_id,
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
 
  	if  (@ls_interpolate <> 'Y') OR 
     	    (@input_size = @ls_range_max) OR
            (@BegList = 1) 
            begin
        	select @output_unit_price = @ls_range_adj_price
     	    end
  	else if (@BegList <> 1)
            begin

		select @output_unit_price = ((((@ls_range_max-@input_size)/(@ls_range_max - @prev_range_max)) * (@prev_range_price - @ls_range_adj_price)) + @ls_range_adj_price)
		
		--select up = @output_unit_price, ls_method = @ls_method
            end
        
  	break 
     end
 
      
      select @prev_range_max   = @ls_range_max
      select @prev_range_price = @ls_range_adj_price
      select @BegList = 0
     
      FETCH NEXT FROM LAND_SCHED_DETAIL into @ls_detail_id,
                  	@ls_id,
          		@ls_range_max,
       			@ls_range_adj_price,
       			@ls_range_interpolate_inc,
			@ls_interpolate,
		    	@ls_method
 
end

CLOSE LAND_SCHED_DETAIL
DEALLOCATE LAND_SCHED_DETAIL

GO

