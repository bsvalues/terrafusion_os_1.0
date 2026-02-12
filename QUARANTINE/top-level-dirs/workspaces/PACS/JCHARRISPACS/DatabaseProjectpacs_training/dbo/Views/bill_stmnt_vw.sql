


CREATE VIEW dbo.bill_stmnt_vw
AS
SELECT     dbo.bill.stmnt_id, dbo.bill.sup_tax_yr, dbo.account.file_as_name, dbo.bill.owner_id, dbo.bill.prop_id,

sum(case when bill.ia_id is not null and bill.ia_id > 0 then 1 else 0 end) as ia_count

FROM         dbo.bill INNER JOIN
                      dbo.account ON dbo.bill.owner_id = dbo.account.acct_id
WHERE     (dbo.bill.coll_status_cd <> 'RS') AND (dbo.bill.active_bill = 'T' OR
                      dbo.bill.active_bill IS NULL)
GROUP BY dbo.bill.stmnt_id, dbo.bill.sup_tax_yr, dbo.account.file_as_name, dbo.bill.owner_id, dbo.bill.prop_id

GO

