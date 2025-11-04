
create procedure LayerOperationPropAssocListInsert
	@lGeneralRunID int,
	@lYear_From numeric(4,0),
	@lSupNum_From int,
	@lPropID_From int,
	@lYear_To numeric(4,0),
	@lSupNum_To int,
	@lPropID_To int
as

set nocount on

	insert dbo.layer_operation_prop_assoc_list (
		lGeneralRunID,
		lYear_From, lSupNum_From, lPropID_From,
		lYear_To, lSupNum_To, lPropID_To
	) values (
		@lGeneralRunID,
		@lYear_From, @lSupNum_From, @lPropID_From,
		@lYear_To, @lSupNum_To, @lPropID_To
	)

	return(0)

GO

