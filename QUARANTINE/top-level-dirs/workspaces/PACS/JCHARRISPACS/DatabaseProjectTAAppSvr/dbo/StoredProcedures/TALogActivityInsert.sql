
create procedure TALogActivityInsert
	@szMachine varchar(23),
	@szDescription varchar(2047),
	@dtActivity datetime = null
as

set nocount on

	if ( @dtActivity is null )
		set @dtActivity = getutcdate()
	
	insert dbo.tb_ta_log_activity (szMachine, dtActivity, szDescription)
	values (@szMachine, @dtActivity, @szDescription)

GO

