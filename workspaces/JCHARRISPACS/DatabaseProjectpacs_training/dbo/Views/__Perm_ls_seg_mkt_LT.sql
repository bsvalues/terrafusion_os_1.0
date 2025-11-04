 create view __Perm_ls_seg_mkt_LT as
select * from 

(SELECT  
    [prop_id],
      [land_seg_mkt_val]
      ,[land_type_cd]
  FROM [pacs_oltp].[dbo].[land_detail]
  Where prop_val_yr=(select appr_yr  from [pacs_oltp].[dbo].pacs_system)  and sup_num=0 and sale_id=0
  --Change if you want soecific years
  )     as basedata
  pivot (
  max([land_seg_mkt_val])
  for [land_type_cd]
  in (
  [85        ]
,[9         ]
,[41        ]
,[CA        ]
,[86        ]
,[11        ]
,[92        ]
,[4         ]
,[52        ]
,[71        ]
,[12        ]
,[31        ]
,[5         ]
,[93        ]
,[91        ]
,[51        ]
,[CONV      ]
,[83        ])) as pivottable

GO

