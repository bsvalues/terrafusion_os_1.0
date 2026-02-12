

create procedure GetApprYear
	@lApprYear numeric(4,0) output
as

set nocount on

	select
		@lApprYear = appr_yr
	from pacs_system with(nolock)

set nocount off

GO

