create view __Land_Segments as
SELECT sls.[prop_id]as ParcelID,
		sls.sum_of_land_segs as Sum_Land_Segments,  
		sls.legal_acreage as Legal_Acreage,
		sls.sum_of_land_seg_mrkt_val as Sum_Segment_Market,
		sls.total_ag_unit_price as Total_Ag_UnitPrice
      ,[prop_val_yr]
      ,[CONVERSION BALANCING SEGMENT] as conversion_balancing
      ,[Land Used by Farm Buildings   ] as Land_for_Farm_Buildings
      ,[Rangeland                     ]as Rangeland
      ,[Nonbuildable land             ] as non_buildable
      ,[Open Space Market Value       ]as OS_Market
      ,[Secondary Comm/Indust Land    ]as SecondaryComm_Indust_Land
      ,[Irrigated Pasture             ]as Irr_Pasture
      ,[Primary Commercial/Indust Land]as Primary_Commercial_Industrial_land
      ,[Homesite                      ]as Homesite
      ,[Irrigated Agland              ]as Irr_Agland
      ,[Utility Easement              ]as Utility_easement
      ,[Utility Towers                ]as Utility_Towers
      ,[Land in transition            ]as Land_in_Transition
      ,[Rural Undeveloped             ]as Rural_Undeveloped
      ,[Dry Pasture                   ]as Dry_Pasture
      ,[Easement                      ]as Easement
      ,[Dry Agland                    ]as Dry_Agland
      ,[Common Areas                  ]as Common_Areas
  FROM [pacs_oltp].[dbo].[__land_type]
  left join __sum_land_seg sls on sls.prop_id=__land_type.prop_id

GO

