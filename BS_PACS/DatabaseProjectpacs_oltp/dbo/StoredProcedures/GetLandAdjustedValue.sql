












CREATE    PROCEDURE GetLandAdjustedValue 
@input_ls_id     	int,
@input_prop_id          int,
@input_prop_yr          int,
@input_sup_num          int,
@input_sale_id          int,
@input_show_output      int,
@input_calculated_value varchar(100),
@output_adjusted_value  varchar(100) OUTPUT
AS

declare @ls_id      		int
declare @land_value  		numeric(10)
declare @land_seg_adj_cd 	varchar(5)
declare @land_seg_adj_pc 	numeric(5,2)
declare @usage   		varchar(5)
declare @amount   		numeric(10)
declare @percent  		numeric(5,2)
declare @adj_amount   		numeric(10)
declare @adj_percent  		numeric(5,2)
declare @calculated_value       numeric(18)
declare @adjustment  		numeric(18)

select @calculated_value = convert(numeric(18), @input_calculated_value)
select @adj_amount  = 0
select @adj_percent = 0
select @adjustment  = 0

DECLARE LAND_ADJ_VW SCROLL CURSOR
FOR select land_seg_id, 
    land_value,     
    land_seg_adj_cd, 
    land_seg_adj_pc, 
    land_adj_type_usage, 
    land_adj_type_amt,         
    land_adj_type_pct 
    from   land_adj_vw
    where  land_seg_id  = @input_ls_id
    and     prop_id     = @input_prop_id
    and     prop_val_yr = @input_prop_yr
    and     sup_num     = @input_sup_num
    and     sale_id     = @input_sale_id

OPEN LAND_ADJ_VW
FETCH NEXT FROM LAND_ADJ_VW into @ls_id, 
     @land_value, 
     @land_seg_adj_cd, 
     @land_seg_adj_pc, 
     @usage, 
     @amount, 
     @percent

while (@@FETCH_STATUS = 0)
begin
   if (@amount > 0)
   begin 
      select @adj_amount = @amount
   end
   else if (@percent > 0)
   begin
      select @adj_percent = @percent
   end
   else if (@land_value > 0)
   begin
      select @adj_amount = @land_value
   end
   else if (@land_seg_adj_pc > 0)
   begin
      select @adj_percent = @land_seg_adj_pc
   end
   if (@adj_amount > 0)
   begin
      select @adjustment = @adjustment + @adj_amount
   end
   else if (@adj_percent > 0)
   begin
      if (@adj_percent <= 100)
      begin
         select @adjustment = @adjustment  + (-1 * @calculated_value * (1.00 - @adj_percent/100))
      end
      else
      begin
         select @adjustment = @adjustment  + (@calculated_value * (@adj_percent/100 - 1.00))
      end
   end
   
   FETCH NEXT FROM LAND_ADJ_VW into @ls_id, 
     	@land_value, 
     	@land_seg_adj_cd, 
     	@land_seg_adj_pc, 
     	@usage, 
     	@amount, 
     	@percent
end

select @output_adjusted_value = convert(varchar(100), @adjustment + @calculated_value)

if (@input_show_output = 1)
begin
      select adjusted_value = @output_adjusted_value
end

CLOSE LAND_ADJ_VW
DEALLOCATE LAND_ADJ_VW

GO

