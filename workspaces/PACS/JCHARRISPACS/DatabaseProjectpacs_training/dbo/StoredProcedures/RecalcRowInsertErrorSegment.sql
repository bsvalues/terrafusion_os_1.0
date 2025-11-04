
create procedure RecalcRowInsertErrorSegment
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int,
	@lImprovID int,
	@lImprovDetailID int,
	@lLandSegID int,
	@szError varchar(255),
	@szErrorType varchar(5),
	@szLandTypeCode varchar(10)
as

set nocount on

	insert prop_recalc_errors with(rowlock) (
		prop_id, sup_yr, sup_num, sale_id, imprv_id, imprv_detail_id, land_detail_id, error, error_type, land_type_cd
	) values (
		@lPropID, @lYear, @lSupNum, @lSaleID, @lImprovID, @lImprovDetailID, @lLandSegID, @szError, @szErrortype, @szLandTypeCode
	)

GO

