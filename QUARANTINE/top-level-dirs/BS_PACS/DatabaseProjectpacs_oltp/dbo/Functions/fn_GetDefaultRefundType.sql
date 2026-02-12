 
create function fn_GetDefaultRefundType (@trans_group_id int)
returns varchar(50)
as
begin

declare @itemtype varchar(50)
declare @default_refund_cd varchar(50)
declare @year numeric(4,0)

set @itemtype = (select top 1 trans_group_type from trans_group
		where trans_group_id = @trans_group_id)
				
set @default_refund_cd = ''

-- bills
if @itemtype in ('LB','AB')
begin

select @year = year(trans.transaction_date) - 1
from coll_transaction trans
join trans_group tg
on tg.mrtransid_pay = trans.transaction_id
where tg.trans_group_id = @trans_group_id		

set @default_refund_cd =
(select top 1 rt.refund_type_cd from refund_type rt with (nolock)

inner join bill_adjustment ba with (nolock)
on ba.modify_cd = rt.modify_cd

where ba.bill_id = @trans_group_id
and rt.year = @year
order by ba.bill_adj_id desc)

end

-- fees
else if @itemtype in ('F')
begin

select @year = year(trans.transaction_date) - 1
from coll_transaction trans
join trans_group tg
on tg.mrtransid_pay = trans.transaction_id
where tg.trans_group_id = @trans_group_id		

set @default_refund_cd =
(select top 1 rt.refund_type_cd from refund_type rt with (nolock)

inner join fee_adjustment fa with (nolock)
on fa.modify_cd = rt.modify_cd

where fa.fee_id = @trans_group_id
and rt.year = @year
order by fa.fee_adj_id desc)

end

-- overpayment credits
else if @itemtype in ('OC')
begin

select @year = year(trans.transaction_date) - 1
from coll_transaction trans
join trans_group tg
on tg.mrtransid_opc = trans.transaction_id
where tg.trans_group_id = @trans_group_id		

set @default_refund_cd = (select rt.refund_type_cd
from refund_type rt
where core_refund_type = 1
and year = @year)

end

-- Null will be returned if the item is not a bill or fee, or if it
-- does not have an adjustment

return @default_refund_cd
end

GO

