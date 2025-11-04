
create procedure WACalcTaxableDeletePropOwnerVal
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,
	@lPacsUserID int
as

set nocount on

	if ( @lPacsUserID <> 0 )
	begin
		delete wpov
		from wash_prop_owner_val as wpov
		join #taxable_property_list as tpl with(nolock) on
			tpl.year = wpov.year and
			tpl.sup_num = wpov.sup_num and
			tpl.prop_id = wpov.prop_id
	end
	else if ( @lPropID <> 0 )
	begin
		delete wpov
		from wash_prop_owner_val as wpov
		where
			wpov.year = @lYear and
			wpov.sup_num = @lSupNum and
			wpov.prop_id = @lPropID
	end
	else
	begin
		delete wpov
		from wash_prop_owner_val as wpov with(tablockx)
		where
			wpov.year = @lYear and
			wpov.sup_num = @lSupNum
	end

GO

