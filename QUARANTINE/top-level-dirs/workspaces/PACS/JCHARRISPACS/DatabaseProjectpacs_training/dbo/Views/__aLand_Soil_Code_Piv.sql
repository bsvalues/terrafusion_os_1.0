create view __aLand_Soil_Code_Piv as
  select * from 

(SELECT  
    [prop_id]

	  ,land_soil_code
      ,[size_acres]
  FROM [pacs_oltp].[dbo].[land_detail]ld
 -- where year=(select tax_yr from pacs_system)--Change if you want soecific years
  )     as basedata
  pivot (
  sum(size_acres)
  for land_soil_code
  in ([BMIA2     ]
,[SITE      ]
,[SITEB     ]
,[WCIA2     ]
,[CRIA3     ]
,[IRPA3     ]
,[SITER     ]
,[DRAG5     ]
,[SITCR     ]
,[WCIP      ]
,[CRIA2     ]
,[CRIA1     ]
,[RCIP      ]
,[BMDRP     ]
,[DRAG3     ]
,[RMIA1     ]
,[RMIA2     ]
,[BMIA1     ]
,[BASE$     ]
,[IRAG1     ]
,[NONE      ]
,[WASTE     ]
,[WCIA3     ]
,[IRPA1     ]
,[RANGE     ]
,[IRAG2     ]
,[RHS       ]
,[SITE1     ]
,[DRPA2     ]
,[DRAG4     ]
,[DRPNV     ]
,[RCIA1     ]
,[DRAG2     ]
,[IRPA2     ]
,[OSOS      ]
,[RCIA2     ]
,[RMDRP     ]
,[SITEC     ]
,[DRPA1     ]
,[DRPA3     ]
,[IRAG3     ]
,[DRAG1     ]
,[SITEI     ]
,[RCIA3     ]
,[WCIA1     ])) as pivottable

GO

