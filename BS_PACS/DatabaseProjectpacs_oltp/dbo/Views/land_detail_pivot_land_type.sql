

--SELECT distinct   ','   +  quotename( land_type_cd,'[]')as land_type_cd FROM [pacs_oltp].[dbo].[land_detail]
create view land_detail_pivot_land_type as
select * from 

(SELECT  
    prop_id    
      ,land_type_cd
	  ,[size_acres]
   FROM [pacs_oltp].[dbo].[land_detail]
where prop_val_yr=(select appr_yr from pacs_system)--Change if you want soecific years
  )     as basedata
  pivot (
  sum([size_acres])
  for land_type_cd
  in ([86]
,[9]
,[4]
,[41]
,[CA]
,[11]
,[5 ]
,[52]
,[83]
,[92]
,[85]
,[12]
,[31]
,[CONV]
,[51]
,[71]
,[93]
,[91])) as pivottable

GO

