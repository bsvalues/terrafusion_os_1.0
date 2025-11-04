create view New_Construction_Permit_Val_Piv as
select * from 

(SELECT  
 
    [prop_id],order_id,bldg_permit_val
      
    FROM New_Constuction_permit_permit_val
--where prop_val_yr=(select appr_yr from pacs_system)and sup_num=0 and sale_id=0--Change if you want soecific years
  )     as basedata
  pivot (
  max([bldg_permit_val])
  for [order_id]
  in (
 [1]
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

)) as pivottable

GO

