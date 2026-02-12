create view comm_featurea_cd_pv as 
SELECT  [feat_code]
      ,[feat_description]
      ,[adjustment_type]
      ,[extra_int1]
      ,[extra_int2]
      ,[extra_int3]
      ,[label_short]
  FROM [cnv_src_benton_2_14_2017].[dbo].[comm_feat_codes]

GO

