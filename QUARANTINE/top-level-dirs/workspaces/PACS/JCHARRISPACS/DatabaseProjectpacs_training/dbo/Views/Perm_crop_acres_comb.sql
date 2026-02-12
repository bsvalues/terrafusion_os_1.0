
create view Perm_crop_acres_comb as
SELECT     distinct   __perm_crop_acres.prop_id,  situs.situs_display,

[C01-Bing 	( permanent_crop_acres  )], __perm_crop_acres.[C02-Rainie 	( permanent_crop_acres  )], __perm_crop_acres.[C04-Chelan 	( permanent_crop_acres  )], 
                         __perm_crop_acres.[O01-Apples 	( permanent_crop_acres  )], __perm_crop_acres.[O02-Cherri 	( permanent_crop_acres  )], __perm_crop_acres.[O03-Pears 	( permanent_crop_acres  )], 
                         __perm_crop_acres.[O04-Peache 	( permanent_crop_acres  )], __perm_crop_acres.[O05-Nectar 	( permanent_crop_acres  )], __perm_crop_acres.[O06-Aprico 	( permanent_crop_acres  )], 
                         __perm_crop_acres.[O07-Plums		( permanent_crop_acres  )], __perm_crop_acres.[O08-Prunes 	( permanent_crop_acres  )], __perm_crop_acres.[O09-Nuts		( permanent_crop_acres  )], 
                         __perm_crop_acres.[O10-Gala		( permanent_crop_acres  )], __perm_crop_acres.[O11-Fuji		( permanent_crop_acres  )], __perm_crop_acres.[O12-Braebu 	( permanent_crop_acres  )], 
                         __perm_crop_acres.[O14-Red Ch	( permanent_crop_acres  )], __perm_crop_acres.[O17-Oregon	( permanent_crop_acres  )], __perm_crop_acres.[O18-Scarle 	( permanent_crop_acres  )], 
                         __perm_crop_acres.[O20-Cameo 	( permanent_crop_acres  )], __perm_crop_acres.[O21-Spur R 	( permanent_crop_acres  )], __perm_crop_acres.[O22-Golden 	( permanent_crop_acres  )], 
                         __perm_crop_acres.[O24-Granny 	( permanent_crop_acres  )], __perm_crop_acres.[O25-Jonago 	( permanent_crop_acres  )], __perm_crop_acres.[O27-Washin 	( permanent_crop_acres  )], 
                         __perm_crop_acres.[O31-Winesa 	( permanent_crop_acres  )], __perm_crop_acres.[O32-Rome		( permanent_crop_acres  )], __perm_crop_acres.[O34-Bisbee 	( permanent_crop_acres  )], 
                         __perm_crop_acres.[35-Top Re		( permanent_crop_acres  )], __perm_crop_acres.[O36-Red De	( permanent_crop_acres  )], __perm_crop_acres.[O39-Pink L 	( permanent_crop_acres  )], 
                         __perm_crop_acres.[O40-Gala B 	( permanent_crop_acres  )], __perm_crop_acres.[O41-Gala B 	( permanent_crop_acres  )], __perm_crop_acres.[O42-Gala B 	( permanent_crop_acres  )], 
                         __perm_crop_acres.[O44-Gala C 	( permanent_crop_acres  )], __perm_crop_acres.[O45-Gala G 	( permanent_crop_acres  )], __perm_crop_acres.[O46-Gala G 	( permanent_crop_acres  )], 
                         __perm_crop_acres.[O47-Gala G 	( permanent_crop_acres  )], __perm_crop_acres.[O48-Gala I 	( permanent_crop_acres  )], __perm_crop_acres.[O49-Gala P 	( permanent_crop_acres  )], 
                         __perm_crop_acres.[O50-Gala S 	( permanent_crop_acres  )], __perm_crop_acres.[O53-Gala R 	( permanent_crop_acres  )], __perm_crop_acres.[O54-Gala U 	( permanent_crop_acres  )], 
                         __perm_crop_acres.[O56-Fuji N 	( permanent_crop_acres  )], __perm_crop_acres.[O57-Fuji T 	( permanent_crop_acres  )], __perm_crop_acres.[O58-Fuji R 	( permanent_crop_acres  )], 
                         __perm_crop_acres.[O59-Fuji R 	( permanent_crop_acres  )], __perm_crop_acres.[O61-Fuji S 	( permanent_crop_acres  )], __perm_crop_acres.[O62-Fuji R 	( permanent_crop_acres  )], 
                         __perm_crop_acres.[O63-Braebu 	( permanent_crop_acres  )], __perm_crop_acres.[O65-Braebu 	( permanent_crop_acres  )], __perm_crop_acres.[O66-Braebu	( permanent_crop_acres  )], 
                         __perm_crop_acres.[O70-Pacifi 	( permanent_crop_acres  )], __perm_crop_acres.[O75-Earlig	( permanent_crop_acres  )], __perm_crop_acres.[O83-Ginger	( permanent_crop_acres  )], 
                         __perm_crop_acres.[O84-Golden 	( permanent_crop_acres  )], __perm_crop_acres.[O87-Red Va 	( permanent_crop_acres  )], __perm_crop_acres.[O89-Honeyc 	( permanent_crop_acres  )], 
                         __perm_crop_acres.[V01-Wine G 	( permanent_crop_acres  )], __perm_crop_acres.[V02-Juice 	( permanent_crop_acres  )], __perm_crop_acres.[V03-Aspara 	( permanent_crop_acres  )], 
                         __perm_crop_acres.[V04-Hops 		( permanent_crop_acres )], __perm_crop_acres.[V05-Red Cu 	( permanent_crop_acres  )], __perm_crop_acres.[V06-Chardo	( permanent_crop_acres  )], 
                         __perm_crop_acres.[V07-Pinot 	( permanent_crop_acres  )], __perm_crop_acres.[V08-Sauvig 	( permanent_crop_acres  )], __perm_crop_acres.[V09-Semill 	( permanent_crop_acres  )], 
                         __perm_crop_acres.[V10-Chenin 	( permanent_crop_acres  )], __perm_crop_acres.[V11-Gewurz 	( permanent_crop_acres  )], __perm_crop_acres.[V12-Muscat 	( permanent_crop_acres  )], 
                         __perm_crop_acres.[V13-Riesli 	( permanent_crop_acres  )], __perm_crop_acres.[V14-Other 	( permanent_crop_acres  )], __perm_crop_acres.[V15-Cabern 	( permanent_crop_acres  )], 
                         __perm_crop_acres.[V16-Merlot 	( permanent_crop_acres  )], __perm_crop_acres.[V17-Syrah 	( permanent_crop_acres  )], __perm_crop_acres.[V18-Pinot 	( permanent_crop_acres  )], 
                         __perm_crop_acres.[V19-Limber 	( permanent_crop_acres  )], __perm_crop_acres.[V20-Other 	( permanent_crop_acres  )], __perm_crop_acres.[V21-Concor	( permanent_crop_acres  )], 
                         __perm_crop_acres.[V22-Niagar 	( permanent_crop_acres  )], __perm_crop_acres.[V23-Viogni 	( permanent_crop_acres  )], __perm_crop_acres.[V24-Cabern 	( permanent_crop_acres  )], 
                         __perm_crop_acres.[V25-Sangio	( permanent_crop_acres  )], __perm_crop_acres.[V26-Zinfan 	( permanent_crop_acres  )], __perm_crop_acres.[27-Grenac 	( permanent_crop_acres  )], 
                         __perm_crop_acres.[V28-Mabec 	( permanent_crop_acres  )], __perm_crop_acres.[V29-Nebbio	( permanent_crop_acres  )], __perm_crop_acres.[V31-Bluebe	( permanent_crop_acres  )], 
                         __perm_crop_acres.[V32-Raspbe	( permanent_crop_acres  )], __perm_crop_acres.[AG-Cannabs	( permanent_crop_acres  )], __perm_crop_acres.[AG-Dairy		( permanent_crop_acres  )], 
                         __perm_crop_acres.[AG-HAYSTOR		( permanent_crop_acres  )], __perm_crop_acres.[AG-POTA/ON 	( permanent_crop_acres  )], __perm_crop_acres.[AG-QUONSET 	( permanent_crop_acres  )], 
                         __perm_crop_acres.[I01-Solid ( permanent_crop_acres  )], __perm_crop_acres.[02-Solid 	( permanent_crop_acres  )], __perm_crop_acres.[I03-Buried 	( permanent_crop_acres  )], 
                         __perm_crop_acres.[I04-Coolin ( permanent_crop_acres  )], __perm_crop_acres.[IRRIGATE 	( permanent_crop_acres  )], __perm_crop_acres.[T01-Tatura ( permanent_crop_acres  )], 
                         __perm_crop_acres.[T02-Spindl 	( permanent_crop_acres  )], __perm_crop_acres.[T03-Wire D ( permanent_crop_acres  )], __perm_crop_acres.[T04-Wire T 	( permanent_crop_acres  )], 
                         __perm_crop_acres.[T05-Hop Tr 	( permanent_crop_acres  )], __perm_crop_acres.[T06-Wine G 	( permanent_crop_acres  )], __perm_crop_acres.[T07-Juice ( permanent_crop_acres  )], 
                         __perm_crop_acres.[T08-VTrell 	( permanent_crop_acres  )], __perm_crop_acres.[T09-SingPo 	( permanent_crop_acres  )]
FROM           __perm_crop_acres     LEFT Join imprv_detail on imprv_detail.prop_id=__perm_crop_acres.prop_id left join property_val pv on pv.prop_id=imprv_detail.prop_id and pv.prop_val_yr=imprv_detail.prop_val_yr and pv.sup_num=imprv_detail.sup_num 
                         LEFT Join 
                         imprv ON imprv_detail.prop_val_yr = imprv.prop_val_yr AND imprv_detail.sup_num = imprv.sup_num AND imprv_detail.sale_id = imprv.sale_id AND imprv_detail.prop_id = imprv.prop_id AND 
                         imprv_detail.imprv_id = imprv.imprv_id 
						 LEFT  JOIN land_detail ON land_detail.prop_id = imprv_detail.prop_id
						 left join 
					

					

situs 

on imprv.prop_id=situs.prop_id

left join


[owner] 

as o with (nolock)
      on
	  imprv.prop_id = o.prop_id
      and imprv.prop_val_yr = o.owner_tax_yr
      and imprv.sup_num = o.sup_num


inner join [account] as a with (nolock)
      on o.owner_id = a.acct_id


left outer join [address] as ad with (nolock)
      on o.owner_id = ad.acct_id
      and ad.primary_addr = 'y'
left outer join [situs] as s with (nolock)
      on imprv.prop_id = s.prop_id
      and s.primary_situs = 'y'
left join 

property_exemption pe

on pe.prop_id = imprv.prop_id



where 

pv.prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)
and imprv.imprv_type_cd='permc'
--and pv.prop_id=26521
--and imprv_det_type_cd like'AG-HAYSTOR '
--and imprv_det_type_cd like '%Gala '
--or imprv_det_type_cd like '%bing '
--and imprv.primary_use_cd > '70'
--and imprv.primary_use_cd < '99'
--and file_as_name like 'Wy%'

GO

