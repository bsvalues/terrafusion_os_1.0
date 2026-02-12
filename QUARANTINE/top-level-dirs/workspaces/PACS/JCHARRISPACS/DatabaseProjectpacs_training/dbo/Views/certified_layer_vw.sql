
create view certified_layer_vw
as
	select
		prop_val_yr = tax_yr,
		sup_num = 0,
		bCertified = case
			when certification_dt is not null
			then 1
			else 0
		end
	from pacs_year

	union all

	select
		prop_val_yr = supplement.sup_tax_yr,
		supplement.sup_num,
		bCertified = case
			when sup_group.sup_accept_dt is not null
			then 1
			else 0
		end
	from supplement
	join sup_group on
		supplement.sup_group_id = sup_group.sup_group_id
	where
		supplement.sup_num <> 0

GO

