  
  Create view __aTax_District_Cert_yr as 
  select * from 
( 
  SELECT [prop_id]
      --,[levy_cd]
      ,[year]
      --,[tax_district_id]
      ,[rollback_id]
      ,[taxable_val]
      ,[levy_rate]
   ,[tax_district]
  
  FROM [pacs_oltp].[dbo].[levy_bill_vw]
-- where year=(select tax_yr from pacs_system)--Change if you want soecific years
  )     as basedata
  pivot (
  sum(levy_rate)
  for tax_district
  in ([KENNEWICK SD 17]
,[FINLEY SD 53]
,[FIRE DISTRICT #5]
,[CITY OF BENTON CITY]
,[MID-COLUMBIA LIBRARY]
,[COUNTY BENTON]
,[CITY OF KENNEWICK]
,[FIRE DISTRICT #2]
,[FIRE DISTRICT #4 EMS]
,[PROSSER SD 116]
,[RICHLAND SD 400]
,[CITY OF RICHLAND]
,[COUNTY BENTON ROAD]
,[STATE SCHOOL]
,[FIRE DISTRICT #6]
,[CITY OF WEST RICHLAND]
,[PROSSER HOSPITAL]
,[KENNEWICK HOSPITAL]
,[PATERSON SD 50]
,[BENTON CITY LIBRARY CAPITAL FACILITY]
,[WEST BENTON REGIONAL FIRE AUTHORITY]
,[PORT OF BENTON]
,[PORT OF KENNEWICK]
,[FIRE DISTRICT #4]
,[CITY OF PROSSER]
,[GRANDVIEW SD 200]
,[KIONA BENTON SD 52]
,[FIRE DISTRICT #1]
,[FIRE DISTRICT #2 EMS])) as pivottable
where year=(select appr_yr-1 from pacs_oltp.dbo.pacs_system)

GO

