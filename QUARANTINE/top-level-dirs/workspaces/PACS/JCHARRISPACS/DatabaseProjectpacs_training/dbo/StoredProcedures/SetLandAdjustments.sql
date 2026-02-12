













CREATE     PROCEDURE SetLandAdjustments
@input_prop_id          int,
@input_prop_yr          int,
@input_sup_num          int,
@input_sale_id          int,
@input_mass_adj_pct     numeric(5,2)

AS

declare @ls_id      		int
declare @prev_ls_id		int
declare @land_value  		numeric(10)
declare @land_seg_adj_cd 	varchar(5)
declare @land_seg_adj_pc 	numeric(5,2)
declare @usage   		varchar(5)
declare @amount   		numeric(10)
declare @percent  		numeric(5,2)
declare @adj_amount   		numeric(10)
declare @adj_percent  		numeric(8,6)
declare @curr_ls_id		int
declare @count			int

select @count       = 0
select @curr_ls_id  = 0
select @adj_amount  = 0
select @adj_percent = 1.00

/* now initialize all the land segments associated with this property with the beginning adj factors 
   this cannot be in the adj_loop because some details segments might not have local adjustments 
   -- Also at this time set the mass adj factor -- */
update land_detail  set land_adj_factor = @adj_percent,
                        land_adj_amt    = @adj_amount,
			land_mass_adj_factor = @input_mass_adj_pct
where   prop_id     = @input_prop_id
and     prop_val_yr = @input_prop_yr
and     sup_num     = @input_sup_num
and     sale_id     = @input_sale_id

DECLARE LAND_ADJ_VW SCROLL CURSOR
FOR select land_seg_id, 
    land_value,     
    land_seg_adj_cd, 
    land_seg_adj_pc, 
    land_adj_type_usage, 
    land_adj_type_amt,         
    land_adj_type_pct 
    from   land_adj_vw
    where   prop_id     = @input_prop_id
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

   if (@ls_id <> @curr_ls_id)
   begin

	if (@count > 0)
        begin
		update land_detail set land_adj_factor = @adj_percent,
                	               land_adj_amt = @adj_amount
        	where   prop_id     = @input_prop_id
    		and     prop_val_yr = @input_prop_yr
    		and     sup_num     = @input_sup_num
    		and     sale_id     = @input_sale_id
        	and     land_seg_id = @curr_ls_id
	end

   
	select @curr_ls_id  = @ls_id
	select @adj_amount  = 0
	select @adj_percent = 1.00
   end

   select @prev_ls_id = @ls_id
   select @count      = @count + 1

   if (@usage = 'U')
   begin
	if (@land_value is not null)
   	begin
      		select @adj_amount = @adj_amount + @land_value
   	end

	if (@land_seg_adj_pc > 0) and (@land_seg_adj_pc is not null)
   	begin
     		select @adj_percent = @adj_percent * (@land_seg_adj_pc/100)
   	end
   	
   end
   else if (@usage = 'A')
   begin
	if (@amount is not null)
   	begin 
     		select @adj_amount = @adj_amount + @amount
   	end
  
   end
   else if (@usage = 'P')
   begin
   
	if (@percent > 0) and (@percent is not null)
   	begin
      		select @adj_percent = @adj_percent * (@percent/100)
   	end   	
   end
      
--select adj_amount = @adj_amount

   FETCH NEXT FROM LAND_ADJ_VW into @ls_id, 
     	@land_value, 
     	@land_seg_adj_cd, 
     	@land_seg_adj_pc, 
     	@usage, 
     	@amount, 
     	@percent
end

if (@input_mass_adj_pct is null)
begin
   select @input_mass_adj_pct = 1.00
end

/* if the count is greater than 0 then update the last record that 
   would have been generated from the cursor */
if (@count > 0)
begin 

	update land_detail set  land_adj_factor = @adj_percent,
                       		land_adj_amt    = @adj_amount
	where   prop_id     = @input_prop_id
	and     prop_val_yr = @input_prop_yr
	and     sup_num     = @input_sup_num
	and     sale_id     = @input_sale_id
	and     land_seg_id = @prev_ls_id

end

CLOSE LAND_ADJ_VW
DEALLOCATE LAND_ADJ_VW

GO

