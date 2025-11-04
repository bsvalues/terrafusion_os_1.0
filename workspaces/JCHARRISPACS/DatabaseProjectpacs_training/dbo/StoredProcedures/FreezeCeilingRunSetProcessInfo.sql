




create procedure FreezeCeilingRunSetProcessInfo
	@run_id int,
	@user_id int

as


update
	freeze_ceiling_run
set
	process_date = getdate(),
	process_user_id = @user_id
from
	freeze_ceiling_run as fcr
where
	fcr.run_id = @run_id
and	fcr.process_date is null
and	fcr.undo_date is null

GO

