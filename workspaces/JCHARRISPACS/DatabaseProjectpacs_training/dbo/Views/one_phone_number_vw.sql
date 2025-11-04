
-- HS 35538 (Sai K) 
-- I am changing this view because currently there is no way to determine which phone num the 
-- taxpayer would wish to be displayed as the primary one, therefore 
-- the earlier view as it is was returning all the rows in phone table for that account
-- the group by would not help if the phone_num are same 
-- I have opened another ticket HS 36251 for addressing this primary flag issue

--create view one_phone_number_vw
--as
--select
--p.acct_id,
--phone_id,
--phone_type_cd,
--p.phone_num
--from phone as p with(nolock)
--inner join 
--(
--	select acct_id,max(phone_num) as phone_num
--	from phone with(nolock)
--	group by acct_id
--) as max_phone on
--p.acct_id=max_phone.acct_id and
--p.phone_num=max_phone.phone_num


create view one_phone_number_vw
as
select TOP 1
p.acct_id,
phone_id,
phone_type_cd,
p.phone_num
from phone as p with(nolock)
order by phone_type_cd

GO

