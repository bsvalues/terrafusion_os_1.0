


CREATE procedure SetRollEntity

@input_tax_yr 	numeric(4)

as

declare @prop_id	int
declare @owner_id	int
declare @entity_cd	varchar(5)
declare @str_entity	varchar(500)

update owner set roll_entity = NULL where owner_tax_yr = @input_tax_yr

declare property_entity_cursor SCROLL CURSOR
FOR select entity_prop_assoc.prop_id,
           entity.entity_cd,
           owner.owner_id
    from   prop_supp_assoc,
           owner,
           entity_prop_assoc,
           entity
    where  prop_supp_assoc.prop_id = owner.prop_id
    and    prop_supp_assoc.sup_num = owner.sup_num
    and    prop_supp_assoc.owner_tax_yr = owner.owner_tax_yr
    and    owner.prop_id = entity_prop_assoc.prop_id
    and    owner.sup_num = entity_prop_assoc.sup_num
    and    owner.owner_tax_yr = entity_prop_assoc.tax_yr
    and    entity_prop_assoc.entity_id = entity.entity_id
    and    prop_supp_assoc.owner_tax_yr = @input_tax_yr
    
OPEN property_entity_cursor
FETCH NEXT from property_entity_cursor into @prop_id, @entity_cd, @owner_id

while (@@FETCH_STATUS=0)
begin
	select @str_entity = roll_entity from owner
	where  prop_id = @prop_id
        and    owner_id = @owner_id
        and    owner_tax_yr = @input_tax_yr

	if (@str_entity is null)
	  begin
		select @str_entity=RTRIM(@entity_cd)
	  end
	else
	  begin
		select @str_entity=@str_entity+','+RTRIM(@entity_cd)
	  end

	update owner set roll_entity = @str_entity
	where prop_id = @prop_id
	and   owner_id = @owner_id
	and   owner_tax_yr = @input_tax_yr

	FETCH NEXT from property_entity_cursor into @prop_id, @entity_cd, @owner_id
end

CLOSE property_entity_cursor
DEALLOCATE property_entity_cursor

GO

