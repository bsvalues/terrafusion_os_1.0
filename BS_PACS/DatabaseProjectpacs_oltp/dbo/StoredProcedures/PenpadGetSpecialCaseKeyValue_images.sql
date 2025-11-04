

create procedure PenpadGetSpecialCaseKeyValue_images
	@szKeys varchar(512) output
as

set nocount on

	select
		@szKeys =
			rtrim(isnull(image_type, '')) + ' - ' +
			rtrim(isnull(rec_type, '')) + ' - ' +
			rtrim(isnull(sub_type, ''))
	from #trigger_table

set nocount off

GO

