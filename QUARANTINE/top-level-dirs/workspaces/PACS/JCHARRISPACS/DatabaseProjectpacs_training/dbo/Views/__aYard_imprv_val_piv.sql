create view  __aYard_imprv_val_piv as
 select * from 
(SELECT  
prop_id,
 prop_val_yr,
     imprv_det_type_cd,
      imprv_det_val
 FROM pacs_oltp.dbo.imprv_detail 
where   prop_val_yr=(select appr_yr from pacs_system)--Change if you want soecific years
  )     as basedata
  pivot (sum(imprv_det_val)
  for imprv_det_type_cd
  in (CovBalc,
  CovDeck,
  CovPatio,
  Deck,
  EncPorch,
  hobby_barn,
  GAZEBO
)) as pivottable

GO

