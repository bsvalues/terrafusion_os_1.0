
CREATE VIEW dbo.eff_acres_grp_prop_vw
AS
SELECT     TOP 100 PERCENT p.prop_id, p.geo_id, pv.legal_desc, a.file_as_name, eaa.date_added, pu.pacs_user_name, eaa.group_id, eaa.prop_val_yr, 
                      pv.legal_acreage, pv.prop_state, pv.prop_inactive_dt
FROM         dbo.effective_acres_assoc eaa 
INNER JOIN            dbo.prop_supp_assoc psa ON psa.prop_id = eaa.prop_id AND psa.owner_tax_yr = eaa.prop_val_yr 
INNER JOIN            dbo.property p          ON p.prop_id = eaa.prop_id 
INNER JOIN            dbo.property_val pv     ON psa.prop_id = pv.prop_id AND psa.sup_num = pv.sup_num AND psa.owner_tax_yr = pv.prop_val_yr 
INNER JOIN            dbo.owner o             ON pv.prop_id = o.prop_id AND pv.sup_num = o.sup_num AND pv.prop_val_yr = o.owner_tax_yr 
INNER JOIN            dbo.account a           ON o.owner_id = a.acct_id 
INNER JOIN            dbo.pacs_user pu        ON eaa.Added_By = pu.pacs_user_id
ORDER BY eaa.group_id, p.geo_id

GO

