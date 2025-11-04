
create view __Image_Type_Piv as 
 select * from 
(SELECT  ref_id,
 ref_year,
     location,
      image_type,
	  ref_type
 FROM [pacs_oltp].[dbo].[pacs_image]
 --where  ref_year=(select appr_yr from pacs_system)--Change if you want soecific years
  )     as basedata
  pivot (
  min(Location)
  for image_type
  in (
 [SKT_JPG   ]
,[SKETCH_SM ]
,[SKETCH_LG ]
,[REET      ]
,[SRVY      ]
,[PIC       ]
,[QLTY Sheet]
,[Misc      ]
,[MOBILE    ]
,[RPA       ]

)) as pivottable

GO

