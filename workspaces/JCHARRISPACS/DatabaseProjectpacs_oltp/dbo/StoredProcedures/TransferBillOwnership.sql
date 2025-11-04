













/****** Object:  Stored Procedure dbo.TransferBillOwnership    Script Date: 1/3/99 9:45:19 PM ******/

/****** Object:  Stored Procedure dbo.TransferBillOwnership    Script Date: 1/3/99 11:57:08 AM ******/
/****** Object:  Stored Procedure dbo.TransferBillOwnership    Script Date: 12/21/98 5:34:37 PM ******/
CREATE         PROCEDURE TransferBillOwnership
   @input_tax_yr        int,
   @input_sup_num       int
 
AS
declare @roll_item_id   int
declare @owner_id int
declare @prop_id int
DECLARE ROLL SCROLL CURSOR
FOR select 
           roll_item.roll_item_id,
           roll_item.owner_id,
           roll_item.prop_id
    from   roll_item       
    where  (roll_item.owner_tax_yr = @input_tax_yr)
    and    (roll_item.sup_num      = @input_sup_num)
    and    (roll_item.sup_action   = 'T')
OPEN ROLL
FETCH NEXT FROM ROLL into @roll_item_id, @owner_id, @prop_id
while (@@FETCH_STATUS = 0)
begin
    update roll_tax_line_assoc 
    set current_owner_id = @owner_id, current_roll_item_id = @roll_item_id
    where  roll_tax_line_assoc.prop_id = @prop_id
    FETCH NEXT FROM ROLL into @roll_item_id, @owner_id, @prop_id
end
CLOSE ROLL
DEALLOCATE ROLL

GO

