
create procedure WACalcTaxableDeletePropOwnerDOR
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,
	@lPacsUserID int
as

set nocount on

	if ( @lPacsUserID <> 0 )
	begin
		delete wpod
		from wash_prop_owner_dor as wpod
		join #taxable_property_list as tpl with(nolock) on
			tpl.year = wpod.year and
			tpl.sup_num = wpod.sup_num and
			tpl.prop_id = wpod.prop_id
	end
	else if ( @lPropID <> 0 )
	begin
		delete wpod
		from wash_prop_owner_dor as wpod
		where
			wpod.year = @lYear and
			wpod.sup_num = @lSupNum and
			wpod.prop_id = @lPropID
	end
	else
	begin
		delete wpod
		from wash_prop_owner_dor as wpod with(tablockx)
		where
			wpod.year = @lYear and
			wpod.sup_num = @lSupNum
	end

GO

