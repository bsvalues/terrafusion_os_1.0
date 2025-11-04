
create procedure WACalcTaxableDeletePropOwnerExemption
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,
	@lPacsUserID int
as

set nocount on

	if ( @lPacsUserID <> 0 )
	begin
		delete wpoe
		from wash_prop_owner_exemption as wpoe
		join #taxable_property_list as tpl with(nolock) on
			tpl.year = wpoe.year and
			tpl.sup_num = wpoe.sup_num and
			tpl.prop_id = wpoe.prop_id
	end
	else if ( @lPropID <> 0 )
	begin
		delete wpoe
		from wash_prop_owner_exemption as wpoe
		where
			wpoe.year = @lYear and
			wpoe.sup_num = @lSupNum and
			wpoe.prop_id = @lPropID
	end
	else
	begin
		delete wpoe
		from wash_prop_owner_exemption as wpoe with(tablockx)
		where
			wpoe.year = @lYear and
			wpoe.sup_num = @lSupNum
	end

GO

