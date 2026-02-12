
create procedure WACalcTaxableDeleteAssocTaxArea
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,
	@lPacsUserID int
as

set nocount on

	if ( @lPacsUserID <> 0 )
	begin
		delete wpotaa
		from wash_prop_owner_tax_area_assoc as wpotaa
		join #taxable_property_list as tpl with(nolock) on
			tpl.year = wpotaa.year and
			tpl.sup_num = wpotaa.sup_num and
			tpl.prop_id = wpotaa.prop_id
	end
	else if ( @lPropID <> 0 )
	begin
		delete wpotaa
		from wash_prop_owner_tax_area_assoc as wpotaa
		where
			wpotaa.year = @lYear and
			wpotaa.sup_num = @lSupNum and
			wpotaa.prop_id = @lPropID
	end
	else
	begin
		delete wpotaa
		from wash_prop_owner_tax_area_assoc as wpotaa with(tablockx)
		where
			wpotaa.year = @lYear and
			wpotaa.sup_num = @lSupNum
	end

GO

