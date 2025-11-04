
create procedure RecalcPopulateListLayer
	@lPacsUserID bigint,
	@lYear numeric(4,0),
	@lSupNum int
as

set nocount on

	declare @lPropertyCount int

	if ( @lPacsUserID = 0 )
	begin
		/* Caller wants count of all properties in the layer */
		select @lPropertyCount = count(*)
		from property_val as pv with(nolock)
		where
			pv.prop_val_yr = @lYear and
			pv.sup_num = @lSupNum and
			pv.prop_inactive_dt is null
	end
	else
	begin
		/* Caller wants count of properties already in recalc_prop_list */
		select @lPropertyCount = count(*)
		from recalc_prop_list with(nolock)
		where
			pacs_user_id = @lPacsUserID
	end

set nocount off

	select lCount = @lPropertyCount

GO

