








CREATE view prop_w_ag
as
select prop_id,
       prop_val_yr,
       sup_num
				    from land_detail  
				    where  state_cd = 'D3'
				    and   sale_id = 0

GO

