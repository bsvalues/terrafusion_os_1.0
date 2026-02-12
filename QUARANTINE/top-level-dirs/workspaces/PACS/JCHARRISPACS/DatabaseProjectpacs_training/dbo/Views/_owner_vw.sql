
CREATE VIEW dbo._owner_vw
AS
SELECT     dbo.owner.owner_id, dbo.owner.owner_tax_yr, dbo.owner.prop_id, dbo.owner.pct_ownership, dbo.account.file_as_name, dbo.address.addr_line1, 
                      dbo.address.addr_line2, dbo.address.addr_line3, dbo.address.addr_city, dbo.address.addr_state, dbo.address.country_cd, dbo.address.addr_zip, 
                      dbo.owner.ag_app_filed, dbo.owner.apply_pct_exemptions, dbo.owner.sup_num, dbo.address.primary_addr
FROM         dbo.account INNER JOIN
                      dbo.owner ON dbo.account.acct_id = dbo.owner.owner_id LEFT OUTER JOIN
                      dbo.address ON dbo.account.acct_id = dbo.address.acct_id

GO

