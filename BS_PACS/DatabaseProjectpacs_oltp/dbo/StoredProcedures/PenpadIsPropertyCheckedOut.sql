
create procedure dbo.PenpadIsPropertyCheckedOut
	@lPropID int,
	@bCheckedOut bit = 0 output,
	@bRS bit = 1
as

set nocount on

	if exists (
		select pc.run_id
		from penpad_checkout as pc with(nolock)
		join penpad_run as pr with(nolock) on
			pc.run_id = pr.run_id
		join property as p with(nolock) on
			pc.prop_id = p.prop_id
		where
			pc.prop_id = @lPropID and
			pc.bCheckedIn = 0 and
			isnull(p.reference_flag, 'F') <> 'T' --and
			--pr.check_in_date is null 
			-- removed since properties can now be rechecked out and original checkin date needs to be retained in case of cancel
	)
	begin
		set @bCheckedOut = 1
	end
	else
	begin
		set @bCheckedOut = 0
	end

set nocount off

	if ( @bRS = 1 )
	begin
		select bCheckedOut = @bCheckedOut
	end

GO

