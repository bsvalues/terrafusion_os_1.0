
create view chg_of_owner_first_seller_vw
as

	select distinct chg_of_owner_id, prop_id, min(seller_id) as seller_id, count(*) as cnt
	from seller_assoc with(nolock)
	group by chg_of_owner_id, prop_id

GO

