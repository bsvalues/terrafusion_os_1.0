










CREATE VIEW dbo.supp_roll_entity_info_vw
AS
SELECT DISTINCT 
    supp_roll_info.prop_id, supp_roll_info.owner_id, 
    prop_owner_entity_val1.taxable_val AS curr_taxable_val, 
    prop_owner_entity_val1.assessed_val AS curr_assessed_val, 
    prop_owner_entity_val1.taxable_val AS prev_taxable_val, 
    prop_owner_entity_val1.assessed_val AS prev_assessed_val, 
    supp_roll_info.sup_num, supp_roll_info.sup_group_id, 
    supp_roll_info.sup_yr, prop_owner_entity_val1.entity_id, 
    bill1.bill_m_n_o, bill1.bill_i_n_s, bill1.bill_prot_i_n_s, 
    bill1.bill_m_n_o AS prev_bill_m_n_o, 
    bill1.bill_i_n_s AS prev_bill_i_n_s, 
    bill1.bill_prot_i_n_s AS prev_prot_i_n_s
FROM bill bill1 LEFT OUTER JOIN
    bill ON bill1.prev_bill_id = bill1.bill_id RIGHT OUTER JOIN
    supp_roll_info INNER JOIN
    prop_owner_entity_val prop_owner_entity_val1 ON 
    supp_roll_info.prop_id = prop_owner_entity_val1.prop_id AND 
    supp_roll_info.owner_id = prop_owner_entity_val1.owner_id AND
     supp_roll_info.sup_yr = prop_owner_entity_val1.sup_yr AND 
    supp_roll_info.sup_num = prop_owner_entity_val1.sup_num ON
     bill1.prop_id = prop_owner_entity_val1.prop_id AND 
    bill1.owner_id = prop_owner_entity_val1.owner_id AND 
    bill1.sup_num = prop_owner_entity_val1.sup_num AND 
    bill1.sup_tax_yr = prop_owner_entity_val1.sup_yr AND 
    bill1.entity_id = prop_owner_entity_val1.entity_id

GO

