




create procedure FreezeCeilingRunSetPreviewInfo
	@run_id int,
	@user_id int

as


update
	freeze_ceiling_run
set
	preview_date = getdate(),
	preview_user_id = @user_id
from
	freeze_ceiling_run as fcr
where
	fcr.run_id = @run_id
and	fcr.preview_date is null
and	fcr.process_date is null
and	fcr.undo_date is null

GO

