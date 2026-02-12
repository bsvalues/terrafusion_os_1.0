create view __AG_imprv_det_ValPV as
select * from 

(SELECT  
    [prop_id],
	imprv_det_type_cd,
	imprv_det_val

     
  FROM [pacs_oltp].[dbo].[imprv_DETAIL]
where prop_val_yr=(select appr_yr from pacs_system)--Change if you want soecific years
  )     as basedata
  pivot (
  max(imprv_det_val)
  for imprv_det_type_cd
  in (
[AG-Arena  ]
,[AG-BARN   ]
,[AG-Cannabs]
,[AG-Dairy  ]
,[AG-HAYSTOR]
,[AG-L/FSBrn]
,[AG-POTA/ON]
,[AG-QUONSET]
,[AG-STEELUT]
)) as pivottable

GO

