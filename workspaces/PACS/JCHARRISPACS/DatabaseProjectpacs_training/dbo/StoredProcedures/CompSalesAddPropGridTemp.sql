
create procedure CompSalesAddPropGridTemp
	@lYear numeric(4,0),
	@lSubjectPropID int,
    @CompType char(1),
	@szGridName varchar(64),
	@lGridID int,
	@szComments varchar(500),
	@lColWidthFields int = 2160, /* 1.5 inches in twips */
	@lColWidthSubject int = 2160, /* 1.5 inches in twips */
	@lPrecision int = 2,
	@bOutputRS bit = 1,
	@lPropGridID int = null output,
	@lPacsUserID int = 0,
	@cShowDate char(1) = 'N',
	@dtMarket datetime,
	@bPrintCommentsFlag bit = 0,
	@szPrintComments varchar(500)
as

set nocount on

	insert comp_sales_temp_property_grids with(rowlock) (
		lYear, lSubjectPropID, szGridName, lGridID, szComments, lColWidthFields, lColWidthSubject, lPrecision, lPacsUserID, comparison_type, cShowDate, dtCreated, dtMarket, bPrintComments, szPrintComments
	) values (
		@lYear, @lSubjectPropID, @szGridName, @lGridID, @szComments, @lColWidthFields, @lColWidthSubject, @lPrecision, @lPacsUserID, @CompType, @cShowDate, getdate(), @dtMarket, @bPrintCommentsFlag, @szPrintComments
	)

	set @lPropGridID = @@identity

set nocount off

	if (@bOutputRS = 1)
	begin
		select lPropGridID = @lPropGridID
	end

GO

