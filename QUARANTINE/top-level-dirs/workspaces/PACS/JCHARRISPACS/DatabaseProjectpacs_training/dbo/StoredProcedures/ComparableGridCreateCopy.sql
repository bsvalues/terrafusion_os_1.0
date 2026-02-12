
create procedure ComparableGridCreateCopy
	@lPropGridID int,
	@bRecordset bit = 1,
	@lNewPropGridID int = null output
as
/* Note that this function does not copy a grid's static data */
set nocount on

	/* Copy comp_sales_property_grids */
	insert comp_sales_property_grids with(rowlock) (
		lSubjectPropID, szGridName, lGridID,
		lColWidthFields, lColWidthSubject, lPrecision,
		dtCreated, lPacsUserID, lYear, szComments,
		comparison_type, cShowDate, dtMarket
	)
	select
		lSubjectPropID, szGridName, lGridID,
		lColWidthFields, lColWidthSubject, lPrecision,
		getdate(), lPacsUserID, lYear, szComments,
		comparison_type, cShowDate, dtMarket
	from comp_sales_property_grids with(nolock)
	where
		lPropGridID = @lPropGridID

	set @lNewPropGridID = scope_identity()

	/* Copy comp_sales_property */
	insert comp_sales_property with(rowlock) (
		lPropGridID, lCompPropID, lColWidthGrid, lSaleID
	)
	select
		@lNewPropGridID, lCompPropID, lColWidthGrid, lSaleID
	from comp_sales_property with(nolock)
	where
		lPropGridID = @lPropGridID
	order by lID asc

	/* Copy comp_sales_property_adj */
	insert comp_sales_property_adj with(rowlock) (
		lPropGridID, lCompPropID, lAdjFieldID, fAdjAmount,
		szAdjReason, lImprovDetID, lImprovAttributeID, lSaleID
	)
	select
		@lNewPropGridID, lCompPropID, lAdjFieldID, fAdjAmount,
		szAdjReason, lImprovDetID, lImprovAttributeID, lSaleID
	from comp_sales_property_adj with(nolock)
	where
		lPropGridID = @lPropGridID
	order by lKey asc

	/* Copy comp_sales_corp_grid_options */
	insert comp_sales_corp_grid_options with(rowlock) (
		lPropGridID, lBPPValue, cSystemBPP, lOGBValue
	)
	select
		@lNewPropGridID, lBPPValue, cSystemBPP, lOGBValue
	from comp_sales_corp_grid_options with(nolock)
	where
		lPropGridID = @lPropGridID

set nocount off

	if ( @bRecordset = 1 )
	begin
		select lNewPropGridID = @lNewPropGridID
	end

GO

