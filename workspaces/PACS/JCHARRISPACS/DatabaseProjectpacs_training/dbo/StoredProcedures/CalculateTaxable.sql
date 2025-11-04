

create procedure CalculateTaxable
	@szEntityList varchar(1000) = '',
	@lSupplement int,
	@lYear numeric(4),
	@lPropID int = 0,
	@szPropertyList varchar(2000) = '',
	@lPacsUserID int = 0,
	@bTaxPreviewMode bit = 0
as

set nocount on

	declare
		@szSQL varchar(8000),
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
		'exec master..xp_CalculateTaxable80 ' +
		convert(varchar(12), @lPacsUserID) + ', ' +
		convert(varchar(12), @lPropID) + ', ' +
		convert(varchar(12), @lYear) + ', ' +
		convert(varchar(12), @lSupplement) + ', ' +
		convert(varchar(1), @bTaxPreviewMode) + ', ' +
		convert(varchar(12), @lTAAppSvrEnvironmentID) + ', ' +
		'''' + replace(@szEntityList, '''', '''''') + ''', ' +
		'''' + replace(@szPropertyList, '''', '''''') + ''', ' +
		'''' + @szTAAppSvr + ''', ' +
		'''' + @szPACSLogin + ''', ' +
		'''' + @szPACSPassword + ''''

	exec(@szSQL)

GO

