
create procedure LayerDeleteExemption
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,
	
	@lOwnerID int = null,
	/*
		Meaning:
			null		All exemptions
			not null	Exemptions on a specific owner
	*/

	@szExemptTypeCode varchar(10) = null,
	/*
		Meaning:
			null		All exemptions
			not null	A specific exemption
	*/

	@bHintEntitiesAlreadyDeleted bit = 0
as

set nocount on

	-- If the caller has already deleted entities, then property_freeze is already empty per the 'on cascade delete' foreign key
	if ( @bHintEntitiesAlreadyDeleted = 0 )
	begin
		delete pf
		from dbo.property_freeze as pf with(rowlock)
		where
			pf.exmpt_tax_yr = @lYear and
			pf.owner_tax_yr = @lYear and
			pf.sup_num = @lSupNum and
			pf.prop_id = @lPropID and
			(@lOwnerID is null or pf.owner_id = @lOwnerID) and
			(@szExemptTypeCode is null or pf.exmpt_type_cd = @szExemptTypeCode)
	end

	delete psee
	from dbo.property_special_entity_exemption as psee with(rowlock)
	where
		psee.exmpt_tax_yr = @lYear and
		psee.owner_tax_yr = @lYear and
		psee.sup_num = @lSupNum and
		psee.prop_id = @lPropID and
		(@lOwnerID is null or psee.owner_id = @lOwnerID) and
		(@szExemptTypeCode is null or psee.exmpt_type_cd = @szExemptTypeCode)

	-- NOTE:  property_exemption_income_detail will delete automatically due to Cascading
	
	delete pei
	from dbo.property_exemption_income as pei with (rowlock)
	where
		pei.exmpt_tax_yr = @lYear and
		pei.owner_tax_yr = @lYear and
		pei.sup_num = @lSupNum and
		pei.prop_id = @lPropID and
		(@lOwnerID is null or pei.owner_id = @lOwnerID) and
		(@szExemptTypeCode is null or pei.exmpt_type_cd = @szExemptTypeCode)

	delete pedd -- do not use rowlock
	from dbo.property_exemption_dor_detail as pedd
	where
		pedd.exmpt_tax_yr = @lYear and
		pedd.owner_tax_yr = @lYear and
		pedd.sup_num = @lSupNum and
		pedd.prop_id = @lPropID and
		(@lOwnerID is null or pedd.owner_id = @lOwnerID) and
		(@szExemptTypeCode is null or pedd.exmpt_type_cd = @szExemptTypeCode)


	delete pe
	from dbo.property_exemption as pe with(rowlock)
	where
		pe.exmpt_tax_yr = @lYear and
		pe.owner_tax_yr = @lYear and
		pe.sup_num = @lSupNum and
		pe.prop_id = @lPropID and
		(@lOwnerID is null or pe.owner_id = @lOwnerID) and
		(@szExemptTypeCode is null or pe.exmpt_type_cd = @szExemptTypeCode)

	
	return(0)

GO

