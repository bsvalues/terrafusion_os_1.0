create view __aRES_imprv_det_ValPV as
select * from 

(SELECT  
    [prop_id],
	imprv_det_type_cd,
	imprv_det_val

     
  FROM [pacs_oltp].[dbo].[imprv_DETAIL]
where prop_val_yr=(select appr_yr from pacs_system)--Change if you want soecific years
  )     as basedata
  pivot (
  max(imprv_det_val)
  for imprv_det_type_cd
  in (

[LEANTO    ]
,[CovBalc   ]
,[LOWER     ]
,[Hobby Barn]
,[LoafingShd]
,[DETGAR    ]
,[EncPorch  ]
,[Lean-To   ]
,[Patio     ]
,[CovDeck   ]
,[GAZEBO    ]
,[Carport   ]
,[ATTGAR    ]
,[POLEBLDG  ]
,[Deck      ]
,[SWE       ]
,[Balcony   ]
,[POOL      ]
,[SHED      ]
,[CovPatio  ]

)) as pivottable

GO

