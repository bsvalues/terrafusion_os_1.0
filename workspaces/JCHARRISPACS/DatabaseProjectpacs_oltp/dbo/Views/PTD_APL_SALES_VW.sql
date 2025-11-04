






/****** Object:  View dbo.PTD_APL_SALES_VW    Script Date: 6/23/2000 2:53:23 PM ******/

CREATE VIEW dbo.PTD_APL_SALES_VW
AS
SELECT chg_of_owner_prop_assoc.sup_tax_yr, 
    chg_of_owner_prop_assoc.prop_id, sale.sl_price, sale.sl_dt, 
    sale_conf.sl_conf_id
FROM chg_of_owner_prop_assoc INNER JOIN
    sale ON 
    chg_of_owner_prop_assoc.chg_of_owner_id = sale.chg_of_owner_id
     LEFT OUTER JOIN
    sale_conf ON 
    sale.chg_of_owner_id = sale_conf.chg_of_owner_id

GO

