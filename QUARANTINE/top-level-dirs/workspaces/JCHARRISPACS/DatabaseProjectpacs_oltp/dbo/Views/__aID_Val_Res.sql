
create view [dbo].[__aID_Val_Res] as 
select * from 
(SELECT  prop_id,
    prop_val_yr,
     imprv_det_type_cd

      ,[imprv_det_val]
	  --[unit_price]
	  --[imprv_det_area]
  FROM [pacs_oltp].[dbo].[imprv_detail]
 where prop_val_yr=(select appr_yr from pacs_system)--Change if you want soecific years
  )     as basedata
  pivot (
 -- sum([imprv_det_area]
 --sum([unit_price]
 sum([imprv_det_val]
  
  )
  for imprv_det_type_cd
  in (
      [ATTGAR    ]				--	as attached_garage
	  ,[DETGAR    ]				--	as detached_garage
	  ,[POLEBLDG  ]					--as Pole_building
      ,[Carport   ]
      ,[Bonus Room]					--as bonus_room
      ,[BSMT      ]					--+[U-BSMT    ]	--as Total_Basement
	  								--as finished_basement
	  ,[U-BSMT    ]					--as unfinished_basment
	  ,[Balcony   ]
      ,[CovBalc   ]
      ,[CovDeck   ]
	  ,[Patio     ]
      ,[CovPatio  ]
      ,[Deck      ]      
      ,[EncPorch  ]
      ,[GAZEBO    ]
      ,[Hobby Barn]					--as hobby_barn
      ,[Lean-To   ]
      ,[LoafingShd]
	  ,[POOL      ]
      ,[SHED      ]
	  ,[SWE]
)) as pivottable

GO

