

create view __aTax_District_piv as 
  select * from 

( 
  SELECT [prop_id],year
  --    ,[levy_cd]
,[tax_district_id]
,[levy_rate]
--,[tax_district]
  
  FROM [pacs_oltp].[dbo].[levy_bill_vw]
-- where year=(select tax_yr from pacs_system)--Change if you want soecific years
  )     as basedata
  pivot (
  sum(levy_rate)
  for tax_district_id
  in ([503]
,[124302]
,[502]
,[501]
,[529]
,[530]
,[520]
,[504]
,[531]
,[525]
,[513]
,[516]
,[189374]
,[507]
,[528]
,[535]
,[518]
,[536]
,[519]
,[533]
,[218537]
,[532]
,[155172]
,[538]
,[514]
,[506]
,[534]
,[517]
,[505])) as pivottable
where year=(select appr_yr-1 from pacs_system)


--select distinct  ','   +  quotename(   tax_district_id,'[]')as  tax_district FROM [pacs_oltp].[dbo].[levy_bill_vw]
 --where year=2018

GO

