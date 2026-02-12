
create procedure LayerDeleteRendition
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int
as

set nocount on


	delete r
	from dbo.rendition as r with(rowlock)
	where
		r.prop_val_yr = @lYear and
		r.sup_num = @lSupNum and
		r.prop_id = @lPropID


	delete pprt
	from dbo.pp_rendition_tracking as pprt with(rowlock)
	where
		pprt.prop_val_yr = @lYear and
		pprt.sup_num = @lSupNum and
		pprt.prop_id = @lPropID


	delete pprpp
	from dbo.pp_rendition_prop_penalty as pprpp with(rowlock)
	where
		pprpp.rendition_year = @lYear and
		pprpp.sup_num = @lSupNum and
		pprpp.prop_id = @lPropID


	delete pprppd
	from dbo.pp_rendition_prop_penalty_distribution as pprppd with(rowlock)
	where
		pprppd.rendition_year = @lYear and
		pprppd.sup_num = @lSupNum and
		pprppd.prop_id = @lPropID

	return(0)

GO

