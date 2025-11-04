
create procedure RecalcRowInsertErrorPTDStateCode
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int,
	@szError varchar(255)
as

set nocount on

	insert prop_recalc_errors with(rowlock) (
		prop_id, sup_yr, sup_num, sale_id, error, error_type
	) values (
		@lPropID, @lYear, @lSupNum, @lSaleID, @szError, 'PTDRD'
	)

GO

