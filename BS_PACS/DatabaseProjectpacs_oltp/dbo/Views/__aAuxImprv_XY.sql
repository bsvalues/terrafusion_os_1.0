Create view __aAuxImprv_XY as 
SELECT ai.[prop_id]
      ,[ATTGAR    ]
      ,[Bonus Room]
      ,[BSMT      ]
	  ,[U-BSMT    ]
      ,[Carport   ]
      ,[CONC      ]
      ,[CovBalc   ]
      ,[CovDeck   ]
      ,[CovPatio  ]
      ,[Deck      ]
      ,[DETGAR    ]
      ,[EncPorch  ]
	  ,[GAZEBO    ]
	  ,[Hobby Barn]
      ,[Lean-To   ]
      ,[LoafingShd]
      ,[Patio     ]
      ,[POLEBLDG  ]
      ,[POOL      ]
      ,[SHED      ] 
	  ,XCoord,YCoord
      FROM [pacs_oltp].[dbo].[__aAux_Imprv] ai
	  LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],[Shape].STCentroid().STX as XCoord,	[Shape].STCentroid().STY as YCoord 
		FROM [Benton_spatial_data].[dbo].[PARCELSANDASSESS]) as coords
			ON ai.prop_id = coords.Prop_ID AND coords.order_id = 1
				WHERE ai.prop_val_yr = (select appr_yr  from [pacs_oltp].[dbo].pacs_system)

GO

