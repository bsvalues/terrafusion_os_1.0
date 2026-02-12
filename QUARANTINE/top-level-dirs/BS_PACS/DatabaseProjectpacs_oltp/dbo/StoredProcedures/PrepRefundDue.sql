

create  procedure PrepRefundDue
	@input_begin_date varchar(10),
	@input_end_date varchar(10),
	@input_pacs_user_id int,
	@input_entity_id int,
	@input_year numeric(4,0)
as


-- collect all refund_due_trans records and their corresponding 
-- modify_cd, modify_reason values from bill_adj_trans if their is one
select
	rdt.transaction_id,
	rdt.batch_id,
	rdt.bill_id,
	rdt.adjust_id,
	rdt.mno_amt,
	rdt.ins_amt,
	rdt.penalty_mno_amt,
	rdt.penalty_ins_amt,
	rdt.interest_mno_amt,
	rdt.interest_ins_amt,
	rdt.atty_fee_amt,
	rdt.discount_mno_amt,
	rdt.discount_ins_amt,
	rdt.underage_mno_amt,
	rdt.underage_ins_amt,
	rdt.overage_mno_amt,
	rdt.overage_ins_amt,
	rdt.payment_trans_id,
	batch.balance_dt,
	bill.prop_id,
	bill.sup_tax_yr,
	bill.sup_num,
	bill.entity_id,
	bat.modify_cd,
	bat.modify_reason
into 
	#tmp
from
	refund_due_trans AS rdt with (nolock)
inner join
	batch with (nolock)
on
	batch.batch_id = rdt.batch_id
left outer join
	bill_adj_trans AS bat with (nolock)
on
	bat.bill_id = rdt.bill_id
and	bat.adjust_id = rdt.adjust_id
inner join
	bill with (nolock) 
on
	bill.bill_id = rdt.bill_id
where
	bill.coll_status_cd <> 'RS'
and	bill.prop_id > 0
order by 
	rdt.batch_id,
	rdt.bill_id,
	rdt.adjust_id


-- if limiting parameters are specified, remove records that do not qualify
if (len(@input_begin_date) > 0) and (@input_begin_date <> '__/__/____')
begin
	delete
		#tmp
	where
		balance_dt < cast(@input_begin_date AS datetime)
end

if (len(@input_end_date) > 0) and (@input_end_date <> '__/__/____')
begin
	delete
		#tmp
	where
		balance_dt > cast(@input_end_date AS datetime)
end

if (len(@input_year) = 4)
begin
	delete
		#tmp
	where
		sup_tax_yr <> cast(@input_year as int)
end

if (len(@input_entity_id) > 0) and (@input_entity_id > 0)
begin
	delete
		#tmp
	where
		entity_id <> @input_entity_id
end


-- delete rows where the sum of all values for a given bill_id is zero
delete
	#tmp 
where
	bill_id in
	(
		select
			bill_id
		from
			#tmp with (nolock)
		group by
			bill_id
		having
			sum(mno_amt + ins_amt + penalty_mno_amt + penalty_ins_amt + interest_mno_amt + interest_ins_amt) = 0
	)

-- the above delete can still leave matching rows that should be eliminated.
-- For example, adjustments 1 and 2 cancel each other out, but adjustment 3
-- caused a non-zero sum so none of the three rows for the bill_id were deleted.
-- we still need to delete adjustments 1 and 2 though
delete
	#tmp
from		
	#tmp
inner join
(
	select
		bill_id,
		adjust_id
	from
		#tmp with (nolock)
	group by
		bill_id,
		adjust_id
	having
		sum(mno_amt + ins_amt + penalty_mno_amt + penalty_ins_amt + interest_mno_amt + interest_ins_amt) = 0
) as tmp
on
	tmp.bill_id = #tmp.bill_id
and	isnull(tmp.adjust_id, 0) = isnull(#tmp.adjust_id, 0)


-- update the modify_cd and modify_reason to values from property_val 
-- if the modify_reason is currently 'Supplemental Modification'
update 
	#tmp
set
	modify_cd = left(pv.sup_cd, 5), 
	modify_reason = left(pv.sup_desc, 100)
from 			
	#tmp
inner join 
	property_val as pv with (nolock)
on
	pv.prop_id = #tmp.prop_id
and	pv.prop_val_yr = #tmp.sup_tax_yr
and	pv.sup_num = #tmp.sup_num
where
	rtrim(#tmp.Modify_reason) = 'Supplemental Modification'


-- update the Modify Code and Modify Reason for any records for
-- which a single bill_id has multiple records in the table
update		
	#tmp
set
	modify_cd = null,
	modify_reason = 'Multiple adjustments exist for this refund.'
where
	(select count(*) from #tmp as child where child.bill_id = #tmp.bill_id) > 1
		

--Delete existing records in the report_refund_due table
delete
	report_refund_due
where
	pacs_user_id = @input_pacs_user_id


-- repopulate the table with records from #tmp
insert into
	report_refund_due
(
	pacs_user_id,
	bill_id,
	mno_amt,
	ins_amt,
	penalty_amt,
	interest_amt,
	atty_fee_amt,
	discount_amt,
	underage_amt,
	overage_amt,
	entity_id,
	refund_year,
	modify_cd,
	modify_reason
)
select
	cast(@input_pacs_user_id as varchar(20)),
	bill_id,
	sum(mno_amt),
	sum(ins_amt),
	sum(penalty_mno_amt) + sum(penalty_ins_amt),
	sum(interest_mno_amt) + sum(interest_ins_amt),
	sum(atty_fee_amt),
	sum(discount_mno_amt) + sum(discount_ins_amt),
	sum(underage_mno_amt) + sum(underage_ins_amt),
	sum(overage_mno_amt) + sum(overage_ins_amt),
	entity_id,
	sup_tax_yr,
	modify_cd,
	modify_reason
from 
	#tmp
group by
	bill_id,
	entity_id,
	sup_tax_yr,
	modify_cd,
	modify_reason


-- drop the temporary table
drop table
	#tmp

GO

