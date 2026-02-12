create view  __map_images as

SELECT 
[order_id]					as 'id',
[prop_id],
[image_location]			as 'image_path',
[image_nm]					as image_name,
[img_path]					as image_nm,
[image_type]  
FROM 
[pacs_oltp].[dbo].[__Main_Image]

GO

