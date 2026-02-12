
create procedure RecalcRowUpdateSpecialEntityExemption
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lOwnerID int,
	@lEntityID int,
	@szExemptTypeCode varchar(10),
	@exmpt_amt numeric(14,2),
	@sp_segment_amt numeric(14,0)
as

set nocount on

	update property_special_entity_exemption with(rowlock)
	set
		exmpt_amt = @exmpt_amt,
		sp_segment_amt = @sp_segment_amt
	where
		prop_id = @lPropID and
		exmpt_tax_yr = @lYear and
		owner_tax_yr = @lYear and
		sup_num = @lSupNum and
		owner_id = @lOwnerID and
		entity_id = @lEntityID and
		exmpt_type_cd = @szExemptTypeCode

GO

