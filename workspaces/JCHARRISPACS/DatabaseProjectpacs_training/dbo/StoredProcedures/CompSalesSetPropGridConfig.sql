

create procedure CompSalesSetPropGridConfig
	@lPropGridID int,
	@lYear numeric(4,0),
	@szGridName varchar(64),
	@lGridFormatID int,
	@lColWidthFields int,				    
	@lColWidthSubject int,
	@lPrecision int,
	@szComments varchar(500),
	@cShowDate char(1)
as

set nocount on

	update comp_sales_property_grids with(rowlock) set
		lYear = @lYear,
		szGridName = @szGridName,
		lGridID = @lGridFormatID,
		lColWidthFields = @lColWidthFields,
		lColWidthSubject = @lColWidthSubject,
		lPrecision = @lPrecision,
		szComments = @szComments,
		cShowDate = @cShowDate
	where
		lPropGridID = @lPropGridID

set nocount off

GO

