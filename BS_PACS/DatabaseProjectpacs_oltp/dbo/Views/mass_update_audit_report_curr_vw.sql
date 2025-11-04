

CREATE VIEW dbo.mass_update_audit_report_curr_vw
AS
SELECT DISTINCT mmpi.prop_id, mmpi.type, mmpi.old_value, mmpi.new_value, mmpi.mm_id, pv.assessed_val, mmpi.field_name, mmpi.updated_table
FROM         dbo.mm_prop_info AS mmpi WITH (nolock) INNER JOIN
                      dbo.mm_config AS mm WITH (nolock) ON mmpi.mm_id = mm.mm_id INNER JOIN
                      dbo.property_val AS pv WITH (nolock) ON mm.year = pv.prop_val_yr AND mmpi.prop_id = pv.prop_id INNER JOIN
                      dbo.prop_supp_assoc AS psa WITH (nolock) ON pv.prop_val_yr = psa.owner_tax_yr AND pv.sup_num = psa.sup_num AND pv.prop_id = psa.prop_id

GO

