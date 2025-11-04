
CREATE  PROCEDURE dbo.MassUpdateBillFeeCode
	@run_id	int,
	@prop_idList nvarchar(max),
	@new_bill_fee_code varchar(10),
	@new_comment varchar(500),
	@pacs_user_id int = 0
AS

/* Top of each procedure to capture input parameters */
set nocount on
set xact_abort on

BEGIN TRY --- SET UP ERROR HANDLING

DECLARE @StartProc datetime
    SET @StartProc = getdate()
DECLARE @StartStep datetime
DECLARE @LogTotRows int
DECLARE @LogSeconds int
DECLARE @LogErrCode int
DECLARE @StartEndMsg varchar(1000)
DECLARE @StepMsg varchar(3000)
DECLARE @proc varchar(100)
    SET @proc = object_name(@@procid)
 
    SET @StartEndMsg = 'Start - ' + @proc  
 + ' @run_id =' +  isnull(convert(varchar(30),@run_id),'') + ','
 + ' @new_bill_fee_code =' +  isnull(@new_bill_fee_code,'') 
 + ' @new_comment =' +  isnull(@new_comment,'') + ','
 + ' @prop_idList (1st 1000 bytes) =' +  substring(isnull(@prop_idList,''),1,1000) 

 exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                   @status_msg = @StartEndMsg
 
-- set variable for final status entry
set @StartEndMsg = Replace(@StartEndMsg, 'Start', 'End')
 
/* End top of each procedure to capture parameters */
 
 
set @StepMsg = 'Initialize'
set @StartStep = getdate()

if @new_bill_fee_code = ''
	set @new_bill_fee_code = NULL

declare @adjustment_date datetime
set @adjustment_date = getdate()

declare @BillFeeCodes varchar(3000)
select @BillFeeCodes = crit_bill_fee_codes from mass_update_bill_fee_code_run  where run_id = @run_id

declare @SpecialAssessments varchar(max)
select @SpecialAssessments =  crit_special_assessments from mass_update_bill_fee_code_run where run_id = @run_id

declare @TaxDistricts varchar(max)
select @TaxDistricts = crit_tax_districts from mass_update_bill_fee_code_run  where run_id = @run_id

declare @FeeType varchar(max)
select @FeeType = crit_fee_type from mass_update_bill_fee_code_run  where run_id = @run_id

-- Select property IDs into a temp table
if exists (select name from tempdb.dbo.sysobjects 
where name = '#propIds')
begin	
	drop table #propIds
end	

create table #propIds
(
	prop_id int not null
) 

create clustered index #ndx_tmp_propIds on #propIds (prop_id)

insert into #propIds (prop_id)
select ID from [dbo].[fn_ReturnTableFromCommaSepValues](@prop_idList)

-- create a work detail for the update details                                  
if exists (select name from tempdb.dbo.sysobjects
where name = '#mass_update_bill_fee_codes')
begin	
	drop table #mass_update_bill_fee_codes
end	

create table #mass_update_bill_fee_codes
(
	run_id int not null,						
	prop_id int not null,
	year int not null,
	sup_num int not null,
	item_id int not null,
	curr_bill_fee_cd varchar(10) null,
	prev_bill_fee_cd varchar(10) null,
	curr_comment varchar(500) null,
	prev_comment varchar (500) null,
	adjustment_id int
) 

create clustered index #ndx_tmp_mass_update_bill_fee_codes on 
#mass_update_bill_fee_codes (item_id)

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  @StepMsg + ' End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds

set @StepMsg = 'Update bills'
set @StartStep = getdate()  --logging capture start time of step

-- Get all the bills that need to be updated with new bill/fee code for the year
insert into #mass_update_bill_fee_codes
(run_id, prop_id, year, sup_num, item_id,  prev_bill_fee_cd, curr_bill_fee_cd, prev_comment, curr_comment)
select
	@run_id,
	ids.prop_id,
	b.display_year, 
	b.sup_num,
	b.bill_id,
	b.code,
	@new_bill_fee_code,
	b.comment,
	@new_comment
from bill b with(nolock)
join mass_update_bill_fee_code_run_year muy with(nolock)
on muy.year = b.display_year
and muy.run_id = @run_id
left join assessment_bill ab with (nolock)
on ab.bill_id = b.bill_id 
left join special_assessment_agency saa with(nolock)
on ab.agency_id = saa.agency_id
left join levy_bill lb with (nolock)
on lb.bill_id = b.bill_id 
left join tax_district td on
lb.tax_district_id = td.tax_district_id
join mass_update_bill_fee_code_run mur with(nolock)
on mur.run_id = muy.run_id
join #propIds ids with(nolock)
on ids.prop_id = b.prop_id
and b.statement_id is not null
where 1 = case -- this is the INCLUDE PAID BILLS filter
	when mur.crit_include_paid_bills = 0 and b.current_amount_due >0 and b.current_amount_due != b.amount_paid then 1 -- ONLY include bills which are not yet paid in full
	when mur.crit_include_paid_bills  = 1 then 1 -- ALWAYS include bills
end
and 1 = case -- this is the BILL FEE CODE filter
	when mur.crit_bill_fee_codes = '' then 1
	when mur.crit_bill_fee_codes = 'ALL' and b.code is not null then 1
	when mur.crit_bill_fee_codes <> 'ALL' and b.code in (select ID from [dbo].[fn_ReturnTableFromCommaSepValues](@BillFeeCodes)) then 1
end
and 1 = case -- this is the SPECIAL ASSESSMENT filter
	when mur.crit_special_assessments = '' then 1
	when mur.crit_special_assessments = 'ALL' and saa.assessment_cd is not null then 1
	when mur.crit_special_assessments <> 'ALL' and saa.assessment_cd in (select ID from [dbo].[fn_ReturnTableFromCommaSepValues](@SpecialAssessments)) then 1
end
and 1 = case -- this is the TAX DISTRICTS filter
	when mur.crit_tax_districts = '' then 1
	when mur.crit_tax_districts = 'ALL' and td.tax_district_cd is not null then 1
	when mur.crit_tax_districts <> 'ALL' and td.tax_district_cd in (select ID from [dbo].[fn_ReturnTableFromCommaSepValues](@TaxDistricts)) then 1
end


-- set bill adjustment IDs
declare @bill_count int
declare @first_bill_adj_id int

select @bill_count = count(*) from #mass_update_bill_fee_codes
if @bill_count > 0
begin
	exec GetUniqueID 'bill_adjustment', @first_bill_adj_id output, @bill_count

	;with bill_fee_codes as
	(
		select *, @first_bill_adj_id + ROW_NUMBER() over (order by item_id) - 1 as assigned_adjustment_id 
		from #mass_update_bill_fee_codes
	)
	update bill_fee_codes
	set adjustment_id = assigned_adjustment_id           

	-- insert adjustments for levy bills
	insert into dbo.bill_adjustment
	(
		bill_adj_id, bill_id, sup_num, 
		previous_bill_fee_cd, bill_fee_cd, previous_base_tax, base_tax, 
		bill_calc_type_cd, tax_area_id,
		previous_taxable_val, taxable_val, modify_reason, pacs_user_id, adjustment_date,
		previous_effective_due_dt, effective_due_dt, previous_payment_status_type_cd, payment_status_type_cd
	)
	select tmp.adjustment_id, tmp.item_id, tmp.sup_num,
	tmp.prev_bill_fee_cd, tmp.curr_bill_fee_cd, b.current_amount_due, b.current_amount_due, 
	'BFC', dbo.fn_BillLastTaxAreaId(tmp.item_id, null),
	lb.taxable_val, lb.taxable_val, tmp.curr_comment, @pacs_user_id, @adjustment_date, 
	b.effective_due_date, b.effective_due_date, b.payment_status_type_cd, b.payment_status_type_cd

	from #mass_update_bill_fee_codes tmp

	join levy_bill lb with(nolock)
	on lb.bill_id = tmp.item_id

	join bill b with(nolock)
	on b.bill_id = lb.bill_id

	-- insert adjustments for assessment bills
	insert into dbo.bill_adjustment
	(
		bill_adj_id, bill_id,	sup_num, 
		previous_bill_fee_cd, bill_fee_cd, 
		previous_base_tax, base_tax, bill_calc_type_cd, modify_reason,
		pacs_user_id, adjustment_date,
		previous_effective_due_dt, effective_due_dt, previous_payment_status_type_cd, payment_status_type_cd
	)
	select tmp.adjustment_id, tmp.item_id, tmp.sup_num,
	tmp.prev_bill_fee_cd, tmp.curr_bill_fee_cd, 
	b.current_amount_due, b.current_amount_due, 'BFC', tmp.curr_comment, 
	@pacs_user_id, @adjustment_date,
	b.effective_due_date, b.effective_due_date, b.payment_status_type_cd, b.payment_status_type_cd

	from #mass_update_bill_fee_codes tmp

	join assessment_bill ab with(nolock)
	on ab.bill_id = tmp.item_id

	join bill b with(nolock)
	on b.bill_id = ab.bill_id


	-- update the bill records
	update b 
	set last_modified = @adjustment_date,
		code = tmp.curr_bill_fee_cd, 
		comment = tmp.curr_comment
	from #mass_update_bill_fee_codes tmp
	join bill b
	on tmp.item_id = b.bill_id

	 -- populate the mass update details table
	insert into mass_update_bill_fee_code_run_details 
	(run_id, prop_id, year, sup_num, bill_id, 
	 curr_bill_fee_code, prev_bill_fee_code, curr_comment, prev_comment)
	select @run_id, tmp.prop_id, tmp.year , tmp.sup_num, tmp.item_id, 
		tmp.curr_bill_fee_cd, tmp.prev_bill_fee_cd, tmp.curr_comment, tmp.prev_comment
	from #mass_update_bill_fee_codes  tmp with (nolock)
end

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  @StepMsg + ' End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds

                                  
set @StepMsg = 'Process fees'
set @StartStep = getdate()  
 
truncate table #mass_update_bill_fee_codes

-- get fees to modify
insert into #mass_update_bill_fee_codes (
run_id, prop_id, year, sup_num, item_id,  prev_bill_fee_cd, curr_bill_fee_cd, prev_comment, curr_comment)
select
	@run_id,
	ids.prop_id,
	f.display_year, 
	isnull(f.sup_num, 0),
	f.fee_id,
	f.code,
	@new_bill_fee_code,
	f.comment,
	@new_comment
from fee f with (nolock)
join mass_update_bill_fee_code_run_year muy with (nolock)
on muy.year = f.display_year
and muy.run_id = @run_id
join mass_update_bill_fee_code_run mur with(nolock)
on mur.run_id = muy.run_id
join fee_property_vw fpv with (nolock)
on fpv.fee_id = f.fee_id
join #propIds ids with (nolock)
on ids.prop_id = fpv.prop_id
and f.statement_id is not null
where 1 = case -- this is the INCLUDE PAID BILLS filter
	when mur.crit_include_paid_bills = 0 and f.current_amount_due >0 and f.current_amount_due != f.amount_paid then 1 -- ONLY include bills which are not yet paid in full
	when mur.crit_include_paid_bills  = 1 then 1 -- ALWAYS include bills
end
and 1 = case -- this is the BILL FEE CODE filter
	when mur.crit_bill_fee_codes = '' then 1
	when mur.crit_bill_fee_codes = 'ALL' and f.code is not null then 1
	when mur.crit_bill_fee_codes <> 'ALL' and f.code in (select ID from [dbo].[fn_ReturnTableFromCommaSepValues](@BillFeeCodes)) then 1
end
and 1 = case -- this is the FEE TPYE CODE filter
	when mur.crit_fee_type = '' then 1
	when mur.crit_fee_type = 'ALL' and f.fee_type_cd is not null then 1
	when mur.crit_fee_type <> 'ALL' and f.fee_type_cd in (select ID from [dbo].[fn_ReturnTableFromCommaSepValues](@FeeType)) then 1
end

-- set fee adjustment IDs
declare @fee_count int
declare @first_fee_adj_id int

select @fee_count = count(*) from #mass_update_bill_fee_codes
if @fee_count > 0
begin
	exec GetUniqueID 'fee_adjustment', @first_fee_adj_id output, @fee_count

	;with bill_fee_codes as
	(
		select *, @first_fee_adj_id + ROW_NUMBER() over (order by item_id) - 1 as assigned_adjustment_id 
		from #mass_update_bill_fee_codes
	)
	update bill_fee_codes
	set adjustment_id = assigned_adjustment_id           

	-- insert fee adjustments
	insert into dbo.fee_adjustment
	(
		fee_adj_id, fee_id, sup_num, 
		previous_bill_fee_cd, bill_fee_cd, 
		previous_base_amount, base_amount, bill_calc_type_cd, modify_reason, pacs_user_id, adjustment_date, 
		previous_effective_due_dt, effective_due_dt, previous_payment_status_type_cd, payment_status_type_cd
	)
	select tmp.adjustment_id, tmp.item_id, tmp.sup_num,
	tmp.prev_bill_fee_cd, tmp.curr_bill_fee_cd,
	f.current_amount_due, f.current_amount_due, 'BFC', tmp.curr_comment, @pacs_user_id, @adjustment_date,
	f.effective_due_date, f.effective_due_date, f.payment_status_type_cd, f.payment_status_type_cd

	from #mass_update_bill_fee_codes tmp
	join fee f with(nolock)
	on tmp.item_id = f.fee_id

	-- update the fee records			
	update f
	set last_modified = @adjustment_date,
		code = tmp.curr_bill_fee_cd, 
		comment = tmp.curr_comment
	from #mass_update_bill_fee_codes tmp
	join fee f  
	on tmp.item_id = f.fee_id

	-- populate the mass update run details table
	insert into mass_update_bill_fee_code_run_details 
	(run_id, prop_id, year, sup_num, bill_id, 
		curr_bill_fee_code, prev_bill_fee_code, curr_comment, prev_comment)
	select @run_id, tmp.prop_id, tmp.year , tmp.sup_num, tmp.item_id, 
		tmp.curr_bill_fee_cd, tmp.prev_bill_fee_cd, tmp.curr_comment, tmp.prev_comment
	from #mass_update_bill_fee_codes  tmp with (nolock)
end

drop table #mass_update_bill_fee_codes
drop table #propIds

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  @StepMsg + ' End'
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
	@AppMsg = 'Error in proc: ' + isnull(@proc,'') + ' ' + isnull(@StepMsg, '') + isnull(@ERROR_MESSAGE, '')
	
	exec dbo.CurrentActivityLogInsert @proc, @AppMsg,0,@ERROR_NUMBER

  RAISERROR(@AppMsg, 16, 1) 

END CATCH

GO

