

CREATE VIEW _land_vw
AS
SELECT land_detail.*, account.file_as_name AS file_as_name, 
    property.geo_id AS geo_id, 
    land_sched1.ls_code AS mkt_class_code, 
    land_sched1.ls_code AS ag_class_code, 
    owner.owner_id AS owner_id, 
    address.primary_addr AS primary_addr, 
    address.addr_line1 AS addr_line1, 
    address.addr_line2 AS addr_line2, 
    address.addr_line3 AS addr_line3, 
    address.addr_city AS addr_city, 
    address.addr_state AS addr_state, 
    address.country_cd AS country_cd, 
    address.addr_zip AS addr_zip
FROM address RIGHT OUTER JOIN
    owner INNER JOIN
    account ON owner.owner_id = account.acct_id ON 
    address.acct_id = account.acct_id RIGHT OUTER JOIN
    land_detail INNER JOIN
    property_val INNER JOIN
    property ON property_val.prop_id = property.prop_id ON 
    land_detail.prop_id = property_val.prop_id AND 
    land_detail.prop_val_yr = property_val.prop_val_yr AND 
    land_detail.sup_num = property_val.sup_num LEFT OUTER JOIN
    land_sched land_sched1 ON 
    land_detail.ls_ag_id = land_sched1.ls_id AND 
    land_detail.prop_val_yr = land_sched1.ls_year LEFT OUTER JOIN
    land_sched ON 
    land_detail.prop_val_yr = land_sched1.ls_year AND 
    land_detail.ls_mkt_id = land_sched1.ls_id ON 
    owner.prop_id = property_val.prop_id AND 
    owner.owner_tax_yr = property_val.prop_val_yr AND 
    owner.sup_num = property_val.sup_num
WHERE (land_detail.sale_id = 0) AND 
    (property_val.prop_inactive_dt IS NULL)

GO

