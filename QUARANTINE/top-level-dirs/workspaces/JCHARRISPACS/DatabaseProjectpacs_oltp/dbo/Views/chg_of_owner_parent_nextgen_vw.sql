
CREATE VIEW dbo.chg_of_owner_parent_nextgen_vw
AS
SELECT  dbo.chg_of_owner.chg_of_owner_id, 
 dbo.chg_of_owner_prop_assoc.prop_id, 
 dbo.chg_of_owner_prop_assoc.seq_num, 
 child.sup_num, 
 dbo.chg_of_owner_prop_assoc.sup_tax_yr, 
 dbo.chg_of_owner.deed_type_cd, 
 dbo.chg_of_owner.deed_num, 
 dbo.chg_of_owner.deed_book_id, 
 dbo.chg_of_owner.deed_book_page, 
 dbo.chg_of_owner.deed_dt, 
 dbo.chg_of_owner.coo_sl_dt, 
 dbo.chg_of_owner.consideration, 
 dbo.chg_of_owner.buyer_lttr_url, 
 dbo.chg_of_owner.seller_lttr_url, 
 dbo.chg_of_owner.buyer_lttr_prt_dt, 
 dbo.chg_of_owner.seller_lttr_prt_dt, 
 dbo.chg_of_owner.comment, 
 dbo.chg_of_owner_first_buyer_vw.buyer_id, 
 buyer_account.file_as_name AS buyer_file_as_name, 
 dbo.chg_of_owner_first_seller_vw.seller_id, 
 seller_account.file_as_name AS seller_file_as_name, 
 dbo.chg_of_owner.grantor_cv, dbo.chg_of_owner.grantee_cv, 
 dbo.sale.sl_type_cd, 
 dbo.sale.adjusted_sl_price, 
 dbo.sale.sl_price, 
 dbo.sale.sl_ratio_type_cd, 
 seller_account.confidential_flag as seller_confidential_flag, 
 buyer_account.confidential_flag as buyer_confidential_flag,
 parent.prop_id as parent_prop_id,
 parent.sup_num as parent_sup_num,
 parent.prop_val_yr as parent_prop_val_yr,
        dbo.chg_of_owner_first_buyer_vw.cnt as buyer_assoc_count, 
 dbo.chg_of_owner_first_seller_vw.cnt as seller_assoc_count,
 dbo.chg_of_owner.excise_number
FROM    dbo.property_val AS parent
 JOIN dbo.property_val AS child ON
  (IsNull(parent.udi_parent, '') = 'T' OR IsNull(parent.udi_parent, '') = 'D') AND
  child.udi_parent_prop_id = parent.prop_id AND
  child.sup_num = parent.sup_num AND
  child.prop_val_yr = parent.prop_val_yr
 JOIN dbo.chg_of_owner_prop_assoc ON 
  child.prop_id = dbo.chg_of_owner_prop_assoc.prop_id
 JOIN dbo.chg_of_owner ON
  dbo.chg_of_owner.chg_of_owner_id = dbo.chg_of_owner_prop_assoc.chg_of_owner_id
 LEFT OUTER JOIN dbo.sale ON 
  dbo.chg_of_owner.chg_of_owner_id = dbo.sale.chg_of_owner_id 
 LEFT OUTER JOIN dbo.chg_of_owner_first_buyer_vw ON   
  dbo.chg_of_owner_first_buyer_vw.chg_of_owner_id = chg_of_owner.chg_of_owner_id
 LEFT OUTER JOIN dbo.chg_of_owner_first_seller_vw ON
   dbo.chg_of_owner_first_seller_vw.chg_of_owner_id = chg_of_owner_prop_assoc.chg_of_owner_id AND
  dbo.chg_of_owner_first_seller_vw.prop_id = chg_of_owner_prop_assoc.prop_id
 LEFT OUTER JOIN dbo.account buyer_account ON 
  dbo.chg_of_owner_first_buyer_vw.buyer_id = buyer_account.acct_id 
 LEFT OUTER JOIN dbo.account seller_account ON 
  dbo.chg_of_owner_first_seller_vw.seller_id = seller_account.acct_id

GO

