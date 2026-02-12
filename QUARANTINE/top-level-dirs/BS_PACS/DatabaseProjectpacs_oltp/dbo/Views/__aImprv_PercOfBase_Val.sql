create view __aImprv_PercOfBase_Val as 
select * from 
(SELECT  prop_id,
    prop_val_yr,
     imprv_det_type_cd
      ,[imprv_det_val]
  FROM [pacs_oltp].[dbo].[imprv_detail]
 where prop_val_yr=(select appr_yr from pacs_system)--Change if you want soecific years
  )     as basedata
  pivot (
  sum([imprv_det_val])
  for imprv_det_type_cd
  in ([ATTGAR    ]
,[Bonus Room]
,[BSMT      ]
,[C-BSMTFIN ]
,[C-BSMTFWPF]
,[C-BSMTSFIN]
,[C-BSMTUFIN]
,[MEZZFD    ]
,[MEZZFO    ]
,[MEZZLCU   ]
,[MEZZSF    ]
,[MEZZUF    ]
,[RESGARA   ]
,[U-BSMT    ]
)) as pivottable

GO

