
create view __aAppEst_Perm_Crop_view as

SELECT id.prop_id as ParcelID, p.geo_id as 'Geo_ID',
ROW_NUMBER() over (partition by id.prop_id ORDER BY id.imprv_det_type_cd desc)AS order_id, id.imprv_det_type_cd,id.yr_built as 'Year_Planted',
ID.imprv_det_meth_cd, ID.imprv_det_class_cd,
Sum(case when   id.imprv_det_type_cd IS not null	
	then	( permanent_crop_acres  )	else	null	end) as	imprv_pc_acres 
,pv.cycle as 'Reval', 
pv.hood_cd as 'neighborhood',
imprv.imprv_state_cd as 'State_Code'
 ,pv.legal_acreage as 'Total_Legal_Acres'
,ac.file_as_name as 'Owner',

ID.depreciation_yr,id.unit_price,

id.imprv_det_val_source as 'Flat_Adjusted Value',
id.imprv_det_flat_val as 'Current_Flat', 
id.imprv_det_calc_val as 'Current_Imprv_Det_Val'

--,XCoord,YCoord

 FROM           pacs_oltp.dbo.imprv_detail  id 
  INNER JOIN
                         pacs_oltp.dbo.imprv ON id.prop_val_yr = imprv.prop_val_yr AND id.sup_num = imprv.sup_num AND id.sale_id = imprv.sale_id AND id.prop_id = imprv.prop_id AND 
                         id.imprv_id = imprv.imprv_id
						 left join 
						 pacs_oltp.dbo.property_val pv on pv.prop_id=id.prop_id and pv.prop_val_yr=id.prop_val_yr and pv.sup_num=id.sup_num 
						 INNER JOIN 
						 pacs_oltp.dbo.owner o  ON	pv.prop_id = o.prop_id
						 INNER JOIN 
						 pacs_oltp.dbo.property p WITH (nolock) ON
							pv.prop_id = p.prop_id
							AND pv.prop_val_yr = o.owner_tax_yr
							AND pv.sup_num = o.sup_num
						INNER JOIN
						pacs_oltp.dbo.account ac WITH (nolock) ON
									o.owner_id = ac.acct_id


inner join 

(SELECT 
[Parcel_ID],
ROW_NUMBER() 
over 
(partition by prop_id 
ORDER BY [Prop_ID]DESC) 
AS order_id,
[Prop_ID]
,[OBJECTID]
shape
--,[XCoord]
--,[YCoord]
,[shape].STCentroid().STX as XCoord
,[shape].STCentroid().STY as YCoord 

FROM 
[Benton_spatial_data].[dbo].[Parcel]
where Prop_ID> 0 


) sp 

 on pv.prop_id=sp.prop_id

			

where 
id.prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)
and id.sale_id=0
and 
imprv.imprv_type_cd='permc'
and id.imprv_det_meth_cd not like 'irr'
and id.imprv_det_meth_cd not like 'trl'
--and id.prop_id=26521
--and imprv_det_type_cd like'AG-HAYSTOR '
--and imprv_det_type_cd like '%V16-Merlot'
and permanent_crop_acres is not null 
group by 
id.prop_id, ID.seq_num,id.imprv_det_id,id.imprv_det_type_cd,permanent_crop_acres,ID.imprv_det_meth_cd,p.geo_id  ,pv.cycle , pv.hood_cd , imprv.imprv_state_cd ,pv.legal_acreage ,ac.file_as_name,
id.yr_built ,
id.permanent_crop_acres ,
id.permanent_crop_irrigation_acres,
id.imprv_det_val_source,
id.imprv_det_flat_val, 
id.imprv_det_calc_val,XCoord,YCoord,ID.depreciation_yr,id.unit_price,imprv_det_class_cd

GO

