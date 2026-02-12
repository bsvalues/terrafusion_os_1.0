


 --SELECT distinct ','   +  quotename([land_type_desc],'[]')as imprv_desc  FROM [web_internet_benton].[dbo].[_clientdb_land_detail]  where prop_val_yr=2019 
 create view [dbo].[__land_type] as
  select * from 

(SELECT  prop_id,
    prop_val_yr,
      [land_type_desc]
      ,[size_acres]
  FROM [web_internet_benton].[dbo].[_clientdb_land_detail]
 -- where year=(select tax_yr from pacs_system)--Change if you want soecific years
  )     as basedata
  pivot (
  sum(size_acres)
  for land_type_desc
  in ([CONVERSION BALANCING SEGMENT]
,[Land Used by Farm Buildings   ]
,[Rangeland                     ]
,[Nonbuildable land             ]
,[Open Space Market Value       ]
,[Secondary Comm/Indust Land    ]
,[Irrigated Pasture             ]
,[Primary Commercial/Indust Land]
,[Homesite                      ]
,[Irrigated Agland              ]
,[Utility Easement              ]
,[Utility Towers                ]
,[Land in transition            ]
,[Rural Undeveloped             ]
,[Dry Pasture                   ]
,[Easement                      ]
,[Dry Agland                    ]
,[Common Areas                  ])) as pivottable
where prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)

GO

