
create procedure DeletePropertySupplementLayer
	@input_prop_id      	int,
	@input_current_supp 	int,
	@input_tax_yr      		numeric(4,0),
	@split_merge_flag		bit = 0,
	
	@szPropType				char(5) = null -- If the caller knows the value, it should be passed so this sp doesn't have to query for it
as

-- Revision History
-- ver	Author		Date		Description
-- 1.0	????		????-??-??	Created
-- 1.1	EricZ		????-??-??	added @split_merge_flag logic to correct multitude of split/merge constraint issues
-- 1.2	TrentN		????-??-??	updated for the new tables imprv_entity_assoc, land_entity_assoc, and pers_prop_entity_assoc
-- 1.3	TrentN		????-??-??	updated for the new tables imprv_exemption_assoc, land_exemption_assoc, and pers_prop_exemption_assoc
-- 1.4	RossK		2004.02.04	Added deletes to shared_prop and shared_prop_value
-- 1.5	JamesW		2005-01-08	Performance & concurrency enhancements
-- 1.6	JeremyS		2005-10-26 	HS 29290 - Don't disable logging
-- 1.7	RichA		2007-09-18	Added property_assoc

/* turn off logging */
exec dbo.SetMachineLogChanges 0


if ( @szPropType is null )
begin
	select @szPropType = prop_type_cd
	from property with(nolock)
	where prop_id = @input_prop_id
end


if ( @szPropType in ('R','MH') )
begin
	/* Now that Income has FK's to imprv and land_detail, it must be deleted first! */
	exec dbo.LayerDeleteIncome @input_tax_yr, @input_current_supp, @input_prop_id
	
	exec dbo.LayerDeleteImprovement @input_tax_yr, @input_current_supp, 0, @input_prop_id, null, null

	exec dbo.LayerDeleteLand @input_tax_yr, @input_current_supp, 0, @input_prop_id, null
end
else if ( @szPropType in ('P','A') )
begin
	exec dbo.LayerDeletePersonal @input_tax_yr, @input_current_supp, @input_prop_id, null

	exec dbo.LayerDeleteRendition @input_tax_yr, @input_current_supp, @input_prop_id
end
else -- Mineral
begin
	exec dbo.LayerDeleteLease @input_tax_yr, @input_current_supp, @input_prop_id
end

exec dbo.LayerDeletePropertyAssoc @input_tax_yr, @input_current_supp, @input_prop_id

exec dbo.LayerDeleteShared @input_tax_yr, @input_current_supp, @input_prop_id

exec dbo.LayerDeleteExemption @input_tax_yr, @input_current_supp, @input_prop_id, null, null, 0


exec dbo.LayerDeleteMain @input_tax_yr, @input_current_supp, @input_prop_id, @split_merge_flag


/* turn on logging */
exec dbo.SetMachineLogChanges 1

GO

