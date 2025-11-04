create view __Imprv_Detail_wPercOfBase as 
SELECT 	   
	   [prop_id]
      ,[prop_val_yr]
      ,[ATTGAR    ]					as attached_garage
      ,[Bonus Room]					as bonus_room
      ,[BSMT      ]+[U-BSMT    ]	as Total_Basement
	  ,[BSMT      ]					as finished_basement
	  ,[U-BSMT    ]					as unfinished_basment
      ,[C-BSMTFIN ]					as Comm_BSMTFIN
      ,[C-BSMTFWPF]					as Comm_BSMTFWPF
      ,[C-BSMTSFIN]					as Comm_BSMTSFIN
      ,[C-BSMTUFIN]					as Comm_BSMTUFIN
      ,[MEZZFD    ]
      ,[MEZZFO    ]
      ,[MEZZLCU   ]
      ,[MEZZSF    ]
      ,[MEZZUF    ]
      ,[RESGARA   ]
      
  FROM [pacs_oltp].[dbo].[__aImprv_PercOfBase]

GO

