create view __aLiving_Area as 
SELECT ma.[prop_id]
	--,coords.Prop_ID
      ,[prop_val_yr]
      ,[MA        ]
      ,[MA - BNV  ]
      ,[MA-1.5 Sty]
      ,[MA-2 Sty  ]
      ,[MA-Gov    ]
      ,[MA-Split  ]
      ,[MA-Tri    ]
      ,[MHomeAdd  ]
	  ,XCoord
	  ,YCoord
  FROM [pacs_oltp].[dbo].[__aMA_Area_] ma
   LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],[Shape].STCentroid().STX as XCoord,	[Shape].STCentroid().STY as YCoord 
		FROM [Benton_spatial_data].[dbo].[PARCELSANDASSESS]) as coords
			ON ma.prop_id = coords.Prop_ID AND coords.order_id = 1
				WHERE ma.prop_val_yr = (select appr_yr  from [pacs_oltp].[dbo].pacs_system)  
				and coords.Prop_ID is not null

GO

