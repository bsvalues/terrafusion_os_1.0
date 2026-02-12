create view __Count_Perm_Crop as 

SELECT 
imprv_detail.prop_id,

count(case when imprv_det_type_cd=	 'C01-Bing '	then	(permanent_crop_acres )	else	null	end) as		 'C01-Bing 	 '	,
count(case when imprv_det_type_cd=	 'C02-Rainie '	then	(permanent_crop_acres )	else	null	end) as		 'C02-Rainie 	 '	,
count(case when imprv_det_type_cd=	 'C04-Chelan '	then	(permanent_crop_acres )	else	null	end) as		 'C04-Chelan 	 '	,
count(case when imprv_det_type_cd=	 'O01-Apples '	then	(permanent_crop_acres )	else	null	end) as		 'O01-Apples 	 '	,
count(case when imprv_det_type_cd=	 'O02-Cherri '	then	(permanent_crop_acres )	else	null	end) as		 'O02-Cherri 	 '	,
count(case when imprv_det_type_cd=	 'O03-Pears '	then	(permanent_crop_acres )	else	null	end) as		 'O03-Pears 	 '	,
count(case when imprv_det_type_cd=	 'O04-Peache '	then	(permanent_crop_acres )	else	null	end) as		 'O04-Peache 	 '	,
count(case when imprv_det_type_cd=	 'O05-Nectar '	then	(permanent_crop_acres )	else	null	end) as		 'O05-Nectar 	 '	,
count(case when imprv_det_type_cd=	 'O06-Aprico '	then	(permanent_crop_acres )	else	null	end) as		 'O06-Aprico 	 '	,
count(case when imprv_det_type_cd=	 'O07-Plums '	then	(permanent_crop_acres )	else	null	end) as		 'O07-Plums	 '	,
count(case when imprv_det_type_cd=	 'O08-Prunes '	then	(permanent_crop_acres )	else	null	end) as		 'O08-Prunes 	 '	,
count(case when imprv_det_type_cd=	 'O09-Nuts '	then	(permanent_crop_acres )	else	null	end) as		 'O09-Nuts	 '	,
count(case when imprv_det_type_cd=	 'O10-Gala'	then	(permanent_crop_acres )	else	null	end) as		 'O10-Gala	 '	,
count(case when imprv_det_type_cd=	 'O11-Fuji '	then	(permanent_crop_acres )	else	null	end) as		 'O11-Fuji	 '	,
count(case when imprv_det_type_cd=	 'O12-Braebu '	then	(permanent_crop_acres )	else	null	end) as		 'O12-Braebu 	 '	,
count(case when imprv_det_type_cd=	 'O14-Red Ch '	then	(permanent_crop_acres )	else	null	end) as		 'O14-Red Ch	 '	,
count(case when imprv_det_type_cd=	 'O17-Oregon '	then	(permanent_crop_acres )	else	null	end) as		 'O17-Oregon	 '	,
count(case when imprv_det_type_cd=	 'O18-Scarle '	then	(permanent_crop_acres )	else	null	end) as		 'O18-Scarle 	 '	,
count(case when imprv_det_type_cd=	 'O20-Cameo '	then	(permanent_crop_acres )	else	null	end) as		 'O20-Cameo 	 '	,
count(case when imprv_det_type_cd=	 'O21-Spur R '	then	(permanent_crop_acres )	else	null	end) as		 'O21-Spur R 	 '	,
count(case when imprv_det_type_cd=	 'O22-Golden '	then	(permanent_crop_acres )	else	null	end) as		 'O22-Golden 	 '	,
count(case when imprv_det_type_cd=	 'O24-Granny '	then	(permanent_crop_acres )	else	null	end) as		 'O24-Granny 	 '	,
count(case when imprv_det_type_cd=	 'O25-Jonago '	then	(permanent_crop_acres )	else	null	end) as		 'O25-Jonago 	 '	,
count(case when imprv_det_type_cd=	 'O27-Washin '	then	(permanent_crop_acres )	else	null	end) as		 'O27-Washin 	 '	,
count(case when imprv_det_type_cd=	 'O31-Winesa '	then	(permanent_crop_acres )	else	null	end) as		 'O31-Winesa 	 '	,
count(case when imprv_det_type_cd=	 'O32-Rome '	then	(permanent_crop_acres )	else	null	end) as		 'O32-Rome	 '	,
count(case when imprv_det_type_cd=	 'O34-Bisbee '	then	(permanent_crop_acres )	else	null	end) as		 'O34-Bisbee 	 '	,
count(case when imprv_det_type_cd=	 '35-Top Re'	then	(permanent_crop_acres )	else	null	end) as		 '35-Top Re	 '	,
count(case when imprv_det_type_cd=	 'O36-Red De'	then	(permanent_crop_acres )	else	null	end) as		 'O36-Red De	 '	,
count(case when imprv_det_type_cd=	 'O39-Pink L '	then	(permanent_crop_acres )	else	null	end) as		 'O39-Pink L 	 '	,
count(case when imprv_det_type_cd=	 'O40-Gala B '	then	(permanent_crop_acres )	else	null	end) as		 'O40-Gala B 	 '	,
count(case when imprv_det_type_cd=	 'O41-Gala B '	then	(permanent_crop_acres )	else	null	end) as		 'O41-Gala B 	 '	,
count(case when imprv_det_type_cd=	 'O42-Gala B '	then	(permanent_crop_acres )	else	null	end) as		 'O42-Gala B 	 '	,
count(case when imprv_det_type_cd=	 'O44-Gala C '	then	(permanent_crop_acres )	else	null	end) as		 'O44-Gala C 	 '	,
count(case when imprv_det_type_cd=	 'O45-Gala G '	then	(permanent_crop_acres )	else	null	end) as		 'O45-Gala G 	 '	,
count(case when imprv_det_type_cd=	 'O46-Gala G '	then	(permanent_crop_acres )	else	null	end) as		 'O46-Gala G 	 '	,
count(case when imprv_det_type_cd=	 'O47-Gala G '	then	(permanent_crop_acres )	else	null	end) as		 'O47-Gala G 	 '	,
count(case when imprv_det_type_cd=	 'O48-Gala I '	then	(permanent_crop_acres )	else	null	end) as		 'O48-Gala I 	 '	,
count(case when imprv_det_type_cd=	 'O49-Gala P '	then	(permanent_crop_acres )	else	null	end) as		 'O49-Gala P 	 '	,
count(case when imprv_det_type_cd=	 'O50-Gala S '	then	(permanent_crop_acres )	else	null	end) as		 'O50-Gala S 	 '	,
count(case when imprv_det_type_cd=	 'O53-Gala R '	then	(permanent_crop_acres )	else	null	end) as		 'O53-Gala R 	 '	,
count(case when imprv_det_type_cd=	 'O54-Gala U '	then	(permanent_crop_acres )	else	null	end) as		 'O54-Gala U 	 '	,
count(case when imprv_det_type_cd=	 'O56-Fuji N '	then	(permanent_crop_acres )	else	null	end) as		 'O56-Fuji N 	 '	,
count(case when imprv_det_type_cd=	 'O57-Fuji T '	then	(permanent_crop_acres )	else	null	end) as		 'O57-Fuji T 	 '	,
count(case when imprv_det_type_cd=	 'O58-Fuji R '	then	(permanent_crop_acres )	else	null	end) as		 'O58-Fuji R 	 '	,
count(case when imprv_det_type_cd=	 'O59-Fuji R '	then	(permanent_crop_acres )	else	null	end) as		 'O59-Fuji R 	 '	,
count(case when imprv_det_type_cd=	 'O61-Fuji S '	then	(permanent_crop_acres )	else	null	end) as		 'O61-Fuji S 	 '	,
count(case when imprv_det_type_cd=	 'O62-Fuji R '	then	(permanent_crop_acres )	else	null	end) as		 'O62-Fuji R 	 '	,
count(case when imprv_det_type_cd=	 'O63-Braebu '	then	(permanent_crop_acres )	else	null	end) as		 'O63-Braebu 	 '	,
count(case when imprv_det_type_cd=	 'O65-Braebu '	then	(permanent_crop_acres )	else	null	end) as		 'O65-Braebu 	 '	,
count(case when imprv_det_type_cd=	 'O66-Braebu'	then	(permanent_crop_acres )	else	null	end) as		 'O66-Braebu	 '	,
count(case when imprv_det_type_cd=	 'O70-Pacifi '	then	(permanent_crop_acres )	else	null	end) as		 'O70-Pacifi 	 '	,
count(case when imprv_det_type_cd=	 'O75-Earlig '	then	(permanent_crop_acres )	else	null	end) as		 'O75-Earlig	 '	,
count(case when imprv_det_type_cd=	 'O83-Ginger '	then	(permanent_crop_acres )	else	null	end) as		 'O83-Ginger	 '	,
count(case when imprv_det_type_cd=	 'O84-Golden '	then	(permanent_crop_acres )	else	null	end) as		 'O84-Golden 	 '	,
count(case when imprv_det_type_cd=	 'O87-Red Va '	then	(permanent_crop_acres )	else	null	end) as		 'O87-Red Va 	 '	,
count(case when imprv_det_type_cd=	 'O89-Honeyc '	then	(permanent_crop_acres )	else	null	end) as		 'O89-Honeyc 	 '	,
count(case when imprv_det_type_cd=	 'V01-Wine G '	then	(permanent_crop_acres )	else	null	end) as		 'V01-Wine G 	 '	,
count(case when imprv_det_type_cd=	 'V02-Juice '	then	(permanent_crop_acres )	else	null	end) as		 'V02-Juice 	 '	,
count(case when imprv_det_type_cd=	 'V03-Aspara '	then	(permanent_crop_acres )	else	null	end) as		 'V03-Aspara 	 '	,
count(case when imprv_det_type_cd=	 'V04-Hops '	then	(permanent_crop_acres )	else	null	end) as		 'V04-Hops 	 '	,
count(case when imprv_det_type_cd=	 'V05-Red Cu '	then	(permanent_crop_acres )	else	null	end) as		 'V05-Red Cu 	 '	,
count(case when imprv_det_type_cd=	 'V06-Chardo '	then	(permanent_crop_acres )	else	null	end) as		 'V06-Chardo	 '	,
count(case when imprv_det_type_cd=	 'V07-Pinot '	then	(permanent_crop_acres )	else	null	end) as		 'V07-Pinot 	 '	,
count(case when imprv_det_type_cd=	 'V08-Sauvig '	then	(permanent_crop_acres )	else	null	end) as		 'V08-Sauvig 	 '	,
count(case when imprv_det_type_cd=	 'V09-Semill '	then	(permanent_crop_acres )	else	null	end) as		 'V09-Semill 	 '	,
count(case when imprv_det_type_cd=	 'V10-Chenin '	then	(permanent_crop_acres )	else	null	end) as		 'V10-Chenin 	 '	,
count(case when imprv_det_type_cd=	 'V11-Gewurz '	then	(permanent_crop_acres )	else	null	end) as		 'V11-Gewurz 	 '	,
count(case when imprv_det_type_cd=	 'V12-Muscat '	then	(permanent_crop_acres )	else	null	end) as		 'V12-Muscat 	 '	,
count(case when imprv_det_type_cd=	 'V13-Riesli '	then	(permanent_crop_acres )	else	null	end) as		 'V13-Riesli 	 '	,
count(case when imprv_det_type_cd=	 'V14-Other '	then	(permanent_crop_acres )	else	null	end) as		 'V14-Other 	 '	,
count(case when imprv_det_type_cd=	 'V15-Cabern '	then	(permanent_crop_acres )	else	null	end) as		 'V15-Cabern 	 '	,
count(case when imprv_det_type_cd=	 'V16-Merlot '	then	(permanent_crop_acres )	else	null	end) as		 'V16-Merlot 	 '	,
count(case when imprv_det_type_cd=	 'V17-Syrah '	then	(permanent_crop_acres )	else	null	end) as		 'V17-Syrah 	 '	,
count(case when imprv_det_type_cd=	 'V18-Pinot '	then	(permanent_crop_acres )	else	null	end) as		 'V18-Pinot 	 '	,
count(case when imprv_det_type_cd=	 'V19-Limber '	then	(permanent_crop_acres )	else	null	end) as		 'V19-Limber 	 '	,
count(case when imprv_det_type_cd=	 'V20-Other '	then	(permanent_crop_acres )	else	null	end) as		 'V20-Other 	 '	,
count(case when imprv_det_type_cd=	 'V21-Concor '	then	(permanent_crop_acres )	else	null	end) as		 'V21-Concor	 '	,
count(case when imprv_det_type_cd=	 'V22-Niagar '	then	(permanent_crop_acres )	else	null	end) as		 'V22-Niagar 	 '	,
count(case when imprv_det_type_cd=	 'V23-Viogni '	then	(permanent_crop_acres )	else	null	end) as		 'V23-Viogni 	 '	,
count(case when imprv_det_type_cd=	 'V24-Cabern '	then	(permanent_crop_acres )	else	null	end) as		 'V24-Cabern 	 '	,
count(case when imprv_det_type_cd=	 'V25-Sangio '	then	(permanent_crop_acres )	else	null	end) as		 'V25-Sangio	 '	,
count(case when imprv_det_type_cd=	 'V26-Zinfan '	then	(permanent_crop_acres )	else	null	end) as		 'V26-Zinfan 	 '	,
count(case when imprv_det_type_cd=	 '27-Grenac '	then	(permanent_crop_acres )	else	null	end) as		 '27-Grenac 	 '	,
count(case when imprv_det_type_cd=	 'V28-Mabec '	then	(permanent_crop_acres )	else	null	end) as		 'V28-Mabec 	 '	,
count(case when imprv_det_type_cd=	 'V29-Nebbio'	then	(permanent_crop_acres )	else	null	end) as		 'V29-Nebbio	 '	,
count(case when imprv_det_type_cd=	 'V31-Bluebe'	then	(permanent_crop_acres )	else	null	end) as		 'V31-Bluebe	 '	,
count(case when imprv_det_type_cd=	 'V32-Raspbe'	then	(permanent_crop_acres )	else	null	end) as		 'V32-Raspbe	 '	,
count(case when imprv_det_type_cd=	 'AG-Cannabs'	then	(permanent_crop_acres )	else	null	end) as		 'AG-Cannabs	 '	,
count(case when imprv_det_type_cd=	 'T01-Tatura '	then	(permanent_crop_acres )	else	null	end) as		 'T01-Tatura	 '	,
count(case when imprv_det_type_cd=	 'T02-Spindl '	then	(permanent_crop_acres )	else	null	end) as		 'T02-Spindl 	 '	,
count(case when imprv_det_type_cd=	 'T03-Wire D '	then	(permanent_crop_acres )	else	null	end) as		 'T03-Wire D	 '	,
count(case when imprv_det_type_cd=	 'T04-Wire T '	then	(permanent_crop_acres )	else	null	end) as		 'T04-Wire T 	 '	,
count(case when imprv_det_type_cd=	 'T05-Hop Tr '	then	(permanent_crop_acres )	else	null	end) as		 'T05-Hop Tr 	 '	,
count(case when imprv_det_type_cd=	 'T06-Wine G '	then	(permanent_crop_acres )	else	null	end) as		 'T06-Wine G 	 '	,
count(case when imprv_det_type_cd=	 'T07-Juice '	then	(permanent_crop_acres )	else	null	end) as		 'T07-Juice	 '	,
count(case when imprv_det_type_cd=	 'T08-VTrell '	then	(permanent_crop_acres )	else	null	end) as		 'T08-VTrell 	 '	,
count(case when imprv_det_type_cd=	 'T09-SingPo '	then	(permanent_crop_acres )	else	null	end) as		 'T09-SingPo 	 '	




 FROM            imprv_detail INNER JOIN
                         imprv ON imprv_detail.prop_val_yr = imprv.prop_val_yr AND imprv_detail.sup_num = imprv.sup_num AND imprv_detail.sale_id = imprv.sale_id AND imprv_detail.prop_id = imprv.prop_id AND 
                         imprv_detail.imprv_id = imprv.imprv_id
where 
imprv_detail.prop_val_yr=(select appr_yr from pacs_system)
and imprv_detail.sale_id=0
and imprv.imprv_type_cd='permc'
--and imprv_detail.prop_id=29245
--and imprv_det_type_cd like'%Bing'
--or imprv_det_type_cd like '%Gala '


group by
imprv_detail.prop_id

GO

