create view __Image_Test_Piv as 
 select * from 
(SELECT  ref_id,
 ref_year,
     location,
      image_type
 FROM [pacs_oltp].[dbo].[pacs_image]
 --where  ref_year=(select appr_yr from pacs_system)--Change if you want soecific years
  )     as basedata
  pivot (
  min(Location)
  for image_type
  in ([SKT_JPG   ]
,[PIC       ]
,[SRVY      ]
,[SKETCH_LG ]
,[SKETCH_SM ]
,[MOBILE    ]
)) as pivottable

GO

