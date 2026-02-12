













/****** Object:  Stored Procedure dbo.MoveSupplementGroupToRoll    Script Date: 1/3/99 9:45:20 PM ******/

/****** Object:  Stored Procedure dbo.MoveSupplementGroupToRoll    Script Date: 1/3/99 11:57:10 AM ******/
/****** Object:  Stored Procedure dbo.MoveSupplementGroupToRoll    Script Date: 12/21/98 5:34:55 PM ******/
CREATE            PROCEDURE MoveSupplementGroupToRoll
 @input_sup_group int,
 @input_user_id   int
AS
declare @sup_num int
declare @sup_tax_yr numeric(4)
declare @entity_id int
DECLARE SUPPLEMENT_VW SCROLL CURSOR
FOR select sup_num,
    sup_tax_yr
    from   supplement_vw
    where  (sup_group_id = @input_sup_group)
DECLARE ENTITY SCROLL CURSOR
for select entity_id
    FROM   entity
 
OPEN SUPPLEMENT_VW
FETCH NEXT FROM SUPPLEMENT_VW into @sup_num, @sup_tax_yr
while (@@FETCH_STATUS = 0)
begin
 
   exec MovePropertyToRoll      @sup_tax_yr, @sup_num
   exec MovePropertyValueToRoll @sup_tax_yr, @sup_num
   exec MovePropertySitusToRoll @sup_tax_yr, @sup_num
   exec TransferBillOwnership @sup_tax_yr, @sup_num
   OPEN ENTITY
   FETCH NEXT FROM ENTITY into @entity_id
   while (@@FETCH_STATUS = 0)
   begin
      select entity_id = @entity_id
      exec MovePropertyEntityToRoll            @sup_tax_yr, @sup_num, @entity_id
      exec MovePropertyExemptionToRoll  @sup_tax_yr, @sup_num, @entity_id
      exec CreateSupplementTaxBills        @sup_tax_yr, @sup_num, @entity_id
      exec RemoveSupplementTaxBills        @sup_tax_yr, @sup_num, @entity_id
     
       FETCH NEXT FROM ENTITY into @entity_id          
   end
   CLOSE ENTITY
    
    FETCH NEXT FROM SUPPLEMENT_VW into @sup_num, @sup_tax_yr
end
update sup_group set status_cd = 'A', sup_accept_by_id = @input_user_id , sup_accept_dt = GetDate()  where sup_group_id = @input_sup_group
CLOSE SUPPLEMENT_VW
DEALLOCATE ENTITY
DEALLOCATE SUPPLEMENT_VW

GO

