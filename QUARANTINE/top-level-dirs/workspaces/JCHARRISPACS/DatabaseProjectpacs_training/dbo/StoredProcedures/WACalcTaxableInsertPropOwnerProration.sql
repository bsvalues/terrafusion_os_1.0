
create procedure WACalcTaxableInsertPropOwnerProration
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,
	@lOwnerID int,

	@past_sup_num int,
	@past_owner_id int,
	@ex_value_pct numeric(20,19),
	@no_ex_value_pct numeric(20,19)
as

set nocount on

	insert wash_prop_owner_proration with(rowlock) (
		year, sup_num, prop_id, owner_id,
		past_sup_num, past_owner_id, ex_value_pct, no_ex_value_pct
	) values (
		@lYear, @lSupNum, @lPropID, @lOwnerID,
		@past_sup_num, @past_owner_id, @ex_value_pct, @no_ex_value_pct
	)

GO

