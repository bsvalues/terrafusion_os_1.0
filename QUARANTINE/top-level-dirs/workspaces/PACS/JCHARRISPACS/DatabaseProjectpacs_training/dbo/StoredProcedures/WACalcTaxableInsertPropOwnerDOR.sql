
create procedure WACalcTaxableInsertPropOwnerDOR
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,
	@lOwnerID int,

	@item_type char,
	@item_id int,
	@exempt_value numeric(14,0)
as

set nocount on

	insert wash_prop_owner_dor with(rowlock) (
		year, sup_num, prop_id, owner_id,
		item_type, item_id, exempt_value
	) values (
		@lYear, @lSupNum, @lPropID, @lOwnerID,
		@item_type, @item_id, @exempt_value
	)

GO

