


create procedure GetEntities

@input_type	char(1),
@input_prop_id	int,
@input_sup_num  int,
@input_yr	numeric(4),
@input_entities varchar(250) output

as

declare @entity_cd	varchar(5)
declare @strSQL		varchar(2048)

set @strSQL = 'DECLARE ENTITIES CURSOR FAST_FORWARD '
set @strSQL = @strSQL + ' FOR select '
set @strSQL = @strSQL + ' entity.entity_cd '

/* preliminary */
if (@input_type = 'P')
begin
	set @strSQL = @strSQL + 'from prelim_entity_prop_assoc epa, '
end
else
begin
	set @strSQL = @strSQL + ' from entity_prop_assoc epa,'
end

set @strSQL = @strSQL + ' entity '
set @strSQL = @strSQL + ' where epa.entity_id = entity.entity_id'
set @strSQL = @strSQL + ' and   epa.prop_id = ' + convert(varchar(15), @input_prop_id)
set @strSQL = @strSQL + ' and   epa.sup_num = ' + convert(varchar(15), @input_sup_num)
set @strSQL = @strSQL + ' and   epa.tax_yr  = ' + convert(varchar(4),  @input_yr)

exec (@strSQL)

OPEN ENTITIES
FETCH NEXT FROM ENTITIES into @entity_cd

while (@@FETCH_STATUS = 0)
begin

	set @entity_cd = rtrim(@entity_cd)

	if (@input_entities = '')
	begin
		set @input_entities = @entity_cd
	end
	else
	begin
		set @input_entities = @input_entities + ', ' + @entity_cd
	end

	FETCH NEXT FROM ENTITIES into @entity_cd
end

CLOSE ENTITIES
DEALLOCATE ENTITIES


set nocount off

GO

