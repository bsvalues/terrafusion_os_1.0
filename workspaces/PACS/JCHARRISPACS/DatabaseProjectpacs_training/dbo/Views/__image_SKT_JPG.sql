create view __image_SKT_JPG as 
SELECT [ref_id]
      ,[ref_year]
      ,[ref_type]
      ,[SKT_JPG   ]
      ,[SKETCH_SM ]
      ,[SKETCH_LG ]
      ,[REET      ]
  
      ,[PIC       ]
    
      ,[MOBILE    ]
     
  FROM [pacs_oltp].[dbo].[__Image_Type_Piv]
  where SKT_JPG  is not null

GO

