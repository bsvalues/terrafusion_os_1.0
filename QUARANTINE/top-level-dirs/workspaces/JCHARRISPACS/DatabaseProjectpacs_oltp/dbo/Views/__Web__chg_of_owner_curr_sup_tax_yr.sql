create view __Web__chg_of_owner_curr_sup_tax_yr as 
SELECT prop_id, seq_num, deed_dt, ISNULL(buyer_file_as_name, 
    grantee_cv) AS grantee, ISNULL(seller_file_as_name, 
    grantor_cv) AS grantor, deed_book_id AS volume, 
    deed_book_page AS page, deed_type_cd AS deed_type,
    sup_tax_yr
FROM chg_of_owner_vw
WHERE 

sup_tax_yr=(Select appr_yr from pacs_oltp.dbo.pacs_system)

GO

