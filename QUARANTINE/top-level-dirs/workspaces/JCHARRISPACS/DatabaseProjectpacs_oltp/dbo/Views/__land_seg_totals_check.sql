create view __land_seg_totals_check as
SELECT sls.[prop_id],
		sls.sum_of_land_segs,  
		sls.legal_acreage,
		sls.sum_of_land_seg_mrkt_val,
		sls.total_ag_unit_price
      ,[prop_val_yr]
      ,[CONVERSION BALANCING SEGMENT]
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
      ,[Common Areas                  ]
  FROM [pacs_oltp].[dbo].[__land_type]
  left join __sum_land_seg sls on sls.prop_id=__land_type.prop_id

GO

