

CREATE VIEW dbo.ia_report_property_vw
AS
SELECT     iaba.ia_id, a.file_as_name, pv.prop_id, pv.legal_desc, COUNT(*) AS num_bills,
                dbo.situs.primary_situs, dbo.situs.situs_num, dbo.situs.situs_street_prefx, dbo.situs.situs_street,
                dbo.situs.situs_street_sufix, dbo.situs.situs_unit, dbo.situs.situs_city, dbo.situs.situs_state,
                dbo.situs.situs_zip, dbo.situs.situs_display
FROM         dbo.installment_agreement_bill_assoc iaba INNER JOIN
                      dbo.bill ON iaba.bill_id = dbo.bill.bill_id INNER JOIN
                      dbo.prop_supp_assoc psa ON dbo.bill.prop_id = psa.prop_id INNER JOIN
                      dbo.property_val pv ON psa.prop_id = pv.prop_id AND psa.sup_num = pv.sup_num AND psa.owner_tax_yr = pv.prop_val_yr INNER JOIN
                      dbo.owner o ON pv.prop_id = o.prop_id AND pv.sup_num = o.sup_num AND pv.prop_val_yr = o.owner_tax_yr INNER JOIN
                      dbo.account a ON o.owner_id = a.acct_id LEFT OUTER JOIN
                      dbo.situs ON dbo.bill.prop_id = dbo.situs.prop_id AND dbo.situs.primary_situs = 'Y'
WHERE     (pv.prop_val_yr IN
                          ((SELECT     MAX(owner_tax_yr)
                              FROM         prop_supp_assoc AS psa1, pacs_system
                              WHERE     psa1.prop_id = psa.prop_id AND psa1.owner_tax_yr <= pacs_system.tax_yr)))
GROUP BY iaba.ia_id, a.file_as_name, pv.prop_id, pv.legal_desc, dbo.situs.primary_situs, dbo.situs.situs_num,
                dbo.situs.situs_street_prefx, dbo.situs.situs_street,
                dbo.situs.situs_street_sufix, dbo.situs.situs_unit, dbo.situs.situs_city, dbo.situs.situs_state,
                dbo.situs.situs_zip, dbo.situs.situs_display

GO

