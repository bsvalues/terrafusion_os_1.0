




CREATE VIEW dbo.OWNER_JAN1_VW
AS
SELECT dbo.owner_jan1.owner_id, dbo.owner_jan1.owner_tax_yr, dbo.owner_jan1.prop_id, dbo.owner_jan1.updt_dt, dbo.owner_jan1.pct_ownership, 
       dbo.owner_jan1.owner_cmnt, dbo.owner_jan1.over_65_defer, dbo.owner_jan1.over_65_date, dbo.owner_jan1.ag_app_filed, 
       dbo.owner_jan1.apply_pct_exemptions, dbo.owner_jan1.type_of_int, dbo.owner_jan1.hs_prop, dbo.account.file_as_name, dbo.address.addr_line1, 
       dbo.address.addr_line2, dbo.address.addr_line3, dbo.address.addr_city, dbo.address.addr_state, dbo.address.country_cd, dbo.address.addr_zip, 
       dbo.address.ml_deliverable, dbo.owner_jan1.birth_dt, dbo.owner_jan1.roll_exemption, dbo.owner_jan1.roll_state_cd, dbo.owner_jan1.roll_entity, 
       dbo.owner_jan1.pct_imprv_hs, dbo.owner_jan1.pct_imprv_nhs, dbo.owner_jan1.pct_land_hs, dbo.owner_jan1.pct_land_nhs, 
       dbo.owner_jan1.pct_ag_use, dbo.owner_jan1.pct_ag_mkt, dbo.owner_jan1.pct_tim_use, dbo.owner_jan1.pct_tim_mkt, dbo.owner_jan1.pct_pers_prop, 
       dbo.owner_jan1.udi_child_prop_id, dbo.owner_jan1.percent_type, dbo.owner_jan1.sup_num, dbo.address.is_international
FROM   dbo.address RIGHT OUTER JOIN
       dbo.account INNER JOIN
       dbo.owner_jan1 ON dbo.account.acct_id = dbo.owner_jan1.owner_id ON dbo.address.acct_id = dbo.account.acct_id AND dbo.address.primary_addr = 'Y'

GO

