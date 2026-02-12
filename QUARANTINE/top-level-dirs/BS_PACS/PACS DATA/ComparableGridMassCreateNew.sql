
create procedure ComparableGridMassCreateNew
	@szQuery varchar(8000),
	@lCompType_Sales int,				-- Specify 0 if Sales grids are NOT to be created.  Any other value means they will be created.
	@lSalesStatic int,					-- Specify 0 if Sales grids are to by dynamic.  Any other value means they will be made static.
	@lSalesCreateOption int,
		/*
			Sales creation options:
			0	Create new grid (even if one already exists)
			1	Create new grid, replacing (removing) any that previously existed
			2	Create new grid only if one doesn't already exist
			3	Not creating new grids - Just convert existing dynamic grids to static
		*/
	@lCompType_Equity int,				-- Specify 0 if Equity grids are NOT to be created.  Any other value means they will be created.
	@lEquityStatic int,					-- Specify 0 if Equity grids are to by dynamic.  Any other value means they will be made static.
	@lEquityCreateOption int,
		/*
			Equity creation options:
			0	Create new grid (even if one already exists)
			1	Create new grid, replacing (removing) any that previously existed
			2	Create new grid only if one doesn't already exist
			3	Not creating new grids - Just convert existing dynamic grids to static
		*/
	@lUseExclusionConfiguration int		-- Specify 0 to NOT use inclusion/exclusion configuration.  Any other value means said configuration will be used to further refine the properties on which to create grids.
as

set nocount on

	if (
		@lSalesCreateOption < 0 or @lSalesCreateOption > 3
		or
		@lEquityCreateOption < 0 or @lEquityCreateOption > 3
	)
	begin
		raiserror('Invalid parameter value specified for @lSalesCreateOption or @lEquityCreateOption', 18, 1)
		return(0)
	end

	declare
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

	exec master.dbo.xp_ComparableGridMassCreateNew
		@lCompType_Sales, @lSalesStatic, @lSalesCreateOption,
		@lCompType_Equity, @lEquityStatic, @lEquityCreateOption,
		@lUseExclusionConfiguration,
		@lTAAppSvrEnvironmentID,
		@szQuery, @szTAAppSvr, @szPACSLogin, @szPACSPassword

GO

