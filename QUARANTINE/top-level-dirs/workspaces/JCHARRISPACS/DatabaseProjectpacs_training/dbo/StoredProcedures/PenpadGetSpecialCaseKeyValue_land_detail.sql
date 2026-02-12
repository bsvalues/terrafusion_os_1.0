

create procedure PenpadGetSpecialCaseKeyValue_land_detail
	@szKeys varchar(512) output
as

set nocount on

	select
		@szKeys =
			rtrim(land_type_cd) + ' - ' +
			rtrim(state_cd) + ' - ' +
			rtrim(isnull(land_seg_desc, ''))
	from #trigger_table

set nocount off

GO

