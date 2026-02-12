Create View __Imprv_Det_Val as 
SELECT [prop_id]
      ,[prop_val_yr]
      ,[ATTGAR    ]					as attached_garge
	  ,[DETGAR    ]					as detached_garage
	  ,[POLEBLDG  ]					as Pole_building
      ,[Carport   ]
      ,[Bonus Room]					as bonus_room
      ,[BSMT      ]+[U-BSMT    ]	as Total_Basement
	  ,[BSMT      ]					as finished_basement
	  ,[U-BSMT    ]					as unfinished_basment
	  ,[Balcony   ]
      ,[CovBalc   ]
      ,[CovDeck   ]
	  ,[Patio     ]
      ,[CovPatio  ]
      ,[Deck      ]      
      ,[EncPorch  ]
      ,[GAZEBO    ]
      ,[Hobby Barn]					as hobby_barn
      ,[Lean-To   ]					as Lean_to
      ,[LoafingShd]
	  ,[POOL      ]
      ,[SHED      ]
	  ,[SWE]
  FROM [pacs_oltp].[dbo].[__aID_Val_Res]

GO

