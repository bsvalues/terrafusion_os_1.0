
create view chg_of_owner_first_buyer_vw
as

	select distinct chg_of_owner_id, min(buyer_id) as buyer_id, count(*) as cnt
	from buyer_assoc with(nolock)
	group by chg_of_owner_id

GO

