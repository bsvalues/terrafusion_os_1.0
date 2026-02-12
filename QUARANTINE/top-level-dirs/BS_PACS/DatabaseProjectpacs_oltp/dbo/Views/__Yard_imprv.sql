create view __Yard_imprv as

select distinct
sum_imprv_areas.prop_id ,
sum_imprv_areas.CovBalc,
sum_imprv_areas.CovDeck,
sum_imprv_areas.CovPatio,
sum_imprv_areas.deck,
sum_imprv_areas.EncPorch,
sum_imprv_areas.GAZEBO,
sum_imprv_areas.Pool,
sum_imprv_areas.Hobby_barn 
from
	property 			
left join
	( SELECT *, ROW_NUMBER() OVER (PARTITION BY prop_id ORDER BY imprv_val DESC) AS row_id 
		FROM [pacs_oltp].[dbo].imprv 
			WHERE [pacs_oltp].[dbo].imprv.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system) and sale_id=0 ) 
			as imprv_fix 
				ON property.prop_id = imprv_fix.prop_id AND imprv_fix.row_id = 1 AND imprv_fix.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system)

left join
	(SELECT prop_id, imprv_id,
		CAST(SUM(CovBalc) 	AS INT) 	as CovBalc, 
		CAST(SUM(CovDeck) 	AS INT)		as CovDeck,
		CAST(SUM(CovPatio) 	AS INT) 	as CovPatio, 
		CAST(SUM(Deck) 		AS INT) 	as deck,
		CAST(SUM(EncPorch) 	AS INT) 	as EncPorch,
		CAST(SUM(hobby_barn)AS INT) 	as hobby_barn,
		CAST(SUM(GAZEBO) 	AS INT) 	as GAZEBO,
		CAST(SUM(pool) 	AS INT) 	as pool
FROM 
				(SELECT row_number() over (partition by prop_id order by "imprv_id" ASC) as "num", prop_id, imprv_id, imprv_det_id,[imprv_det_val] ,
					--CASE WHEN rtrim(imprv_det_desc)    = 'Main Area'	THEN imprv_det_area ELSE 0 END AS living_area, 
					CASE WHEN rtrim(imprv_det_type_cd) = 'CovBalc'		THEN [imprv_det_val] ELSE 0 END AS CovBalc, 
					CASE WHEN rtrim(imprv_det_type_cd) = 'CovDeck'		THEN [imprv_det_val] ELSE 0 END AS CovDeck,					
					CASE WHEN rtrim(imprv_det_type_cd) = 'CovPatio'		THEN [imprv_det_val] ELSE 0 END AS CovPatio, 
					CASE WHEN rtrim(imprv_det_type_cd) = 'Deck'			THEN [imprv_det_val] ELSE 0 END AS Deck,
					CASE WHEN rtrim(imprv_det_type_cd) = 'EncPorch'		THEN [imprv_det_val] ELSE 0 END AS EncPorch,
					CASE WHEN rtrim(imprv_det_type_cd) = 'hobby_barn'	THEN [imprv_det_val] ELSE 0 END AS hobby_barn,
					CASE WHEN rtrim(imprv_det_type_cd) = 'GAZEBO'		THEN [imprv_det_val] ELSE 0 END AS GAZEBO ,
					CASE WHEN rtrim(imprv_det_type_cd) = 'Pool'		THEN [imprv_det_val] ELSE 0 END AS Pool 

FROM pacs_oltp.dbo.imprv_detail 
	WHERE[prop_val_yr] = (select appr_yr from [pacs_oltp].[dbo].pacs_system)AND rtrim(imprv_det_type_cd) 
		IN ('CovBalc', 'CovDeck', 'CovPatio', 'Deck', 'EncPorch','hobby_barn','Gazebo', 'pool'	)OR rtrim(imprv_det_desc) = 'Main Area') 
		as imprv_areas 
			GROUP BY prop_id, imprv_id,[imprv_det_val])  
			
			
			as sum_imprv_areas 
			ON imprv_fix.prop_id = sum_imprv_areas.prop_id AND imprv_fix.imprv_id = sum_imprv_areas.imprv_id

left join 
		
		
		
		(SELECT row_number() over (partition by prop_id order by "imprv_id" ASC) as "num", 
		prop_id, imprv_id, imprv_det_id, 
		CASE WHEN rtrim(imprv_det_desc)		= 'CovBalc'			THEN [imprv_det_val]		ELSE 0 END			AS CovBalc, 		
		CASE WHEN rtrim(imprv_det_type_cd)	= 'CovDeck'			THEN [imprv_det_val]		ELSE 0 END			AS CovDeck, 
		CASE WHEN rtrim(imprv_det_type_cd)	= 'CovPatio'		THEN [imprv_det_val]		ELSE 0 END			AS CovPatio,		
		CASE WHEN rtrim(imprv_det_type_cd)	= 'Deck'			THEN [imprv_det_val]		ELSE 0 END			AS Deck, 
		CASE WHEN rtrim(imprv_det_type_cd)	= 'EncPorch'		THEN [imprv_det_val]		ELSE 0 END			AS EncPorch,
		CASE WHEN rtrim(imprv_det_type_cd)	= 'hobby_barn'		THEN [imprv_det_val]		ELSE 0 END			AS hobby_barn,
		CASE WHEN rtrim(imprv_det_type_cd)	= 'Gazebo'			THEN [imprv_det_val]		ELSE 0 END			AS Gzaebo,
		CASE WHEN rtrim(imprv_det_type_cd)	= 'pool'			THEN [imprv_det_val]		ELSE 0 END			AS pool
	

			FROM [pacs_oltp].[dbo].imprv_detail 
				WHERE[prop_val_yr] = (select appr_yr from [pacs_oltp].[dbo].pacs_system)AND rtrim(imprv_det_type_cd) 
					IN ('CovBalc', 'CovDeck', 'CovPatio', 'Deck', 'EncPorch','hobby_barn','Gazebo','pool'	) OR rtrim(imprv_det_desc) = 'Main Area'  
						GROUP BY prop_id, imprv_id  ,imprv_det_id,imprv_det_desc,imprv_det_area,imprv_detail.imprv_det_type_cd,[imprv_det_val])
							
							as ia
							ON imprv_fix.prop_id = ia.prop_id AND imprv_fix.imprv_id = ia.imprv_id

GO

