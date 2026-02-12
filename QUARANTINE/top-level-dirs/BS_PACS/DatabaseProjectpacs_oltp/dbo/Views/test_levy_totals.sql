




create view test_levy_totals
as
SELECT
    supp_yr_vw."type", supp_yr_vw."sup_yr", 
    entity."entity_id", entity."entity_type_cd",
    real_mobile_totals_vw."land_hstd_val", personal_total_vw."appraised_val" as t9,
    prop_total_vw."prop_count" as t2, prop_total_vw."ten_percent_cap", prop_total_vw."appraised_val",
    auto_total_vw."prop_count" as t3, auto_total_vw."appraised_val" as t10,
     levy_roll_total_vw."i_n_s_tax_pct", levy_roll_total_vw."prot_i_n_s_tax_pct", levy_roll_total_vw."mno_amt", levy_roll_total_vw."ins_amt", levy_roll_total_vw."prot_ins_amt", levy_roll_total_vw."total_amt",
    mineral_total_vw."prop_count", mineral_total_vw."appraised_val" as t11,
    freeze_totals."taxable_val", freeze_totals."assessed_val", freeze_totals."freeze_count", freeze_totals."freeze_ceiling", freeze_totals."frz_actual_tax", freeze_totals."frz_tax_rate",
    account."file_as_name"
FROM
    { oj ((((((((("levy_entity_yr_vw" supp_yr_vw INNER JOIN "entity" entity ON
        supp_yr_vw."entity_id" = entity."entity_id")
     LEFT OUTER JOIN "levy_personal_total_vw" personal_total_vw ON
        supp_yr_vw."entity_id" = personal_total_vw."entity_id" AND
    supp_yr_vw."sup_yr" = personal_total_vw."owner_tax_yr" AND
    supp_yr_vw."type" = personal_total_vw."type")
     LEFT OUTER JOIN "levy_prop_total_vw" prop_total_vw ON
        supp_yr_vw."entity_id" = prop_total_vw."entity_id" AND
    supp_yr_vw."sup_yr" = prop_total_vw."owner_tax_yr" AND
    supp_yr_vw."type" = prop_total_vw."type")
     LEFT OUTER JOIN "levy_auto_total_vw" auto_total_vw ON
        supp_yr_vw."entity_id" = auto_total_vw."entity_id" AND
    supp_yr_vw."sup_yr" = auto_total_vw."owner_tax_yr" AND
    supp_yr_vw."type" = auto_total_vw."type")
     LEFT OUTER JOIN "levy_real_mobile_totals_exmpt_vw" real_mobile_totals_exmpt_vw ON
        supp_yr_vw."entity_id" = real_mobile_totals_exmpt_vw."entity_id" AND
    supp_yr_vw."sup_yr" = real_mobile_totals_exmpt_vw."owner_tax_yr" AND
    supp_yr_vw."type" = real_mobile_totals_exmpt_vw."type")
     LEFT OUTER JOIN "levy_roll_total_vw" levy_roll_total_vw ON
        supp_yr_vw."sup_yr" = levy_roll_total_vw."sup_tax_yr" AND
    supp_yr_vw."entity_id" = levy_roll_total_vw."entity_id" AND
    supp_yr_vw."type" = levy_roll_total_vw."type")
     LEFT OUTER JOIN "levy_mineral_total_vw" mineral_total_vw ON
        supp_yr_vw."entity_id" = mineral_total_vw."entity_id" AND
    supp_yr_vw."sup_yr" = mineral_total_vw."owner_tax_yr" AND
    supp_yr_vw."type" = mineral_total_vw."type")
     LEFT OUTER JOIN "levy_freeze_totals_vw" freeze_totals ON
        supp_yr_vw."entity_id" = freeze_totals."entity_id" AND
    supp_yr_vw."sup_yr" = freeze_totals."owner_tax_yr" AND
    supp_yr_vw."type" = freeze_totals."type")
     LEFT OUTER JOIN "levy_real_mobile_totals_vw" real_mobile_totals_vw ON
        supp_yr_vw."entity_id" = real_mobile_totals_vw."entity_id" AND
    supp_yr_vw."sup_yr" = real_mobile_totals_vw."owner_tax_yr" AND
    supp_yr_vw."type" = real_mobile_totals_vw."type")
     INNER JOIN "account" account ON
        entity."entity_id" = account."acct_id"}
WHERE
    supp_yr_vw."type" = 'L' AND
    supp_yr_vw."sup_yr" = 1999. AND
    supp_yr_vw."entity_id" = 1

GO

