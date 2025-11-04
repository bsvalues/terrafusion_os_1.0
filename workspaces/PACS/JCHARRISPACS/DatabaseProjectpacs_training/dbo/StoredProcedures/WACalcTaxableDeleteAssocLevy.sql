
create procedure WACalcTaxableDeleteAssocLevy
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,
	@lPacsUserID int
as

set nocount on

	if ( @lPacsUserID <> 0 )
	begin
		delete wpola
		from wash_prop_owner_levy_assoc as wpola
		join #taxable_property_list as tpl with(nolock) on
			tpl.year = wpola.year and
			tpl.sup_num = wpola.sup_num and
			tpl.prop_id = wpola.prop_id
	end
	else if ( @lPropID <> 0 )
	begin
		delete wpola
		from wash_prop_owner_levy_assoc as wpola
		where
			wpola.year = @lYear and
			wpola.sup_num = @lSupNum and
			wpola.prop_id = @lPropID
	end
	else
	begin
		delete wpola
		from wash_prop_owner_levy_assoc as wpola with(tablockx)
		where
			wpola.year = @lYear and
			wpola.sup_num = @lSupNum
	end

GO

