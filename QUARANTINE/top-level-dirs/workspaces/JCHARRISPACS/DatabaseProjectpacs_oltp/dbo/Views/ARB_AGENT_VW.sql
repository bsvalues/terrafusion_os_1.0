


CREATE VIEW dbo.ARB_AGENT_VW
AS
SELECT     dbo.property_type.prop_type_desc, dbo.prop_supp_assoc.prop_id, dbo.prop_supp_assoc.owner_tax_yr, dbo.property_val.legal_desc, 
                      dbo.property_val.prop_inactive_dt, dbo.property.geo_id, dbo.agent_assoc.agent_id, dbo.account.file_as_name
FROM         dbo.property_type INNER JOIN
                      dbo.property ON dbo.property_type.prop_type_cd = dbo.property.prop_type_cd INNER JOIN
                      dbo.property_val INNER JOIN
                      dbo.prop_supp_assoc ON dbo.property_val.prop_id = dbo.prop_supp_assoc.prop_id AND 
                      dbo.property_val.prop_val_yr = dbo.prop_supp_assoc.owner_tax_yr AND dbo.property_val.sup_num = dbo.prop_supp_assoc.sup_num ON 
                      dbo.property.prop_id = dbo.prop_supp_assoc.prop_id INNER JOIN
                      dbo.agent_assoc ON dbo.property_val.prop_id = dbo.agent_assoc.prop_id AND 
                      dbo.property_val.prop_val_yr = dbo.agent_assoc.owner_tax_yr INNER JOIN
                      dbo.account ON dbo.agent_assoc.agent_id = dbo.account.acct_id
WHERE     (dbo.property_val.prop_inactive_dt IS NULL)

GO

