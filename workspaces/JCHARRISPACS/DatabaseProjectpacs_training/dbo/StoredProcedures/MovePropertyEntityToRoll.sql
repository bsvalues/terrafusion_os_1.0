












CREATE PROCEDURE MovePropertyEntityToRoll
@input_sup_yr   int,
@input_sup_num  int
 
AS
declare @sup_num   	 int
declare @prop_id         int
declare @owner_id  	 int
declare @roll_item_id  	 int
declare @sup_tax_yr      numeric(4)
declare @entity_id  	 int
declare @entity_prop_pct numeric(14,10)

DECLARE ROLL_ITEM SCROLL CURSOR
FOR select roll_item.prop_id,
           roll_item.owner_id,
           roll_item.sup_num,
           roll_item.roll_item_id,
	   entity_prop_assoc.entity_id,
           entity_prop_assoc.entity_prop_pct
    from   roll_item, entity_prop_assoc
    where  (roll_item.sup_tax_yr      = @input_sup_yr)
    and    (roll_item.sup_num         = @input_sup_num)
    and    (entity_prop_assoc.prop_id = roll_item.prop_id)
    and    (entity_prop_assoc.sup_num = @input_sup_num)
    and    (entity_prop_assoc.tax_yr  = @input_sup_yr)

OPEN ROLL_ITEM
FETCH NEXT FROM ROLL_ITEM into 	@prop_id,
                       		@owner_id,
                       		@sup_num,
                       		@roll_item_id,
				@entity_id,
				@entity_prop_pct
   
while (@@FETCH_STATUS = 0)
begin 
   
      delete from roll_entity_assoc where roll_item_id = @roll_item_id and entity_id = @entity_id
                   
      insert into roll_entity
      (
            sup_tax_yr,
            entity_id,
            sup_num,
            entity_pct,
            roll_item_id
      )
      values 
      (
           @input_sup_yr,
           @entity_id,
           @input_sup_num,
           @entity_prop_pct,
           @roll_item_id
      )
      
      insert into roll_entity_assoc
      (
           sup_num,
           sup_tax_yr,
           entity_id,
           roll_item_id
      )
      values
      (
          @input_sup_num,
          @input_sup_yr,
          @entity_id,
          @roll_item_id
      )

     /* exec MovePropertyExemptionToRoll @input_sup_yr, @input_sup_num, @entity_id, @prop_id */
    
     FETCH NEXT FROM ROLL_ITEM into @prop_id,
                       		@owner_id,
                       		@sup_num,
                       		@roll_item_id,
				@entity_id,
				@entity_prop_pct
end
CLOSE ROLL_ITEM
DEALLOCATE ROLL_ITEM

GO

