create view  __map_sketches as 
SELECT [id]
,[prop_id]
,[prop_val_yr]
,[imprv_id]
,replace([image_path], 
'\\CHPACS\OLTP\pacs_oltp\Images\', '')								as sketch
FROM 
[web_internet_benton].[dbo].[_clientdb_property_sketch]				as sk--",

GO

