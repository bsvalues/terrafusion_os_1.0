


CREATE procedure ValidateExport

as

declare @date	datetime
declare @missing_payment_records	int
declare @missing_refund_records		int
declare @missing_adj_records		int
declare @duplicate_recap_records	int
declare @record_imbalance		int
declare @property_imbalance		int
declare @valid_export			int

select @date = max(balance_dt) From batch_close_day

set @date = dateadd(dd, 1, @date)

select @missing_payment_records = count(*)
From payment_trans pt with (nolock), payment p  with (nolock), batch  with (nolock)
where p.payment_id = pt.payment_id
and   p.batch_id = batch.batch_id
and   batch.balance_dt < @date 
and   isnull(batch.close_dt,'') <> ''
and   not exists (select *
from recap_trans   with (nolock) where type in ('SA', 'P', 'VP', 'VEP', 'EP')
and  bill_id = pt.bill_id
and  ref_id1 = pt.transaction_id) 
and	 pt.bill_id is not null		-- HS 38794
and   not exists (select *
from validate_coll_export_exclude_bills with (nolock) where bill_id = pt.bill_id )

select @missing_refund_records = count(*)
From refund_trans pt with (nolock), refund p with (nolock), batch  with (nolock)
where p.refund_id = pt.refund_id
and   p.batch_id = batch.batch_id
and   batch.balance_dt < @date 
and   isnull(batch.close_dt,'') <> ''
and   not exists (select *
from recap_trans   with (nolock) where type in ('R', 'VR')
and  bill_id = pt.bill_id
and  ref_id1 = pt.transaction_id) 
and   not exists (select *
from validate_coll_export_exclude_bills with (nolock) where bill_id = pt.bill_id )

select @missing_adj_records = count(*)
from bill_adj_trans baj
where modify_dt < @date
and   not exists (select *
from recap_trans   with (nolock) where type in ('A')
and  bill_id = baj.bill_id
and  ref_id1 = baj.adjust_id) 
and   not exists (select *
from validate_coll_export_exclude_bills with (nolock) where bill_id = baj.bill_id )


select @duplicate_recap_records = count(distinct ref_id1)
from recap_trans rt with (nolock)
where exists (
select *
from recap_trans rt1 with (nolock)
where rt.type = rt1.type
and   rt.ref_id1 = rt1.ref_id1
and   rt.bill_id = rt1.bill_id
and   not exists (select *
from validate_coll_export_exclude_bills with (nolock) where bill_id = rt1.bill_id )
group by type, ref_id1, bill_id
having count(*) > 1
)


truncate table balance_report


select
	bill.bill_id,
	sup_tax_yr,
	sup_num,
	entity_id,
	prop_id,
	owner_id,
	adjustment_code,
	adj_effective_dt,
	adj_expiration_dt,
	adj_comment,
	rollback_id,
	coll_status_cd,
	bill_type,
	effective_due_dt,
	bill_m_n_o,
	bill_i_n_s,
	bill_m_n_o + sum(IsNull(mno_adj, 0)) as bill_adj_m_n_o,
	bill_i_n_s + sum(IsNull(ins_adj, 0)) as bill_adj_i_n_s,
	bill_prot_i_n_s,
	bill_late_ag_penalty,
	sum(IsNull(mno_amt, 0))      as bill_m_n_o_pd,
	sum(IsNull(ins_amt, 0))      as bill_i_n_s_pd,
	sum(IsNull(pen_mno_amt, 0))  as penalty_m_n_o_pd,
	sum(IsNull(pen_ins_amt, 0))  as penalty_i_n_s_pd,
	sum(IsNull(int_mno_amt, 0))  as interest_m_n_o_pd,
	sum(IsNull(int_ins_amt, 0))  as interest_i_n_s_pd,
	sum(IsNull(atty_fee_amt, 0)) as attorney_fees_pd,
	bill_assessed_value,
	bill_taxable_val,
	stmnt_id,
	sum(IsNull(disc_mno_amt, 0))   as discount_mno_pd,
	sum(IsNull(disc_ins_amt, 0))   as discount_ins_pd,
	prev_bill_id,
	new_bill_id,
	create_dt,
	bill.ref_id1,
	ref_id2,
	ref_id3,
	ref_id4,
	ref_id5,
	discount_offered,
	levy_group_id,
	levy_run_id,
	active_bill,
	0 as refund_m_n_o_pd,
	0 as refund_i_n_s_pd,
	0 as refund_pen_m_n_o_pd,
	0 as refund_pen_i_n_s_pd,
	0 as refund_int_m_n_o_pd,
	0 as refund_int_i_n_s_pd,
	0 as refund_atty_fee_pd,
	sum(IsNull(under_mno_amt, 0)) as underage_mno_pd,
	sum(IsNull(under_ins_amt, 0)) as underage_ins_pd,
	sum(IsNull(over_mno_amt,  0)) as overage_mno_pd,
	sum(IsNull(over_ins_amt,  0)) as overage_ins_pd,
	0 as refund_disc_mno_pd,
	0 as refund_disc_ins_pd,
	ia_id,
	pay_type,
	pay1_amt,
	pay1_paid,
	pay1_due_dt,
	pay2_amt,
	pay2_paid,
	pay2_due_dt,
	pay3_amt,
	pay3_paid,
	pay3_due_dt,
	pay4_amt,
	pay4_paid,
	pay4_due_dt,
	pay_created_dt,
	pay_removed_dt,
	pay_created_by,
	pay_removed_by
into #bill
from bill with (nolock)
	left outer join recap_trans rt with (nolock)     
	on    bill.bill_id = rt.bill_id
	and   rt.balance_dt <  @date
group by
	bill.bill_id,
	sup_tax_yr,
	sup_num,
	entity_id,
	prop_id,
	owner_id,
	adjustment_code,
	adj_effective_dt,
	adj_expiration_dt,
	adj_comment,
	rollback_id,
	coll_status_cd,
	bill_type,
	effective_due_dt,
	bill_m_n_o,
	bill_i_n_s,
	bill_prot_i_n_s,
	bill_late_ag_penalty,
	bill_assessed_value,
	bill_taxable_val,
	stmnt_id,
	prev_bill_id,
	new_bill_id,
	create_dt,
	bill.ref_id1,
	ref_id2,
	ref_id3,
	ref_id4,
	ref_id5,
	discount_offered,
	levy_group_id,
	levy_run_id,
	active_bill,
	ia_id,
	pay_type,
	pay1_amt,
	pay1_paid,
	pay1_due_dt,
	pay2_amt,
	pay2_paid,
	pay2_due_dt,
	pay3_amt,
	pay3_paid,
	pay3_due_dt,
	pay4_amt,
	pay4_paid,
	pay4_due_dt,
	pay_created_dt,
	pay_removed_dt,
	pay_created_by,
	pay_removed_by



select bill.sup_tax_yr, bill.bill_id, bill.entity_id,  bill.prop_id,(bill.bill_adj_m_n_o + bill.bill_adj_i_n_s) - (bill.bill_m_n_o + bill.bill_i_n_s) as bill_adj,

((bill.bill_m_n_o_pd + bill.bill_i_n_s_pd + bill.discount_mno_pd + bill.discount_ins_pd + bill.underage_mno_pd +  bill.underage_ins_pd) - 
	 (bill.refund_m_n_o_pd + bill.refund_i_n_s_pd + bill.refund_disc_mno_pd + bill.refund_disc_ins_pd)) as bill_pd,

(bill.bill_adj_m_n_o + bill.bill_adj_i_n_s) - 
	((bill.bill_m_n_o_pd + bill.bill_i_n_s_pd + bill.discount_mno_pd + bill.discount_ins_pd + bill.underage_mno_pd +  bill.underage_ins_pd) - 
	 (bill.refund_m_n_o_pd + bill.refund_i_n_s_pd + bill.refund_disc_mno_pd + bill.refund_disc_ins_pd)) as bill_amt_due
,
    
(#bill.bill_adj_m_n_o + #bill.bill_adj_i_n_s) - 
((#bill.bill_m_n_o_pd + #bill.bill_i_n_s_pd + #bill.discount_mno_pd + #bill.discount_ins_pd + #bill.underage_mno_pd +  #bill.underage_ins_pd) - 
(#bill.refund_m_n_o_pd + #bill.refund_i_n_s_pd + #bill.refund_disc_mno_pd + #bill.refund_disc_ins_pd)) as trans_amt_due


into #temp

from 
#bill, bill with (nolock)
where #bill.bill_id = bill.bill_id
and  (bill.bill_adj_m_n_o + bill.bill_adj_i_n_s) - 
	((bill.bill_m_n_o_pd + bill.bill_i_n_s_pd + bill.discount_mno_pd + bill.discount_ins_pd + bill.underage_mno_pd +  bill.underage_ins_pd) - 
	 (bill.refund_m_n_o_pd + bill.refund_i_n_s_pd + bill.refund_disc_mno_pd + bill.refund_disc_ins_pd))
<>
    
(#bill.bill_adj_m_n_o + #bill.bill_adj_i_n_s) - 
((#bill.bill_m_n_o_pd + #bill.bill_i_n_s_pd + #bill.discount_mno_pd + #bill.discount_ins_pd + #bill.underage_mno_pd +  #bill.underage_ins_pd) - 
(#bill.refund_m_n_o_pd + #bill.refund_i_n_s_pd + #bill.refund_disc_mno_pd + #bill.refund_disc_ins_pd))

and bill.coll_status_cd <> 'RS'
and IsNull(bill.active_bill, 'T') <> 'F'
and bill.prop_id <> -1

-- exclude bills that have had payments/adjustments/refunds after the last date paid
and not exists (select * From payment_trans pt with (nolock),
			      payment p with (nolock),
			      batch with (nolock)
		 where p.payment_id = pt.payment_id
		 and   p.batch_id = batch.batch_id
		 and   pt.bill_id = bill.bill_id
		 and   batch.balance_Dt >= @date)
and not exists (select * From refund_trans rt with (nolock),
			      refund r with (nolock),
			      batch with (nolock)
		 where r.refund_id = rt.refund_id
		 and   r.batch_id = batch.batch_id
		 and   rt.bill_id = bill.bill_id
		 and   batch.balance_Dt >= @date)
and not exists (select * From bill_adj_trans with (nolock)
		where bill_adj_trans.bill_id = bill.bill_id
		and   bill_adj_trans.modify_dt >= @date)


-- produce report of differences

	declare @bill_id		int
	declare @prop_id		int
	declare @bill_amt_due		numeric(14,2)
	declare @trans_amt_due		numeric(14,2)
	declare @bill_adj		numeric(14,2)
	declare @bill_pd		numeric(14,2)
	declare @payment_amt		numeric(14,2)
	declare @refund_amt		numeric(14,2)
	declare @adj_amt		numeric(14,2)
	declare @recap_payment_amt	numeric(14,2)
	declare @recap_adj_amt		numeric(14,2)
	declare @comment		varchar(500)

	declare bill_cursor scroll cursor
	for select bill_id, prop_id, bill_adj, bill_pd, bill_amt_due, trans_amt_due
	from #temp 

	open bill_cursor
	fetch next from bill_cursor into @bill_id, @prop_id, @bill_adj, @bill_pd, @bill_amt_due, @trans_amt_due

	while (@@FETCH_STATUS = 0)
	begin

		select @payment_amt = IsNull(sum(mno_amt + ins_amt + discount_mno_amt + discount_ins_amt + underage_mno_amt + underage_ins_amt ), 0)
		from payment_trans with (nolock)
		where bill_id = @bill_id
		
		select @refund_amt = IsNull(sum(refund_m_n_o_pd + refund_i_n_s_pd + refund_disc_mno_pd + refund_disc_ins_pd), 0)
		from refund_trans with (nolock)
		where bill_id = @bill_id
		
		
		select @adj_amt = IsNull(sum( (curr_mno_tax + curr_ins_tax) - (prev_mno_tax + prev_ins_tax)), 0)
		from bill_adj_trans with (nolock)
		where bill_id = @bill_id
		
		select @recap_payment_amt = sum(mno_amt + ins_amt), 
		       @recap_adj_amt     = sum(mno_adj + ins_adj) 
		From recap_trans with (nolock) where bill_id = @bill_id

		set @comment = ''

		if (@recap_adj_amt <> @adj_amt and @adj_amt = @bill_adj)
		begin
			set @comment = 'Duplicate Adj Amount in Recap_Trans'
		end
		else if (@recap_payment_amt <> (@payment_amt - @refund_amt) and (@payment_amt - @refund_amt) = @bill_pd)
		begin
			set @comment = 'Duplicate Trans Amount in Recap_Trans'
		end
		else if (@bill_pd <> (@payment_amt - @refund_amt) )
		begin
			set @comment = 'Payment Trans Amount does not equal Bill Paid Amount, contact Development'
		end
		else if (@bill_adj <> @adj_amt)
		begin
			set @comment = 'Bill Adj Trans Amount does not equal Bill Adj Amount, contact Development'
		end
		
		
		insert into balance_report (bill_id, prop_id, bill_amt_due, trans_amt_due, 
					     bill_amt, bill_adj, trans_amt, trans_adj,
					     recap_trans_amt, recap_adj_amt, comment)
		select @bill_id, @prop_id, @bill_amt_due, @trans_amt_due, @bill_pd, @bill_adj, 
			(@payment_amt - @refund_amt) as trans_amt,  @adj_amt as adj_amt, 
			@recap_payment_amt as recap_trans_amt,  @recap_adj_amt as recap_adj_amt, @comment
		
		fetch next from bill_cursor into @bill_id, @prop_id, @bill_adj, @bill_pd, @bill_amt_due, @trans_amt_due
	end

	close bill_cursor
	deallocate bill_cursor


drop table #bill
drop table #temp

delete from balance_report
where exists (select *
from validate_coll_export_exclude_bills with (nolock) where bill_id = balance_report.bill_id )

select @record_imbalance = count(*) From balance_report 
select @property_imbalance = count(distinct prop_id) from balance_report 


if (@missing_payment_records = 0 and 
    @missing_refund_records  = 0 and
    @missing_adj_records     = 0 and
--  @duplicate_recap_records = 0 and      	HS 38766      
    @property_imbalance = 0 and
    @record_imbalance = 0)
begin
	set @valid_export = 1
end
else
begin
	set @valid_export = 0
end


IF NOT EXISTS (select name from tempdb.dbo.sysobjects where name = 
	'##temp_col_export_valid')
begin

	CREATE TABLE [##temp_col_export_valid] (
		[spid] [int] NOT NULL ,
		[valid_export] [int] NOT NULL ,
		[missing_payment_records] [int] NULL ,
		[missing_refund_records] [int] NULL ,
		[missing_adj_records] [int] NULL ,
		[duplicate_recap_records] [int] NULL ,
		[property_imbalance] [int] NULL ,
		[record_imbalance] [int] NULL 
	) ON [PRIMARY]
	

End

delete from ##temp_col_export_valid where spid = @@SPID

insert into ##temp_col_export_valid values
(
	@@spid,
	@valid_export, 
	@missing_payment_records, 
	@missing_refund_records, 
	@missing_adj_records,
	@duplicate_recap_records,
	@property_imbalance,
	@record_imbalance
)
/*
select  @valid_export 		 as 'valid_export',
	@missing_payment_records as 'missing_payment_records',
        @missing_refund_records  as 'missing_refund_records',
        @missing_adj_records     as 'missing_adj_records',
        @duplicate_recap_records as 'duplicate_recap_records',
	@property_imbalance	 as 'property_imbalance',
	@record_imbalance        as 'record_imbalance'




*/

GO

