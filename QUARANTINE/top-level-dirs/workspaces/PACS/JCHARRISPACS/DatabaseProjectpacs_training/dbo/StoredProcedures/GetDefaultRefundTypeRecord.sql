 
create procedure GetDefaultRefundTypeRecord (@trans_group_id int)
as

declare @itemtype varchar(10)
declare @last_modify_cd varchar(10)
declare @year numeric(4,0)

set @itemtype = (select top 1 trans_group_type from trans_group
		where trans_group_id = @trans_group_id)

-- bills
if @itemtype in ('LB','AB')
begin

select top 1 @last_modify_cd = modify_cd
from bill_adjustment
where bill_id = @trans_group_id
order by bill_adj_id desc

select @year = year(trans.transaction_date) - 1
from coll_transaction trans
join trans_group tg
on tg.mrtransid_pay = trans.transaction_id
where tg.trans_group_id = @trans_group_id

end

-- fees
else if @itemtype = 'F'
begin

select top 1 @last_modify_cd = modify_cd
from fee_adjustment
where fee_id = @trans_group_id
order by fee_adj_id desc

select @year = year(trans.transaction_date) - 1
from coll_transaction trans
join trans_group tg
on tg.mrtransid_pay = trans.transaction_id
where tg.trans_group_id = @trans_group_id

end

-- overpayment credit

else if @itemtype = 'OC'
begin

select @year = year(trans.transaction_date) - 1
from coll_transaction trans
join trans_group tg
on tg.mrtransid_opc = trans.transaction_id
where tg.trans_group_id = @trans_group_id

end

-- results

if @itemtype = 'OC'
begin

select null as last_modify_cd, rt.*
from refund_type rt
where core_refund_type = 1
and year = @year

end

else begin

select @last_modify_cd as last_modify_cd, rt.*
from refund_type rt
where modify_cd = @last_modify_cd
and year = @year

end

GO

