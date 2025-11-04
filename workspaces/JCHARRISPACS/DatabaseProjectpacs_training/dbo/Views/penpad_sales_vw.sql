

CREATE view penpad_sales_vw

as
	

SELECT 	coopa.prop_id, coopa.chg_of_owner_id, CASE ISNULL(s.sl_dt, '')
			WHEN '' THEN ''
			ELSE CONVERT(varchar(10), s.sl_dt, 101)
			END as sale_dt,

			ISNULL(s.sl_price,-1) as sale_price,
			ISNULL(s.sl_type_cd,'') as type,
			ISNULL(s.sl_ratio_type_cd,'') as ratio_cd,
			ISNULL(s.sl_financing_cd,'') as fin_cd,
			ISNULL(s.finance_yrs,-1) as fin_term,
			ISNULL(s.sl_living_area,-1) as la_sqft,
			ISNULL(a.file_as_name,'') as grantor,
			ISNULL(coo.consideration,'') as consid,
			ISNULL(coo.deed_type_cd,'') as deed,
			ISNULL(coo.deed_book_id,'') as book_id,
			ISNULL(coo.deed_book_page,'') as deed_page

			FROM chg_of_owner_prop_assoc as coopa
			WITH (NOLOCK)
			
			INNER JOIN chg_of_owner as coo
			WITH (NOLOCK)
			ON coopa.chg_of_owner_id = coo.chg_of_owner_id
			
			LEFT OUTER JOIN seller_assoc as sa
			WITH (NOLOCK)
			ON coopa.chg_of_owner_id = sa.chg_of_owner_id
			AND coopa.prop_id = sa.prop_id
			
			LEFT OUTER JOIN account as a
			WITH (NOLOCK)
			ON sa.seller_id = a.acct_id
			
			LEFT OUTER JOIN sale as s
			WITH (NOLOCK)
			ON coopa.chg_of_owner_id = s.chg_of_owner_id

GO

