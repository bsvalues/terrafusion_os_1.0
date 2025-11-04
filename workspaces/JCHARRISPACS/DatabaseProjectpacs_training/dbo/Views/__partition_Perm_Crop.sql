create view __partition_Perm_Crop as 


 
					

SELECT 
imprv_detail.prop_id,
order_id,
sum(case when imprv_detail.imprv_det_type_cd=	 'C01-Bing '	then	(permanent_crop_acres )	else	null	end) as		 'C01-Bing 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'C02-Rainie '	then	(permanent_crop_acres )	else	null	end) as		 'C02-Rainie 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'C04-Chelan '	then	(permanent_crop_acres )	else	null	end) as		 'C04-Chelan 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O01-Apples '	then	(permanent_crop_acres )	else	null	end) as		 'O01-Apples 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O02-Cherri '	then	(permanent_crop_acres )	else	null	end) as		 'O02-Cherri 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O03-Pears '	then	(permanent_crop_acres )	else	null	end) as		 'O03-Pears 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O04-Peache '	then	(permanent_crop_acres )	else	null	end) as		 'O04-Peache 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O05-Nectar '	then	(permanent_crop_acres )	else	null	end) as		 'O05-Nectar 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O06-Aprico '	then	(permanent_crop_acres )	else	null	end) as		 'O06-Aprico 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O07-Plums '	then	(permanent_crop_acres )	else	null	end) as		 'O07-Plums	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O08-Prunes '	then	(permanent_crop_acres )	else	null	end) as		 'O08-Prunes 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O09-Nuts '	then	(permanent_crop_acres )	else	null	end) as		 'O09-Nuts	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O10-Gala'	then	(permanent_crop_acres )	else	null	end) as		 'O10-Gala	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O11-Fuji '	then	(permanent_crop_acres )	else	null	end) as		 'O11-Fuji	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O12-Braebu '	then	(permanent_crop_acres )	else	null	end) as		 'O12-Braebu 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O14-Red Ch '	then	(permanent_crop_acres )	else	null	end) as		 'O14-Red Ch	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O17-Oregon '	then	(permanent_crop_acres )	else	null	end) as		 'O17-Oregon	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O18-Scarle '	then	(permanent_crop_acres )	else	null	end) as		 'O18-Scarle 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O20-Cameo '	then	(permanent_crop_acres )	else	null	end) as		 'O20-Cameo 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O21-Spur R '	then	(permanent_crop_acres )	else	null	end) as		 'O21-Spur R 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O22-Golden '	then	(permanent_crop_acres )	else	null	end) as		 'O22-Golden 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O24-Granny '	then	(permanent_crop_acres )	else	null	end) as		 'O24-Granny 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O25-Jonago '	then	(permanent_crop_acres )	else	null	end) as		 'O25-Jonago 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O27-Washin '	then	(permanent_crop_acres )	else	null	end) as		 'O27-Washin 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O31-Winesa '	then	(permanent_crop_acres )	else	null	end) as		 'O31-Winesa 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O32-Rome '	then	(permanent_crop_acres )	else	null	end) as		 'O32-Rome	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O34-Bisbee '	then	(permanent_crop_acres )	else	null	end) as		 'O34-Bisbee 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 '35-Top Re'	then	(permanent_crop_acres )	else	null	end) as		 '35-Top Re	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O36-Red De'	then	(permanent_crop_acres )	else	null	end) as		 'O36-Red De	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O39-Pink L '	then	(permanent_crop_acres )	else	null	end) as		 'O39-Pink L 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O40-Gala B '	then	(permanent_crop_acres )	else	null	end) as		 'O40-Gala B 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O41-Gala B '	then	(permanent_crop_acres )	else	null	end) as		 'O41-Gala B 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O42-Gala B '	then	(permanent_crop_acres )	else	null	end) as		 'O42-Gala B 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O44-Gala C '	then	(permanent_crop_acres )	else	null	end) as		 'O44-Gala C 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O45-Gala G '	then	(permanent_crop_acres )	else	null	end) as		 'O45-Gala G 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O46-Gala G '	then	(permanent_crop_acres )	else	null	end) as		 'O46-Gala G 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O47-Gala G '	then	(permanent_crop_acres )	else	null	end) as		 'O47-Gala G 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O48-Gala I '	then	(permanent_crop_acres )	else	null	end) as		 'O48-Gala I 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O49-Gala P '	then	(permanent_crop_acres )	else	null	end) as		 'O49-Gala P 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O50-Gala S '	then	(permanent_crop_acres )	else	null	end) as		 'O50-Gala S 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O53-Gala R '	then	(permanent_crop_acres )	else	null	end) as		 'O53-Gala R 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O54-Gala U '	then	(permanent_crop_acres )	else	null	end) as		 'O54-Gala U 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O56-Fuji N '	then	(permanent_crop_acres )	else	null	end) as		 'O56-Fuji N 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O57-Fuji T '	then	(permanent_crop_acres )	else	null	end) as		 'O57-Fuji T 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O58-Fuji R '	then	(permanent_crop_acres )	else	null	end) as		 'O58-Fuji R 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O59-Fuji R '	then	(permanent_crop_acres )	else	null	end) as		 'O59-Fuji R 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O61-Fuji S '	then	(permanent_crop_acres )	else	null	end) as		 'O61-Fuji S 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O62-Fuji R '	then	(permanent_crop_acres )	else	null	end) as		 'O62-Fuji R 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O63-Braebu '	then	(permanent_crop_acres )	else	null	end) as		 'O63-Braebu 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O65-Braebu '	then	(permanent_crop_acres )	else	null	end) as		 'O65-Braebu 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O66-Braebu'	then	(permanent_crop_acres )	else	null	end) as		 'O66-Braebu	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O70-Pacifi '	then	(permanent_crop_acres )	else	null	end) as		 'O70-Pacifi 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O75-Earlig '	then	(permanent_crop_acres )	else	null	end) as		 'O75-Earlig	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O83-Ginger '	then	(permanent_crop_acres )	else	null	end) as		 'O83-Ginger	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O84-Golden '	then	(permanent_crop_acres )	else	null	end) as		 'O84-Golden 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O87-Red Va '	then	(permanent_crop_acres )	else	null	end) as		 'O87-Red Va 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'O89-Honeyc '	then	(permanent_crop_acres )	else	null	end) as		 'O89-Honeyc 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V01-Wine G '	then	(permanent_crop_acres )	else	null	end) as		 'V01-Wine G 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V02-Juice '	then	(permanent_crop_acres )	else	null	end) as		 'V02-Juice 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V03-Aspara '	then	(permanent_crop_acres )	else	null	end) as		 'V03-Aspara 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V04-Hops '	then	(permanent_crop_acres )	else	null	end) as		 'V04-Hops 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V05-Red Cu '	then	(permanent_crop_acres )	else	null	end) as		 'V05-Red Cu 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V06-Chardo '	then	(permanent_crop_acres )	else	null	end) as		 'V06-Chardo	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V07-Pinot '	then	(permanent_crop_acres )	else	null	end) as		 'V07-Pinot 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V08-Sauvig '	then	(permanent_crop_acres )	else	null	end) as		 'V08-Sauvig 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V09-Semill '	then	(permanent_crop_acres )	else	null	end) as		 'V09-Semill 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V10-Chenin '	then	(permanent_crop_acres )	else	null	end) as		 'V10-Chenin 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V11-Gewurz '	then	(permanent_crop_acres )	else	null	end) as		 'V11-Gewurz 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V12-Muscat '	then	(permanent_crop_acres )	else	null	end) as		 'V12-Muscat 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V13-Riesli '	then	(permanent_crop_acres )	else	null	end) as		 'V13-Riesli 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V14-Other '	then	(permanent_crop_acres )	else	null	end) as		 'V14-Other 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V15-Cabern '	then	(permanent_crop_acres )	else	null	end) as		 'V15-Cabern 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V16-Merlot '	then	(permanent_crop_acres )	else	null	end) as		 'V16-Merlot 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V17-Syrah '	then	(permanent_crop_acres )	else	null	end) as		 'V17-Syrah 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V18-Pinot '	then	(permanent_crop_acres )	else	null	end) as		 'V18-Pinot 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V19-Limber '	then	(permanent_crop_acres )	else	null	end) as		 'V19-Limber 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V20-Other '	then	(permanent_crop_acres )	else	null	end) as		 'V20-Other 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V21-Concor '	then	(permanent_crop_acres )	else	null	end) as		 'V21-Concor	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V22-Niagar '	then	(permanent_crop_acres )	else	null	end) as		 'V22-Niagar 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V23-Viogni '	then	(permanent_crop_acres )	else	null	end) as		 'V23-Viogni 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V24-Cabern '	then	(permanent_crop_acres )	else	null	end) as		 'V24-Cabern 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V25-Sangio '	then	(permanent_crop_acres )	else	null	end) as		 'V25-Sangio	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V26-Zinfan '	then	(permanent_crop_acres )	else	null	end) as		 'V26-Zinfan 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 '27-Grenac '	then	(permanent_crop_acres )	else	null	end) as		 '27-Grenac 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V28-Mabec '	then	(permanent_crop_acres )	else	null	end) as		 'V28-Mabec 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V29-Nebbio'	then	(permanent_crop_acres )	else	null	end) as		 'V29-Nebbio	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V31-Bluebe'	then	(permanent_crop_acres )	else	null	end) as		 'V31-Bluebe	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'V32-Raspbe'	then	(permanent_crop_acres )	else	null	end) as		 'V32-Raspbe	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'AG-Cannabs'	then	(permanent_crop_acres )	else	null	end) as		 'AG-Cannabs	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'T01-Tatura '	then	(permanent_crop_acres )	else	null	end) as		 'T01-Tatura	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'T02-Spindl '	then	(permanent_crop_acres )	else	null	end) as		 'T02-Spindl 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'T03-Wire D '	then	(permanent_crop_acres )	else	null	end) as		 'T03-Wire D	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'T04-Wire T '	then	(permanent_crop_acres )	else	null	end) as		 'T04-Wire T 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'T05-Hop Tr '	then	(permanent_crop_acres )	else	null	end) as		 'T05-Hop Tr 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'T06-Wine G '	then	(permanent_crop_acres )	else	null	end) as		 'T06-Wine G 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'T07-Juice '	then	(permanent_crop_acres )	else	null	end) as		 'T07-Juice	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'T08-VTrell '	then	(permanent_crop_acres )	else	null	end) as		 'T08-VTrell 	 '	,
sum(case when imprv_detail.imprv_det_type_cd=	 'T09-SingPo '	then	(permanent_crop_acres )	else	null	end) as		 'T09-SingPo 	 '	




 FROM            imprv_detail INNER JOIN
                         imprv ON imprv_detail.prop_val_yr = imprv.prop_val_yr AND imprv_detail.sup_num = imprv.sup_num AND imprv_detail.sale_id = imprv.sale_id AND imprv_detail.prop_id = imprv.prop_id AND 
                         imprv_detail.imprv_id = imprv.imprv_id
left join 
(SELECT id.prop_id,
ROW_NUMBER() over (partition by id.prop_id ORDER BY id.imprv_det_type_cd desc)AS order_id, 
ID.imprv_det_meth_cd, id.imprv_det_type_cd,
Sum(case when   id.imprv_det_type_cd IS not null	
	then	( permanent_crop_acres  )	else	null	end) as	imprv_pc_acres 
 FROM           pacs_oltp.dbo.imprv_detail  id 
  INNER JOIN
                         pacs_oltp.dbo.imprv ON id.prop_val_yr = imprv.prop_val_yr AND id.sup_num = imprv.sup_num AND id.sale_id = imprv.sale_id AND id.prop_id = imprv.prop_id AND 
                         id.imprv_id = imprv.imprv_id
						 left join 
						 pacs_oltp.dbo.property_val pv on pv.prop_id=id.prop_id and pv.prop_val_yr=id.prop_val_yr and pv.sup_num=id.sup_num 

						 where 
id.prop_val_yr=(select appr_yr from pacs_system)
and id.sale_id=0
and imprv.imprv_type_cd='permc'
--and imprv_detail.prop_id=29245
--and imprv_det_type_cd like'%Bing'
--or imprv_det_type_cd like '%Gala '
and imprv_det_type_cd is not null

group by 
id.prop_id,id.imprv_det_id,id.imprv_det_type_cd,permanent_crop_acres,ID.imprv_det_meth_cd) pc on pc.prop_id=imprv_detail.prop_id


where 
imprv_detail.prop_val_yr=(select appr_yr from pacs_system)
and imprv_detail.sale_id=0
and imprv.imprv_type_cd='permc'
--and imprv_detail.prop_id=29245
--and imprv_det_type_cd like'%Bing'
--or imprv_det_type_cd like '%Gala '
and imprv_detail.imprv_det_type_cd is not null

group by imprv_detail.prop_id, pc.order_id

GO

