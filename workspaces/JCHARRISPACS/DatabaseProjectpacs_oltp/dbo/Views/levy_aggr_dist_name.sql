create view levy_aggr_dist_name as

select * from 

(SELECT  
    [year],
      [tax_district_name]
      ,[final_levy_rate]
  FROM [pacs_oltp].[dbo].[levy_review]
  where year=(select tax_yr from pacs_system)) as basedata
  pivot (
  sum(final_levy_rate)
  for tax_district_name
  in ([BENTON CITY LIBRARY CAPITAL FACILITY  ]
,[CITY OF BENTON CITY  ]
,[CITY OF KENNEWICK  ]
,[CITY OF PROSSER  ]
,[CITY OF RICHLAND  ]
,[CITY OF WEST RICHLAND  ]
,[COUNTY BENTON  ]
,[COUNTY BENTON ROAD  ]
,[FINLEY SD 53  ]
,[FIRE #1 2014 GO BOND  ]
,[FIRE DISTRICT #1  ]
,[FIRE DISTRICT #1 2012 GO BOND  ]
,[FIRE DISTRICT #2  ]
,[FIRE DISTRICT #2 EMS  ]
,[FIRE DISTRICT #4  ]
,[FIRE DISTRICT #4 EMS  ]
,[FIRE DISTRICT #5  ]
,[FIRE DISTRICT #6  ]
,[GRANDVIEW SD 200  ]
,[KENNEWICK HOSPITAL  ]
,[KENNEWICK SD 17  ]
,[KIONA BENTON SD 52  ]
,[MID-COLUMBIA LIBRARY]
,[PATERSON SD 50  ]
,[PORT OF BENTON  ]
,[PORT OF KENNEWICK  ]
,[PROSSER HOSPITAL  ]
,[PROSSER SD 116  ]
,[RICHLAND SD 400  ]
,[STATE SCHOOL]
,[WEST BENTON REGIONAL FIRE AUTHORITY  ])) as pivottable

GO

