



/****** Object:  View dbo.VIT_SALES_TOTALS_VW    Script Date: 1/17/00 9:53:06 AM ******/
CREATE VIEW dbo.VIT_SALES_TOTALS_VW
AS
SELECT SUM(vit_sales.amount_due) AS sum_amount_due, 
    property_val.vit_flag, property_val.prop_inactive_dt, 
    prop_supp_assoc.prop_id, 
    prop_supp_assoc.owner_tax_yr
FROM prop_supp_assoc INNER JOIN
    property_val ON 
    prop_supp_assoc.prop_id = property_val.prop_id AND 
    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr AND
     prop_supp_assoc.sup_num = property_val.sup_num LEFT OUTER
     JOIN
    vit_sales ON property_val.prop_val_yr = vit_sales.year AND 
    property_val.prop_id = vit_sales.prop_id
GROUP BY property_val.vit_flag, property_val.prop_inactive_dt, 
    prop_supp_assoc.prop_id, 
    prop_supp_assoc.owner_tax_yr
HAVING (property_val.vit_flag = 'T') AND 
    (property_val.prop_inactive_dt IS NULL)

GO

