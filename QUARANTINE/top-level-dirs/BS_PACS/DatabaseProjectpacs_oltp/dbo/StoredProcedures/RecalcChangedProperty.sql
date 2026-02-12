
create procedure RecalcChangedProperty
	@pacs_user_id int
as

set nocount on

	declare
		@szSQL varchar(4000),
		@szTAAppSvr varchar(64),
		@lTAAppSvrEnvironmentID int,
		@szPACSLogin varchar(30),
		@szPACSPassword varchar(50)

	/* Get the configuration parameters */
	select
		@szTAAppSvr = szTAAppSvr,
		@lTAAppSvrEnvironmentID = lTAAppSvrEnvironmentID
	from xsp_pacs_config with(nolock)

	select
		@szPACSLogin = pacs_user_name,
		@szPACSPassword = password
	from pacs_user with(nolock)
	where pacs_user_name = 'System'

	/* The calls to replace() are in order to make ' safe */
	set @szSQL =
		'exec master..xp_RecalcProperty80 ' +
		convert(varchar(12), @pacs_user_id) + ', 0, 0, 0, 1, 0, 0, ' +
		convert(varchar(12), @pacs_user_id) + ', 0, 0, ' +
		convert(varchar(12), @lTAAppSvrEnvironmentID) + ', ' +
		'''' + @szTAAppSvr + ''', ' +
		'''' + @szPACSLogin + ''', ' +
		'''' + @szPACSPassword + ''''

	exec(@szSQL)

GO

