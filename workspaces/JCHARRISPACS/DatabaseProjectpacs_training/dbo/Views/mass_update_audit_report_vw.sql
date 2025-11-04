
CREATE VIEW dbo.mass_update_audit_report_vw
AS
SELECT DISTINCT mpi.mm_id, mpi.seq_num, mpi.prop_id, mpi.type, mpi.old_value, mpi.new_value, 
		pv.assessed_val AS Curr_val, muprev.assessed_val AS Prev_val, 
		mpi.field_name, mpi.updated_table
FROM    dbo.mm_prop_info as mpi
with (nolock)
JOIN	dbo.mass_update_audit_report_prev_vw as muprev
with (nolock)
on		mpi.mm_id = muprev.mm_id
and		mpi.seq_num = muprev.seq_num
and		mpi.prop_id = muprev.prop_id
join	dbo.property_val as pv
with (nolock)
on		mpi.year = pv.prop_val_yr
and		mpi.sup_num = pv.sup_num
and		mpi.prop_id = pv.prop_id

GO

