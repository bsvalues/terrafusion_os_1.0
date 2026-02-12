/****** Script for SelectTopNRows command from SSMS  ******/
create view pc as

SELECT [prop_id],
     [imprv_det_class_cd]+','+
   [imprv_det_type_cd]
       as crop_type_Class
      ,[imprv_det_meth_cd]
      ,[permanent_crop_acres]
      ,[prmnt_crp_irri_ac]
      ,[prmnt_crp_dns]
      ,[imprv_type_cd]
      ,[sale_id]
      ,[prop_inactive_dt]
  FROM [pacs_oltp].[dbo].[__ag_field_imprv_]

GO

