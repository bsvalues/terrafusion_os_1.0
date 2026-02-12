








CREATE view prop_w_timber
as
select prop_id,
       prop_val_yr,
       sup_num
				    from land_detail  
				    where   state_cd = 'D2'
				    and   sale_id = 0

GO

