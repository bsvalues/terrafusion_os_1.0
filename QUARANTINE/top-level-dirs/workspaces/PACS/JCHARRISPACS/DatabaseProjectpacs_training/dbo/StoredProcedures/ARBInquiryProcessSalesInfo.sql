

create   procedure ARBInquiryProcessSalesInfo

@prop_id	int

as

select top 2
       coo.chg_of_owner_id,
       sale.sl_dt,
       sale.adjusted_sl_price,
       sale.sl_type_cd, 
       coo.deed_dt,
       buyer.file_as_name as buyer,
       seller.file_as_name as seller
from chg_of_owner coo
inner join chg_of_owner_prop_assoc copa on coo.chg_of_owner_id = copa.chg_of_owner_id
left outer join sale on coo.chg_of_owner_id = sale.chg_of_owner_id
left outer join buyer_assoc ba on coo.chg_of_owner_id = ba.chg_of_owner_id
left outer join seller_assoc sa on coo.chg_of_owner_id = sa.chg_of_owner_id
left outer join account buyer on ba.buyer_id = buyer.acct_id
left outer join account seller on sa.seller_id = seller.acct_id
where copa.prop_id = @prop_id
order by copa.seq_num asc

GO

