


Create view __Perm_ls_ag_id_piv as 
select * from 

(SELECT  
    [prop_id],
      [size_acres]
      ,[ls_ag_id]
   FROM [pacs_oltp].[dbo].[land_detail]
where prop_val_yr=(select appr_yr from pacs_system)and sup_num=0 and sale_id=0--Change if you want soecific years
  )     as basedata
  pivot (
  max([size_acres])
  for [ls_ag_id]
  in (
 [460]
,[1868]
,[549]
,[390]
,[510]
,[416]
,[204]
,[2125]
,[9]
,[256]
,[308]
,[1907]
,[22]
,[74]
,[1920]
,[217]
,[178]
,[441]
,[523]
,[478]
,[321]
,[454]
,[126]
,[403]
,[152]
,[243]
,[295]
,[1881]
,[435]
,[562]
,[139]
,[1894]
,[87]
,[466]
,[113]
,[191]
,[35]
,[472]
,[269]
,[230]
,[282]
,[536]
,[165])) as pivottable

GO

