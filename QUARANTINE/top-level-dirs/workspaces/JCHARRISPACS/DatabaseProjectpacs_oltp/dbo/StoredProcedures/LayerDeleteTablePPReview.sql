
create procedure LayerDeleteTablePPReview
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int
as

set nocount on

delete from pp_review
where [year] = @lYear and
	sup_num = @lSupNum and
	prop_id = @lPropID

	return(0)

GO

