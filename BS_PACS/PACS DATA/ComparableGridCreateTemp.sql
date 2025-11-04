
create procedure ComparableGridCreateTemp
	@lPropGridID int,
	@bRecordset bit = 1,
	@lTempPropGridID int = null output
as

set nocount on

	/* Copy comp_sales_property_grids */
	insert comp_sales_temp_property_grids with(rowlock) (
		lSubjectPropID, szGridName, lGridID,
		lColWidthFields, lColWidthSubject, lPrecision,
		dtCreated, lPacsUserID, lYear, szComments,
		comparison_type, cShowDate, dtMarket
	)
	select
		lSubjectPropID, szGridName, lGridID,
		lColWidthFields, lColWidthSubject, lPrecision,
		dtCreated, lPacsUserID, lYear, szComments,
		comparison_type, cShowDate, dtMarket
	from comp_sales_property_grids with(nolock)
	where
		lPropGridID = @lPropGridID

	set @lTempPropGridID = scope_identity()

	/* Copy comp_sales_property */
	insert comp_sales_temp_property with(rowlock) (
		lTempPropGridID, lCompPropID, lColWidthGrid, lSaleID
	)
	select
		@lTempPropGridID, lCompPropID, lColWidthGrid, lSaleID
	from comp_sales_property with(nolock)
	where
		lPropGridID = @lPropGridID
	order by lID asc

	/* Copy comp_sales_property_adj */
	insert comp_sales_temp_property_adj with(rowlock) (
		lTempPropGridID, lCompPropID, lAdjFieldID, fAdjAmount, fUserAdjAmount,
		szAdjReason, lImprovDetID, lImprovAttributeID, bSystemAdj, lSaleID
	)
	select
		@lTempPropGridID, lCompPropID, lAdjFieldID, 0, fAdjAmount,
		szAdjReason, lImprovDetID, lImprovAttributeID, 0, lSaleID
	from comp_sales_property_adj with(nolock)
	where
		lPropGridID = @lPropGridID
	order by lKey asc

	/* Copy comp_sales_corp_grid_options */
	insert comp_sales_temp_corp_grid_options with(rowlock) (
		lTempPropGridID, lBPPValue, cSystemBPP, lOGBValue
	)
	select
		@lTempPropGridID, lBPPValue, cSystemBPP, lOGBValue
	from comp_sales_corp_grid_options with(nolock)
	where
		lPropGridID = @lPropGridID

	/* Copy comparable_grid_subject */
	insert comparable_grid_temp_subject with(rowlock) (
		lTempPropGridID, lSecondarySubjectPropID
	)
	select
		@lTempPropGridID, lSecondarySubjectPropID
	from comparable_grid_subject with(nolock)
	where
		lPropGridID = @lPropGridID

set nocount off

	if ( @bRecordset = 1 )
	begin
		select lTempPropGridID = @lTempPropGridID
	end

GO

