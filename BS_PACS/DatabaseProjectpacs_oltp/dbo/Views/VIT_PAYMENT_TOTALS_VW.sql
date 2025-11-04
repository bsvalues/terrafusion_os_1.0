


CREATE VIEW dbo.VIT_PAYMENT_TOTALS_VW
AS
SELECT VIT_SALES_TOTALS_VW.prop_id, 
    VIT_SALES_TOTALS_VW.owner_tax_yr, 
    VIT_SALES_TOTALS_VW.sum_amount_due AS amount_due, 
    VIT_PAYMENT_VW.amount_paid, 
    VIT_SALES_TOTALS_VW.sum_amount_due - VIT_PAYMENT_VW.amount_paid
     AS amount_diff, account.file_as_name, owner.owner_id
FROM VIT_PAYMENT_VW RIGHT OUTER JOIN
    VIT_SALES_TOTALS_VW INNER JOIN
    prop_supp_assoc ON 
    VIT_SALES_TOTALS_VW.prop_id = prop_supp_assoc.prop_id AND
     VIT_SALES_TOTALS_VW.owner_tax_yr = prop_supp_assoc.owner_tax_yr
     INNER JOIN
    account INNER JOIN
    owner ON account.acct_id = owner.owner_id ON 
    prop_supp_assoc.prop_id = owner.prop_id AND 
    prop_supp_assoc.owner_tax_yr = owner.owner_tax_yr AND 
    prop_supp_assoc.sup_num = owner.sup_num ON 
    VIT_PAYMENT_VW.prop_id = VIT_SALES_TOTALS_VW.prop_id AND
     VIT_PAYMENT_VW.year = VIT_SALES_TOTALS_VW.owner_tax_yr

GO

