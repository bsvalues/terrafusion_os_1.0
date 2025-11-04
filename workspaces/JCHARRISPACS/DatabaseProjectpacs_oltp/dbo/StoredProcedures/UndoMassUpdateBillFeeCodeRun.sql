
CREATE  PROCEDURE UndoMassUpdateBillFeeCodeRun
	@run_id	int,
	@pacs_user_id int = 0
AS

set nocount on
set xact_abort on

BEGIN TRY --- SET UP ERROR HANDLING

-- initialize

declare @undo_date datetime
set @undo_date = GETDATE()

-- create a work detail for the update details                                  
if exists (select name from tempdb.dbo.sysobjects
where name = '#adjustment_table')
begin	
	drop table #adjustment_table
end	

create table #adjustment_table
(
	item_id int not null,
	adjustment_id int
	
	primary key (item_id)
) 

-- get the items that need to be updated
insert into #adjustment_table (item_id)
select bill_id 
from mass_update_bill_fee_code_run_details mud
where mud.run_id = @run_id

-- assign bill adjustment IDs
declare @bill_count int
declare @first_bill_adj_id int

select @bill_count = count(*) 
from #adjustment_table at
join bill b with(nolock)
on b.bill_id = at.item_id

if @bill_count > 0
begin
	exec GetUniqueID 'bill_adjustment', @first_bill_adj_id output, @bill_count

	;with adjustment_table as
	(
		select *, @first_bill_adj_id + ROW_NUMBER() over (order by item_id) - 1 as assigned_adjustment_id 
		from #adjustment_table at
		join bill b with(nolock)
		on b.bill_id = at.item_id
	)
	update adjustment_table
	set adjustment_id = assigned_adjustment_id           
end

--assign fee adjustment IDs
declare @fee_count int
declare @first_fee_adj_id int

select @fee_count = count(*) 
from #adjustment_table at
join fee f with(nolock)
on f.fee_id = at.item_id

if @fee_count > 0
begin
	exec GetUniqueID 'fee_adjustment', @first_fee_adj_id output, @fee_count

	;with adjustment_table as
	(
		select *, @first_fee_adj_id + ROW_NUMBER() over (order by item_id) - 1 as assigned_adjustment_id 
		from #adjustment_table at
		join fee f with(nolock)
		on f.fee_id = at.item_id
	)
	update adjustment_table
	set adjustment_id = assigned_adjustment_id           
end

-- insert adjustments for levy bills
insert into bill_adjustment
(
	bill_adj_id, bill_id, sup_num, 
	previous_bill_fee_cd, bill_fee_cd, previous_base_tax, base_tax, 
	bill_calc_type_cd, tax_area_id,
	previous_taxable_val, taxable_val, modify_reason, pacs_user_id, adjustment_date,
	previous_effective_due_dt, effective_due_dt, previous_payment_status_type_cd, payment_status_type_cd
)
select at.adjustment_id, b.bill_id, b.sup_num,
mud.curr_bill_fee_code, mud.prev_bill_fee_code, b.current_amount_due, b.current_amount_due, 
'BFC', dbo.fn_BillLastTaxAreaId(b.bill_id, null),
lb.taxable_val, lb.taxable_val, mud.prev_comment, @pacs_user_id, @undo_date, 
b.effective_due_date, b.effective_due_date, b.payment_status_type_cd, b.payment_status_type_cd

from #adjustment_table at

join levy_bill lb with(nolock)
on lb.bill_id = at.item_id

join bill b with(nolock)
on b.bill_id = lb.bill_id

join mass_update_bill_fee_code_run_details mud
on mud.bill_id = b.bill_id
and mud.run_id = @run_id

-- insert adjustments for assessment bills
insert into dbo.bill_adjustment
(
	bill_adj_id, bill_id,	sup_num, 
	previous_bill_fee_cd, bill_fee_cd, 
	previous_base_tax, base_tax, bill_calc_type_cd, modify_reason,
	pacs_user_id, adjustment_date,
	previous_effective_due_dt, effective_due_dt, previous_payment_status_type_cd, payment_status_type_cd
)
select at.adjustment_id, b.bill_id, b.sup_num,
mud.curr_bill_fee_code, mud.prev_bill_fee_code, 
b.current_amount_due, b.current_amount_due, 'BFC', mud.prev_comment, 
@pacs_user_id, @undo_date,
b.effective_due_date, b.effective_due_date, b.payment_status_type_cd, b.payment_status_type_cd

from #adjustment_table at

join assessment_bill ab with(nolock)
on ab.bill_id = at.item_id

join bill b with(nolock)
on b.bill_id = ab.bill_id

join mass_update_bill_fee_code_run_details mud
on mud.bill_id = b.bill_id
and mud.run_id = @run_id

-- update bill records
update b
set last_modified = @undo_date, 
	code = (case when mubd.prev_bill_fee_code = '' then NULL else mubd.prev_bill_fee_code end), 
	comment = mubd.prev_comment
	
from mass_update_bill_fee_code_run_details mubd with(nolock)
join bill b with(nolock)
on mubd.bill_id = b.bill_id
where mubd.run_id = @run_id

-- insert fee adjustments
insert into dbo.fee_adjustment
(
	fee_adj_id, fee_id, sup_num, 
	previous_bill_fee_cd, bill_fee_cd, 
	previous_base_amount, base_amount, bill_calc_type_cd, modify_reason, pacs_user_id, adjustment_date, 
	previous_effective_due_dt, effective_due_dt, previous_payment_status_type_cd, payment_status_type_cd
)
select at.adjustment_id, f.fee_id, isnull(f.sup_num, 0),
mud.curr_bill_fee_code, mud.prev_bill_fee_code,
f.current_amount_due, f.current_amount_due, 'BFC', mud.prev_comment, @pacs_user_id, @undo_date,
f.effective_due_date, f.effective_due_date, f.payment_status_type_cd, f.payment_status_type_cd

from #adjustment_table at

join fee f with(nolock)
on f.fee_id = at.item_id

join mass_update_bill_fee_code_run_details mud
on mud.bill_id = f.fee_id
and mud.run_id = @run_id

-- update fee records
update f
set last_modified = @undo_date,
	code = (case when mubd.prev_bill_fee_code = '' then NULL else mubd.prev_bill_fee_code end),
 	comment = mubd.prev_comment
from mass_update_bill_fee_code_run_details mubd with(nolock)
join fee f with(nolock)
on mubd.bill_id = f.fee_id
where mubd.run_id = @run_id

-- delete the mass update run
delete from mass_update_bill_fee_code_run_details
where run_id = @run_id
 
delete from mass_update_bill_fee_code_run_year
where run_id = @run_id
 
delete from mass_update_bill_fee_code_run
where run_id = @run_id

-- cleanup
drop table #adjustment_table

END TRY

-- Report any exceptions
BEGIN CATCH
	DECLARE
	@ERROR_SEVERITY INT,
	@ERROR_STATE INT,
	@ERROR_NUMBER INT,
	@ERROR_LINE INT,
	@ERROR_MESSAGE VARCHAR(245),
	@AppMsg varchar(2000)
    
	SELECT
	@ERROR_SEVERITY = ERROR_SEVERITY(),
	@ERROR_STATE = ERROR_STATE(),
	@ERROR_NUMBER = ERROR_NUMBER(),
	@ERROR_LINE = ERROR_LINE(),
	@ERROR_MESSAGE = ERROR_MESSAGE(),
	@AppMsg = 'Error undoing mass update bill/fee code: ' + isnull(@ERROR_MESSAGE, '')

  RAISERROR(@AppMsg, 16, 1) 

END CATCH

GO

