
CREATE VIEW dbo.curr_chg_of_owner_vw
AS
SELECT coo.deed_type_cd, coo.deed_num, 
    coo.deed_book_id, coo.deed_book_page, 
    coo.deed_dt, coo.coo_sl_dt, 
    coo.consideration, coo.ref_id1, 
    coo.comment, coo.seller_lttr_prt_dt, 
    coo.buyer_lttr_prt_dt, coo.seller_lttr_url, 
    coo.buyer_lttr_url, 
    coopa.prop_id, 
    coopa.seq_num, 
    psa.sup_num, 
    coopa.sup_tax_yr, 
    coopa.chg_of_owner_id
FROM chg_of_owner as coo
with (nolock)
JOIN chg_of_owner_prop_assoc as coopa
with (nolock)
ON coo.chg_of_owner_id = coopa.chg_of_owner_id
join prop_supp_assoc as psa
with (nolock)
on coopa.sup_tax_yr = psa.owner_tax_yr
and coopa.prop_id = psa.prop_id
WHERE coopa.seq_num = 0

GO

