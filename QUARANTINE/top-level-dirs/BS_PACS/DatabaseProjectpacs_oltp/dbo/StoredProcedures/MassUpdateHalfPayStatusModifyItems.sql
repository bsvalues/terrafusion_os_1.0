
create procedure dbo.MassUpdateHalfPayStatusModifyItems
	@run_id	int,
	@undo_run bit = 0
as

-- DO 95922 - Mass Update Half Pay Status
-- 
-- Update the selected bills and fees to the new half pay status.
--

set nocount on

-- Modify the bills and fees in a try-catch block and a transaction, to ensure that an error
-- won't leave the process only partly complete.
begin try
begin tran

-- verify that the run exists
if not exists(select 1 from mass_update_half_pay_run where run_id = @run_id)
	raiserror('The specified Mass Update Half Pay Status run does not exist.', 15, 1)

-- remove temp tables if they exist
if object_id('tempdb..#bill') is not null
	drop table #bill
if object_id('tempdb..#fee') is not null
	drop table #fee


-- select run data
declare @convert_to_half_pay bit
declare @new_h1_date datetime
declare @new_h2_date datetime
declare @created_by int
declare @status char(1)
declare @modify_reason varchar(500)


select 
	@convert_to_half_pay = convert_to_half_pay,
	@new_h1_date = new_h1_date,
	@new_h2_date = new_h2_date,
	@created_by = created_by,
	@status = status,
	@modify_reason = modify_reason
	
from mass_update_half_pay_run
where run_id = @run_id


-- validation
if @convert_to_half_pay is null
	raiserror('The specified run does not exist', 15, 1)
if @new_h1_date is null
	raiserror('H1 date is not valid', 15, 1)
if (@convert_to_half_pay = 1) and (@new_h2_date is null)
	raiserror('H2 date is not valid', 15, 1)

-- run must be in the correct state
if @undo_run = 0 and @status <> 'V'
	raiserror('The Mass Update Half Pay Status run must be Verified to begin processing', 15, 1)
if @undo_run = 1 and @status <> 'P'
	raiserror('The Mass Update Half Pay Status run must be Processed before it can be undone.', 15, 1)


if (@undo_run = 0)
begin
	-- normal: refresh backup of saved original values
	update mui
	set orig_h1 = bpd.amount_due,
		orig_h1_date = bpd.due_date
	from mass_update_half_pay_run_items mui
	join bill_payments_due bpd
		on bpd.bill_id = mui.trans_group_id
	where bpd.bill_payment_id = 0 

	update mui
	set orig_h2 = bpd.amount_due,
		orig_h2_date = bpd.due_date
	from mass_update_half_pay_run_items mui
	join bill_payments_due bpd
		on bpd.bill_id = mui.trans_group_id
	where bpd.bill_payment_id = 1 

	update mui
	set orig_h1 = fpd.amount_due,
		orig_h1_date = fpd.due_date
	from mass_update_half_pay_run_items mui
	join fee_payments_due fpd
		on fpd.fee_id = mui.trans_group_id
	where fpd.fee_payment_id = 0 

	update mui
	set orig_h2 = fpd.amount_due,
		orig_h2_date = fpd.due_date
	from mass_update_half_pay_run_items mui
	join fee_payments_due fpd
		on fpd.fee_id = mui.trans_group_id
	where fpd.fee_payment_id = 1 
end
else begin
	-- undo: Do the opposite conversion
	set @convert_to_half_pay = ~@convert_to_half_pay
end


declare @old_status varchar(10)
declare @new_status varchar(10)
declare @bill_calc_type_cd varchar(10)

set @old_status = case when @convert_to_half_pay = 1 then 'FULL' else 'HALF' end
set @new_status = case when @convert_to_half_pay = 1 then 'HALF' else 'FULL' end
set @bill_calc_type_cd = case when @convert_to_half_pay = 1 then 'SHPay' else 'RHPay' end


-- create temporary bill and fee tables
create table #bill
(
	bill_id int not null primary key,
	bill_adj_id int null,
	new_h1_due numeric(14,2) null,
	new_h1_paid numeric(14,2) null,
	new_h1_date datetime null,
	new_h2_due numeric(14,2) null,
	new_h2_paid numeric(14,2) null,
	new_h2_date datetime null,
)

create table #fee
(
	fee_id int not null primary key,
	fee_adj_id int null,
	new_h1_due numeric(14,2) null,
	new_h1_paid numeric(14,2) null,
	new_h1_date datetime null,
	new_h2_due numeric(14,2) null,
	new_h2_paid numeric(14,2) null,
	new_h2_date datetime null,
)

-- assign new due dates, relative to the bill/fee year
insert #bill (bill_id, new_h1_date, new_h2_date)
select b.bill_id, @new_h1_date, @new_h2_date
from mass_update_half_pay_run_items mui
join bill b
	on b.bill_id = mui.trans_group_id
where mui.run_id = @run_id

insert #fee (fee_id, new_h1_date, new_h2_date)
select f.fee_id, @new_h1_date, @new_h2_date
from mass_update_half_pay_run_items mui
join fee f
	on f.fee_id = mui.trans_group_id
where mui.run_id = @run_id

if @undo_run = 1
begin
	-- for undo, substitue the previously saved dates
	update bt
	set new_h1_date = isnull(mui.orig_h1_date, new_h1_date),
		new_h2_date = isnull(mui.orig_h2_date, new_h2_date)
	from #bill bt
	join mass_update_half_pay_run_items mui
		on mui.trans_group_id = bt.bill_id
		and mui.run_id = @run_id

	update ft
	set new_h1_date = isnull(mui.orig_h1_date, new_h1_date),
		new_h2_date = isnull(mui.orig_h2_date, new_h2_date)
	from #fee ft
	join mass_update_half_pay_run_items mui
		on mui.trans_group_id = ft.fee_id
		and mui.run_id = @run_id

	-- also, update the modify reason
	set @modify_reason = left('Undo: ' + @modify_reason, 500)
end


-- if the H2 date would be earlier than H1, move the H2 date to the next year.
update #bill
set new_h2_date = case when new_h2_date < new_h1_date then dateadd(year, 1, new_h2_date) else new_h2_date end

update #fee
set new_h2_date = case when new_h2_date < new_h1_date then dateadd(year, 1, new_h2_date) else new_h2_date end


-- get bill adjustment IDs
declare @bill_count int
declare @first_bill_adj_id int
select @bill_count = count(*) from #bill

if @bill_count > 0
begin
	exec GetUniqueID 'bill_adjustment', @first_bill_adj_id output, @bill_count

	;with b as
	(
		select *, @first_bill_adj_id + ROW_NUMBER() over (order by bill_id) - 1 as assigned_adjustment_id
		from #bill
	)
	update b
	set bill_adj_id = assigned_adjustment_id
end

-- get fee_adjustment IDs
declare @fee_count int
declare @first_fee_adj_id int
select @fee_count = count(*) from #fee

if @fee_count > 0
begin
	exec GetUniqueID 'fee_adjustment', @first_fee_adj_id output, @fee_count

	;with f as
	(
		select *, @first_fee_adj_id + ROW_NUMBER() over (order by fee_id) - 1 as assigned_adjustment_id
		from #fee
	)
	update f
	set fee_adj_id = assigned_adjustment_id
end


-- levy bill adjustment records
insert bill_adjustment
(bill_adj_id, bill_id, 
	sup_num, previous_payment_status_type_cd, payment_status_type_cd, modify_reason,
	previous_base_tax, base_tax, tax_area_id, bill_calc_type_cd,
	previous_taxable_val, taxable_val, pacs_user_id, adjustment_date,
	previous_effective_due_dt, effective_due_dt, previous_bill_fee_cd, bill_fee_cd)
select bt.bill_adj_id, b.bill_id, 
	b.sup_num, @old_status previous_payment_status_type_cd, @new_status payment_status_type_cd, @modify_reason,
	b.current_amount_due previous_base_tax, b.current_amount_due base_tax,
	dbo.fn_BillLastTaxAreaId(b.bill_id,null) as tax_area_id, @bill_calc_type_cd bill_calc_type_cd,
	lb.taxable_val previous_taxable_val, lb.taxable_val, @created_by pacs_user_id, getdate() adjustment_date,
	b.effective_due_date previous_effective_due_dt, bt.new_h1_date effective_due_dt, b.code previous_bill_fee_cd, b.code bill_fee_cd
from #bill bt
join bill b
	on b.bill_id = bt.bill_id
join levy_bill lb
	on lb.bill_id = bt.bill_id


-- special assessment bill adjustment records
insert bill_adjustment
(bill_adj_id, bill_id, 
	sup_num, previous_payment_status_type_cd, payment_status_type_cd, modify_reason,
	previous_base_tax, base_tax, batch_id, bill_calc_type_cd,
	pacs_user_id, adjustment_date,
	previous_effective_due_dt, effective_due_dt, previous_bill_fee_cd, bill_fee_cd)
select bt.bill_adj_id, b.bill_id, 
	b.sup_num, @old_status previous_payment_status_type_cd, @new_status payment_status_type_cd, @modify_reason,
	b.current_amount_due previous_base_tax, b.current_amount_due base_tax,
	NULL batch_id, @bill_calc_type_cd bill_calc_type_cd,
	@created_by pacs_user_id, getdate() adjustment_date,
	b.effective_due_date previous_effective_due_dt, bt.new_h1_date effective_due_dt, b.code previous_bill_fee_cd, b.code bill_fee_cd
from #bill bt
join bill b
	on b.bill_id = bt.bill_id
join assessment_bill ab
	on ab.bill_id = bt.bill_id


-- fee adjustment records
insert fee_adjustment
(fee_adj_id, fee_id, transaction_id,
	sup_num, previous_payment_status_type_cd, payment_status_type_cd, modify_reason,
	previous_base_amount, base_amount, batch_id, bill_calc_type_cd,
	pacs_user_id, adjustment_date,
	previous_effective_due_dt, effective_due_dt, previous_bill_fee_cd, bill_fee_cd)
select ft.fee_adj_id, f.fee_id, null transaction_id,
	f.sup_num, f.payment_status_type_cd previous_payment_status_type_cd, @new_status payment_status_type_cd, @modify_reason,
	f.current_amount_due previous_base_amount, f.current_amount_due base_amount, null batch_id, @bill_calc_type_cd bill_calc_type_cd,
	@created_by pacs_user_id, getdate() adjustment_date,
	f.effective_due_date prevous_effective_due_dt, ft.new_h1_date effective_due_dt, f.code previous_bill_fee_cd, f.code bill_fee_cd

from #fee ft
join fee f
	on f.fee_id = ft.fee_id


-- bill and fee records
update b
set payment_status_type_cd = @new_status,
	effective_due_date = bt.new_h1_date 
from bill b
join #bill bt
	on b.bill_id = bt.bill_id
										
update f
set payment_status_type_cd = @new_status,
	effective_due_date = ft.new_h1_date
from fee f
join #fee ft
	on f.fee_id = ft.fee_id


-- convert to FULL
if (@convert_to_half_pay = 0)
begin
	-- bill amounts
	update bt
	set new_h1_due = b.current_amount_due,
		new_h1_paid = b.amount_paid
	from #bill bt
	join bill b
		on b.bill_id = bt.bill_id

	-- insert any missing H1 bill payments
	insert bill_payments_due (bill_id, bill_payment_id, is_payout_payment)
	select bt.bill_id, 0, 0 
	from #bill bt
	where not exists(
		select 1 from bill_payments_due bpd
		where bpd.bill_id = bt.bill_id
		and bpd.bill_payment_id = 0)

	-- remove H2 bill payments
	delete bpd
	from bill_payments_due bpd
	join #bill b
		on b.bill_id = bpd.bill_id
	where bpd.bill_payment_id > 0

	-- update H1 bill payments
	update bpd
	set amount_due = bt.new_h1_due,
		amount_paid = bt.new_h1_paid,
		due_date = bt.new_h1_date
	from bill_payments_due bpd
	join #bill bt
		on bt.bill_id = bpd.bill_id
	where bpd.bill_payment_id = 0


	-- fee amounts
	update ft
	set new_h1_due = f.current_amount_due,
		new_h1_paid = f.amount_paid
	from #fee ft
	join fee f
		on f.fee_id = ft.fee_id

	-- insert any missing H1 fee payments
	insert fee_payments_due (fee_id, fee_payment_id, year, amount_due, amount_paid, is_payout_payment)
	select ft.fee_id, 0, f.year, 0, 0, 0 
	from #fee ft
	join fee f
		on f.fee_id = ft.fee_id
	where not exists(
		select 1 from fee_payments_due fpd
		where fpd.fee_id = ft.fee_id
		and fpd.fee_payment_id = 0)

	-- remove fee H2 payments
	delete fpd
	from fee_payments_due fpd
	join #fee f
		on f.fee_id = fpd.fee_id
	where fpd.fee_payment_id > 0

	-- update fee H1 payments
	update fpd
	set amount_due = ft.new_h1_due,
		amount_paid = ft.new_h1_paid,
		due_date = ft.new_h1_date
	from fee_payments_due fpd
	join #fee ft
		on ft.fee_id = fpd.fee_id
	where fpd.fee_payment_id = 0
end

-- convert to HALF
else begin
	-- bill amounts
	update bt
	set new_h1_due = case when b.amount_paid > 0 and b.amount_paid < b.current_amount_due then b.amount_paid else round(b.current_amount_due / 2, 2) end,
		new_h2_due = b.current_amount_due - (case when b.amount_paid > 0 and b.amount_paid < b.current_amount_due then b.amount_paid else round(b.current_amount_due / 2, 2) end)
	from #bill bt
	join bill b
		on b.bill_id = bt.bill_id

	update bt
	set new_h1_paid = case when b.amount_paid > bt.new_h1_paid then bt.new_h1_paid else b.amount_paid end,
		new_h2_paid = b.amount_paid - (case when b.amount_paid > bt.new_h1_paid then bt.new_h1_paid else b.amount_paid end)
	from #bill bt
	join bill b
		on b.bill_id = bt.bill_id

	-- insert any missing bill payments
	insert bill_payments_due (bill_id, bill_payment_id, amount_due, amount_paid, is_payout_payment)
	select bt.bill_id, 0, 0, 0, 0 
	from #bill bt
	where not exists(
		select 1 from bill_payments_due bpd
		where bpd.bill_id = bt.bill_id
		and bpd.bill_payment_id = 0)

	insert bill_payments_due (bill_id, bill_payment_id, amount_due, amount_paid, is_payout_payment)
	select bt.bill_id, 1, 0, 0, 0 
	from #bill bt
	where not exists(
		select 1 from bill_payments_due bpd
		where bpd.bill_id = bt.bill_id
		and bpd.bill_payment_id = 1)

	-- update H1 bill payments
	update bpd
	set amount_due = bt.new_h1_due,
		amount_paid = bt.new_h1_paid,
		due_date = bt.new_h1_date
	from bill_payments_due bpd
	join #bill bt
		on bt.bill_id = bpd.bill_id
	where bpd.bill_payment_id = 0

	-- update H2 bill payments
	update bpd
	set amount_due = bt.new_h2_due,
		amount_paid = bt.new_h2_paid,
		due_date = bt.new_h2_date
	from bill_payments_due bpd
	join #bill bt
		on bt.bill_id = bpd.bill_id
	where bpd.bill_payment_id = 1


	-- fee amounts
	update ft
	set new_h1_due = case when f.amount_paid > 0 and f.amount_paid < f.current_amount_due then f.amount_paid else round(f.current_amount_due / 2, 2) end,
		new_h2_due = f.current_amount_due - (case when f.amount_paid > 0 and f.amount_paid < f.current_amount_due then f.amount_paid else round(f.current_amount_due / 2, 2) end)
	from #fee ft
	join fee f
		on f.fee_id = ft.fee_id

	update ft
	set new_h1_paid = case when f.amount_paid > ft.new_h1_paid then ft.new_h1_paid else f.amount_paid end,
		new_h2_paid = f.amount_paid - (case when f.amount_paid > ft.new_h1_paid then ft.new_h1_paid else f.amount_paid end)
	from #fee ft
	join fee f
		on f.fee_id = ft.fee_id

	-- insert any missing fee payments
	insert fee_payments_due (fee_id, fee_payment_id, year, amount_due, amount_paid, is_payout_payment)
	select ft.fee_id, 0, f.year, 0, 0, 0 
	from #fee ft
	join fee f
		on f.fee_id = ft.fee_id
	where not exists(
		select 1 from fee_payments_due fpd
		where fpd.fee_id = ft.fee_id
		and fpd.fee_payment_id = 0)

	insert fee_payments_due (fee_id, fee_payment_id, year, amount_due, amount_paid, is_payout_payment)
	select ft.fee_id, 1, f.year, 0, 0, 0 
	from #fee ft
	join fee f
		on f.fee_id = ft.fee_id
	where not exists(
		select 1 from fee_payments_due fpd
		where fpd.fee_id = ft.fee_id
		and fpd.fee_payment_id = 1)

	-- update H1 fee payments
	update fpd
	set amount_due = ft.new_h1_due,
		amount_paid = ft.new_h1_paid,
		due_date = ft.new_h1_date
	from fee_payments_due fpd
	join #fee ft
		on ft.fee_id = fpd.fee_id
	where fpd.fee_payment_id = 0

	-- update H2 fee payments
	update fpd
	set amount_due = ft.new_h2_due,
		amount_paid = ft.new_h2_paid,
		due_date = ft.new_h2_date
	from fee_payments_due fpd
	join #fee ft
		on ft.fee_id = fpd.fee_id
	where fpd.fee_payment_id = 1
end


-- update run status
-- Modify: Verified to Processed
-- Undo: Processed to Undone
update mur
set status = case when @undo_run = 0 then 'P' else 'U' end
from mass_update_half_pay_run mur
where mur.run_id = @run_id


-- If an error is caught, roll back the transaction.
-- Then, raise the error again so it will appear in the PACS client.

commit tran
end try

begin catch
	if @@trancount > 0 rollback tran;

	declare @ErrorMessage nvarchar(max);
	declare @ErrorSeverity int;
	declare @ErrorState int;

	select @ErrorMessage = error_message(),
		@ErrorSeverity = error_severity(),
		@ErrorState = error_state()

	raiserror(@ErrorMessage, @ErrorSeverity, @ErrorState)
end catch

GO

