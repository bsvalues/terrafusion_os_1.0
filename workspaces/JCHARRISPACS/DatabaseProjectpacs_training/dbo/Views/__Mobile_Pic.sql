create view __Mobile_Pic as
select row_number() over (partition by prop_id order by image_id desc) as order_id, p.prop_id, image_id, image_type, location as image_location, image_nm , 
REPLACE( REPLACE( location,  '\\CHPACS\OLTP\pacs_oltp\Images\',''), '\\CHPACS\OLTP\pacs_oltp\\','') AS img_path FROM [pacs_oltp].[dbo].[pacs_image] pi 
left join property p on p.prop_id=pi.ref_id
where image_type='mobile'

GO

