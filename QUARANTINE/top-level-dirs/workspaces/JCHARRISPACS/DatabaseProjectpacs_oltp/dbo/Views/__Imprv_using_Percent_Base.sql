create view __Imprv_using_Percent_Base as 
SELECT  [prop_id]
      ,[prop_val_yr]
      ,[ATTGAR    ]
      ,[Bonus Room]
      ,[BSMT      ] as finsihed_basement
      ,[C-BSMTFIN ] as commercial_basementFIN
      ,[C-BSMTFWPF] as commercial_basementFWPF
      ,[C-BSMTSFIN] as commercial_basementSFIN
      ,[C-BSMTUFIN] as commercial_basementUFIN
      ,[MEZZFD    ]
      ,[MEZZFO    ]
      ,[MEZZLCU   ]
      ,[MEZZSF    ]
      ,[MEZZUF    ]
      ,[RESGARA   ]
      ,[U-BSMT    ] as unfinished_basement
  FROM [pacs_oltp].[dbo].[__aImprv_PercOfBase]

GO

