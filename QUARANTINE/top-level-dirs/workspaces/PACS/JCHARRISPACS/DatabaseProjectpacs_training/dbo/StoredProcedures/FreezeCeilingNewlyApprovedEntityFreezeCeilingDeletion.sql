




create procedure FreezeCeilingNewlyApprovedEntityFreezeCeilingDeletion
	@run_id int
as


delete
	freeze_ceiling_newly_approved_entity_freeze_ceiling_run_detail
from
	freeze_ceiling_run as run
inner join
	freeze_ceiling_newly_approved_entity_freeze_ceiling_run_detail as detail
on
	detail.run_id = run.run_id
where
	run.run_id = @run_id
and	run.process_date is null
and	run.undo_date is null

GO

