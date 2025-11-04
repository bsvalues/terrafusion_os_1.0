CREATE VIEW [CO\ANTHONYV].Viewwwwwwwww
AS

SELECT TOP 0        coopa.prop_id, coopa.seq_num, coopa.chg_of_owner_id, CASE ISNULL(s.sl_dt, '') WHEN '' THEN '' ELSE CONVERT(varchar(10), s.sl_dt, 101) END AS sale_dt, ISNULL(s.sl_price, - 1) AS sale_price, ISNULL(s.sl_type_cd, '') AS type, 
                         ISNULL(s.sl_ratio_type_cd, '') AS ratio_cd, ISNULL(s.sl_financing_cd, '') AS fin_cd, ISNULL(s.finance_yrs, - 1) AS fin_term, ISNULL(s.sl_living_area, - 1) AS la_sqft, ISNULL(a.file_as_name, '') AS grantor, 
                         ISNULL(a.confidential_file_as_name, '') AS C_Name, ISNULL(coo.consideration, '') AS consid, ISNULL(coo.deed_type_cd, '') AS deed, ISNULL(coo.deed_book_id, '') AS book_id, ISNULL(coo.deed_book_page, '') AS deed_page, 
                         ISNULL(a.first_name, '') AS Fname, ISNULL(a.last_name, '') AS Lname, s.sl_type_cd, s.sl_dt, s.sl_yr_blt, s.sl_living_area, s.sl_imprv_unit_price
FROM            dbo.chg_of_owner_prop_assoc AS coopa WITH (NOLOCK) INNER JOIN
                         dbo.chg_of_owner AS coo WITH (NOLOCK) ON coopa.chg_of_owner_id = coo.chg_of_owner_id LEFT OUTER JOIN
                         dbo.seller_assoc AS sa WITH (NOLOCK) ON coopa.chg_of_owner_id = sa.chg_of_owner_id AND coopa.prop_id = sa.prop_id LEFT OUTER JOIN
                         dbo.account AS a WITH (NOLOCK) ON sa.seller_id = a.acct_id LEFT OUTER JOIN
                         dbo.sale AS s WITH (NOLOCK) ON coopa.chg_of_owner_id = s.chg_of_owner_id
order by 1

GO

