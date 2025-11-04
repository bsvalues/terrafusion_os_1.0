create view __aIdt as
SELECT [prop_id]
      ,[prop_val_yr]
      ,[AG-BARN   ] as ag_barn
      ,[AG-Cannabs] as ag_cannabs
      ,[AG-Dairy  ] as ag_dairy
      ,[AG-HAYSTOR] as ag_haystor
      ,[AG-L/FSBrn] as ag_lf_brn
      ,[AG-MACHINE] as ag_machine
      ,[AG-POTA/ON] as ag_potato
      ,[AG-QUONSET] as ag_quonset
      ,[AG-STEELUT] as ag_steelut
      ,[APARTHRS  ]
      ,[ATTGAR    ]
      ,[Balcony   ]
      ,[Bonus Room] as bonus_room
      ,[BSMT      ]
      ,[Carport   ]
      ,[CovBalc   ]
      ,[CovDeck   ]
      ,[CovPatio  ]
      ,[Deck      ]
      ,[DETGAR    ]
      ,[EncPorch  ]
      ,[GAZEBO    ]
      ,[Hobby Barn] as hobby_barn
      ,[Lean-To   ] as learn_to
      ,[LoafingShd]
      ,[MACHINE   ]
      ,[Patio     ]
      ,[POLEBLDG  ]
      ,[POOL      ]
      ,[SHED      ]
      ,[U-BSMT    ] as unfinished_basement
  FROM [pacs_oltp].[dbo].[__id_type]

GO

