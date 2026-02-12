




create procedure FreezeCeilingRunSetUndoInfo
	@run_id int,
	@user_id int

as


update
	freeze_ceiling_run
set
	undo_date = getdate(),
	undo_user_id = @user_id
from
	freeze_ceiling_run as fcr
where
	fcr.run_id = @run_id
and	fcr.process_date is null
and	fcr.undo_date is null

GO

