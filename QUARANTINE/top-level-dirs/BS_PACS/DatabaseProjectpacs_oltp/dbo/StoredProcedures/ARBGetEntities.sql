

create procedure ARBGetEntities

@prop_id	int,
@sup_num	int,
@prop_val_yr	numeric(4),
@entities	varchar(50)	output

as

declare @entity_cd	varchar(5)

set @entities = ''


DECLARE ENTITIES insensitive cursor
FOR select distinct RTRIM(entity_cd) as entity_cd
    from entity_prop_assoc with(nolock)
	join entity with(nolock) on
		entity_prop_assoc.entity_id = entity.entity_id
    where prop_id = @prop_id
    and   tax_yr = @prop_val_yr
    and   sup_num = @sup_num
    order by 1

OPEN ENTITIES
FETCH NEXT FROM ENTITIES INTO @entity_cd

WHILE (@@FETCH_STATUS = 0)
BEGIN
	if (@entities = '')
	begin
		set @entities = @entity_cd
	end
	else
	begin
		set @entities = @entities + ', '
		set @entities = @entities + @entity_cd
	end

	FETCH NEXT FROM ENTITIES INTO @entity_cd
END

CLOSE ENTITIES
DEALLOCATE ENTITIES

GO

