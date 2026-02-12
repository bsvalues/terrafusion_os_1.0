create view __landSizeAcres as

SELECT  distinct id.prop_id,

--x,y,XCoord,YCoord,Shape,sp.order_id as id,
 --min (CASE WHEN ia.order_id = 1 THEN  ia.land_seg_id ELSE NULL END) ac_1  , 
min	(CASE	WHEN	ia.order_id	=	1	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	1	 '	,
min	(CASE	WHEN	ia.order_id	=	2	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	2	 '	,
min	(CASE	WHEN	ia.order_id	=	3	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	3	 '	,
min	(CASE	WHEN	ia.order_id	=	4	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	4	 '	,
min	(CASE	WHEN	ia.order_id	=	5	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	5	 '	,
min	(CASE	WHEN	ia.order_id	=	6	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	6	 '	,
min	(CASE	WHEN	ia.order_id	=	7	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	7	 '	,
min	(CASE	WHEN	ia.order_id	=	8	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	8	 '	,
min	(CASE	WHEN	ia.order_id	=	9	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	9	 '	,
min	(CASE	WHEN	ia.order_id	=	10	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	10	 '	,
min	(CASE	WHEN	ia.order_id	=	11	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	11	 '	,
min	(CASE	WHEN	ia.order_id	=	12	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	12	 '	,
min	(CASE	WHEN	ia.order_id	=	13	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	13	 '	,
min	(CASE	WHEN	ia.order_id	=	14	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	14	 '	,
min	(CASE	WHEN	ia.order_id	=	15	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	15	 '	,
min	(CASE	WHEN	ia.order_id	=	16	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	16	 '	,
min	(CASE	WHEN	ia.order_id	=	17	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	17	 '	,
min	(CASE	WHEN	ia.order_id	=	18	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	18	 '	,
min	(CASE	WHEN	ia.order_id	=	19	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	19	 '	,
min	(CASE	WHEN	ia.order_id	=	20	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	20	 '	,
min	(CASE	WHEN	ia.order_id	=	21	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	21	 '	,
min	(CASE	WHEN	ia.order_id	=	22	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	22	 '	,
min	(CASE	WHEN	ia.order_id	=	23	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	23	 '	,
min	(CASE	WHEN	ia.order_id	=	24	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	24	 '	,
min	(CASE	WHEN	ia.order_id	=	25	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	25	 '	,
min	(CASE	WHEN	ia.order_id	=	26	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	26	 '	,
min	(CASE	WHEN	ia.order_id	=	27	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	27	 '	,
min	(CASE	WHEN	ia.order_id	=	28	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	28	 '	,
min	(CASE	WHEN	ia.order_id	=	29	THEN	ia.size_acres	ELSE	NULL	END)	 '	SizeAcres	29	 '	

 FROM           pacs_oltp.dbo.land_detail  id 
  
  
  INNER JOIN
                         pacs_oltp.dbo.land_detail ON id.prop_val_yr = land_detail.prop_val_yr AND id.sup_num = land_detail.sup_num AND id.sale_id = land_detail.sale_id AND id.prop_id = land_detail.prop_id AND 
                         id.land_seg_id = land_detail.land_seg_id
						 left join 
						 pacs_oltp.dbo.property_val pv on pv.prop_id=id.prop_id and pv.prop_val_yr=id.prop_val_yr and pv.sup_num=id.sup_num  

  inner join 

(
SELECT distinct  id.prop_id,
ROW_NUMBER() over (partition by id.prop_id ORDER BY id.land_seg_id)AS order_id,
Sum(case when   id.size_acres IS not null	
	then	(id.size_acres)	else	null	end) as	size_acres 
	 
	
 FROM           pacs_oltp.dbo.land_detail id 
  inner join
                         pacs_oltp.dbo.land_detail ON id.prop_val_yr = land_detail.prop_val_yr 
						 AND id.sup_num = land_detail.sup_num AND id.sale_id = land_detail.sale_id 
						 AND id.prop_id = land_detail.prop_id AND 
                         id.land_seg_id = land_detail.land_seg_id
						 left join 
						 pacs_oltp.dbo.property_val pv on pv.prop_id=id.prop_id and pv.prop_val_yr=id.prop_val_yr and pv.sup_num=id.sup_num 

where 
id.prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)
and id.sale_id=0
--and imprv.imprv_type_cd='permc'
--and id.imprv_det_meth_cd not like 'irr'
--and id.imprv_det_meth_cd not like 'trl'
--and id.prop_id=26521
--and imprv_det_type_cd like'AG-HAYSTOR '
--and imprv_det_type_cd like '%V16-Merlot'
--and permanent_crop_acres is not null 


group by 
id.prop_id,id.land_seg_id,id.size_acres,pacs_oltp.dbo.land_detail.land_soil_code
) as ia on ia.prop_id=id.prop_id

group by id.prop_id,pacs_oltp.dbo.land_detail.land_soil_code

GO

