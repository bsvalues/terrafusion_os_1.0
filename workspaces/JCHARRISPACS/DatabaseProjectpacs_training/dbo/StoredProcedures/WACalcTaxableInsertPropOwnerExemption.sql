
create procedure WACalcTaxableInsertPropOwnerExemption
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,
	@lOwnerID int,

	@exmpt_type_cd varchar(10),
	@exempt_value numeric(14,0),
	@exempt_sub_type_cd varchar(10),
	@exempt_qualify_cd varchar(10)
as

set nocount on

	insert wash_prop_owner_exemption with(rowlock) (
		year, sup_num, prop_id, owner_id,
		exmpt_type_cd, exempt_value, exempt_sub_type_cd, exempt_qualify_cd
	) values (
		@lYear, @lSupNum, @lPropID, @lOwnerID,
		@exmpt_type_cd, @exempt_value, @exempt_sub_type_cd, @exempt_qualify_cd
	)

GO

