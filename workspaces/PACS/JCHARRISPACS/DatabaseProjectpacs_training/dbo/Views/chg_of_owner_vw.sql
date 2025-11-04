
CREATE VIEW dbo.chg_of_owner_vw
AS
SELECT coo.chg_of_owner_id, coopa.prop_id, coopa.seq_num, 
                      psa.sup_num, coopa.sup_tax_yr, coo.deed_type_cd, coo.deed_num, 
                      coo.deed_book_id, coo.deed_book_page, coo.deed_dt, coo.coo_sl_dt, 
                      coo.consideration, coo.buyer_lttr_url, coo.seller_lttr_url, coo.buyer_lttr_prt_dt, 
                      coo.seller_lttr_prt_dt, coo.comment, ba.buyer_id, buyer_account.file_as_name AS buyer_file_as_name, 
                      sa.seller_id, seller_account.file_as_name AS seller_file_as_name, coo.grantor_cv, coo.grantee_cv, 
                      s.sl_type_cd, s.adjusted_sl_price, s.sl_price, s.sl_ratio_type_cd, seller_account.confidential_flag as seller_confidential_flag, buyer_account.confidential_flag as buyer_confidential_flag
FROM dbo.chg_of_owner as coo
with (nolock)
INNER JOIN chg_of_owner_prop_assoc as coopa
with (nolock)
on coo.chg_of_owner_id = coopa.chg_of_owner_id
join prop_supp_assoc as psa
with (nolock)
on coopa.sup_tax_yr = psa.owner_tax_yr
and coopa.prop_id = psa.prop_id
left outer join sale as s
with (nolock)
on coo.chg_of_owner_id = s.chg_of_owner_id
left outer join buyer_assoc as ba
with (nolock)
on coo.chg_of_owner_id = ba.chg_of_owner_id
left outer join seller_assoc as sa
with (nolock)
on coopa.chg_of_owner_id = sa.chg_of_owner_id
and coopa.prop_id = sa.prop_id
left outer join account as buyer_account
with (nolock)
on ba.buyer_id = buyer_account.acct_id
left outer join account as seller_account
with (nolock)
on sa.seller_id = seller_account.acct_id

GO

