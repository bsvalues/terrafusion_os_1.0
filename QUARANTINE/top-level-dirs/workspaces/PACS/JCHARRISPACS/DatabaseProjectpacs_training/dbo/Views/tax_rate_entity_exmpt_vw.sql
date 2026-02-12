
CREATE VIEW dbo.tax_rate_entity_exmpt_vw
AS
SELECT tax_rate.entity_id, tax_rate.tax_rate_yr, 
    tax_rate.discount_dt, tax_rate.late_dt, 
    tax_rate.attorney_fee_dt, tax_rate.bills_created_dt, 
    tax_rate.m_n_o_tax_pct, tax_rate.i_n_s_tax_pct, 
    tax_rate.prot_i_n_s_tax_pct, tax_rate.sales_tax_pct, 
    tax_rate.stmnt_dt, tax_rate.collect_for, tax_rate.appraise_for, 
    tax_rate.ready_to_certify, tax_rate.special_inv_entity, 
    tax_rate.ready_to_create_bill, tax_rate.PLUS_1_INT_PCT, 
    tax_rate.PLUS_1_PENALTY_PCT, tax_rate.PLUS_2_INT_PCT, 
    tax_rate.PLUS_2_PENALTY_PCT, 
    entity_exmpt.exmpt_type_cd, entity_exmpt.local_option_pct, 
    entity_exmpt.state_mandate_amt, 
    entity_exmpt.local_option_min_amt, 
    entity_exmpt.local_option_amt, 
    tax_rate.attorney_fee_pct
FROM tax_rate LEFT OUTER JOIN
    entity_exmpt ON 
    tax_rate.entity_id = entity_exmpt.entity_id AND 
    tax_rate.tax_rate_yr = entity_exmpt.exmpt_tax_yr

GO

