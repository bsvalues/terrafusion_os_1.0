--select Distinct
--  ','   +  quotename(row_id,'[]')as imprv_number

--FROM [pacs_oltp].[dbo].[imprv_number]
-- order by imprv_number

create view Commercial_imprv_num as 
select * from 

(SELECT prop_id, imprv_desc,
    
	 row_id

  FROM [pacs_oltp].[dbo].[imprv_number]
  where imprv_desc is not null and imprv_type_cd ='c'
		

  )     as basedata
  pivot (
  max(imprv_desc)
  for row_id
  in ([1] 
  
  ,[2]
  ,[3]
  ,[4]
  ,[5]
,[6]
,[7]
,[8]
,[9]
,[10]
,[11]
,[12]
,[13]
,[14]
,[15]
,[16]
,[17]
,[18]
,[19]

,[20]
,[21]
,[22]
,[23]
,[24]
,[25]
,[26]
,[27]
,[28]
,[29]

,[30]
,[31]
,[32]
,[33]
,[34]
,[35]
,[36]
,[37]
,[38]
,[39]

,[40]
,[41]
,[42]
,[43]
,[44]
,[45]
,[46]
,[47]
,[48]

  
  )) as pivottable

GO

