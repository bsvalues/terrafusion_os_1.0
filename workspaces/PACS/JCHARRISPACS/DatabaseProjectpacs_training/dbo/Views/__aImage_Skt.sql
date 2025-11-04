
create view [dbo].[__aImage_Skt] as
select * from 
(SELECT  
      [prop_id]
     -- ,[year]
      ,[image_path]
      --,[image_nm]
      ,[image_type]
  FROM [web_internet_benton].[dbo].[_clientdb_property_image]
 
  )     as basedata
  pivot (
  min([image_path])
  for [image_type]
   in
   (
 
PIC,       
REET ,     
RPA ,      
SKT_JPG   


)) as pivottable

GO

