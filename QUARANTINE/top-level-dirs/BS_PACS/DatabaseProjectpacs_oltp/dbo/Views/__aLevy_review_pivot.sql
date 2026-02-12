


create view __aLevy_review_pivot as
select * from 

(SELECT  
    [year],
      [tax_district_name]
	  ,levy_type_desc
      ,[final_levy_rate]
  FROM [pacs_oltp].[dbo].[levy_review]
-- where year=(select tax_yr from pacs_system)--Change if you want soecific years
  )     as basedata
  pivot (
  sum(final_levy_rate)
  for levy_type_desc
  in ([ADMINISTRATIVE REFUND]
,[CAPITOL PROJECTS]
,[DEBT SERVICE]
,[EXCESS]
,[MAINTENANCE AND OPERATION LEVY]
,[REGULAR]
,[STATE LEVY PART 1]
,[STATE PART 2])) as pivottable

GO

