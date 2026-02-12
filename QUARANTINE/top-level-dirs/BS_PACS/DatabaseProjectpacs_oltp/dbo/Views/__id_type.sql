
create view [dbo].[__id_type] as
select * from 
(SELECT  prop_id,
    prop_val_yr,
     imprv_det_type_cd
      ,imprv_det_area
  FROM [pacs_oltp].[dbo].[imprv_detail]
 where prop_val_yr=(select appr_yr from pacs_system)--Change if you want soecific years
  )     as basedata
  pivot (
  sum(imprv_det_area)
  for imprv_det_type_cd
  in ([AG-BARN   ]
,[AG-Cannabs]
,[AG-Dairy  ]
,[AG-HAYSTOR]
,[AG-L/FSBrn]
,[AG-MACHINE]
,[AG-POTA/ON]
,[AG-QUONSET]
,[AG-STEELUT]
,[APARTHRS  ]
,[ATTGAR    ]
,[Balcony   ]
,[Bonus Room]
,[BSMT      ]
,[Carport   ]
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
,[MACHINE   ]
,[MHomeAdd  ]
,[Patio     ]
,[POLEBLDG  ]
,[POOL      ]
,[SHED      ]
,[U-BSMT    ]
)) as pivottable

GO

