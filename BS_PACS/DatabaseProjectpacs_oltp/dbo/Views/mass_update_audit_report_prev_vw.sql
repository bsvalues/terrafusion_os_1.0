
CREATE VIEW dbo.mass_update_audit_report_prev_vw
AS
SELECT mmpi.mm_id, mmpi.prop_id, mmpi.seq_num, pv.assessed_val
FROM dbo.mm_prop_info AS mmpi 
WITH (nolock) 
JOIN dbo.property_val AS pv 
WITH (nolock)
ON mmpi.year - 1 = pv.prop_val_yr 
AND mmpi.prop_id = pv.prop_id 
JOIN dbo.prop_supp_assoc AS psa 
WITH (nolock) 
ON pv.prop_val_yr = psa.owner_tax_yr 
AND pv.sup_num = psa.sup_num 
AND pv.prop_id = psa.prop_id

GO

