
create procedure CompSalesAddPropGrid
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
	@bSetDefault bit = 0,
	@lGridIDCard int = 0,
	@dtMarket datetime,
	@bPrintCommentsFlag bit = 0,
	@szPrintComments varchar(500) = ''
as

set nocount on

	if ( isnull(@lGridIDCard, 0) = 0 )
		set @lGridIDCard = @lGridID

	declare @lNumGrids int

	begin transaction

	insert comp_sales_property_grids with(rowlock) (
		lYear, lSubjectPropID, szGridName, lGridID, szComments, lColWidthFields, lColWidthSubject, lPrecision, lPacsUserID, comparison_type, cShowDate, lGridIDCard, dtMarket, bPrintComments, szPrintComments
	) values (
		@lYear, @lSubjectPropID, @szGridName, @lGridID, @szComments, @lColWidthFields, @lColWidthSubject, @lPrecision, @lPacsUserID, @CompType, @cShowDate, @lGridIDCard, @dtMarket, @bPrintCommentsFlag, @szPrintComments
	)

	set @lPropGridID = scope_identity()

	select
		@lNumGrids = count(*)
	from comp_sales_property_grids with(nolock)
	where
		lSubjectPropID = @lSubjectPropID and
		comparison_type = @CompType and
		lYear = @lYear

	-- Must have a default grid
	if ( @bSetDefault = 1 or @lNumGrids = 1 )
	begin
		exec dbo.ComparableGridSetPropYearCompType @lYear, @lSubjectPropID, @CompType, 1, @lPropGridID, 0, null
	end

	commit transaction

set nocount off

	if (@bOutputRS = 1)
	begin
		select lPropGridID = @lPropGridID
	end

GO

