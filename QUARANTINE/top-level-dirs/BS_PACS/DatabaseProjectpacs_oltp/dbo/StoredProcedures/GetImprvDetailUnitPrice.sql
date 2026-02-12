

CREATE PROCEDURE GetImprvDetailUnitPrice 

	@input_method_cd	char(5),
	@input_type_cd		char(10),
	@input_class_cd		char(10),
	@input_yr			numeric(4),
	@input_size  		numeric(18,1), 
	@input_unit_price	numeric(14,2),
	@input_stories		varchar(5),
	@output_unit_price  numeric(14,2) OUTPUT,
	@output_used_sched_for_calc bit OUTPUT

AS

declare @range_max 		numeric(18,1)
declare @range_adj_price 	numeric(14,2)
declare @range_interpolate_inc  numeric(14,6)
declare @interpolate		char(1)

/* variables for interpolation */
declare @prev_range_max  	numeric(18,1)
declare @prev_range_price 	numeric(14,2)
declare @BegList  		int
declare @interpolate_price 	numeric(14,2)
declare @imprv_pc_of_base	numeric(14,2)

select @output_unit_price = 0
select @prev_range_max    = 0
select @prev_range_price  = 0
select @BegList = 1
set @output_used_sched_for_calc = 0

select @imprv_pc_of_base = imprv_pc_of_base,
       @interpolate      = imprv_interpolate
from imprv_sched
where imprv_det_meth_cd  = @input_method_cd
    and   imprv_det_type_cd  = @input_type_cd
    and   imprv_det_class_cd = @input_class_cd
    and   imprv_yr           = @input_yr


/* if imprv_pc_of_base is null then we will use the ranges */
if (@imprv_pc_of_base is null) 
begin
	if (@input_size is not null) and (@input_size > 0)
	begin
		DECLARE IMPRV_SCHED_DETAIL CURSOR FAST_FORWARD
		FOR select  range_max,           
	    	range_adj_price,  
            		range_interpolate_inc
    		from imprv_sched_detail 
    		where imprv_det_meth_cd  = @input_method_cd
    		and   imprv_det_type_cd  = @input_type_cd
    		and   imprv_det_class_cd = @input_class_cd
    		and   imprv_yr           = @input_yr
			and	  imprv_sched_detail.stories = @input_stories
	              order by range_max

		OPEN IMPRV_SCHED_DETAIL
		FETCH NEXT FROM IMPRV_SCHED_DETAIL into @range_max, @range_adj_price, @range_interpolate_inc

		while (@@FETCH_STATUS = 0)
		begin
  			if (@input_size <= @range_max)
  			begin
				
				if  (@interpolate <> 'T') OR 
					(@input_size = @range_max) OR
					(@BegList = 1)  
				begin
					set @output_unit_price = @range_adj_price
					
				end
				else if (@BegList <> 1)
				begin
					select @output_unit_price = ((((@range_max-@input_size)/(@range_max - @prev_range_max)) * (@prev_range_price - @range_adj_price)) + @range_adj_price)
				end 

				set @output_used_sched_for_calc = 1
				break 
			end
				
			select @prev_range_max   = @range_max
			select @prev_range_price = @range_adj_price
  			select @BegList = 0

   			FETCH NEXT FROM IMPRV_SCHED_DETAIL into @range_max, @range_adj_price, @range_interpolate_inc

		end

		CLOSE IMPRV_SCHED_DETAIL
		DEALLOCATE IMPRV_SCHED_DETAIL

	end
	else
	begin
		set @output_unit_price = 0
	end
end
else
begin
	set @output_unit_price = (@imprv_pc_of_base/100) * @input_unit_price
end

GO

