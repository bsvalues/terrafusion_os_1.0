










CREATE VIEW dbo.supp_prop_entity_val
AS
SELECT DISTINCT 
    prop_owner_entity_val.prop_id, 
    prop_owner_entity_val.owner_id, 
    prop_owner_entity_val.sup_num, 
    prop_owner_entity_val.sup_yr, entity.entity_cd, 
    owner.pct_ownership, 
    prev_owner.pct_ownership AS prev_pct_owner, 
    prop_owner_entity_val.taxable_val, 
    prev_prop_owner_entity_val.taxable_val AS prev_taxable_val, 
    prop_owner_entity_val.taxable_val - prev_prop_owner_entity_val.taxable_val
     AS gain_loss_taxable_val, 
    prop_owner_entity_val.assessed_val, 
    prev_prop_owner_entity_val.assessed_val AS prev_assessed_val,
     prop_owner_entity_val.assessed_val - prev_prop_owner_entity_val.assessed_val
     AS gain_loss_assessed_val, 
    prev_bill.bill_m_n_o + prev_bill.bill_i_n_s AS prev_tax_amt, 
    curr_bill.bill_m_n_o + curr_bill.bill_i_n_s AS curr_tax_amt, 
    curr_bill.bill_m_n_o + curr_bill.bill_i_n_s - prev_bill.bill_m_n_o +
     prev_bill.bill_i_n_s AS gain_loss_tax_amt
FROM bill curr_bill RIGHT OUTER JOIN
    prop_owner_entity_val prop_owner_entity_val INNER JOIN
    owner owner ON 
    prop_owner_entity_val.owner_id = owner.owner_id AND 
    prop_owner_entity_val.sup_yr = owner.owner_tax_yr AND 
    prop_owner_entity_val.prop_id = owner.prop_id AND 
    prop_owner_entity_val.sup_num = owner.sup_num INNER JOIN
    entity entity ON 
    prop_owner_entity_val.entity_id = entity.entity_id INNER JOIN
    property_val property_val ON 
    prop_owner_entity_val.prop_id = property_val.prop_id AND 
    prop_owner_entity_val.sup_yr = property_val.prop_val_yr AND 
    prop_owner_entity_val.sup_num = property_val.sup_num LEFT OUTER
     JOIN
    prop_owner_entity_val prev_prop_owner_entity_val ON 
    prop_owner_entity_val.entity_id = prev_prop_owner_entity_val.entity_id
     AND 
    property_val.prop_id = prev_prop_owner_entity_val.prop_id AND
     property_val.prop_val_yr = prev_prop_owner_entity_val.sup_yr
     AND 
    property_val.prev_sup_num = prev_prop_owner_entity_val.sup_num
     LEFT OUTER JOIN
    bill prev_bill ON 
    prev_prop_owner_entity_val.prop_id = prev_bill.prop_id AND 
    prev_prop_owner_entity_val.owner_id = prev_bill.owner_id AND
     prev_prop_owner_entity_val.entity_id = prev_bill.entity_id AND 
    prev_prop_owner_entity_val.sup_num = prev_bill.sup_num AND
     prev_prop_owner_entity_val.sup_yr = prev_bill.sup_tax_yr ON 
    curr_bill.prop_id = prop_owner_entity_val.prop_id AND 
    curr_bill.owner_id = prop_owner_entity_val.owner_id AND 
    curr_bill.sup_num = prop_owner_entity_val.sup_num AND 
    curr_bill.sup_tax_yr = prop_owner_entity_val.sup_yr AND 
    curr_bill.entity_id = prop_owner_entity_val.entity_id LEFT OUTER
     JOIN
    owner prev_owner ON 
    prev_prop_owner_entity_val.owner_id = prev_owner.owner_id AND
     prev_prop_owner_entity_val.sup_yr = prev_owner.owner_tax_yr
     AND 
    prev_prop_owner_entity_val.prop_id = prev_owner.prop_id AND
     prev_prop_owner_entity_val.sup_num = prev_owner.sup_num LEFT
     OUTER JOIN
    property_val prev_property_val ON 
    property_val.prop_id = prev_property_val.prop_id AND 
    property_val.prop_val_yr = prev_property_val.prop_val_yr AND 
    property_val.prev_sup_num = prev_property_val.sup_num

GO

