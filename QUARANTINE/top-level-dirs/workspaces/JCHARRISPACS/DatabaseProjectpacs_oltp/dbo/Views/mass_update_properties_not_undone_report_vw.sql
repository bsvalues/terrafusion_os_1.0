
CREATE VIEW dbo.mass_update_properties_not_undone_report_vw
AS

SELECT	mmpi.mm_id, mmpi.prop_id, a.file_as_name, pv.legal_desc, mmpi.field_name
FROM	dbo.mm_prop_info AS mmpi 
WITH (nolock) 
JOIN	dbo.property_val as pv
with (nolock)
on		mmpi.year = pv.prop_val_yr
and		mmpi.sup_num = pv.sup_num
and		mmpi.prop_id = pv.prop_id
JOIN	dbo.owner as o
with (nolock)
on		mmpi.year = o.owner_tax_yr
and		mmpi.sup_num = o.sup_num
and		mmpi.prop_id = o.prop_id
JOIN	dbo.account as a
with (nolock)
on		o.owner_id = a.acct_id
                    
WHERE     (mmpi.undo_failed = 1)

GO

