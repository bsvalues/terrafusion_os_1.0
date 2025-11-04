




CREATE procedure TransferDelqRemoveNulls
as 
update transfer_delq_tax set geo_id = ' ' where geo_id is null
update transfer_delq_tax set owner_id = ' ' where owner_id is null
update transfer_delq_tax set owner_name = ' ' where owner_name is null
update transfer_delq_tax set addr_line1 = ' ' where addr_line1 is null
update transfer_delq_tax set addr_line2 = ' ' where addr_line2 is null
update transfer_delq_tax set addr_line3 = ' ' where addr_line3 is null
update transfer_delq_tax set addr_city = ' ' where addr_city is null
update transfer_delq_tax set addr_state = ' ' where addr_state is null
update transfer_delq_tax set addr_zip   = ' ' where addr_zip is null
update transfer_delq_tax set addr_country_cd = ' ' where addr_country_cd is null
update transfer_delq_tax set addr_deliverable = ' ' where addr_deliverable is null
update transfer_delq_tax set legal_desc = ' ' where legal_desc is null
update transfer_delq_tax set freeze_yr = ' ' where freeze_yr is null
update transfer_delq_tax set freeze_ceiling = ' '  where freeze_ceiling is null
update transfer_delq_tax set bill_id = 0 where bill_id is null
update transfer_delq_tax set entity_id = 0 where entity_id is null
update transfer_delq_tax set entity_cd = ' ' where entity_cd is null
update transfer_delq_tax set entity_tax_yr = ' ' where entity_tax_yr is null
update transfer_delq_tax set stmnt_id = 0 where stmnt_id is null
update transfer_delq_tax set assessed_val = 0 where assessed_val is null
update transfer_delq_tax set taxable_val = 0 where assessed_val is null
update transfer_delq_tax set effective_due_dt = ' ' where effective_due_dt is null
update transfer_delq_tax set base_mno = 0 where base_mno is null
update transfer_delq_tax set base_ins = 0 where base_ins is null
update transfer_delq_tax set base_mno_due = 0 where base_mno_due is null
update transfer_delq_tax set base_ins_due = 0 where base_ins_due is null
update transfer_delq_tax set adjustment_code = ' ' where adjustment_code is null
update transfer_delq_tax set suit_num = ' ' where suit_num is null
update transfer_delq_tax set bankruptcy_num = ' ' where bankruptcy_num is null
update transfer_delq_tax set judgement_date = ' ' where judgement_date is null
update transfer_delq_tax set judge_from_yr = ' ' where judge_from_yr is null
update transfer_delq_tax set judge_to_yr = ' ' where judge_to_yr is null
update transfer_delq_tax set mortgage_lender = ' ' where mortgage_lender is null
update transfer_delq_tax set mortgage_acct_no = ' ' where mortgage_acct_no is null
update transfer_delq_tax set deferral_begin = ' ' where deferral_begin is null
update transfer_delq_tax set deferral_end = ' ' where deferral_end is null
update transfer_delq_tax set mh_lein_date = ' ' where mh_lein_date is null
update transfer_delq_tax set mh_release_date = ' ' where mh_release_date is null

/* one more final kludge to add */
update transfer_delq_tax set legal_desc = replace(legal_desc, '
', '') where legal_desc like '%
%'

GO

