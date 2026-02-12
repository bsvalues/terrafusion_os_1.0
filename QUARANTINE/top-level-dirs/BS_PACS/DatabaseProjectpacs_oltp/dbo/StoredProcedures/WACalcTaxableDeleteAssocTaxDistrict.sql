
create procedure WACalcTaxableDeleteAssocTaxDistrict
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,
	@lPacsUserID int
as

set nocount on

	if ( @lPacsUserID <> 0 )
	begin
		delete wpotda
		from wash_prop_owner_tax_district_assoc as wpotda
		join #taxable_property_list as tpl with(nolock) on
			tpl.year = wpotda.year and
			tpl.sup_num = wpotda.sup_num and
			tpl.prop_id = wpotda.prop_id
	end
	else if ( @lPropID <> 0 )
	begin
		delete wpotda
		from wash_prop_owner_tax_district_assoc as wpotda
		where
			wpotda.year = @lYear and
			wpotda.sup_num = @lSupNum and
			wpotda.prop_id = @lPropID
	end
	else
	begin
		delete wpotda
		from wash_prop_owner_tax_district_assoc as wpotda with(tablockx)
		where
			wpotda.year = @lYear and
			wpotda.sup_num = @lSupNum
	end

GO

