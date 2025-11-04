

create procedure PenpadGetSpecialCaseKeyValue_imprv
	@szKeys varchar(512) output
as

set nocount on

	select
		@szKeys =
			rtrim(isnull(imprv_type_cd, '')) + ' - ' +
			rtrim(isnull(imprv_state_cd, '')) + ' - ' +
			rtrim(isnull(imprv_desc, ''))
	from #trigger_table

set nocount off

GO

