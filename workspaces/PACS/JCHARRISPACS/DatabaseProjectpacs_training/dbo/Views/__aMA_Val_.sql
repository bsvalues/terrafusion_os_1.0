create view __aMA_Val_ as 

select * from 
(SELECT  prop_id,
    prop_val_yr,
     imprv_det_type_cd

      ,
	  [imprv_det_val]
	  --[unit_price]
	  --[imprv_det_area]
  FROM [pacs_oltp].[dbo].[imprv_detail]
 where prop_val_yr=(select appr_yr from pacs_system)--Change if you want soecific years
  )     as basedata
  pivot (
 --sum([imprv_det_area]
 --sum([unit_price]
 sum([imprv_det_val]
  
  )
  for imprv_det_type_cd
  in (
 [MA        ]
,[MA - BNV  ]
,[MA-1.5 Sty]
,[MA-2 Sty  ]
,[MA-Gov    ]
,[MA-Split  ]
,[MA-Tri    ]
,[MHomeAdd  ]

)) as pivottable

GO

