create view propval_images as
SELECT  [lrsn] as prop_id
      ,[image_seq_number]
      ,[image_description]
      ,[image_path]
      ,[image_date]
      ,[detail_image]
      ,[history]
      ,[image_int1]
      ,[image_int2]
      ,[image_int3]
      ,[image_flag1]
      ,[image_flag2]
      ,[image_flag3]
      ,[image_text1]
      ,[image_text2]
  FROM [cnv_src_benton_2_14_2017].[dbo].[image_index]

GO

