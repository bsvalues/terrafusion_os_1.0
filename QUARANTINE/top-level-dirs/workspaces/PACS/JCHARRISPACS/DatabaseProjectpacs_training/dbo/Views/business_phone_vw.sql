
CREATE  view business_phone_vw
as

select acct_id, phone_num,phone_type_cd,phone_id
from phone 
where phone_type_cd = 'B'

GO

