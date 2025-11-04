
create procedure CompSalesQueueARBGrid
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@bARBInquiry bit = 1,
	@lPacsUserID int = 0,
	@lCaseID int = 0,
	@lPriority int = 1 /* The default priority, currently only used by protest */
as

set nocount on

	declare @lCompType int

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
		@lNumCompsResidentialSales int,
		@lNumCompsResidentialEquity int,
		@lNumCompsCorpSales int,
		@lNumCompsCorpEquity int

	select
		@lNumCompsResidentialSales = lNumCompsResidential,
		@lNumCompsResidentialEquity = lNumCompsResidentialEquity,
		@lNumCompsCorpSales = lNumCompsCorp,
		@lNumCompsCorpEquity = lNumCompsCorpEquity
	from comp_sales_config with(nolock)
	where
		lYear = @lYear

	declare @bResidential bit
	exec IsResidentialProperty @lPropID, @lYear, @lSupNum, @bResidential output

	/* Do not generate more than one ARB grid and do not generate if not configured (via # of comps) */
	if (
		(
			(@bResidential = 1 and @lNumCompsResidentialSales > 0)
			or
			(@bResidential = 0 and @lNumCompsCorpSales > 0)
		)
		and
		not exists (
			select lPropGridID
			from comp_sales_property_grids with(nolock)
			where
				lSubjectPropID = @lPropID and
				lYear = @lYear and
				comparison_type = 'S'
		)
	)
	begin
		set @lCompType = 0

		/* add grid  for Comparable Sales */
		set @szSQL = 
			'exec master..xp_CompSalesQueueARBGrid80 ' +
			convert(varchar(12), @lPropID) + ', ' +
			convert(varchar(12), @lYear) + ', ' +
			convert(varchar(12), @lSupNum) + ', ' +
			convert(varchar(1), @bARBInquiry) + ', ' +
			convert(varchar(12), @lPacsUserID) + ', ' +
			convert(varchar(12), @lCaseID) + ', ' +
			convert(varchar(12), @lPriority) + ', ' +
			convert(varchar(12), @lCompType) + ', ' +
			convert(varchar(12), @lTAAppSvrEnvironmentID) + ', 1, ' +
			'''' + @szTAAppSvr + ''', ' +
			'''' + @szPACSLogin + ''', ' +
			'''' + @szPACSPassword + ''''

		exec(@szSQL)
	end

	/* Do not generate more than one ARB grid and do not generate if not configured (via # of comps) */
	if (
		(
			(@bResidential = 1 and @lNumCompsResidentialEquity > 0)
			or
			(@bResidential = 0 and @lNumCompsCorpEquity > 0)
		)
		and
		not exists (
			select lPropGridID
			from comp_sales_property_grids with(nolock)
			where
				lSubjectPropID = @lPropID and
				lYear = @lYear and
				comparison_type = 'E'
		)
	)
	begin
		set @lCompType = 1

		/* add grid  for Comparable Equity */
		set @szSQL = 
			'exec master..xp_CompSalesQueueARBGrid80 ' +
			convert(varchar(12), @lPropID) + ', ' +
			convert(varchar(12), @lYear) + ', ' +
			convert(varchar(12), @lSupNum) + ', ' +
			convert(varchar(1), @bARBInquiry) + ', ' +
			convert(varchar(12), @lPacsUserID) + ', ' +
			convert(varchar(12), @lCaseID) + ', ' +
			convert(varchar(12), @lPriority) + ', ' +
			convert(varchar(12), @lCompType) + ', ' +
			convert(varchar(12), @lTAAppSvrEnvironmentID) + ', 1, ' +
			'''' + @szTAAppSvr + ''', ' +
			'''' + @szPACSLogin + ''', ' +
			'''' + @szPACSPassword + ''''

		exec(@szSQL)
	end

	/* The grid(s) is now queued for creation */

GO

