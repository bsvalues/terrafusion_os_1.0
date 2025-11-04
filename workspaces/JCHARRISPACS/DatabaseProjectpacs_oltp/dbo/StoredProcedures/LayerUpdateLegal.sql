
create procedure LayerUpdateLegal
	@lFromYear numeric(4,0),
	@lFromSupNum int,
	@lFromPropID int,
	@lToYear numeric(4,0),
	@lToSupNum int,
	@lToPropID int
as

set nocount on

	update pv
	set abs_subdv_cd = curr.abs_subdv_cd,
		block = curr.block,
		tract_or_lot = curr.tract_or_lot,
		book_page = curr.book_page,
		legal_acreage = curr.legal_acreage,
		eff_size_acres = curr.eff_size_acres,
		condo_pct = curr.condo_pct,
		legal_desc_2 = curr.legal_desc_2,
		udi_child_legal_desc = curr.udi_child_legal_desc,
		auto_build_legal = curr.auto_build_legal,
		legal_desc = curr.legal_desc
	from property_val as pv
	join property_val as curr
	with (nolock)
	on pv.prop_id = curr.prop_id
	where pv.prop_val_yr = @lToYear
	and pv.sup_num = @lToSupNum
	and curr.prop_val_yr = @lFromYear
	and curr.sup_num = @lFromSupNum
    and pv.prop_id = @lToPropID
    and curr.prop_id = @lFromPropID

	update pld
	set metes_and_bounds = curr.metes_and_bounds
	from property_legal_description as pld
	join property_legal_description as curr
	with (nolock)
	on pld.prop_id = curr.prop_id
	where pld.prop_val_yr = @lToYear
	and pld.sup_num = @lToSupNum
	and curr.prop_val_yr = @lFromYear
	and curr.sup_num = @lFromSupNum
	and pld.prop_id = @lToPropID
	and curr.prop_id = @lFromPropID

	return(0)

GO

