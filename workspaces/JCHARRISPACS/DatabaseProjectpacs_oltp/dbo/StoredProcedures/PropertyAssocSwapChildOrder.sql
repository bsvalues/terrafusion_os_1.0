
create procedure PropertyAssocSwapChildOrder
	@lPropValYr numeric(4,0),
	@lSupNum int,
	@lParentPropID int,
	@lChild_Swap1 int,
	@lChild_Swap2 int
as

set nocount on

	declare
		@lOrder_Swap1 int,
		@lOrder_Swap2 int

	begin transaction

	select
		@lOrder_Swap1 = lOrder
	from property_assoc with(rowlock, holdlock, updlock)
	where prop_val_yr = @lPropValYr
	and sup_num = @lSupNum
	and parent_prop_id = @lParentPropID
	and child_prop_id = @lChild_Swap1

	select
		@lOrder_Swap2 = lOrder
	from property_assoc with(rowlock, holdlock, updlock)
	where prop_val_yr = @lPropValYr
	and sup_num = @lSupNum
	and parent_prop_id = @lParentPropID
	and child_prop_id = @lChild_Swap2

	update property_assoc with(rowlock)
	set lOrder = @lOrder_Swap2
	where prop_val_yr = @lPropValYr
	and sup_num = @lSupNum
	and parent_prop_id = @lParentPropID
	and child_prop_id = @lChild_Swap1

	update property_assoc with(rowlock)
	set lOrder = @lOrder_Swap1
	where prop_val_yr = @lPropValYr
	and sup_num = @lSupNum
	and parent_prop_id = @lParentPropID
	and child_prop_id = @lChild_Swap2

	commit transaction

GO

