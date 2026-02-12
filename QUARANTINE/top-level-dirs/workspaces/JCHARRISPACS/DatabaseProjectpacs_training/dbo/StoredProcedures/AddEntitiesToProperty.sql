
-----------------------------------------------------------------------------
-- Procedure: AddEntitiesToProperty
--
-- Purpose: Add a colon delimited list of entities to the entity_prop_assoc
--	table.
-----------------------------------------------------------------------------
CREATE PROCEDURE AddEntitiesToProperty
	@in_prop_id		int,
	@in_sup_num		int,
	@in_year		int,
	@in_entity_list		varchar(2000)

AS

SET NOCOUNT ON
declare @entity_name		varchar(15)
declare @stop_index		int
declare @contine		bit
declare @entity_id		int
select @contine = 1

	if LEN(@in_entity_list) > 0
	begin
		while(@contine = 1)
		begin
			select @stop_index = CHARINDEX(':', @in_entity_list)
			if @stop_index <> 0
				begin
					select @entity_name = LEFT(@in_entity_list,@stop_index-1)
					select @in_entity_list = RIGHT(@in_entity_list,LEN(@in_entity_list)-@stop_index)
				end
			else
				begin
			 		select @entity_name = @in_entity_list
					select @contine = 0
				end
	
			insert into entity_prop_assoc(entity_id,prop_id,sup_num,tax_yr)
			select ent.entity_id,@in_prop_id,@in_sup_num,@in_year 
			from entity as ent WITH (NOLOCK)
			where entity_id = @entity_name 
			
		end
	end

GO

