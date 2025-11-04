

CREATE procedure MonitorInsert
	@szName varchar(50),
	@szQuery varchar(1024),
	@szType varchar(10),
	@nRefreshRate int,
	@DisableSort int
as

set nocount on

	declare
		@lMonitorID int

	/* Insert the letter record and get it's ID */
	insert monitors (
		name, query, monitor_type, refresh_rate, disable_sort
	) values (
		@szName, @szQuery, @szType, @nRefreshRate,@DisableSort
	)
	set @lMonitorID = @@identity

set nocount off

	select
		monitor_id = @lMonitorID

GO

