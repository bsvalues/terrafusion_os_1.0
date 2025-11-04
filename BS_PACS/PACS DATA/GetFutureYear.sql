

create procedure GetFutureYear
	@lFutureYear numeric(4,0) output
as

set nocount on

	select
		@lFutureYear = future_yr
	from pacs_system with(nolock)

set nocount off

GO

