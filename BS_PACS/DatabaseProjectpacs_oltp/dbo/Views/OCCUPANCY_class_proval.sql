create view OCCUPANCY_class_proval as
SELECT  [ID]
      ,[OCCUPANCY_ID]
      ,[VALUATION_METHOD_ID]
      ,[CONSTRUCTION_CLASS_ID]
      ,[LOW_USE_CODE]
      ,[HIGH_USE_CODE]
  FROM [mvp_cost_3Q2016].[mvp].[OCCUPANCY_CLASS]

GO

