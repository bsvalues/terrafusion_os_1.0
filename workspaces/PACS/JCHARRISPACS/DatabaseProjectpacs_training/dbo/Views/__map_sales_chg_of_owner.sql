create view  __map_sales_chg_of_owner as

SELECT DISTINCT chg_of_owner_prop_assoc.prop_id, 
RTRIM(COALESCE(chg_of_owner.deed_book_page, ''))						AS deed_book_page, 
RTRIM(COALESCE(chg_of_owner.deed_num, ''))								AS deed_num, 
RTRIM(COALESCE(chg_of_owner.deed_book_id, ''))							AS deed_book_id,
RTRIM(COALESCE(chg_of_owner.grantor_cv, '')) 							AS grantor_cv, 
RTRIM(COALESCE(chg_of_owner.deed_type_cd, ''))							AS deed_type_cd, 
coalesce([sl_price], 0)													AS sl_price,
[sl_dt], 
RTRIM(COALESCE(sl_ratio_type_cd, '' )) 						AS sl_ratio_type_cd,
YEAR(sl_dt)															AS sl_year,
RTRIM(COALESCE(deed_history.grantee, '')) 								AS grantee, 											
deed_history.excise_number
FROM [pacs_oltp].[dbo].[sale]
LEFT JOIN 
chg_of_owner 
ON 
sale.chg_of_owner_id = chg_of_owner.chg_of_owner_id
LEFT JOIN 
chg_of_owner_prop_assoc 
ON 
sale.chg_of_owner_id =chg_of_owner_prop_assoc.chg_of_owner_id 
LEFT JOIN 
web_internet_benton.dbo._clientdb_deed_history_detail				as deed_history 
ON 
sale.chg_of_owner_id = deed_history.chg_of_owner_id 
WHERE
NOT chg_of_owner_prop_assoc.prop_id IS NULL AND NOT SL_DT IS null

GO

