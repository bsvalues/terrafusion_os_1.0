
-- exec dbo.PaymentImportPrepareMatch 335470,1
CREATE PROCEDURE dbo.PaymentImportPrepareMatch     
   @runID int,
   @forAutoPay int
 AS
 
/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @StartProc datetime
    SET @StartProc = getdate()
DECLARE @StartStep datetime
DECLARE @LogTotRows bigint
DECLARE @LogSeconds int
DECLARE @LogErrCode int
DECLARE @StartEndMsg varchar(1000)
DECLARE @StepMsg varchar(3000)
DECLARE @proc varchar(100)
    SET @proc = object_name(@@procid)
 
    SET @StartEndMsg = 'Start - ' + @proc  
 + ' @runID =' +  isnull(convert(varchar(30),@runID),'') + ','
 + ' @forAutoPay =' +  isnull(convert(varchar(30),@forAutoPay),'')
 
 exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                   @status_msg = @StartEndMsg
 
-- set variable for final status entry
 set @StartEndMsg = Replace(@StartEndMsg,'Start','End')
 
/* End top of each procedure to capture parameters */


declare @payment_run_id int
set @payment_run_id = @runID

SET @StepMsg =  'Step 1 Start'
set @StartStep = getdate()  --logging capture start time of step
 
-- get the bills

update pri set
prop_id = tdcb.prop_id,
statement_id = isnull(tdcb.statement_id, 0),
year = tdcb.year,
payment_group_id = b.payment_group_id

from prepare_run_items pri with(nolock)

join prepare_run_tax_due_assoc prtda with(nolock)
on pri.payment_date = prtda.payment_date
and pri.is_bill = prtda.is_bill

join tax_due_calc_bill tdcb with(nolock)
on tdcb.dataset_id = prtda.dataset_id
and tdcb.bill_id = pri.trans_group_id

join bill b with(nolock)
on b.bill_id = tdcb.bill_id

where pri.payment_run_id = @payment_run_id
  and pri.is_bill = 1

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 1 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds

SET @StepMsg =  'Step 2 Start'
set @StartStep = getdate()  --logging capture start time of step
                                   
-- get the fees

update pri set
prop_id = fpa.prop_id,
statement_id = isnull(tdcf.statement_id, 0),
year = tdcf.year,
payment_group_id = f.payment_group_id

from prepare_run_items pri with(nolock)

join prepare_run_tax_due_assoc prtda with(nolock)
on pri.payment_date = prtda.payment_date
and pri.is_bill = prtda.is_bill

join tax_due_calc_fee tdcf with(nolock)
on tdcf.dataset_id = prtda.dataset_id
and tdcf.fee_id = pri.trans_group_id

join fee f with(nolock)
on f.fee_id = tdcf.fee_id

left join fee_property_vw fpa with(nolock)
on fpa.fee_id = f.fee_id

where pri.payment_run_id = @payment_run_id
 and pri.is_bill = 0

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 2 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds


-- AutoPay: Remove items that aren't in the AutoPay property ID list
if @forAutoPay = 1
begin
   SET @StepMsg =  'Step 3 Start'
   set @StartStep = getdate()  --logging capture start time of step

   exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = 0,
                                  @err_status = 0,
                                  @duration_in_seconds = 0
                                  
   delete from prepare_run_items where payment_run_id = @payment_run_id
   and prop_id not in (select prop_id from prepare_run_payments where payment_run_id = @payment_run_id)
   
    -- logging end of step 
    SELECT @LogTotRows = @@ROWCOUNT, 
           @LogErrCode = @@ERROR 
       SET @LogSeconds = datediff(s,@StartStep,getdate())
       SET @StepMsg =  'Step 3 End'
    exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                      @status_msg = @StepMsg,
                                      @row_count = @LogTotRows,
                                      @err_status = @LogErrCode,
                                      @duration_in_seconds = @LogSeconds


end

-- fix the property ID for fees without one
-- (Technically, this is a data error - fees in a statement should have a property association)
if @forAutoPay = 0
begin
   SET @StepMsg =  'Step 4 Start'
   set @StartStep = getdate()  --logging capture start time of step

   exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = 0,
                                  @err_status = 0,
                                  @duration_in_seconds = 0
    update prepare_run_items
    set prop_id = 
        (select top 1 prop_id from prepare_run_items pp_inner
         where pp_inner.payment_run_id = prepare_run_items.payment_run_id
         and pp_inner.statement_id = prepare_run_items.statement_id
         and pp_inner.year = prepare_run_items.year)
    where payment_run_id = @payment_run_id
    and isnull(prop_id, 0) = 0

    -- logging end of step 
    SELECT @LogTotRows = @@ROWCOUNT, 
           @LogErrCode = @@ERROR 
       SET @LogSeconds = datediff(s,@StartStep,getdate())
       SET @StepMsg =  'Step 4 End'
    exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                      @status_msg = @StepMsg,
                                      @row_count = @LogTotRows,
                                      @err_status = @LogErrCode,
                                      @duration_in_seconds = @LogSeconds


end

SET @StepMsg =  'Step 5 Start'
set @StartStep = getdate()  --logging capture start time of step

update prepare_run_items
set prop_id = isnull(prop_id, 0)
where payment_run_id = @payment_run_id 

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 5 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds


SET @StepMsg =  'Step 6 Start'
set @StartStep = getdate()  --logging capture start time of step

-- bill amounts due
update prepare_run_items set
full_amount_due = q.full_total,
half_amount_due = q.half_total
from (
select bpd.bill_id,
sum(case when bpd.total_due_as_of_posting > 0 then
	bpd.total_due_as_of_posting else 0 end) as full_total,
sum(case when bpd.total_due_as_of_posting > 0
	and bpd.is_h1_payment = 1 then
	bpd.total_due_as_of_posting else 0 end) as half_total 
 
from prepare_run_items pri

join prepare_run_tax_due_assoc tda with(nolock)
on pri.payment_run_id = tda.payment_run_id
and pri.payment_date = tda.payment_date
and pri.is_bill = tda.is_bill

join tax_due_calc_bill_payments_due bpd with(nolock)
on bpd.dataset_id = tda.dataset_id
and bpd.bill_id = pri.trans_group_id

where pri.payment_run_id = @payment_run_id
 and pri.is_bill = 1
group by bpd.bill_id
) q
where prepare_run_items.payment_run_id = @payment_run_id 
and prepare_run_items.trans_group_id = q.bill_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 6 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds

SET @StepMsg =  'Step 7 Start'
set @StartStep = getdate()  --logging capture start time of step

-- fee amounts due

update prepare_run_items set
full_amount_due = q.full_total,
half_amount_due = q.half_total
from (
select fpd.fee_id,
sum(case when fpd.total_due_as_of_posting > 0 then
	fpd.total_due_as_of_posting else 0 end) as full_total,
sum(case when fpd.total_due_as_of_posting > 0
	and fpd.is_h1_payment = 1 then
	fpd.total_due_as_of_posting else 0 end) as half_total 
 
from prepare_run_items pri

join prepare_run_tax_due_assoc tda with(nolock)
on pri.payment_run_id = tda.payment_run_id
and pri.payment_date = tda.payment_date
and pri.is_bill = tda.is_bill

join tax_due_calc_fee_payments_due fpd with(nolock)
on fpd.dataset_id = tda.dataset_id
and fpd.fee_id = pri.trans_group_id

where pri.payment_run_id = @payment_run_id
and pri.is_bill = 0
group by fpd.fee_id
) q
where prepare_run_items.payment_run_id = @payment_run_id
and prepare_run_items.trans_group_id = q.fee_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 7 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds

SET @StepMsg =  'Step 8 Start'
set @StartStep = getdate()  --logging capture start time of step

-- map the bills and fees to the import payments

update prepare_run_items
set payment_run_detail_id = prp.payment_run_detail_id
from prepare_run_payments prp
where prepare_run_items.payment_run_id = @payment_run_id
and prp.payment_run_id= prepare_run_items.payment_run_id
and prp.statement_id = prepare_run_items.statement_id
and prp.year = prepare_run_items.year

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 8 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds

SET @StepMsg =  'Step 9 Start'
set @StartStep = getdate()  --logging capture start time of step

update prepare_run_items
set payment_run_detail_id = prpg.payment_run_detail_id
from prepare_run_payment_group prpg
where prepare_run_items.payment_run_id = @payment_run_id
and prpg.payment_run_id = prepare_run_items.payment_run_id
and prpg.payment_group_id = prepare_run_items.payment_group_id
and prepare_run_items.payment_run_detail_id is null

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 9 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds

SET @StepMsg =  'Step 10 Start'
set @StartStep = getdate()  --logging capture start time of step

delete prepare_run_items
where payment_run_id = @payment_run_id
and payment_run_detail_id is null

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 10 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds

SET @StepMsg =  'Step 11 Start'
set @StartStep = getdate()  --logging capture start time of step

-- get allowable variances

declare @under_variance numeric(14,2)
select @under_variance = pay_type_amt
from payment_code with(nolock)
where pay_type_cd = 'UP'

declare @over_variance numeric(14,2)
select @over_variance = pay_type_amt
from payment_code with(nolock)
where pay_type_cd = 'OP'


-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 11 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds


-- get the total amounts due for each payment

if @forAutoPay = 1
begin
    SET @StepMsg =  'Step 12 Start'
    set @StartStep = getdate()  --logging capture start time of step

   exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = 0,
                                  @err_status = 0,
                                  @duration_in_seconds = 0
    -- AutoPay version
    update prepare_run_payments
    set full_amount_due = full_total,
    half_amount_due = half_total
    from (
	    select payment_run_detail_id, prop_id,
		    sum(full_amount_due) as full_total,
		    sum(half_amount_due) as half_total
	    from prepare_run_items
	    where payment_run_id = @payment_run_id
	    group by payment_run_detail_id, prop_id
    ) amount_due_totals
    where prepare_run_payments.payment_run_id = @payment_run_id
    and prepare_run_payments.payment_run_detail_id = amount_due_totals.payment_run_detail_id
    and prepare_run_payments.prop_id = amount_due_totals.prop_id

    -- logging end of step 
    SELECT @LogTotRows = @@ROWCOUNT, 
           @LogErrCode = @@ERROR 
       SET @LogSeconds = datediff(s,@StartStep,getdate())
       SET @StepMsg =  'Step 12 End'
    exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                      @status_msg = @StepMsg,
                                      @row_count = @LogTotRows,
                                      @err_status = @LogErrCode,
                                      @duration_in_seconds = @LogSeconds

    SET @StepMsg =  'Step 13 Start'
    set @StartStep = getdate()  --logging capture start time of step

    update prepare_run_payments
    set full_statement_amount_due = full_total,
    half_statement_amount_due = half_total
    from (
	    select payment_run_detail_id, statement_id, prop_id,
		    sum(full_amount_due) as full_total,
		    sum(half_amount_due) as half_total
	    from prepare_run_items
	    where payment_run_id = @payment_run_id
	    group by payment_run_detail_id, statement_id, prop_id
    ) amount_due_totals
    where prepare_run_payments.payment_run_id = @payment_run_id
    and prepare_run_payments.payment_run_detail_id = amount_due_totals.payment_run_detail_id
    and prepare_run_payments.statement_id = amount_due_totals.statement_id
    and prepare_run_payments.prop_id = amount_due_totals.prop_id

    -- logging end of step 
    SELECT @LogTotRows = @@ROWCOUNT, 
           @LogErrCode = @@ERROR 
       SET @LogSeconds = datediff(s,@StartStep,getdate())
       SET @StepMsg =  'Step 13 End'
    exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                      @status_msg = @StepMsg,
                                      @row_count = @LogTotRows,
                                      @err_status = @LogErrCode,
                                      @duration_in_seconds = @LogSeconds

 end

else
 begin
    SET @StepMsg =  'Step 14 Start'
    set @StartStep = getdate()  --logging capture start time of step    

   exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = 0,
                                  @err_status = 0,
                                  @duration_in_seconds = 0
    -- not AutoPay
    update prepare_run_payments
    set full_amount_due = full_total,
    half_amount_due = half_total
    from (
	    select payment_run_detail_id, 
		    sum(full_amount_due) as full_total,
		    sum(half_amount_due) as half_total
	    from prepare_run_items
	    where payment_run_id = @payment_run_id
	    group by payment_run_detail_id
    ) amount_due_totals
    where prepare_run_payments.payment_run_id = @payment_run_id
    and prepare_run_payments.payment_run_detail_id = amount_due_totals.payment_run_detail_id

    -- logging end of step 
    SELECT @LogTotRows = @@ROWCOUNT, 
           @LogErrCode = @@ERROR 
       SET @LogSeconds = datediff(s,@StartStep,getdate())
       SET @StepMsg =  'Step 14 End'
    exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                      @status_msg = @StepMsg,
                                      @row_count = @LogTotRows,
                                      @err_status = @LogErrCode,
                                      @duration_in_seconds = @LogSeconds

    SET @StepMsg =  'Step 15 Start'
    set @StartStep = getdate()  --logging capture start time of step    
                                       
    update prepare_run_payments
    set full_statement_amount_due = full_total,
    half_statement_amount_due = half_total
    from (
	    select payment_run_detail_id, statement_id,
		    sum(full_amount_due) as full_total,
		    sum(half_amount_due) as half_total
	    from prepare_run_items
	    where payment_run_id = @payment_run_id
	    group by payment_run_detail_id, statement_id
    ) amount_due_totals
    where prepare_run_payments.payment_run_id = @payment_run_id
    and prepare_run_payments.payment_run_detail_id = amount_due_totals.payment_run_detail_id
    and prepare_run_payments.statement_id = amount_due_totals.statement_id

    -- logging end of step 
    SELECT @LogTotRows = @@ROWCOUNT, 
           @LogErrCode = @@ERROR 
       SET @LogSeconds = datediff(s,@StartStep,getdate())
       SET @StepMsg =  'Step 15 End'
    exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                      @status_msg = @StepMsg,
                                      @row_count = @LogTotRows,
                                      @err_status = @LogErrCode,
                                      @duration_in_seconds = @LogSeconds

 end

SET @StepMsg =  'Step 16 Start'
set @StartStep = getdate()  --logging capture start time of step      

-- clear the default statements into the statements table

delete import_payment_statements
where payment_run_id = @payment_run_id

-- flag properties that have a pending AutoPay payment
update import_payment
set has_pending_autopay_payment = 0
where payment_run_id = @payment_run_id

update ip
set has_pending_autopay_payment = 1
from import_payment ip
join autopay_enrollment ae
on ae.prop_id = ip.prop_id
and ae.pending_payment > 0
where payment_run_id = @payment_run_id

-- flag properties that have a Payout Agreement
update import_payment
set has_payout_agreement = 0
where payment_run_id = @payment_run_id

update ip
set has_payout_agreement = 1
from import_payment ip
join property_payout_agreement ppra on
ip.prop_id = ppra.prop_id
join payout_agreement pa on
ppra.payout_agreement_id = pa.payout_agreement_id
where payment_run_id = @payment_run_id and status_cd = 'A'

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 16 End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds
                                  
SET @StepMsg =  'Step 17 Cursor Start'
set @StartStep = getdate()  --logging capture start time of step      

-- accept or reject each payment

declare @detail_id int
declare @amount_paid numeric(14,2)
declare @full_amount_due numeric(14,2)
declare @half_amount_due numeric(14,2)
declare @full_statement_amount_due numeric(14,2)
declare @half_statement_amount_due numeric(14,2)	
declare @amount_due numeric(14,2)	
declare @status char(5)
declare @payment_type char(1)			
declare @statement_only bit
declare @post_date datetime
declare @has_pending_autopay_payment bit
declare @has_payout_agreement bit
declare @is_mismatch bit

declare payment_cursor cursor forward_only for
select payment_run_detail_id, amount_due, amount_paid, has_pending_autopay_payment, has_payout_agreement
from import_payment
where payment_run_id = @payment_run_id

open payment_cursor
fetch next from payment_cursor into @detail_id, @amount_due, @amount_paid, @has_pending_autopay_payment, @has_payout_agreement

while @@fetch_status = 0
begin
-- for each payment, get the amounts to match
select 
	@full_amount_due = full_amount_due,
	@half_amount_due = half_amount_due,
	@full_statement_amount_due = full_statement_amount_due,
	@half_statement_amount_due = half_statement_amount_due,
	@post_date = payment_date,
	@is_mismatch = is_mismatch
from prepare_run_payments prp
where prp.payment_run_detail_id = @detail_id

set @payment_type = 'F'
set @statement_only = 0


if @is_mismatch = 1
begin
	set @status = 'M'
	set @amount_due = 0
end

else if @forAutoPay = 0 and @has_pending_autopay_payment = 1
begin
	-- regular payment runs should not pay statements on a property with a pending AutoPay payment
	set @status = 'R'
	set @amount_due = 0
end

else if  @amount_due > @amount_paid and @has_payout_agreement = 1
begin
	-- regular payment runs should not pay statements on a property with a Payout Agreement
	set @status = 'R'
	set @amount_due = 0
end

else if @amount_paid = 0
begin
	-- nothing was paid
	set @status = 'A'
	set @amount_due = 0
end

else if @full_amount_due is null
begin
	-- nothing to match
	set @status = 'R'
	set @amount_due = 0
end

else if (@full_amount_due > 0)
and (@amount_paid - @full_amount_due <= @over_variance)
and (@full_amount_due - @amount_paid <= @under_variance)
begin
	-- full amount
	set @status = 'A'
	set @amount_due = @full_amount_due
end

else if (@half_amount_due > 0)
and (@amount_paid - @half_amount_due <= @over_variance)
and (@half_amount_due - @amount_paid <= @under_variance)
begin
	-- half amount
	set @status = 'A'
	set @payment_type = 'H'
	set @amount_due = @half_amount_due
end

else if (@full_statement_amount_due > 0)
and (@amount_paid - @full_statement_amount_due <= @over_variance)
and (@full_statement_amount_due - @amount_paid <= @under_variance)
begin
	-- full amount, statement only
	set @status = 'A'
	set @statement_only = 1
	set @amount_due = @full_statement_amount_due
end

else if (@half_statement_amount_due > 0)
and (@amount_paid - @half_statement_amount_due <= @over_variance)
and (@half_statement_amount_due - @amount_paid <= @under_variance)
begin
	-- half amount, statement only
	set @status = 'A'
	set @statement_only = 1
	set @payment_type = 'H'
	set @amount_due = @half_statement_amount_due
end

else begin
	-- none of the options matched
	set @status = 'R'
	set @amount_due = @full_amount_due
end   

-- set values on the import payment record
update import_payment
set amount_due = @amount_due,
status = @status,
post_date = @post_date
where current of payment_cursor

-- write the default statements into the statements table

if @amount_paid > 0
begin
	if @statement_only = 0 and @status = 'A'
	begin
		insert import_payment_statements
		(payment_run_id, payment_run_detail_id, statement_id, year, prop_id, pay_code)

		select distinct @payment_run_id, @detail_id, statement_id, year, prop_id, @payment_type
		from prepare_run_items 
		where payment_run_detail_id = @detail_id
	end
	else if not (@forAutoPay = 0 and @has_pending_autopay_payment = 1) 
	begin
		insert import_payment_statements
		(payment_run_id, payment_run_detail_id, statement_id, year, prop_id, pay_code)

		select @payment_run_id, @detail_id, primary_statement_id, year - 1, prop_id, @payment_type
		from import_payment
		where payment_run_id = @payment_run_id
		and payment_run_detail_id = @detail_id
		and isnull(prop_id, 0) > 0
	end
end

fetch next from payment_cursor into @detail_id, @amount_due, @amount_paid, @has_pending_autopay_payment, @has_payout_agreement
end

close payment_cursor	
deallocate payment_cursor   

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 17 Cursor End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds
-- end of procedure update log
SET @LogSeconds = datediff(s,@StartProc,getdate())
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StartEndMsg,
                                  @row_count = @@ROWCOUNT,
                                  @err_status = @@ERROR,
                                  @duration_in_seconds = @LogSeconds

GO

