







CREATE PROCEDURE AcceptSuppProperty
   @input_prop_id	int,
   @input_sup_num	int,
   @input_year		numeric(4)
AS

declare @accept_create_id int
declare @accept_create_dt datetime

select @accept_create_id = accept_create_id, @accept_create_dt = accept_create_dt
	from property_val
	where prop_id = @input_prop_id and 
	      prop_val_yr = @input_year and
	      sup_num = @input_sup_num	

update property_val 
	set accept_create_id = null, accept_create_dt = null 
	where prop_id = @input_prop_id and 
	      prop_val_yr = @input_year and
	      sup_num = @input_sup_num	

/* here we will calculate the entity/property exemption value and the 
   entity/property taxable value */
exec SetPropertyEntityValue @input_year, @input_sup_num, @input_prop_id
	
/* there could be a situation where an entity is deleted from a property, if that is the case we must 
    still record a value in the prop_owner_entity_val table so that we can record previous and current values */
exec SetDeletedEntityValue @input_year, @input_sup_num, @input_prop_id
          
          
update property_val 
	set accept_create_id = @accept_create_id, accept_create_dt = @accept_create_dt 
	where prop_id = @input_prop_id and 
	      prop_val_yr = @input_year and
	      sup_num = @input_sup_num

GO

