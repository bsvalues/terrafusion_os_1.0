
CREATE procedure PropertyAssocGetNextOrder
	@lPropValYr numeric(4,0),
	@lSupNum int,
	@lParentPropID int,
	@lNextOrder int = null output,
	@bRS bit = 1
as

set nocount on

	select
		@lNextOrder = max(isnull(lOrder, -1))
	from property_assoc with(nolock)
	where prop_val_yr = @lPropValYr
	and sup_num = @lSupNum
	and parent_prop_id = @lParentPropID

	if ( @lNextOrder is null )
	begin
		set @lNextOrder = 0
	end
	else
	begin
		set @lNextOrder = @lNextOrder + 1
	end

set nocount off

	if ( @bRS = 1 )
	begin
		select lNextOrder = @lNextOrder
	end

GO

