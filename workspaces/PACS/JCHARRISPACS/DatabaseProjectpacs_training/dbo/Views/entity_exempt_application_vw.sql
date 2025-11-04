





CREATE  VIEW dbo.entity_exempt_application_vw
AS
SELECT tax_rate.entity_id, tax_rate.tax_rate_yr, 
    entity_exempt_ov65_vw.exmpt_type_cd AS ov65_exmpt_type_cd,
     entity_exempt_ov65_vw.exmpt_tax_yr AS ov65_exmpt_tax_yr,
     entity_exempt_ov65_vw.local_option_pct AS ov65_local_option_pct,
     entity_exempt_ov65_vw.state_mandate_amt AS ov65_state_mandate_amt,
     entity_exempt_ov65_vw.local_option_min_amt AS ov65_local_option_min_amt,
     entity_exempt_ov65_vw.local_option_amt AS ov65_local_option_amt,
     entity_exempt_dp_vw.exmpt_type_cd AS dp_exmpt_type_cd,
     entity_exempt_dp_vw.exmpt_tax_yr AS dp_exmpt_tax_yr,
     entity_exempt_dp_vw.local_option_pct AS dp_local_option_pct,
     entity_exempt_dp_vw.state_mandate_amt AS dp_state_mandate_amt,
     entity_exempt_dp_vw.local_option_min_amt AS dp_local_option_min_amt,
     entity_exempt_dp_vw.local_option_amt AS dp_local_option_amt,
     entity_exempt_hs_vw.exmpt_type_cd AS hs_exmpt_type_cd,
     entity_exempt_hs_vw.exmpt_tax_yr AS hs_exmpt_type_yr,
     entity_exempt_hs_vw.local_option_pct AS hs_local_option_pct,
     entity_exempt_hs_vw.state_mandate_amt AS hs_state_mandate_amt,
     entity_exempt_hs_vw.local_option_min_amt AS hs_local_option_min_amt,
     entity_exempt_hs_vw.local_option_amt AS hs_local_option_amt,
     case when entity_exempt_hs_vw.exmpt_type_cd = 'HS' and isnull(entity_exempt_hs_vw.state_mandate_amt, 0) <> 0 then 'T' else 'F' end as chk_1,
     case when entity_exempt_hs_vw.exmpt_type_cd = 'HS' and ((isnull(entity_exempt_hs_vw.local_option_amt, 0) <> 0) or (isnull(entity_exempt_hs_vw.local_option_pct, 0) <> 0)) then 'T' else 'F' end as chk_2,
     case when entity_exempt_ov65_vw.exmpt_type_cd in ('OV65', 'OV65S') and isnull(entity_exempt_ov65_vw.state_mandate_amt, 0) <> 0 then 'T' else 'F' end as chk_3,
     case when entity_exempt_ov65_vw.exmpt_type_cd in ('OV65', 'OV65S') and ((isnull(entity_exempt_ov65_vw.local_option_amt, 0) <> 0) or (isnull(entity_exempt_ov65_vw.local_option_pct, 0) <> 0)) then 'T' else 'F' end as chk_4,
     case when entity_exempt_dp_vw.exmpt_type_cd = 'DP' and isnull(entity_exempt_dp_vw.state_mandate_amt, 0) <> 0 then 'T' else 'F' end as chk_5
FROM entity_exempt_dp_vw RIGHT OUTER JOIN
    tax_rate ON 
    entity_exempt_dp_vw.entity_id = tax_rate.entity_id AND 
    entity_exempt_dp_vw.exmpt_tax_yr = tax_rate.tax_rate_yr
     LEFT OUTER JOIN
    entity_exempt_hs_vw ON 
    tax_rate.entity_id = entity_exempt_hs_vw.entity_id AND 
    tax_rate.tax_rate_yr = entity_exempt_hs_vw.exmpt_tax_yr
     LEFT OUTER JOIN
    entity_exempt_ov65_vw ON 
    tax_rate.entity_id = entity_exempt_ov65_vw.entity_id AND
     tax_rate.tax_rate_yr = entity_exempt_ov65_vw.exmpt_tax_yr

where tax_rate.appraise_for = 'T'

GO

