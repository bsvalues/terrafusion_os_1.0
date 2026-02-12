

create procedure PenpadGetSpecialCaseKeyValue_entity_prop_assoc
	@szKeys varchar(512) output
as

set nocount on

	select
		@szKeys = rtrim(e.entity_cd)
	from #trigger_table as epa
	join entity as e on
		epa.entity_id = e.entity_id

set nocount off

GO

