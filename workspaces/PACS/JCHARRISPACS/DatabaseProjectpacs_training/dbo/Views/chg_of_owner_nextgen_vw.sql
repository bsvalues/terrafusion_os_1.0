
CREATE VIEW dbo.chg_of_owner_nextgen_vw
AS
SELECT     dbo.chg_of_owner.chg_of_owner_id, dbo.chg_of_owner_prop_assoc.prop_id, dbo.chg_of_owner_prop_assoc.seq_num, 
                      dbo.chg_of_owner_prop_assoc.sup_num, dbo.chg_of_owner_prop_assoc.sup_tax_yr, dbo.chg_of_owner.deed_type_cd, dbo.chg_of_owner.deed_num, 
                      dbo.chg_of_owner.deed_book_id, dbo.chg_of_owner.deed_book_page, dbo.chg_of_owner.deed_dt, dbo.chg_of_owner.coo_sl_dt, 
                      dbo.chg_of_owner.consideration, dbo.chg_of_owner.buyer_lttr_url, dbo.chg_of_owner.seller_lttr_url, dbo.chg_of_owner.buyer_lttr_prt_dt, 
                      dbo.chg_of_owner.seller_lttr_prt_dt, dbo.chg_of_owner.comment, chg_of_owner_first_buyer_vw.buyer_id, buyer_account.file_as_name AS buyer_file_as_name, 
                      dbo.chg_of_owner_first_seller_vw.seller_id, seller_account.file_as_name AS seller_file_as_name, dbo.chg_of_owner.grantor_cv, dbo.chg_of_owner.grantee_cv, 
                      dbo.sale.sl_type_cd, dbo.sale.adjusted_sl_price, dbo.sale.sl_price, dbo.sale.sl_ratio_type_cd, 
        seller_account.confidential_flag as seller_confidential_flag, buyer_account.confidential_flag as buyer_confidential_flag,
        chg_of_owner_first_buyer_vw.cnt as buyer_assoc_count, chg_of_owner_first_seller_vw.cnt as seller_assoc_count,
     dbo.chg_of_owner.excise_number
FROM  dbo.chg_of_owner 
INNER JOIN dbo.chg_of_owner_prop_assoc 
ON   dbo.chg_of_owner.chg_of_owner_id = dbo.chg_of_owner_prop_assoc.chg_of_owner_id 
LEFT OUTER JOIN chg_of_owner_first_buyer_vw
ON   chg_of_owner_first_buyer_vw.chg_of_owner_id = chg_of_owner.chg_of_owner_id
LEFT OUTER JOIN chg_of_owner_first_seller_vw
ON   chg_of_owner_first_seller_vw.chg_of_owner_id = chg_of_owner.chg_of_owner_id
AND  chg_of_owner_first_seller_vw.prop_id = chg_of_owner_prop_assoc.prop_id
LEFT OUTER JOIN dbo.sale 
ON   dbo.chg_of_owner.chg_of_owner_id = dbo.sale.chg_of_owner_id 
LEFT OUTER JOIN dbo.account buyer_account 
ON   chg_of_owner_first_buyer_vw.buyer_id = buyer_account.acct_id
LEFT OUTER JOIN dbo.account seller_account 
ON   chg_of_owner_first_seller_vw.seller_id = seller_account.acct_id

GO

