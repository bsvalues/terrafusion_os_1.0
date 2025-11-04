
CREATE VIEW dbo._owner_prop_group_vw
AS
SELECT     dbo._owner_vw.owner_id, dbo._owner_vw.owner_tax_yr, dbo._owner_vw.prop_id, dbo._owner_vw.pct_ownership, 
                      dbo.prop_group_assoc.prop_group_cd, dbo._owner_vw.file_as_name, dbo._owner_vw.addr_line1, dbo._owner_vw.addr_line2, 
                      dbo._owner_vw.addr_line3, dbo._owner_vw.addr_city, dbo._owner_vw.addr_state, dbo._owner_vw.country_cd, dbo._owner_vw.addr_zip, 
                      dbo._owner_vw.ag_app_filed, dbo._owner_vw.apply_pct_exemptions, dbo._owner_vw.sup_num, dbo._owner_vw.primary_addr
FROM         dbo._owner_vw INNER JOIN
                      dbo.prop_group_assoc ON dbo._owner_vw.prop_id = dbo.prop_group_assoc.prop_id

GO

