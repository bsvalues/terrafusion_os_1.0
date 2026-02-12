
create view __yard_count as
select distinct
sum_imprv_areas.prop_id ,
sum_imprv_areas.CovBalc+
sum_imprv_areas.CovDeck+
sum_imprv_areas.CovPatio+
sum_imprv_areas.deck+
sum_imprv_areas.EncPorch+
sum_imprv_areas.GAZEBO+
sum_imprv_areas.hobby_barn as yard_imprv
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
		CAST(SUM(GAZEBO) 	AS INT) 	as GAZEBO
FROM 
				(SELECT row_number() over (partition by prop_id order by "imprv_id" ASC) as "num", prop_id, imprv_id, imprv_det_id, 
					--CASE WHEN rtrim(imprv_det_desc)    = 'Main Area'	THEN imprv_det_area ELSE 0 END AS living_area, 
					CASE WHEN rtrim(imprv_det_type_cd) = 'CovBalc'		THEN 1 ELSE 0 END AS CovBalc, 
					CASE WHEN rtrim(imprv_det_type_cd) = 'CovDeck'		THEN 1 ELSE 0 END AS CovDeck,					
					CASE WHEN rtrim(imprv_det_type_cd) = 'CovPatio'		THEN 1 ELSE 0 END AS CovPatio, 
					CASE WHEN rtrim(imprv_det_type_cd) = 'Deck'			THEN 1 ELSE 0 END AS Deck,
					CASE WHEN rtrim(imprv_det_type_cd) = 'EncPorch'		THEN 1 ELSE 0 END AS EncPorch,
					CASE WHEN rtrim(imprv_det_type_cd) = 'hobby_barn'	THEN 1 ELSE 0 END AS hobby_barn,
					CASE WHEN rtrim(imprv_det_type_cd) = 'GAZEBO'		THEN 1 ELSE 0 END AS GAZEBO 
FROM pacs_oltp.dbo.imprv_detail 
	WHERE[prop_val_yr] = (select appr_yr from [pacs_oltp].[dbo].pacs_system)AND rtrim(imprv_det_type_cd) 
		IN ('CovBalc', 'CovDeck', 'CovPatio', 'Deck', 'EncPorch','hobby_barn','Gazebo'	)OR rtrim(imprv_det_desc) = 'Main Area') 
		as imprv_areas 
			GROUP BY prop_id, imprv_id)  
			
			
			as sum_imprv_areas 
			ON imprv_fix.prop_id = sum_imprv_areas.prop_id AND imprv_fix.imprv_id = sum_imprv_areas.imprv_id

left join 
		
		
		
		(SELECT row_number() over (partition by prop_id order by "imprv_id" ASC) as "num", 
		prop_id, imprv_id, imprv_det_id, 
		CASE WHEN rtrim(imprv_det_desc)		= 'CovBalc'			THEN '1'		ELSE 0 END			AS CovBalc, 		
		CASE WHEN rtrim(imprv_det_type_cd)	= 'CovDeck'			THEN '1'		ELSE 0 END			AS CovDeck, 
		CASE WHEN rtrim(imprv_det_type_cd)	= 'CovPatio'		THEN '1'		ELSE 0 END			AS CovPatio,		
		CASE WHEN rtrim(imprv_det_type_cd)	= 'Deck'			THEN '1'		ELSE 0 END			AS Deck, 
		CASE WHEN rtrim(imprv_det_type_cd)	= 'EncPorch'		THEN '1'		ELSE 0 END			AS EncPorch,
		CASE WHEN rtrim(imprv_det_type_cd)	= 'hobby_barn'		THEN '1'		ELSE 0 END			AS hobby_barn,
		CASE WHEN rtrim(imprv_det_type_cd)	= 'Gazebo'			THEN  '1'		ELSE 0 END			AS Gzaebo
	

			FROM [pacs_oltp].[dbo].imprv_detail 
				WHERE[prop_val_yr] = (select appr_yr from [pacs_oltp].[dbo].pacs_system)AND rtrim(imprv_det_type_cd) 
					IN ('CovBalc', 'CovDeck', 'CovPatio', 'Deck', 'EncPorch','hobby_barn','Gazebo'	) OR rtrim(imprv_det_desc) = 'Main Area'  
						GROUP BY prop_id, imprv_id  ,imprv_det_id,imprv_det_desc,imprv_det_area,imprv_detail.imprv_det_type_cd)
							
							as ia
							ON imprv_fix.prop_id = ia.prop_id AND imprv_fix.imprv_id = ia.imprv_id

GO

