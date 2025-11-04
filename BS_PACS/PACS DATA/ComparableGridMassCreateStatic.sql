
create procedure ComparableGridMassCreateStatic
	@szQuery varchar(2048),
	@lReplaceExisting int = 0,
	@lMakeStaticDefault int = 0

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

	declare
		@lPacsUserID int

	set @lPacsUserID = 0

	exec master.dbo.xp_ComparableGridMassCreateStatic
		@lPacsUserID, @lMakeStaticDefault, @lReplaceExisting,
		@lTAAppSvrEnvironmentID, @szQuery, @szTAAppSvr, @szPACSLogin, @szPACSPassword

GO

