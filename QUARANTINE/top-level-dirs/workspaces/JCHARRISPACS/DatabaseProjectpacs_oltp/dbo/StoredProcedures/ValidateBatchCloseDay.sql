




create procedure ValidateBatchCloseDay

@input_begin_dt	datetime,
@input_end_dt	datetime

as


declare @missing_payment_records	int
declare @missing_refund_records		int
declare @missing_adj_records		int
declare @duplicate_recap_records	int
declare @valid_close			int

set @input_end_dt = dateadd(dd, 1, @input_end_dt)



select @missing_payment_records = count(*)
From payment_trans pt with (nolock), payment p  with (nolock), batch  with (nolock)
where p.payment_id = pt.payment_id
and   p.batch_id = batch.batch_id
and   batch.balance_dt >= @input_begin_dt
and   batch.balance_dt <  @input_end_dt 
and   not exists (select *
from recap_trans   with (nolock) where type in ('SA', 'P', 'VP', 'VEP')
and  bill_id = pt.bill_id
and  ref_id1 = pt.transaction_id) 

select @missing_refund_records = count(*)
From refund_trans pt with (nolock), refund p with (nolock), batch  with (nolock)
where p.refund_id = pt.refund_id
and   p.batch_id = batch.batch_id
and   batch.balance_dt >= @input_begin_dt
and   batch.balance_dt <  @input_end_dt 
and   not exists (select *
from recap_trans   with (nolock) where type in ('R', 'VR')
and  bill_id = pt.bill_id
and  ref_id1 = pt.transaction_id) 

select @missing_adj_records = count(*)
from bill_adj_trans baj
where modify_dt >= @input_begin_dt
and   modify_dt < @input_end_dt
and   not exists (select *
from recap_trans   with (nolock) where type in ('A')
and  bill_id = baj.bill_id
and  ref_id1 = baj.adjust_id) 


select @duplicate_recap_records = count(distinct ref_id1)
from recap_trans rt with (nolock)
where balance_dt >= @input_begin_dt
and   balance_dt <  @input_end_dt
and   exists (
select *
from recap_trans rt1 with (nolock)
where rt.type = rt1.type
and   rt.ref_id1 = rt1.ref_id1
and   rt.bill_id = rt1.bill_id
group by type, ref_id1, bill_id
having count(*) > 1
)


if (@missing_payment_records = 0 and 
    @missing_refund_records  = 0 and
    @missing_adj_records     = 0 and
    @duplicate_recap_records = 0)
begin
	set @valid_close = 1
end
else
begin
	set @valid_close = 0
end
 
select  @valid_close 		 as 'valid_close',
	@missing_payment_records as 'missing_payment_records',
        @missing_refund_records  as 'missing_refund_records',
        @missing_adj_records     as 'missing_adj_records',
        @duplicate_recap_records as 'duplicate_recap_records'

GO

