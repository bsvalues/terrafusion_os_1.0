create view __image_mobile as 
SELECT [ref_id]
      ,[ref_year]
      ,[ref_type]
      ,[SKT_JPG   ]
      ,[SKETCH_SM ]
      ,[SKETCH_LG ]
      ,[REET      ]
      ,[SRVY      ]
      ,[PIC       ]
      ,[QLTY Sheet]
      ,[Misc      ]
      ,[MOBILE    ]
      ,[RPA       ]
  FROM [pacs_oltp].[dbo].[__Image_Type_Piv]
  where mobile is not null

GO

