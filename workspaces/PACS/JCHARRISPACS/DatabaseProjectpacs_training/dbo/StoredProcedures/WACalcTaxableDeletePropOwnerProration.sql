
create procedure WACalcTaxableDeletePropOwnerProration
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,
	@lPacsUserID int
as

set nocount on

	if ( @lPacsUserID <> 0 )
	begin
		delete wpop
		from wash_prop_owner_proration as wpop
		join #taxable_property_list as tpl with(nolock) on
			tpl.year = wpop.year and
			tpl.sup_num = wpop.sup_num and
			tpl.prop_id = wpop.prop_id
	end
	else if ( @lPropID <> 0 )
	begin
		delete wpop
		from wash_prop_owner_proration as wpop
		where
			wpop.year = @lYear and
			wpop.sup_num = @lSupNum and
			wpop.prop_id = @lPropID
	end
	else
	begin
		delete wpop
		from wash_prop_owner_proration as wpop with(tablockx)
		where
			wpop.year = @lYear and
			wpop.sup_num = @lSupNum
	end

GO

