


CREATE PROCEDURE SetPropertyEntityValue
   @input_tax_yr        int,
   @input_sup_num       int,
   @input_prop_id	int = 0,
   @input_pacs_user_id int = 0
AS

exec CalculateTaxable '', @input_sup_num, @input_tax_yr, @input_prop_id, '', @input_pacs_user_id

/*
declare @entity_cursor_id	int
declare @entity_type		char(5)

if (@input_prop_id <> 0)
begin
	delete from property_entity_exemption where owner_tax_yr = @input_tax_yr and sup_num = @input_sup_num and prop_id = @input_prop_id
	delete from prop_owner_entity_val where sup_yr = @input_tax_yr and sup_num = @input_sup_num and prop_id = @input_prop_id
end
else
begin
	delete from property_entity_exemption 
	from property_val 
	where property_val.prop_id = property_entity_exemption.prop_id
	and    property_val.sup_num = property_entity_exemption.sup_num
	and    property_val.prop_val_yr = property_entity_exemption.owner_tax_yr 
	and    property_entity_exemption.owner_tax_yr = @input_tax_yr 
	and    property_entity_exemption.sup_num = @input_sup_num  
	and    property_val.accept_create_id is null

	delete from prop_owner_entity_val 
	from property_val 
	where prop_owner_entity_val.prop_id = property_val.prop_id
	and    prop_owner_entity_val.sup_num = property_val.sup_num
	and    prop_owner_entity_val.sup_yr     = property_val.prop_val_yr
	and    prop_owner_entity_val.sup_yr = @input_tax_yr 
	and    prop_owner_entity_val.sup_num = @input_sup_num                  
	and    property_val.accept_create_id is null
end


DECLARE ENTITY SCROLL CURSOR
FOR select entity_id,
	     entity_type_cd
    from   entity

OPEN ENTITY
FETCH NEXT FROM ENTITY into @entity_cursor_id, @entity_type

while (@@FETCH_STATUS = 0)
begin

	if (@entity_type <> 'R' or @entity_type is null)
	begin
		if (@input_prop_id <> 0)
		begin
			exec SetEntityExmptValue @input_tax_yr, @input_sup_num, @entity_cursor_id, @input_prop_id
		end
		else
		begin
			exec SetEntityExmptValue @input_tax_yr, @input_sup_num, @entity_cursor_id
		end
			
	end
	else
	begin
		if (@input_prop_id <> 0)
		begin
			exec SetRBEntityExmptValue @input_tax_yr, @input_sup_num, @entity_cursor_id, @input_prop_id
		end
		else
		begin
			exec SetRBEntityExmptValue @input_tax_yr, @input_sup_num, @entity_cursor_id
		end
			
	end

	FETCH NEXT FROM ENTITY into @entity_cursor_id, @entity_type
end

CLOSE ENTITY
DEALLOCATE ENTITY 

*/

GO

