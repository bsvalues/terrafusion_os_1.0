




CREATE VIEW dbo.prop_w_ex_ex366_vw
AS
SELECT prop_supp_assoc.prop_id, 
    prop_supp_assoc.owner_tax_yr, prop_supp_assoc.sup_num, 
    property_val.legal_desc, account.file_as_name, 
    owner.pct_ownership
FROM account INNER JOIN
    owner ON account.acct_id = owner.owner_id INNER JOIN
    prop_supp_assoc INNER JOIN
    property_val ON 
    prop_supp_assoc.prop_id = property_val.prop_id AND 
    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr AND
     prop_supp_assoc.sup_num = property_val.sup_num ON 
    owner.prop_id = property_val.prop_id AND 
    owner.owner_tax_yr = property_val.prop_val_yr AND 
    owner.sup_num = property_val.sup_num
WHERE property_val.prop_inactive_dt IS NULL AND 
    EXISTS
        (SELECT *
      FROM property_exemption
      WHERE prop_id = owner.prop_id AND 
           sup_num = owner.sup_num AND 
           exmpt_tax_yr = owner.owner_tax_yr AND 
           exmpt_tax_yr = owner.owner_tax_yr AND 
           owner_id = owner.owner_id AND 
           exmpt_type_cd = 'EX') AND EXISTS
        (SELECT *
      FROM property_exemption
      WHERE prop_id = owner.prop_id AND 
           sup_num = owner.sup_num AND 
           exmpt_tax_yr = owner.owner_tax_yr AND 
           owner_tax_yr = owner.owner_tax_yr AND 
           owner_id = owner.owner_id AND 
           exmpt_type_cd = 'EX366')

GO

