
/*  NOTE: MAJOR CHANGES MADES TO THIS PROC Jan. 2012 *** */
/*  SEE NOTES BELOW *** */


create procedure WATaxStatementLevyCreate
	@pacs_user_id int,
	@year numeric(4,0),
	@group_id int,
	@run_id int,
	@dataset_id_delq_bill int,
	@dataset_id_delq_fee int,
	@generate_event bit,
	@dataset_id_HalfPay int,
	@owner_only int -- 0 is owner, 1 is agent, 2 is mortgage, 3 is taxserver and 4 is all
as

/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
/*  MAJOR CHANGES MADES TO THIS PROC Jan. 2012 *** */

/* Below is a list of tables modified in this proces:
Modification may not be in this proc  could be in proc called by this proc.
For performance, tables that have a _current_run Yes designation, means that data is first
written to to a mirror image of that table that has a suffix of "_current_run"
Data of "_current_run tables" are inserted into "real" tables at the very end of this proc
by calling the proc WATaxStatementLevyCreate_InsertFrom_CurrentRun 

TABLE                                            Modification type possible  Has _current_run work table
account_event_assoc	                             Insert                              No
event	                                         Insert                              No
prop_event_assoc	                             Insert                              No

wa_tax_statement	                             Insert,Update,Delete                Yes
wa_tax_statement_assessment_fee	                 Insert,Update,Delete                Yes
wa_tax_statement_assessment_fee_display	         Insert,Delete                       Yes
wa_tax_statement_delinquent_history	             Insert,Update,Delete                Yes
wa_tax_statement_history	                     Insert                              No
wa_tax_statement_history_bill_fee_assoc	         Insert                              No
wa_tax_statement_levy	                         Insert,Update,Delete                Yes
wa_tax_statement_levy_details_display            Insert,Update,Delete                Yes
wa_tax_statement_levy_display	                 Insert,Deleted                      Yes
wa_tax_statement_owner	                         Insert,Update,Delete                Yes
wa_tax_statement_owner_distribution	             Insert,Update,Delete                Yes
wa_tax_statement_run	                         Update                              No
wa_tax_statement_system_address	                 Insert,Delete
wa_tax_statement_tax_history_comparison	         Insert,Update,Delete                Yes

*/
BEGIN TRY   --- SET UP ERROR HANDLING

DECLARE @StartProc datetime
    SET @StartProc = getdate()
DECLARE @StartStep datetime
DECLARE @LogTotRows int
DECLARE @LogStatus varchar(200)
DECLARE @LogErrCode int
DECLARE @qry varchar(255)
DECLARE @curRows int
DECLARE @proc varchar(500)
DECLARE @StatementID int
 set @proc = object_name(@@procid)

 SET @qry = 'Start - ' + @proc  
 + ' @pacs_user_id =' +  convert(varchar(30),@pacs_user_id) + ','
 + ' @year =' +  convert(varchar(30),@year) + ','
 + ' @group_id =' +  convert(varchar(30),@group_id) + ','
 + ' @run_id =' +  convert(varchar(30),@run_id) + ','
 + ' @dataset_id_delq_bill =' +  convert(varchar(30),@dataset_id_delq_bill) + ','
 + ' @dataset_id_delq_fee =' +  convert(varchar(30),@dataset_id_delq_fee) + ','
 + ' @generate_event =' +  convert(varchar(30),@generate_event) + ','
 + ' @dataset_id_HalfPay =' +  convert(varchar(30),@dataset_id_HalfPay) + ','
 + ' @owner_only =' +  convert(varchar(30),@owner_only) 
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */

set @StartStep = getdate()
SET @LogStatus = 'Step 1 Start '


declare @prev_year numeric(4,0)
    set @prev_year = @year - 1

declare @statement_id int    
declare @payment_group_id int
declare @prop_id int
declare @taxpayer_statement bit
declare @current_tax_yr int

select @current_tax_yr = tax_yr from pacs_system

select @taxpayer_statement = case when isNull(statement_option, 0) = 2 
                               then 1 else 0 
                             end
  from wa_tax_statement_run wts 
where wts.year = @year and wts.group_id = @group_id and wts.run_id = @run_id
 
SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 2 Start '

-- call to remove existing records from main tables that have this run inf
-- normally won't be any, but just in case
exec WATaxStatementLevyCreate_Delete_Existing @pacs_user_id,@year,@group_id,@run_id

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 2 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 3 Start '

-- call to remove entries from work tables with this run info
-- normally won't be any, but just in case

exec WATaxStatementLevyCreate_Delete_CurrentRun @year,@group_id,@run_id

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 3 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 4 Start '
	
-- get some info used in several steps from large tables
-- so it is only retrieved once

-- wa_tax_statement_calc_bill
create table #wa_tax_statement_calc_bill
( [year] numeric(4,0)
 ,statement_id int
 ,prop_id int
 ,bill_id int
 ,current_amount_due numeric (14,2)
)

insert into #wa_tax_statement_calc_bill
( [year] 
 ,statement_id 
 ,prop_id 
 ,bill_id 
 ,current_amount_due
)
select
	 [year] 
	 ,statement_id 
	 ,prop_id 
	 ,bill_id 
	 ,current_amount_due
  from wa_tax_statement_calc_bill as wts  
        -- pk run_year, group_id, run_id, bill_id
where wts.run_year = @year and wts.group_id = @group_id and wts.run_id = @run_id


select
	 @StatementID = statement_id 
  from wa_tax_statement_calc_bill as wts  
where wts.run_year = @year and wts.group_id = @group_id and wts.run_id = @run_id



SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 4 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 5 Start '

create clustered index idx_bill_id on #wa_tax_statement_calc_bill(bill_id,statement_id)

SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 5 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 6 Start '

-- wa_tax_statement_calc_bill_payments_due 
create table #wa_tax_statement_calc_bill_payments_due 
( bill_id int
 ,payment_id int
 ,is_h1_payment bit
 ,due_date datetime
 ,amount_due numeric(14,2)
 ,amount_paid numeric(14,2)
 ,amt_interest numeric(14,2)
 ,amt_bond_interest numeric(14,2)
 ,amt_penalty numeric(14,2)
 ,is_delinquent bit
 )

insert into #wa_tax_statement_calc_bill_payments_due
(
  bill_id
 ,payment_id
 ,is_h1_payment
 ,due_date
 ,amount_due
 ,amount_paid
 ,amt_interest
 ,amt_bond_interest
 ,amt_penalty
 ,is_delinquent
)
select
	  bill_id
	 ,payment_id
	 ,is_h1_payment
	 ,due_date
	 ,amount_due
	 ,amount_paid
	 ,amt_interest
	 ,amt_bond_interest
	 ,amt_penalty
	 ,is_delinquent
 from wa_tax_statement_calc_bill_payments_due as wts 
        -- pk run_year, group_id, run_id, bill_id, payment_id 
where wts.run_year = @year and wts.group_id = @group_id and wts.run_id = @run_id


SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 6 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 7 Start '

create clustered index idx_bill_id 
  on #wa_tax_statement_calc_bill_payments_due(bill_id,payment_id)

SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 7 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode


set @StartStep = getdate()
SET @LogStatus = 'Step 8 Start '

-- wa_tax_statement_calc_fee_payments_due
create table #wa_tax_statement_calc_fee_payments_due
( fee_id int
 ,payment_id int
 ,is_h1_payment bit
 ,due_date datetime
 ,amount_due numeric(14,2)
 ,amount_paid numeric(14,2)
 ,amt_interest numeric(14,2)
 ,amt_bond_interest numeric(14,2)
 ,amt_penalty numeric(14,2)
)

insert into #wa_tax_statement_calc_fee_payments_due
(
  fee_id
 ,payment_id
 ,is_h1_payment
 ,due_date
 ,amount_due
 ,amount_paid
 ,amt_interest
 ,amt_bond_interest
 ,amt_penalty
)
select
  fee_id
 ,payment_id
 ,is_h1_payment
 ,due_date
 ,amount_due
 ,amount_paid
 ,amt_interest
 ,amt_bond_interest
 ,amt_penalty
  from wa_tax_statement_calc_fee_payments_due as wts 
        -- pk run_year, group_id, run_id, fee_id, payment_id 
where wts.run_year = @year and wts.group_id = @group_id and wts.run_id = @run_id


SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 8 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 9 Start '

create clustered index idx_fee_id 
    on #wa_tax_statement_calc_fee_payments_due(fee_id,payment_id)

SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 9 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode


set @StartStep = getdate()
SET @LogStatus = 'Step 10 Start '

-- get needed info from wa_tax_statement_calc_fee
create table #wa_tax_statement_calc_fee
( [year] numeric(4,0)
 ,statement_id int
 ,fee_id int
 ,current_amount_due numeric(14,2)
 ,fee_type_cd varchar(10)
)

insert into #wa_tax_statement_calc_fee
( [year] 
 ,statement_id 
 ,fee_id 
 ,current_amount_due
 ,fee_type_cd
)
select
	  wts.[year] 
	 ,wts.statement_id 
	 ,wts.fee_id
	 ,wts.current_amount_due 
	 ,fee_type_cd
  from wa_tax_statement_calc_fee as wts  
         -- pk run_year, group_id, run_id, fee_id
where wts.run_year = @year and wts.group_id = @group_id and wts.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 10 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 11 Start '

create clustered index idx_fee on #wa_tax_statement_calc_fee(fee_id,statement_id)

SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 11 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 12 Start '

-- get info for current year bills to be used in later steps
create table #bill
( 
	bill_id int,
	prop_id int,
	statement_id int,
	payment_group_id int,
	rollback_id int,
	bill_type varchar(5),
	code varchar(10)
)

insert into #bill
( 
  bill_id,
  prop_id,
  statement_id,
  payment_group_id,
  rollback_id,
  bill_type,
  code
)

select b.bill_id,
	b.prop_id,
	b.statement_id,
	b.payment_group_id,
	b.rollback_id,
	b.bill_type,
	b.code
from #wa_tax_statement_calc_bill cb 
join bill b with(nolock)
on b.bill_id = cb.bill_id
   
create clustered index idx_statement_id on #bill(statement_id, bill_id)

SELECT @LogTotRows = @@ROWCOUNT,
 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 12 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 13 Start '

-- get info for current year fees to be used in later steps
create table #fee
( 
	fee_id int,
	prop_id int,
	statement_id int,
	payment_group_id int,
	rollback_id int,
	fee_type_cd varchar(10),
	code varchar(10)
)

insert into #fee
( 
	fee_id,
	prop_id,
	statement_id,
	payment_group_id,
	rollback_id,
	fee_type_cd,
	code
)

select f.fee_id,
	fpv.prop_id,
	f.statement_id,
	f.payment_group_id,
	f.rollback_id,
	f.fee_type_cd,
	f.code
from #wa_tax_statement_calc_fee cf 
join fee f with(nolock)
on f.fee_id = cf.fee_id
join fee_property_vw fpv with(nolock)
on f.fee_id = fpv.fee_id
   
create clustered index idx_statement_id on #fee(statement_id, fee_id)

SELECT @LogTotRows = @@ROWCOUNT,
 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 13 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 14 Start '

-- get delinquent bill information
create table #delq_bill
( 
	bill_id int,
	prop_id int,
	statement_id int,
	year numeric(4,0),
	payment_group_id int,
	rollback_id int
)

insert into #delq_bill
( 
	bill_id,
	prop_id,
	statement_id,
	year,
	payment_group_id,
	rollback_id
)

select b.bill_id,
	b.prop_id,
	b.statement_id,
	b.year,
	b.payment_group_id,
	b.rollback_id
from tax_due_calc_bill cb 
join bill b with(nolock)
on b.bill_id = cb.bill_id
where cb.dataset_id = @dataset_id_delq_bill   
   
create clustered index idx_statement_id on #delq_bill(statement_id, bill_id)

SELECT @LogTotRows = @@ROWCOUNT,
 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 14 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 15 Start '

-- get delinquent fee information
create table #delq_fee
( 
	fee_id int,
	prop_id int,
	statement_id int,
	year numeric(4,0),
	payment_group_id int
)

insert into #delq_fee
( 
	fee_id,
	prop_id,
	statement_id,
	year,
	payment_group_id
)

select f.fee_id,
	fpv.prop_id,
	f.statement_id,
	f.year,
	f.payment_group_id
from tax_due_calc_fee cf 
join fee f with(nolock)
on f.fee_id = cf.fee_id
join fee_property_vw fpv with(nolock)
on f.fee_id = fpv.fee_id
where cf.dataset_id = @dataset_id_delq_fee
   
create clustered index idx_statement_id on #delq_fee(statement_id, fee_id)

SELECT @LogTotRows = @@ROWCOUNT,
 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 15 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 16 Start '

-- Create a table of statements.  This lists statements that will be created in the run year,
-- and maps previous year statements to the current year ones.

create table #tblStatementInfo
(
	statement_id int,
	year numeric(4,0),
	prop_id int,
	is_current_year_statement bit,
	payment_group_id int,
	cy_statement_id int,
	cy_year numeric(4,0),
	original_statement_id int,
	is_additional_statement bit
)

create clustered index idx_statement_id on #tblStatementInfo(statement_id, year, prop_id)

-- insert current year statements
insert #tblStatementInfo
(
	statement_id,
	year,
	prop_id,
	is_current_year_statement,
	payment_group_id,
	cy_statement_id,
	cy_year,
	is_additional_statement
)

select statement_id, @year, prop_id, 1, payment_group_id, statement_id, @year, 0
from #bill

union

select statement_id, @year, prop_id, 1, payment_group_id, statement_id, @year, 0
from #fee

-- add delinquent statements
insert #tblStatementInfo
(
	statement_id,
	year,
	prop_id,
	is_current_year_statement,
	payment_group_id,
	cy_statement_id,
	cy_year,	
	is_additional_statement
)

select b.statement_id, b.year, b.prop_id, 0, payment_group_id, @StatementID, @year, 0
from #delq_bill b

union

select distinct f.statement_id, f.year, f.prop_id, 0, payment_group_id, @StatementID, @year, 0
from #delq_fee f


-- Determine if any additional statements should be added to the current year

declare @additional_statement_id int

select @additional_statement_id = max(statement_id) + 1
from #tblStatementInfo tsi
where tsi.year = @year

declare @current_prop_id int
set @current_prop_id = -999

declare @current_statement_id int
set @current_statement_id = -999

-- Search for current year statements that contain more than one payment group ID.
-- Create additional statements so that each payment group ID has its own statement.

declare statements_to_split cursor LOCAL fast_forward for

select tsi.prop_id, tsi.statement_id, tsi.payment_group_id
from #tblStatementInfo tsi

join ( 
	select prop_id, statement_id, count(distinct tsi2.payment_group_id) payment_group_count
	from #tblStatementInfo tsi2
	where tsi2.year = @year
	group by tsi2.prop_id, tsi2.statement_id
	having count(distinct tsi2.payment_group_id) > 1
) ss
on ss.prop_id = tsi.prop_id
and ss.statement_id = tsi.statement_id
and tsi.year = @year

order by tsi.prop_id, tsi.statement_id


open statements_to_split
fetch next from statements_to_split into @prop_id, @statement_id, @payment_group_id

while (@@FETCH_STATUS = 0)
begin
	if (@prop_id <> @current_prop_id or @statement_id <> @current_statement_id)
	begin
		-- first occurrence of a statement
		set @current_prop_id = @prop_id
		set @current_statement_id = @statement_id
	end
	else begin
		-- subsequent occurrence - assign an additional statement ID
		update tsi
		set statement_id = @additional_statement_id,
			original_statement_id = @statement_id,
			is_additional_statement = 1
		from #tblStatementInfo tsi
		where tsi.statement_id = @statement_id
		and tsi.year = @year
		and tsi.prop_id = @prop_id
		and tsi.payment_group_id = @payment_group_id
		
		set @additional_statement_id = @additional_statement_id + 1
	end
	
	fetch next from statements_to_split into @prop_id, @statement_id, @payment_group_id
end

close statements_to_split
deallocate statements_to_split

-- update cached bill and fee records with additional statement IDs
update b
set statement_id = tsi.statement_id

from #bill b

join #tblStatementInfo tsi
on b.prop_id = tsi.prop_id
and b.payment_group_id = tsi.payment_group_id
and b.statement_id = tsi.original_statement_id

where tsi.original_statement_id is not null


update wtscb
set statement_id = b.statement_id
from #wa_tax_statement_calc_bill wtscb

join #bill b
on b.bill_id = wtscb.bill_id

where b.prop_id in (
	select prop_id from #tblStatementInfo
	where original_statement_id is not null
)


update f
set statement_id = tsi.statement_id

from #fee f

join #tblStatementInfo tsi
on f.prop_id = tsi.prop_id
and f.payment_group_id = tsi.payment_group_id
and f.statement_id = tsi.original_statement_id

where tsi.original_statement_id is not null


update wtscf
set statement_id = f.statement_id
from #wa_tax_statement_calc_fee wtscf

join #fee f
on f.fee_id = wtscf.fee_id

where f.prop_id in (
	select prop_id from #tblStatementInfo
	where original_statement_id is not null
)


-- Search for payment group IDs that exist only in previous years.  If any are found,
-- create an additional statement in the current year for each of them.

declare prev_year_only_payment_groups cursor LOCAL fast_forward for

select distinct payment_group_id, prop_id
from #tblStatementInfo tsi

where exists (
	select 1 from #tblStatementInfo tsi_prev
	where tsi_prev.payment_group_id = tsi.payment_group_id
	and tsi_prev.prop_id = tsi.prop_id
	and tsi_prev.year < @year
)

and not exists (
	select 1 from #tblStatementInfo tsi_current
	where tsi_current.payment_group_id = tsi.payment_group_id
	and tsi_current.prop_id = tsi.prop_id
	and tsi_current.year = @year
)

open prev_year_only_payment_groups
fetch next from prev_year_only_payment_groups into @payment_group_id, @prop_id

while (@@FETCH_STATUS = 0)
begin
	insert #tblStatementInfo
	(statement_id, year, prop_id, is_current_year_statement, payment_group_id,
	 cy_statement_id, cy_year, is_additional_statement)
	values (@additional_statement_id, @year, @prop_id, 1, @payment_group_id,
		@additional_statement_id, @year, 1)

	set @additional_statement_id = @additional_statement_id + 1

	fetch next from prev_year_only_payment_groups into @payment_group_id, @prop_id	
end

close prev_year_only_payment_groups
deallocate prev_year_only_payment_groups


SELECT @LogTotRows = @@ROWCOUNT,
       @LogErrCode = @@ERROR
SET @LogStatus = 'Step 16 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode


set @StartStep = getdate()
SET @LogStatus = 'Step 17 Start '

-- Run options
declare @dtNow datetime
set @dtNow = getdate()
declare @first_half_payment bit
declare @effective_date datetime
declare @run_type char(1)
select
	@first_half_payment = 1,--first_half_payment,
	@effective_date = dateadd(dd, 0, datediff(dd, 0, effective_date)), -- get just the effective date, no time
	@run_type = case 
	              when type = '2' then 'D' 
	              when type = 'O' then 'C' 
	              else type 
	            end
from wa_tax_statement_run 
where year = @year and group_id = @group_id and run_id = @run_id

declare @suppress_prior_year_values bit
set @suppress_prior_year_values = 0

if exists(select szConfigName
					from pacs_config
					with (nolock)
					where szGroup = 'Tax Statement Config'
					and szConfigName = 'Suppress Prior Values on Tax Statement Suppressed On Notice'
					and szConfigValue = 'T')
begin
	set @suppress_prior_year_values = 1
end

declare @pacs_user_name varchar(30)

select @pacs_user_name = pacs_user_name
from pacs_user with(nolock)
where pacs_user_id = @pacs_user_id

SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 17 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode


set @StartStep = getdate()
SET @LogStatus = 'Step 18 Start '

-- Initial insert into wa_tax_statement
-- Satisfying only the non nullable columns,
-- and things we already know at this point
	
declare @statement_count int  

exec WATaxStatementLevyCreate_Insert_wa_tax_statement_current_run
         @pacs_user_name, @year, @group_id, @run_id,@suppress_prior_year_values,
         @effective_date, @statement_count output    
    
SELECT @LogTotRows = @statement_count,
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 18 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 19 Start '
				
-- match delinquent statements to "parent" current year statements, based on property IDs
update tsi
set
	cy_statement_id = parent_tsi.statement_id,
	cy_year = parent_tsi.year
from #tblStatementInfo tsi

cross apply (
	select top 1 t.statement_id, t.year
	from #tblStatementInfo t
	
	where tsi.prop_id = t.prop_id
	and t.is_current_year_statement = 1
	and  t.payment_group_id = tsi.payment_group_id
	
	order by case when isnull(tsi.payment_group_id, -1) = isnull(t.payment_group_id, -1)
		then 1 else 2 end
	
) parent_tsi

where tsi.is_current_year_statement = 0

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 19 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 20 Start '
--------------------------------------
-- BEGIN - Updates to wa_tax_statement unrelated to tax due values
--------------------------------------

-- Situs information
update wts
set
	wts.situs_display = REPLACE(situs.situs_display, ',', ' ')
from wa_tax_statement_current_run as wts 
join situs  on
	situs.prop_id = wts.prop_id and
	situs.primary_situs = 'Y'
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 20 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 21 Start '
	
-- 'In Care Of' linked owner	
update wts
set
	wts.care_of_name = a.file_as_name
from wa_tax_statement_current_run as wts 
join prop_linked_owner as plo  -- pk prop_val_yr, sup_num, prop_id, owner_id
 on
	plo.prop_val_yr = wts.year and
	plo.sup_num = wts.sup_num and
	plo.prop_id = wts.prop_id and
	plo.link_type_cd = 'C/O'
join account as a 
  on a.acct_id = plo.owner_id
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 21 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 22 Start '
	
-- Agent ID
update wts
set
	wts.agent_id = p.col_agent_id
from wa_tax_statement_current_run as wts
     join
     property as p 
 on p.prop_id = wts.prop_id 
-- Jon suggested removing the join with agent_assoc
--join agent_assoc aa with(nolock) on
--	aa.owner_tax_yr = wts.year
--	and aa.prop_id = wts.prop_id
--	and aa.owner_id = wts.owner_id
--	and aa.agent_id = p.col_agent_id
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id
--	and (aa.exp_dt is null or aa.exp_dt > @StartProc)
	and p.col_agent_id is not null
	and p.col_agent_id <> 0

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 22 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 23 Start '
	
	
-- Mortgage company ID & Taxserver ID
update wts
set
	wts.mortgage_co_id = ma.mortgage_co_id,
	wts.mortgage_company = a.file_as_name,
	wts.taxserver_id = mc.taxserver_id
from wa_tax_statement_current_run as wts 
     join mortgage_assoc as ma
  on ma.prop_id = wts.prop_id
     join 
     mortgage_co as mc
  on mc.mortgage_co_id = ma.mortgage_co_id
     join 
     account as a 
  on a.acct_id = ma.mortgage_co_id
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 23 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 24 Start '
-- Auto-Pay Enrollment
update wts
set
	wts.autopay_enrolled_status = isNull(ae.enrolled_status, 0)
from wa_tax_statement_current_run as wts 
join autopay_enrollment ae on 
	wts.prop_id = ae.prop_id and
	wts.owner_id = ae.acct_id
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id


SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 24 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 25 Start '
	
-- Owner address
update wts
set
	wts.owner_addr_line1 = addr.addr_line1,
	wts.owner_addr_line2 = addr.addr_line2,
	wts.owner_addr_line3 = addr.addr_line3,
	wts.owner_carrier_route = addr.carrier_route,
	wts.owner_addr_city = addr.addr_city,
	wts.owner_addr_state = addr.addr_state,
	wts.owner_addr_zip = addr.addr_zip,
	wts.owner_addr_country = case	when isNull(country.country_name, '') = '' then addr.country_cd 
									else country.country_name end,
	wts.owner_addr_is_deliverable = case
		when IsNull(addr.ml_deliverable, 'T') in ('T','Y')
		then 1
		else 0
	end,
	wts.owner_addr_is_international = addr.is_international
from wa_tax_statement_current_run as wts 
     join 
     address as addr with(nolock)
  on
	 addr.acct_id = wts.owner_id and
	 isNull(addr.primary_addr, 'N') = 'Y'
     left join 
     country with (nolock) 
  on
	country.country_cd = addr.country_cd
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 25 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 26 Start '

-- Mailto address for owner
update wts
set
	wts.mailto_id = wts.owner_id,
	wts.mailto_name = wts.owner_name,
	wts.mailto_addr_line1 = wts.owner_addr_line1,
	wts.mailto_addr_line2 = wts.owner_addr_line2,
	wts.mailto_addr_line3 = wts.owner_addr_line3,
	wts.mailto_carrier_route = wts.owner_carrier_route,
	wts.mailto_addr_city = wts.owner_addr_city,
	wts.mailto_addr_state = wts.owner_addr_state,
	wts.mailto_addr_zip = wts.owner_addr_zip,
	wts.mailto_addr_country = wts.owner_addr_country,
	wts.mailto_addr_is_deliverable = wts.owner_addr_is_deliverable,
	wts.mailto_addr_is_international = wts.owner_addr_is_international
from wa_tax_statement_current_run as wts 
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 26 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode



--------------------------------------
-- END - Updates to wa_tax_statement unrelated to tax due values
--------------------------------------

set @StartStep = getdate()
SET @LogStatus = 'Step 27 Start '
	

-- wa_tax_statement_levy_details_display

exec WATaxStatementLevyCreate_Insert_wa_tax_statement_levy_details_display_current_run
                                   @pacs_user_id,@year,@group_id,@run_id 


SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 27 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode


set @StartStep = getdate()
SET @LogStatus = 'Step 28 Start '

-- wa_tax_statement_levy
exec WATaxStatementLevyCreate_Insert_wa_tax_statement_levy_current_run
                                   @pacs_user_id,@year,@group_id,@run_id 
		

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 28 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 29 Start '

	
--------------------------------------------------
-- BEGIN - wa_tax_statement_tax_history_comparison
--------------------------------------------------

exec WATaxStatementLevyCreate_Insert_wa_tax_statement_tax_history_comparison_current_run
               @pacs_user_id,@year,@group_id,@run_id


SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 29 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode
	--------------------------------------------------
	-- END - wa_tax_statement_tax_history_comparison
	--------------------------------------------------

	----------------------------------------
	-- BEGIN - wa_tax_statement_assessment_fee
	----------------------------------------
	
set @StartStep = getdate()
SET @LogStatus = 'Step 30 Start '

exec WATaxStatementLevyCreate_Insert_wa_tax_statement_assessment_fee_current_run
	 @pacs_user_id,
	 @year,
	 @group_id,
	 @run_id
	 
SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 30 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode
	 
------------------------------------------
---- END - wa_tax_statement_assessment_fee
------------------------------------------

--------------------------------------
-- BEGIN - Updates to wa_tax_statement related to tax due values
--------------------------------------

set @StartStep = getdate()			
SET @LogStatus = 'Step 31 Start '

declare @StartOfYear datetime
declare @EndOfYear datetime
    set @StartofYear = '1/1/' + cast(@year as varchar(4))
    set @EndOfYear = DATEADD(ms,-3,DATEADD(yy,1,@StartofYear))  
    
    -- get prior tax value into work table for update in next step
create table #tmpPriorTaxes
( prop_id int
 ,base_paid numeric(18,2)
 ,pi_paid numeric(18,2)
)

insert into #tmpPriorTaxes
( prop_id 
 ,base_paid
 ,pi_paid
)
select 
	  b.prop_id,
	  base_paid = sum(isnull(ct.base_amount_pd, 0)),
	  pi_paid = sum(isnull(ct.penalty_amount_pd, 0) 
			  + isnull(ct.interest_amount_pd, 0) 
			  + isnull(ct.bond_interest_pd, 0)
			  + isnull(ct.other_amount_pd, 0)) 
 from bill as b  -- PK cluster bill_id
	  join 
	  coll_transaction as ct 
	  -- pk cluster transaction_id, idx trans_group_id, create_date, transaction_type
   on
	  ct.trans_group_id = b.bill_id
      join 
      (		-- Potentially multiple copy_types and statement_ids
			select distinct prop_id 
			from wa_tax_statement_current_run 
			where group_id = @group_id
			and year = @year
			and	run_id = @run_id
			and copy_type = 0
		) as wts 
   on 
    wts.prop_id = b.prop_id
where 
ct.create_date between @StartOfYear and @EndOfYear
group by b.prop_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 31 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()			
SET @LogStatus = 'Step 32 Start '


insert #tmpPriorTaxes(prop_id,base_paid,pi_paid)
select 
	  b.prop_id,
	  base_paid = sum(isnull(ct.base_amount_pd, 0)),
	  pi_paid = sum(isnull(ct.penalty_amount_pd, 0) 
			  + isnull(ct.interest_amount_pd, 0) 
			  + isnull(ct.bond_interest_pd, 0)
			  + isnull(ct.other_amount_pd, 0)) 
from bill as b with(nolock) -- PK cluster bill_id
join bill_fee_assoc as bfa 
on	bfa.bill_id = b.bill_id
join coll_transaction as ct  -- pk cluster transaction_id, idx trans_group_id, create_date, transaction_type
on  ct.trans_group_id = bfa.fee_id
join 
  (		-- Potentially multiple copy_types and statement_ids
		select distinct prop_id from wa_tax_statement_current_run 
		where group_id = @group_id
		and year = @year
		and	run_id = @run_id
		and copy_type = 0
	) as wts 
on wts.prop_id = b.prop_id
--where datepart(year, ct.create_date) = @year -- select bills that were paid during the previous year
where ct.create_date between @StartOfYear and @EndOfYear

group by b.prop_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 32 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()			
SET @LogStatus = 'Step 33 Start '


create index idx_tmpPriorTaxes on #tmpPriorTaxes(prop_id,base_paid,pi_paid)

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 33 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()			
SET @LogStatus = 'Step 34 Start '
	
-- Prior year taxes and p&i paid
update wts
set
	wts.prior_year_taxes_paid = prev.base_paid,
	wts.prior_year_pi_paid = prev.pi_paid
from wa_tax_statement_current_run as wts 
inner join
(
	select 
		prop_id,
		sum(base_paid) as base_paid,
		sum(pi_paid) as pi_paid
	from  #tmpPriorTaxes 
	group by prop_id
) as prev
on prev.prop_id = wts.prop_id
where wts.group_id = @group_id 
  and wts.year = @year
  and wts.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 34 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

drop table #tmpPriorTaxes

set @StartStep = getdate()			
SET @LogStatus = 'Step 35 Start '
	
	
-- Prior year levy rate


-- find records we will eventually update    
create table #wts
(  prop_id int 
  ,has_snrdsbl_prev bit
)


insert into #wts
( prop_id
 ,has_snrdsbl_prev
)
 
select distinct 
		prop_id
	  , has_snrdsbl_prev
from wa_tax_statement_current_run  
where group_id = @group_id
and year = @year
and run_id = @run_id
and copy_type = 0
and suppress_prior_year_values = 0

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 35 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode
	
set @StartStep = getdate()			
SET @LogStatus = 'Step 36 Start '
	

create clustered index idx_prop_id on #wts(prop_id)

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 36 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()			
SET @LogStatus = 'Step 37 Start '

-- find previous bill tax rate data
create table #billPrev
( prop_id int
 ,exmpt_type_cd varchar (10)
 ,levy_rate numeric (13,10)
 ,levy_part int
)

insert into #billPrev
( prop_id
 ,exmpt_type_cd
 ,levy_rate
 ,levy_part
)

select bh.prop_id, isnull(le.exmpt_type_cd,''),
	case when is_tif_sponsoring_levy = 1 then 0 
		when (has_senior_ex = 1) and (isnull(l.senior_levy_rate, 0) > 0)
		then isnull(l.senior_levy_rate, 0) 
	else isnull(l.levy_rate, 0) 
	end as levy_rate,
	lt.levy_part

from
(
select 
	   distinct
	   b.prop_id
	  ,lb.year
	  ,lb.tax_district_id
	  ,lb.levy_cd
  from bill as b with(nolock)
	   join
	   #wts as wts
	on b.prop_id = wts.prop_id
   and b.year = @prev_year
	   join
	   levy_bill  as lb with(nolock)
	on b.bill_id = lb.bill_id
) as bh
	   join
	   levy as l with(nolock)
	on l.[year] = bh.[year]
   and l.tax_district_id = bh.tax_district_id
   and l.levy_cd = bh.levy_cd
	   left outer join 
	   levy_exemption as le with (nolock)
	on le.year = bh.year
   and l.tax_district_id = le.tax_district_id
   and le.tax_district_id = bh.tax_district_id
   and le.levy_cd = bh.levy_cd
    join levy_type lt with(nolock)
	on lt.levy_type_cd = l.levy_type_cd
	cross apply (
		select case when exists(
			select 1 from prop_accepted_supp_assoc_vw psa with(nolock)
			join owner o with(nolock)
				on o.prop_id = psa.prop_id
				and o.sup_num = psa.sup_num
				and o.owner_tax_yr = psa.owner_tax_yr
			join property_exemption as pe_snr with(nolock)
				on pe_snr.exmpt_tax_yr = psa.owner_tax_yr
				and pe_snr.owner_tax_yr	= psa.owner_tax_yr
				and pe_snr.prop_id = psa.prop_id
				and pe_snr.sup_num = psa.sup_num
				and pe_snr.owner_id = o.owner_id
				and pe_snr.exmpt_type_cd = 'SNR/DSBL'
			where psa.prop_id = bh.prop_id
				and psa.owner_tax_yr = bh.year
		) then 1 else 0 end has_senior_ex
	) senior_check
	cross apply (
		select case when exists(
			select 1
			from tif_area_levy tal with(nolock)
			where tal.year = l.year
			and tal.linked_tax_district_id = l.tax_district_id
			and tal.linked_levy_cd = l.levy_cd
		) then 1 else 0 end is_tif_sponsoring_levy
	) spon


SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 37 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()			
SET @LogStatus = 'Step 38 Start '

	 
create clustered index idx_prop_id on #billPrev(prop_id)

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 38 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()			
SET @LogStatus = 'Step 39 Start '
	 	 
-- now update
update wts
set
	wts.prior_year_tax_rate = prev.lrate
from wa_tax_statement_current_run as wts 
	 join
	 ( 
		select stmt.prop_id
			  ,	sum(
		case when bp.levy_part = 2 then
			case when isnull(bp.exmpt_type_cd, '') = 'SNR/DSBL'	or stmt.has_snrdsbl_prev = 1 then
				0	
			else
				isnull(bp.levy_rate, 0)
			end
		else 
			case
				when isnull(bp.exmpt_type_cd, '') <> 'SNR/DSBL'	or stmt.has_snrdsbl_prev = 0 then
					isnull(bp.levy_rate, 0)
				else
					0
				end
		end ) as lrate
		  from #billPrev as bp
			   join
			   #wts as stmt
			on bp.prop_id = stmt.prop_id
		group by stmt.prop_id
	 ) as prev
 on prev.prop_id = wts.prop_id
where wts.group_id = @group_id 
  and wts.year = @year 
  and wts.run_id = @run_id
  and wts.suppress_prior_year_values = 0     

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 39 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()			
SET @LogStatus = 'Step 40 Start '
	
select
	stmt.statement_id,
	sum(
		case when (levy_has_snr_ex = 1 and stmt.has_snrdsbl_curr = 1)
		then 0 
		else isnull(l.levy_rate, 0) end
	) as lrate
into #tlevy_rate
from ( --this is to ensure that a given levy is counted exactly once per statement
	select distinct
		wtscb.statement_id,
		wts.has_snrdsbl_curr,
		wtscb.year,
		lb.tax_district_id,
		lb.levy_cd
	from #wa_tax_statement_calc_bill wtscb with(nolock)
	inner join wa_tax_statement_current_run wts with(nolock)
		on wts.group_id = @group_id 
		and wts.year = @year
		and wts.year = wtscb.year
		and wts.run_id = @run_id
		and wts.statement_id = wtscb.statement_id
	inner join levy_bill lb with(nolock)
		on wtscb.bill_id = lb.bill_id
) stmt
cross apply (
	select case when exists(
		select 1
		from tif_area_levy tal with(nolock)
		where tal.year = stmt.year
		and tal.linked_tax_district_id = stmt.tax_district_id
		and tal.linked_levy_cd = stmt.levy_cd
	) then 1 else 0 end is_tif_sponsoring_levy
) spon
cross apply (
	select lv.levy_type_cd,
		case when is_tif_sponsoring_levy = 1 then 0 
		when (stmt.has_snrdsbl_curr = 1) and (isnull(lv.senior_levy_rate, 0) > 0)
			then isnull(lv.senior_levy_rate, 0) 
		else isnull(lv.levy_rate, 0) 
		end as levy_rate
	from levy lv with(nolock)
	where lv.year = stmt.year
	and lv.tax_district_id = stmt.tax_district_id
	and lv.levy_cd = stmt.levy_cd
) l
cross apply (
	select case when exists (
		select 1 from levy_exemption le with(nolock)
		where le.year = stmt.year
		and le.tax_district_id = stmt.tax_district_id
		and le.levy_cd = stmt.levy_cd
		and le.exmpt_type_cd = 'SNR/DSBL'
	)
	then 1 else 0 end levy_has_snr_ex
) le_snr
group by stmt.statement_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 40 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()			
SET @LogStatus = 'Step 41 Start '
	

create index idx_statement on #tlevy_rate(statement_id,lrate)

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 41 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()			
SET @LogStatus = 'Step 42 Start '
		
-- Current year levy rate
update wts
set
	wts.current_year_tax_rate = curr.lrate
from wa_tax_statement_current_run as wts 
     join 
     #tlevy_rate as curr 
on
	curr.statement_id = wts.statement_id
where wts.group_id = @group_id 
  and wts.year = @year 
  and wts.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 42  End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

drop table #tlevy_rate

set @StartStep = getdate()			
SET @LogStatus = 'Step 43 Start '
	
-- Total taxes, assessments, & fees
-- Gross taxes
update wts
set
	wts.total_taxes_assessments_fees = isnull(levies.base_amt, 0) + isnull(other.base_amt, 0),
	wts.gross_tax_amount = isNull(levies.gross_tax_amt, 0)
from wa_tax_statement_current_run as wts 
left outer join (
	select statement_id, 
		base_amt = sum(tax_amount),
		gross_tax_amt = sum(isNull(gross_tax_amount, 0))
	from wa_tax_statement_levy_current_run with(nolock)
	where group_id = @group_id and year = @year and run_id = @run_id
	group by statement_id
) as levies on
	levies.statement_id = wts.statement_id
left outer join (
	select statement_id, base_amt = sum(assessment_fee_amount)
	from wa_tax_statement_assessment_fee_current_run with (nolock)
	where group_id = @group_id and year = @year and run_id = @run_id
	group by statement_id
) as other on
	other.statement_id = wts.statement_id
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id

-- exempt tax amount
update wts
set exempt_tax_amount = wpov.exempt_tax_amount
from wa_tax_statement_current_run wts

cross apply
(
	select sum(wpovTaxable.tax_wout_ex_amt - wpovTaxable.tax_amt) exempt_tax_amount
	from wash_prop_owner_val_tax_vw wpovTaxable with(nolock)
	where wts.prop_id = wpovTaxable.prop_id
	and wts.year = wpovTaxable.year
	and wts.sup_num = wpovTaxable.sup_num
) wpov

where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id


SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 43 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()			
SET @LogStatus = 'Step 44 Start '

create table #tmpItems
(
 statement_id int,
 amt_base numeric(15,2),
 amt_interest numeric(15,2),
 amt_penalty numeric(14,2),
 payment_id int 
)	
    -- get data to update with for the next 2 steps
insert into #tmpItems
(
 statement_id ,
 amt_base ,
 amt_interest,
 amt_penalty,
 payment_id 
)	
select
	b.statement_id,
	amt_base = bpd.amount_due - bpd.amount_paid,
	amt_interest = bpd.amt_interest + bpd.amt_bond_interest,
	bpd.amt_penalty,
	payment_id = case
		when bpd.payment_id = 1 and bpd.is_h1_payment = 1
		then 0
		else bpd.payment_id
	end
from #wa_tax_statement_calc_bill as b 
     join 
     #wa_tax_statement_calc_bill_payments_due as bpd 
 on
	bpd.bill_id = b.bill_id


SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 44 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()			
SET @LogStatus = 'Step 45 Start '


insert into #tmpItems
    (statement_id,
     amt_base,
     amt_interest,
     amt_penalty,
     payment_id)
select
	f.statement_id,
	amt_base = fpd.amount_due - fpd.amount_paid,
	amt_interest = fpd.amt_interest + fpd.amt_bond_interest,
	fpd.amt_penalty,
	case
		when fpd.payment_id = 1 and fpd.is_h1_payment = 1
		then 0
		else fpd.payment_id
	end
from #wa_tax_statement_calc_fee as f 
     join 
     #wa_tax_statement_calc_fee_payments_due as fpd with(nolock)
 on
	fpd.fee_id = f.fee_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 45 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()			
SET @LogStatus = 'Step 46 Start '

create table #tmpSum
(
statement_id int,
amt_base numeric (38,2),
amt_interest numeric (38,2),
amt_penalty numeric (38,2) 
)

insert into #tmpSum
(
statement_id,
amt_base ,
amt_interest,
amt_penalty  
)

select
	statement_id,
	amt_base = sum(amt_base),
	amt_interest = sum(amt_interest),
	amt_penalty = sum(amt_penalty)
from 
   #tmpItems as items
group by statement_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 46 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()			
SET @LogStatus = 'Step 47 Start '

-- to speed matches, create index on all fields 
create clustered index idx_tmpSum on #tmpSum(statement_id,amt_base,amt_interest,amt_penalty) 

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 47 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()			
SET @LogStatus = 'Step 48 Start '

-- Full base amount due (unpaid, not original), interest due, penalty due
update wts
set
	wts.full_tax_amount = dues.amt_base,
	wts.full_interest_amount = dues.amt_interest,
	wts.full_penalty_amount = dues.amt_penalty,
	wts.full_total_due = dues.amt_base + dues.amt_interest + dues.amt_penalty
from wa_tax_statement_current_run as wts 
     join
     #tmpSum as dues
  on
	dues.statement_id = wts.statement_id
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 48 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()			

-- Half base amount due (unpaid, not original), interest due, penalty due
declare @payment_id int
if (@first_half_payment = 1)
begin
	--set @payment_id = 0
	-- If the first_half_payment is set to true, then generate the half = half amount

	SET @LogStatus = 'Step 49 Start '

	exec dbo.CurrentActivityLogInsert @proc, @LogStatus,@@ROWCOUNT,@@ERROR

	create table #tmpSum0
	(
	statement_id int,
	amt_base numeric (38,2),
	amt_interest numeric (38,2),
	amt_penalty numeric (38,2) 
	)

	insert into #tmpSum0
	(
	statement_id,
	amt_base ,
	amt_interest,
	amt_penalty  
	)	
	select
		statement_id,
		amt_base = sum(amt_base),
		amt_interest = sum(amt_interest),
		amt_penalty = sum(amt_penalty)
	from 
	   #tmpItems as items
    where payment_id = 0
	group by statement_id

	SELECT @LogTotRows = @@ROWCOUNT,
		 @LogErrCode = @@ERROR
	SET @LogStatus = 'Step 49 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	set @StartStep = getdate()
	SET @LogStatus = 'Step 50 Start '

    create clustered index idx_tmpSum0 on #tmpSum0(statement_id,amt_base,amt_interest,amt_penalty) 

	SELECT @LogTotRows = @@ROWCOUNT,
		 @LogErrCode = @@ERROR
	SET @LogStatus = 'Step 50 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	set @StartStep = getdate()
	SET @LogStatus = 'Step 51 Start '

	update wts
	set
		wts.half_tax_amount = dues.amt_base,
		wts.half_interest_amount = dues.amt_interest,
		wts.half_penalty_amount = dues.amt_penalty,
		wts.half_total_due = dues.amt_base-- + dues.amt_interest + dues.amt_penalty
	from wa_tax_statement_current_run as wts 
	    join 	
        #tmpSum0 as dues
  on
		dues.statement_id = wts.statement_id
	where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id

	SELECT @LogTotRows = @@ROWCOUNT,
		 @LogErrCode = @@ERROR
	SET @LogStatus = 'Step 51 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

    drop table #tmpSum0
end
else
begin
	--set @payment_id = 1
	-- If the first_half_payment is not set to true, then generate the half = full amount
	SET @LogStatus = 'Step 52 Start '

	update wts
	set
		wts.half_tax_amount = dues.amt_base,
		wts.half_interest_amount = dues.amt_interest,
		wts.half_penalty_amount = dues.amt_penalty,
		wts.half_total_due = dues.amt_base-- + dues.amt_interest + dues.amt_penalty
	from wa_tax_statement_current_run as wts 
	     join 
         #tmpSum as dues
      on
	 	dues.statement_id = wts.statement_id
	where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id

	SELECT @LogTotRows = @@ROWCOUNT,
		 @LogErrCode = @@ERROR
	SET @LogStatus = 'Step 52 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

end

drop table #tmpSum
    
set @StartStep = getdate()
SET @LogStatus = 'Step 53 Start '



	-- get data for half pay update
create table #tmphalfpay
(
 statement_id int
)	

insert into #tmphalfpay
(
 statement_id 
)
select 
	statement_id
from (

	select 
		b.statement_id
	from #wa_tax_statement_calc_bill as b 
	join #wa_tax_statement_calc_bill_payments_due as bpd 
	     -- pk run_year, group_id, run_id, bill_id, payment_id
 on
		     bpd.bill_id = b.bill_id 
		and  bpd.payment_id = 1 
		and  bpd.due_date >= @effective_date
		and  b.year >= @current_tax_yr - 1
	--where
	
	union  -- eliminates duplicates
	
	select 
		f.statement_id
	from #wa_tax_statement_calc_fee as f 
	join #wa_tax_statement_calc_fee_payments_due as fpd 
	 on
		     fpd.fee_id = f.fee_id 
		and  fpd.payment_id = 1 
		and  fpd.due_date >= @effective_date
		and  f.year >= @current_tax_yr - 1

) as derivedTable

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 53 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 54 Start '

create clustered index idx_halfpay on #tmphalfpay(statement_id)

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 54 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 55 Start '

-- Update show_half_pay_line
update wts
   set wts.show_half_pay_line = 1
  from wa_tax_statement_current_run as wts
        -- pk clust group_id, year, run_id, statement_id, copy_type
       join 
       #tmphalfpay as b2
    on wts.statement_id = b2.statement_id   
 where wts.group_id = @group_id 
   and wts.year = @year 
   and wts.run_id = @run_id


SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 55 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

drop table #tmphalfpay

set @StartStep = getdate()
SET @LogStatus = 'Step 56 Start '
		
-- Determine wa_tax_statement.due_date ; NO LONGER per SDS 1005_1 figure 3.2.5.3d
	
declare @due_date datetime
set @due_date = @effective_date

--
/*
 * Bug 17705 - no longer should the dates reflect the bill_payments_due dates, should
 *						 just be @effective_date.
 */
update wts
set wts.due_date = due_when.min_due_date
from wa_tax_statement_current_run as wts 
join (
	select b.statement_id, min_due_date = min(bpd.due_date),
			max_due_date = max(bpd.due_date)
	from #bill as b with(nolock)
	join tax_due_calc_list as tdcl with(nolock) -- pk dataset_id, tax_due_id
	 on
		tdcl.dataset_id = @dataset_id_HalfPay and
		tdcl.tax_due_id = b.bill_id
	join bill_payments_due as bpd with(nolock) -- pk bill_id, bill_payment_id
	 on
		bpd.bill_id = b.bill_id
	group by b.statement_id
) as due_when on
	due_when.statement_id = wts.statement_id
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id		
	

SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 56 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode


set @StartStep = getdate()

if exists (	select * 
			from wa_tax_statement_current_run wts with (nolock)
			where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id
			and wts.due_date is null )

	begin

	    SET @LogStatus = 'Step 57 Start '	
	    exec dbo.CurrentActivityLogInsert @proc,@LogStatus,0,0
	    
		create table #tmpDueDateIDs (statement_id int, prop_id int)	
	
		insert into #tmpDueDateIDs (statement_id, prop_id)
		select wts.statement_id, wts.prop_id
		from wa_tax_statement_current_run wts with (nolock)
		where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id
		and wts.due_date is null

		SELECT @LogTotRows = @@ROWCOUNT,
			   @LogErrCode = @@ERROR
		SET @LogStatus = 'Step 57 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode


		set @StartStep = getdate()
	    SET @LogStatus = 'Step 58 Start '	
		
		create index #ndx_statement_id_prop_id on #tmpDueDateIDs (statement_id, prop_id)		

		SELECT @LogTotRows = @@ROWCOUNT,
			   @LogErrCode = @@ERROR
		SET @LogStatus = 'Step 58 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode


		set @StartStep = getdate()
	    SET @LogStatus = 'Step 59 Start '
	    	
		update wts
		set wts.due_date = due_when.min_due_date,
			wts.full_tax_due_date = due_when.max_due_date
		from wa_tax_statement_current_run as wts 
		join (
			select b.statement_id, min_due_date = min(bpd.due_date),
				max_due_date = max(bpd.due_date)
			from #bill as b with(nolock)
			join #tmpDueDateIDs tmp 
	      on tmp.statement_id = b.statement_id
			and tmp.prop_id = b.prop_id
			join bill_payments_due as bpd with(nolock) on
				bpd.bill_id = b.bill_id
			group by b.statement_id
		) as due_when on
			due_when.statement_id = wts.statement_id
		where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id
		
		SELECT @LogTotRows = @@ROWCOUNT,
			   @LogErrCode = @@ERROR
		SET @LogStatus = 'Step 59 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode


		set @StartStep = getdate()
	end


SET @LogStatus = 'Step 60 Start '		
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,0,0	

-- I cannot think of any case where no bill would be part of a statement
-- (where only fees would be part of a statement)
-- but just in case ...
update wts
set wts.due_date = due_when.min_due_date,
	wts.full_tax_due_date = due_when.max_due_date
from wa_tax_statement_current_run as wts 
join (
	select f.statement_id, min_due_date = min(fpd.due_date),
	       max_due_date = max(fpd.due_date)
	from #fee as f with(nolock)  
	join fee_payments_due as fpd with(nolock) on
		fpd.fee_id = f.fee_id
	group by f.statement_id
) as due_when 
on
	due_when.statement_id = wts.statement_id
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id
and wts.due_date is null

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 60 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

--------------------------------------
-- END - Updates to wa_tax_statement related to tax due values
--------------------------------------

----------------------------------------------
-- BEGIN - wa_tax_statement_delinquent_history
----------------------------------------------
set @StartStep = getdate()
SET @LogStatus = 'Step 61 Start '		

exec WATaxStatementLevyCreate_Insert_wa_tax_statement_delinquent_history_current_run
            @pacs_user_id,@year,@group_id, @run_id, @dataset_id_delq_bill, @dataset_id_delq_fee 
            
SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 61 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode
		
----------------------------------------------
-- END - wa_tax_statement_delinquent_history
----------------------------------------------

set @StartStep = getdate()
SET @LogStatus = 'Step 62 Start '		

-- Update delinquent columns in wa_tax_statement
update wts
set
	wts.delinquent_tax_amount = delq.base_amount,
	wts.delinquent_interest_amount = delq.interest_amount,
	wts.delinquent_penalty_amount = delq.penalty_amount,
	wts.delinquent_total_due = delq.interest_amount + delq.penalty_amount -- base is already handled by FULL or HALF payments, do not need to include again here
from wa_tax_statement_current_run as wts 
join (
	select
		delq.statement_id,
		base_amount = sum(delq.base_amount),
		interest_amount = sum(delq.interest_amount),
		penalty_amount = sum(delq.penalty_amount)
	from wa_tax_statement_delinquent_history_current_run as delq with(nolock)
	where delq.group_id = @group_id and delq.year = @year and delq.run_id = @run_id
		and delq.delinquent_year = @year
	group by delq.statement_id
) as delq on
	delq.statement_id = wts.statement_id
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id

-- Update delinquent columns in wa_tax_statement for ROLLBACKS
update wts
set
	wts.delinquent_tax_amount = wts.delinquent_tax_amount + delq.base_amount,
	wts.delinquent_interest_amount = wts.delinquent_interest_amount + delq.interest_amount,
	wts.delinquent_penalty_amount = wts.delinquent_penalty_amount + delq.penalty_amount,
	wts.delinquent_total_due = wts.delinquent_total_due + delq.base_amount + delq.interest_amount + delq.penalty_amount
from wa_tax_statement_current_run as wts 
join (
	select
		delq.statement_id,
		base_amount = sum(delq.base_amount),
		interest_amount = sum(delq.interest_amount),
		penalty_amount = sum(delq.penalty_amount)
	from wa_tax_statement_delinquent_history_current_run as delq with(nolock)
	where delq.group_id = @group_id and delq.year = @year and delq.run_id = @run_id
		and delq.delinquent_year < @year
	group by delq.statement_id
) as delq on
	delq.statement_id = wts.statement_id
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id



SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 62 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 63 Start '	

	
-- Update new prior year columns in wa_tax_statement
update wts
set
	wts.prior_year_0_tax_amount = delq.base_amount,
	wts.prior_year_0_interest = delq.interest_amount,
	wts.prior_year_0_penalty = delq.penalty_amount
from wa_tax_statement_current_run as wts 
join (
	select
		delq.statement_id,
		base_amount = sum(delq.base_amount),
		interest_amount = sum(delq.interest_amount),
		penalty_amount = sum(delq.penalty_amount)
	from wa_tax_statement_delinquent_history_current_run as delq with(nolock)
	where delq.group_id = @group_id and delq.year = @year and delq.run_id = @run_id
		and delq.delinquent_year = @year - 1
	group by delq.statement_id
) as delq on
	delq.statement_id = wts.statement_id
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 63 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 64 Start '	

	
-- Update new prior year columns in wa_tax_statement
update wts
set
	wts.prior_year_1_tax_amount = delq.base_amount,
	wts.prior_year_1_interest = delq.interest_amount,
	wts.prior_year_1_penalty = delq.penalty_amount
from wa_tax_statement_current_run as wts 
join (
	select
		delq.statement_id,
		base_amount = sum(delq.base_amount),
		interest_amount = sum(delq.interest_amount),
		penalty_amount = sum(delq.penalty_amount)
	from wa_tax_statement_delinquent_history_current_run as delq with(nolock)
	where delq.group_id = @group_id and delq.year = @year and delq.run_id = @run_id
		and delq.delinquent_year = @year - 2
	group by delq.statement_id
) as delq on
	delq.statement_id = wts.statement_id
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 64 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 65 Start '	

-- Update new prior year columns in wa_tax_statement
update wts
set
	wts.prior_year_delq_tax_amount = delq.base_amount,
	wts.prior_year_delq_interest = delq.interest_amount,
	wts.prior_year_delq_penalty = delq.penalty_amount
from wa_tax_statement_current_run as wts 
join (
	select
		delq.statement_id,
		base_amount = sum(delq.base_amount),
		interest_amount = sum(delq.interest_amount),
		penalty_amount = sum(delq.penalty_amount)
	from wa_tax_statement_delinquent_history_current_run as delq with(nolock)
	where delq.group_id = @group_id and delq.year = @year and delq.run_id = @run_id
		and delq.delinquent_year < @year - 2
	group by delq.statement_id
) as delq on
	delq.statement_id = wts.statement_id
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 65 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 66 Start '	

-- Update total due
update wts
set
	wts.total_due = isnull(wts.delinquent_total_due, 0) + isnull(wts.full_total_due, 0)
from wa_tax_statement_current_run as wts 
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 66 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

if (@taxpayer_statement <> 1)
	begin

	set @StartStep = getdate()
	SET @LogStatus = 'Step 67 Start '	

			
	create table #holdmsg
	(
	  prop_id int,
	  sup_num int,
	  message_cd varchar (10),
	  statement_id int,
	  total_taxes_assessments_fees numeric (14,2),
	  cur_code int
	 )
	 
	 insert into #holdmsg
	(
	  prop_id,
	  sup_num,
	  message_cd,
	  statement_id,
	  total_taxes_assessments_fees,
	  cur_code
	 )

	select prop_id,
		   sup_num,
		   message_cd,
		   statement_id,
		   total_taxes_assessments_fees,
		   0 -- cur_code 
	  from wa_tax_statement_current_run with (nolock) 
	 where group_id = @group_id 
	   and year = @year 
	   and run_id = @run_id           

	SELECT @LogTotRows = @@ROWCOUNT,
		 @LogErrCode = @@ERROR
	SET @LogStatus = 'Step 67 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	set @StartStep = getdate()
	SET @LogStatus = 'Step 68 Start '	
		

	create index idx_msg on #holdmsg(prop_id,message_cd,statement_id,sup_num)

	SELECT @LogTotRows = @@ROWCOUNT,
		 @LogErrCode = @@ERROR
	SET @LogStatus = 'Step 68 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	set @StartStep = getdate()
	SET @LogStatus = 'Step 69 Start '	
		
		----------------------------------------------------
		-- BEGIN - Determine message code for each statement
		----------------------------------------------------
	declare
		@tax_statement_cd varchar(10),
		@delinquent_assessment bit,
		@rollback_due bit,
		@delinquent_taxes bit,
		@supplement_reason bit,
		@suppress_year bit,
		@source_table varchar(30),
		@source_column varchar(30),
		@field_value varchar(50),
		@szSelectSQL varchar(8000),
		@szJoinSQL varchar(8000),
		@szWhereSQL varchar(8000),
		@szSQL varchar(max),
		@bALL bit,
		@curCode int,
		@billFeeCode varchar(30)

	set @curCode = 0
	set @curRows = 0  -- for logging

	declare curMessageCodes cursor LOCAL fast_forward
	for
		select 
			tax_statement_cd,
			isnull(delinquent_assessment, 0),
			isnull(rollback_due, 0),
			isnull(delinquent_taxes, 0),
			isnull(supplement_reason, 0),
			isnull(suppress_prior_year_values, 0)
		from tax_statement_config with(nolock)
		order by priority_number asc
	for read only

	open curMessageCodes
	fetch next from curMessageCodes 
		into @tax_statement_cd, @delinquent_assessment,
		 @rollback_due, @delinquent_taxes, @supplement_reason, @suppress_year

	while (@@fetch_status = 0)
	begin
		set @curCode = @curCode + 1
		set @curRows = @curRows + 1  -- for logging 
	    
		-- If the Supplement Reason is checked, only set the code if the property has a supplement
		-- and outstanding bills.

					
		set @billFeeCode = (select field_value
			from tax_statement_config_detail as tscd with (nolock) 
			where tscd.tax_statement_cd = @tax_statement_cd
				  and source_table = 'bill_fee_code')    
				  	
		if (@supplement_reason = 1)
		begin
			update wts
			set wts.cur_code = @curCode
			from #holdmsg as wts
			join property_val as pv
			with (nolock)
			on pv.prop_val_yr = @year
			and pv.sup_num = wts.sup_num
			and pv.prop_id = wts.prop_id
			where wts.message_cd is null
			and pv.sup_num > 0
		end
		else if (@suppress_prior_year_values = 1 and @suppress_year = 1)
		begin
			update wts
			set wts.cur_code = @curCode
			from #holdmsg as wts
			join property_val as pv
			with (nolock)
			on pv.prop_val_yr = @year
			and pv.sup_num = wts.sup_num
			and pv.prop_id = wts.prop_id
			where wts.message_cd is null
			and pv.suppress_notice_prior_year_values = 1
		end
		
		else if (@delinquent_assessment = 1 and @dataset_id_delq_bill > 0)
		begin
		
			update wts
			set
				wts.cur_code = @curCode
			from #holdmsg as wts
			join tax_due_calc_bill as tdcb with(nolock) on
				tdcb.dataset_id = @dataset_id_delq_bill and
				tdcb.prop_id = wts.prop_id
			join assessment_bill as ab with(nolock) on
				ab.bill_id = tdcb.bill_id
			 where wts.message_cd is null

			update wts
			set
				wts.cur_code = @curCode
			from #holdmsg as wts
			join #wa_tax_statement_calc_bill wtsc with (nolock) on 
				wtsc.statement_id = wts.statement_id and
				wtsc.prop_id = wts.prop_id 
			join #wa_tax_statement_calc_bill_payments_due as wtscd with(nolock) on
				wtscd.bill_id = wtsc.bill_id 
			join assessment_bill as ab with(nolock) on
				ab.bill_id = wtsc.bill_id
			where wts.message_cd is null
			and wtscd.is_delinquent = 1

		end

		else if (@rollback_due = 1 and @dataset_id_delq_bill > 0)
		begin
			update wts
			set
				wts.cur_code = @curCode
			from #holdmsg as wts
			join tax_due_calc_bill as tdcb with(nolock) on
				tdcb.dataset_id = @dataset_id_delq_bill and
				tdcb.prop_id = wts.prop_id
			join #delq_bill as b with(nolock) on
				b.bill_id = tdcb.bill_id and
				b.rollback_id > 0
			where wts.message_cd is null
		end

		else if (@delinquent_taxes = 1 and @dataset_id_delq_bill > 0)
		begin
			update wts
			set
				wts.cur_code = @curCode
			from #holdmsg as wts
			join tax_due_calc_bill as tdcb with(nolock) on
				tdcb.dataset_id = @dataset_id_delq_bill and
				tdcb.prop_id = wts.prop_id
			join levy_bill as lb with(nolock) on
				lb.bill_id = tdcb.bill_id
			where wts.message_cd is null
			
			update wts
			set
				wts.cur_code = @curCode
			from #holdmsg as wts
			join #wa_tax_statement_calc_bill wtsc with (nolock) on 
				wtsc.statement_id = wts.statement_id and
				wtsc.prop_id = wts.prop_id 
			join #wa_tax_statement_calc_bill_payments_due as wtscd with(nolock) on
				wtscd.bill_id = wtsc.bill_id 
			join levy_bill as lb with(nolock) on
				lb.bill_id = wtscd.bill_id
			where wts.message_cd is null
			and wtscd.is_delinquent = 1
		end
		-- if no prior configuration for this record is met use the generic/default message
		else if (@delinquent_assessment = 0 and	@rollback_due = 0 and @delinquent_taxes = 0 and @supplement_reason = 0 and @suppress_year = 0)		
		begin
		
			update wts
			set
				wts.cur_code = @curCode
			from #holdmsg as wts
		end
		
		if (len(@billFeeCode) > 0)
		begin
			update wts
			   set wts.cur_code = @curCode
			  from #holdmsg as wts
				   join 
				   #bill as b with(nolock)
				on b.statement_id = wts.statement_id
				   join 
				   bill_fee_code as bfc with(nolock)
				on bfc.bill_fee_cd = b.code
			 where wts.message_cd is null
			   and b.code = @billFeeCode		
		end

		set @szSelectSQL = 
				'update wts
				set wts.message_cd = ''' + @tax_statement_cd + '''
				from #holdmsg as wts'
			
		set @szJoinSQL = ''
		
		set @szWhereSQL = 
			' where wts.message_cd is null 
			 and cur_code = ' + convert(varchar(3), @curCode)
			 
			 
		
		-- Use the tax_statement_config_detail
		declare curCodeDetail cursor LOCAL fast_forward
		for
			select source_table, source_column, field_value
			from tax_statement_config_detail with(nolock)
			where tax_statement_cd = @tax_statement_cd
			and len(isNull(field_value, '')) > 0
		for read only
		
		open curCodeDetail
		fetch next from curCodeDetail into @source_table, @source_column, @field_value

		while (@@fetch_status = 0)
		begin
			set @bALL = 0
			if (@field_value = '<ALL>')
				set @bALL = 1
			else begin
				set @field_value = replace(@field_value, ' ', '')
				exec dbo.BuildINString @field_value output
			end
			
			if (@source_table = 'property_type' and len(@field_value) > 0)
			begin
				set @szJoinSQL = @szJoinSQL + '
				join property as p with(nolock) on
					p.prop_id = wts.prop_id
				join property_type as pt with(nolock) on
					pt.prop_type_cd = p.prop_type_cd'
				
				if (@bALL = 0)
					set @szWhereSQL = @szWhereSQL + ' and pt.' + @source_column + ' in(' + @field_value + ')'
			end
			else if (@source_table = 'bill_fee_code' and len(@field_value) > 0)
			begin
				set @szJoinSQL = @szJoinSQL + '
				join #bill as b with(nolock) on
					 b.statement_id = wts.statement_id
					
				join bill_fee_code as bfc with(nolock) on
					bfc.bill_fee_cd = b.code'
				
				if (@bALL = 0)
					set @szWhereSQL = @szWhereSQL + ' and bfc.' + @source_column + ' in(' + @field_value + ')'
			end
			else if (@source_table = 'annexation' and len(@field_value) > 0)
			begin
			
				set @szJoinSQL = @szJoinSQL + '
				join annexation_property_assoc as apa with(nolock) on
					apa.year = ' + convert(varchar(4), @year) + ' and
					apa.prop_id = wts.prop_id
				join annexation as a with(nolock) on
					a.annexation_id = apa.annexation_id'
				
				if (@bALL = 0)
					set @szWhereSQL = @szWhereSQL + ' and a.' + @source_column + ' in(' + @field_value + ')'
			end
			else if (@source_table = 'exmpt_type' and len(@field_value) > 0)
			begin
			
				set @szJoinSQL = @szJoinSQL + '
				join property_exemption as pe with(nolock) on
					pe.exmpt_tax_yr = ' + convert(varchar(4), @year) + ' and
					pe.owner_tax_yr = ' + convert(varchar(4), @year) + ' and
					pe.sup_num = wts.sup_num and
					pe.prop_id = wts.prop_id  
				join exmpt_type as et with(nolock) on
					et.exmpt_type_cd = pe.exmpt_type_cd'
				
				if (@bALL = 0)
					set @szWhereSQL = @szWhereSQL + ' and et.' + @source_column + ' in(' + @field_value + ')'
			end
			else if (@source_table = 'assessment_type' and len(@field_value) > 0)
			begin
				set @szJoinSQL = @szJoinSQL + '
				join #bill as b2 with(nolock) on
					b2.statement_id = wts.statement_id 
				join assessment_bill as ab with(nolock) on
					ab.bill_id = b2.bill_id
				join special_assessment_agency as spa with(nolock) on
					spa.agency_id = ab.agency_id
				join assessment_type as at with(nolock) on
					at.assessment_type_cd = spa.assessment_type_cd'

				if (@bALL = 0)
					set @szWhereSQL = @szWhereSQL + ' and at.' + @source_column + ' in(' + @field_value + ')'
			end
			else if (@source_table = 'litigation_event_type' and len(@field_value) > 0)
			begin
				set @szJoinSQL = @szJoinSQL + '
				join #bill as b3 with(nolock) on
					b3.statement_id = wts.statement_id 
				join litigation_statement_assoc as lba with(nolock) on
					lba.statement_id = b3.statement_id and lba.year = ' + convert(varchar(4), @year) + ' 
				join litigation_events as le with(nolock) on
					le.litigation_id = lba.litigation_id
				join litigation_event_type as let with(nolock) on
					let.litigation_event_cd = le.event_cd'

				if (@bALL = 0)
					set @szWhereSQL = @szWhereSQL + ' and let.' + @source_column 
					+ ' in(' + @field_value + ')'
			end			
			fetch next from curCodeDetail into @source_table, @source_column, @field_value
		end
		
		close curCodeDetail
		deallocate curCodeDetail
		
		set @szSQL = ''
		set @szSQL = @szSelectSQL + @szJoinSQL + @szWhereSQL 
		
			
		 
		--print @szSQL  -- for testing only
		
		exec(@szSQL)
		set @szSQL = ''
		set @szJoinSQL = ''
		
		fetch next from curMessageCodes into @tax_statement_cd, @delinquent_assessment, @rollback_due, @delinquent_taxes, @supplement_reason, @suppress_year
	end

	close curMessageCodes
	deallocate curMessageCodes

	SELECT @LogTotRows = @curRows,  -- # of loops for cursor
		 @LogErrCode = @@ERROR
	SET @LogStatus = 'Step 69 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	set @StartStep = getdate()
	SET @LogStatus = 'Step 70 Start '	
		
	-- now update current_run table with message code

	update wts
	   set
		   wts.message_cd = m.message_cd
	  from wa_tax_statement_current_run as wts
		   join 
		   #holdmsg m
		on wts.group_id = @group_id 
	   and wts.year = @year
	   and wts.run_id = @run_id
	   and wts.statement_id = m.statement_id
	   and wts.prop_id = m.prop_id
	   and wts.sup_num = m.sup_num
	   
	SELECT @LogTotRows = @@ROWCOUNT,
		 @LogErrCode = @@ERROR
	SET @LogStatus = 'Step 70 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

		----------------------------------------------------
		-- END - Determine message code for each statement
		----------------------------------------------------

end

	----------------------------------------
	-- BEGIN - OCR scanline 
	----------------------------------------

set @StartStep = getdate()
SET @LogStatus = 'Step 71 Start '	
	
-- Get options stored in the statement run
declare @ocr_include_delq_when_needed bit
declare @ocr_always_include_delq bit
declare @barcode_statement_or_property bit

select
	@ocr_include_delq_when_needed = ocr_include_delq_when_needed,
	@ocr_always_include_delq = ocr_always_include_delq,
	@barcode_statement_or_property = barcode_statement_or_property 
from wa_tax_statement_run with(nolock)
where year = @year and group_id = @group_id and run_id = @run_id

-- All scanlines have the prop ID, statement ID, full due, & half due
update wts
set wts.scanline =
	ISNULL(replicate('0', 10 - len(convert(varchar(10), prop_id))),'') + convert(varchar(10), prop_id)
	+
	ISNULL(replicate('0', 10 - len(convert(varchar(10), statement_id))),'') + convert(varchar(10), statement_id)
	+
	ISNULL(replicate('0', 10 - len(replace(convert(varchar, full_total_due), '.', ''))),'') + substring(replace(convert(varchar, full_total_due), '.', ''),1,10)
	+
	ISNULL(replicate('0', 10 - len(replace(convert(varchar, (half_total_due + full_interest_amount + full_penalty_amount)), '.', ''))),'') + substring(replace(convert(varchar, (half_total_due + full_interest_amount + full_penalty_amount)), '.', ''),1,10),
wts.scanline2 = 
	replicate('0', 10 - len(convert(varchar(10), prop_id))) + convert(varchar(10), prop_id)
	+
	replicate('0', 10 - len(convert(varchar(10), statement_id))) + convert(varchar(10), statement_id)
	+
	--for second half, the "full amount" is the second half, and the "half amount" is 0
	ISNULL(replicate('0', 10 - len(replace(convert(varchar, full_tax_amount - half_tax_amount), '.', ''))),'') + substring(replace(convert(varchar, full_tax_amount - half_tax_amount), '.', ''),1,10)
	+
	replicate('0', 10) 		
from wa_tax_statement_current_run as wts 
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 71 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 72 Start '	
			
-- Add the delinquent amounts due. Depending on configured options, these can be added for
-- all statements, no statements, or just statements that have a delinquent amount due
if @ocr_include_delq_when_needed = 1 or @ocr_always_include_delq = 1
begin
	update wts
	set wts.scanline = wts.scanline +
		ISNULL(replicate('0', 10 - len(replace(convert(varchar, delq1.total), '.', ''))),'')
		  + substring(replace(convert(varchar, delq1.total), '.', ''),1,10)
		+
		ISNULL(replicate('0', 10 - len(replace(convert(varchar, delq2.total), '.', ''))),'')
			 + substring(replace(convert(varchar, delq2.total), '.', ''),1,10)
		+
		ISNULL(replicate('0', 10 - len(replace(convert(varchar, delq3.total), '.', ''))),'')
		   + substring(replace(convert(varchar, delq3.total), '.', ''),1,10),
		wts.scanline2 = wts.scanline2 +
					 replicate('0', 30) --assumes delinquent amounts are paid as part of first half
	from wa_tax_statement_current_run as wts 
	join wa_tax_statement_delinquent_history_current_run as delq1 with(nolock) on
		delq1.group_id = wts.group_id and
		delq1.year = wts.year and
		delq1.run_id = wts.run_id and
		delq1.statement_id = wts.statement_id and
		delq1.delinquent_year = (@year - 1)
	join wa_tax_statement_delinquent_history_current_run as delq2 with(nolock) on
		delq2.group_id = wts.group_id and
		delq2.year = wts.year and
		delq2.run_id = wts.run_id and
		delq2.statement_id = wts.statement_id and
		delq2.delinquent_year = (@year - 2)
	join wa_tax_statement_delinquent_history_current_run as delq3 with(nolock) on
		delq3.group_id = wts.group_id and
		delq3.year = wts.year and
		delq3.run_id = wts.run_id and
		delq3.statement_id = wts.statement_id and
		delq3.delinquent_year = (@year - 3)
	where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id
	and (@ocr_always_include_delq = 1 or exists (
		select *
		from wa_tax_statement_delinquent_history_current_run as delq with(nolock)
		where
			delq.group_id = wts.group_id and
			delq.year = wts.year and
			delq.run_id = wts.run_id and
			delq.statement_id = wts.statement_id and
			delq.delinquent_year < @year and
			delq.total > 0
		)
	)
end

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 72 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 73 Start '	
			
-- Add the check digit and the PACS identifier '9'
update wts
set wts.scanline = wts.scanline + dbo.fn_CheckDigitMod10(wts.scanline) + '9',
wts.scanline2 = wts.scanline2 + dbo.fn_CheckDigitMod10(wts.scanline2) + '9'
from wa_tax_statement_current_run as wts
where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 73 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	--------------------------------------
	-- END - OCR scanline
	--------------------------------------

	------------------------------------------
		

	------------------------------------------
	-- BEGIN - wa_tax_statement_levy_display
	------------------------------------------
set @StartStep = getdate()
SET @LogStatus = 'Step 74 Start '	

declare @maxLevies int
set @maxLevies = 13


create table #tblMaxLevyExceed 
 (
	statement_id int not null
)
	
-- Determine the statement_ids that will need an 'Other' line
insert #tblMaxLevyExceed (statement_id)
select t.statement_id
from (
	select wtsl.statement_id
	from wa_tax_statement_levy_current_run as wtsl with(nolock)
	where wtsl.group_id = @group_id and wtsl.year = @year and wtsl.run_id = @run_id
	group by wtsl.statement_id
	having count(*) > @maxLevies
) as t


SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 74 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

create clustered index idx_statement_id on #tblMaxLevyExceed(statement_id)

set @StartStep = getdate()
SET @LogStatus = 'Step 75 Start '	

-- Insert, without change, those that do not need the 'Other' line
insert wa_tax_statement_levy_display_current_run (
	year, group_id, run_id, statement_id, tax_district_id, voted, levy_rate, tax_amount, taxable_value,
	order_num, levy_cd, levy_description, main, prior_yr_tax_amount, levy_part
)
select
	wtsl.year, wtsl.group_id, wtsl.run_id, wtsl.statement_id, wtsl.tax_district_id, wtsl.voted, 
	wts.levy_rate, wts.tax_amount, wts.taxable_value, wtsl.order_num,
	wts.levy_cd,
	case when isnull(separate_levy_desc,'') <> '' then separate_levy_desc 
		when lt.levy_part in (1,2) then lt.levy_type_desc 
		else isnull(td.tax_district_desc, 'OTHER') end as levy_description,
	1, wts.prior_yr_tax_amount, wts.levy_part
from wa_tax_statement_levy_current_run wtsl with(nolock)
join (
	select 
		wtslddcr.group_id, wtslddcr.year, wtslddcr.run_id, wtslddcr.statement_id, 
		wtslddcr.tax_district_id, wtslddcr.voted, wtslddcr.levy_part,  
		case when lso.separate_levy_display = 1 then wtslddcr.levy_cd else isnull(td.tax_district_cd, 'OTHER') end as levy_cd,
		max(case when wtslddcr.levy_part in (1,2) then l.levy_type_cd else '' end) levy_type_cd,
		max(case when lso.separate_levy_display = 1 then lso.levy_description else '' end) as separate_levy_desc,
		max(wtslddcr.taxable_value) taxable_value, sum(wtslddcr.levy_rate) as levy_rate, sum(wtslddcr.tax_amount) as tax_amount, 
		max(wtslddcr.prior_yr_tax_amount) as prior_yr_tax_amount
	from wa_tax_statement_levy_details_display_current_run wtslddcr with(nolock)	
	join tax_district td with(nolock)
		on td.tax_district_id = wtslddcr.tax_district_id  
	join levy l with(nolock)
		on l.year = wtslddcr.year
		and l.tax_district_id = wtslddcr.tax_district_id
		and l.levy_cd = wtslddcr.levy_cd
	left join levy_statement_option lso with(nolock)
		on wtslddcr.year = lso.year
		and wtslddcr.tax_district_id = lso.tax_district_id
		and wtslddcr.levy_cd = lso.levy_cd
	group by wtslddcr.group_id, wtslddcr.year, wtslddcr.run_id, wtslddcr.statement_id,
		wtslddcr.tax_district_id, wtslddcr.voted, wtslddcr.levy_part, 
		case when lso.separate_levy_display = 1 then wtslddcr.levy_cd else isnull(td.tax_district_cd, 'OTHER') end
) wts
	on wts.group_id = wtsl.group_id 
	and wts.year = wtsl.year
	and wts.run_id = wtsl.run_id
	and wts.statement_id = wtsl.statement_id
	and wts.tax_district_id = wtsl.tax_district_id
	and wts.voted = wtsl.voted
	and wts.levy_part = wtsl.levy_part
left join tax_district td with(nolock)
	on td.tax_district_id = wts.tax_district_id  
left join levy_type lt with(nolock)
	on lt.levy_type_cd = wts.levy_type_cd
	and lt.levy_part = wts.levy_part
left join #tblMaxLevyExceed mle
	on wtsl.statement_id = mle.statement_id 
where wtsl.group_id = @group_id 
	and wtsl.year = @year
	and wtsl.run_id = @run_id
	and mle.statement_id is null -- do not insert if statement exist in #tblMaxLevyExceed 

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 75 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode




set @StartStep = getdate()
SET @LogStatus = 'Step 76 Start '		

-- Now, for each that needs an 'Other' line
set @curRows = @curRows + 1  -- for logging 
declare curNeedOther cursor LOCAL fast_forward
for
	select statement_id
	from #tblMaxLevyExceed
for read only

open curNeedOther
fetch next from curNeedOther into @statement_id

declare @levyRemain int
declare @otherOrderNum int

while ( @@fetch_status = 0 )
begin

    set @curRows = 0  -- for logging
	set @levyRemain = @maxLevies - 1
	
	-- Insert at most @maxLevies - 1 voted levies
	set rowcount @levyRemain
	insert wa_tax_statement_levy_display_current_run (
	year, group_id, run_id, statement_id, tax_district_id, voted, levy_rate, tax_amount, taxable_value,
	order_num, levy_cd, levy_description, main, prior_yr_tax_amount, levy_part
	)
	select
		wtsl.year, wtsl.group_id, wtsl.run_id, wtsl.statement_id, wtsl.tax_district_id, wtsl.voted, 
		wts.levy_rate, wts.tax_amount, wts.taxable_value, wtsl.order_num,
		wts.levy_cd,
		case when isnull(separate_levy_desc,'') <> '' then separate_levy_desc 
			when lt.levy_part in (1,2) then lt.levy_type_desc 
			else isnull(td.tax_district_desc, 'OTHER') end as levy_description,
		1, wts.prior_yr_tax_amount, wts.levy_part
	from wa_tax_statement_levy_current_run wtsl with(nolock)
	join (
		select 
			wtslddcr.group_id, wtslddcr.year, wtslddcr.run_id, wtslddcr.statement_id, 
			wtslddcr.tax_district_id, wtslddcr.voted, wtslddcr.levy_part,  
			case when lso.separate_levy_display = 1 then wtslddcr.levy_cd else isnull(td.tax_district_cd, 'OTHER') end as levy_cd,
			max(case when wtslddcr.levy_part in (1,2) then l.levy_type_cd else '' end) levy_type_cd,
			max(case when lso.separate_levy_display = 1 then lso.levy_description else '' end) as separate_levy_desc,
			max(wtslddcr.taxable_value) taxable_value, sum(wtslddcr.levy_rate) as levy_rate, sum(wtslddcr.tax_amount) as tax_amount, 
			max(wtslddcr.prior_yr_tax_amount) as prior_yr_tax_amount
		from wa_tax_statement_levy_details_display_current_run wtslddcr with(nolock)	
		join tax_district td with(nolock)
			on td.tax_district_id = wtslddcr.tax_district_id  
		join levy l with(nolock)
			on l.year = wtslddcr.year
			and l.tax_district_id = wtslddcr.tax_district_id
			and l.levy_cd = wtslddcr.levy_cd
		left join levy_statement_option lso with(nolock)
			on wtslddcr.year = lso.year
			and wtslddcr.tax_district_id = lso.tax_district_id
			and wtslddcr.levy_cd = lso.levy_cd
		group by wtslddcr.group_id, wtslddcr.year, wtslddcr.run_id, wtslddcr.statement_id,
			wtslddcr.tax_district_id, wtslddcr.voted, wtslddcr.levy_part, 
			case when lso.separate_levy_display = 1 then wtslddcr.levy_cd else isnull(td.tax_district_cd, 'OTHER') end
	) wts
		on wts.group_id = wtsl.group_id 
		and wts.year = wtsl.year
		and wts.run_id = wtsl.run_id
		and wts.statement_id = wtsl.statement_id
		and wts.tax_district_id = wtsl.tax_district_id
		and wts.voted = wtsl.voted
		and wts.levy_part = wtsl.levy_part
	left join tax_district td with(nolock)
		on td.tax_district_id = wts.tax_district_id  
	left join levy_type lt with(nolock)
		on lt.levy_type_cd = wts.levy_type_cd
		and lt.levy_part = wts.levy_part
	where wtsl.group_id = @group_id 
		and wtsl.year = @year
		and wtsl.run_id = @run_id
		and wtsl.statement_id = @statement_id
		and wtsl.voted = 1
	order by wtsl.order_num, levy_cd -- needed because set rowcount is being used
	
	set @levyRemain = @levyRemain - @@rowcount
	
	set @otherOrderNum = 1
	-- Insert as many nonvoted levies as we can
	if ( @levyRemain > 0 )
	begin
		set rowcount @levyRemain
		insert wa_tax_statement_levy_display_current_run (
		year, group_id, run_id, statement_id, tax_district_id, voted, levy_rate, tax_amount, taxable_value,
		order_num, levy_cd, levy_description, main, prior_yr_tax_amount, levy_part
		)
		select
			wtsl.year, wtsl.group_id, wtsl.run_id, wtsl.statement_id, wtsl.tax_district_id, wtsl.voted, 
			wts.levy_rate, wts.tax_amount, wts.taxable_value, wtsl.order_num,
			wts.levy_cd,
			case when isnull(separate_levy_desc,'') <> '' then separate_levy_desc 
				when lt.levy_part in (1,2) then lt.levy_type_desc 
				else isnull(td.tax_district_desc, 'OTHER') end as levy_description,
			1, wts.prior_yr_tax_amount, wts.levy_part
		from wa_tax_statement_levy_current_run wtsl with(nolock)
		join (
			select 
				wtslddcr.group_id, wtslddcr.year, wtslddcr.run_id, wtslddcr.statement_id, 
				wtslddcr.tax_district_id, wtslddcr.voted, wtslddcr.levy_part,  
				case when lso.separate_levy_display = 1 then wtslddcr.levy_cd else isnull(td.tax_district_cd, 'OTHER') end as levy_cd,
				max(case when wtslddcr.levy_part in (1,2) then l.levy_type_cd else '' end) levy_type_cd,
				max(case when lso.separate_levy_display = 1 then lso.levy_description else '' end) as separate_levy_desc,
				max(wtslddcr.taxable_value) taxable_value, sum(wtslddcr.levy_rate) as levy_rate, sum(wtslddcr.tax_amount) as tax_amount, 
				max(wtslddcr.prior_yr_tax_amount) as prior_yr_tax_amount
			from wa_tax_statement_levy_details_display_current_run wtslddcr with(nolock)	
			join tax_district td with(nolock)
				on td.tax_district_id = wtslddcr.tax_district_id  
			join levy l with(nolock)
				on l.year = wtslddcr.year
				and l.tax_district_id = wtslddcr.tax_district_id
				and l.levy_cd = wtslddcr.levy_cd
			left join levy_statement_option lso with(nolock)
				on wtslddcr.year = lso.year
				and wtslddcr.tax_district_id = lso.tax_district_id
				and wtslddcr.levy_cd = lso.levy_cd
			group by wtslddcr.group_id, wtslddcr.year, wtslddcr.run_id, wtslddcr.statement_id,
				wtslddcr.tax_district_id, wtslddcr.voted, wtslddcr.levy_part, 
				case when lso.separate_levy_display = 1 then wtslddcr.levy_cd else isnull(td.tax_district_cd, 'OTHER') end
		) wts
			on wts.group_id = wtsl.group_id 
			and wts.year = wtsl.year
			and wts.run_id = wtsl.run_id
			and wts.statement_id = wtsl.statement_id
			and wts.tax_district_id = wtsl.tax_district_id
			and wts.voted = wtsl.voted
			and wts.levy_part = wtsl.levy_part
		left join tax_district td with(nolock)
			on td.tax_district_id = wts.tax_district_id  
		left join levy_type lt with(nolock)
			on lt.levy_type_cd = wts.levy_type_cd
			and lt.levy_part = wts.levy_part
		where wtsl.group_id = @group_id 
			and wtsl.year = @year
			and wtsl.run_id = @run_id
			and wtsl.statement_id = @statement_id
			and wtsl.voted = 0
		order by wtsl.order_num, levy_cd -- needed because set rowcount is being used
		
		set @otherOrderNum = @@rowcount + 1
	end
	
	set rowcount 0
	-- Now aggregate the values from any that we had no room for
	-- Ex: those whose values sum into the 'Other' line
	insert wa_tax_statement_levy_display_current_run (
		year, group_id, run_id, statement_id, tax_district_id, voted, levy_rate, tax_amount, 
		order_num, levy_cd, levy_description, main, prior_yr_tax_amount
	)
	select
		year, group_id, run_id, statement_id, 0, 0, sum(levy_rate), sum(tax_amount), 
		@otherOrderNum, 'OTHER', 'OTHER', 1, sum(prior_yr_tax_amount)
	from wa_tax_statement_levy_current_run as wtsl with(nolock)
	where wtsl.group_id = @group_id and wtsl.year = @year and wtsl.run_id = @run_id
	and wtsl.statement_id = @statement_id
	and not exists (
		select *
		from wa_tax_statement_levy_display_current_run as wtsld with(nolock)
		where
			wtsld.year = wtsl.year and
			wtsld.group_id = wtsl.group_id and
			wtsld.run_id = wtsl.run_id and
			wtsld.statement_id = wtsl.statement_id and
			wtsld.tax_district_id = wtsl.tax_district_id and
			wtsld.voted = wtsl.voted and
			wtsld.levy_part = wtsl.levy_part
	)
	group by year, group_id, run_id, statement_id
	
	fetch next from curNeedOther into @statement_id
end

set rowcount 0

close curNeedOther
deallocate curNeedOther
	
SELECT @LogTotRows = @curRows, -- # of loops for cursor
	   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 76 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode


	------------------------------------------
	-- END - wa_tax_statement_levy_display
	------------------------------------------

	------------------------------------------
	-- BEGIN - wa_tax_statement_assessment_fee_display
	------------------------------------------
set @StartStep = getdate()
SET @LogStatus = 'Step 77 Start '	

declare @maxAssessmentFees int
set @maxAssessmentFees = 12
	
create table #tblMaxAssessmentFeeExceed 
(
	statement_id int not null
)
	
-- Determine the statement_ids that will need an 'Other' line
insert #tblMaxAssessmentFeeExceed 
      (statement_id)
select t.statement_id
from (
	select wtsaf.statement_id, c = count(*)
	from wa_tax_statement_assessment_fee_current_run_vw as wtsaf with(nolock)
	where wtsaf.year = @year and wtsaf.group_id = @group_id and wtsaf.run_id = @run_id
	group by wtsaf.statement_id
	having count(*) > @maxAssessmentFees
) as t

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 77 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

create index idx_statement_id on #tblMaxAssessmentFeeExceed(statement_id)

set @StartStep = getdate()
SET @LogStatus = 'Step 78 Start '	

-- Insert, without change, those that do not need the 'Other' line
insert wa_tax_statement_assessment_fee_display_current_run (
	year, group_id, run_id, statement_id, assessment_fee_id, assessment_fee_amount, item_desc, order_num, fee_cd, agency_id
)
select
	year, group_id, run_id, statement_id, assessment_fee_id, assessment_fee_amount, item_desc, order_num, fee_cd, agency_id
from wa_tax_statement_assessment_fee_current_run_vw as wtsaf with(nolock)
where wtsaf.year = @year and wtsaf.group_id = @group_id and wtsaf.run_id = @run_id
and not exists (
	select *
	from #tblMaxAssessmentFeeExceed as fe
	where fe.statement_id = wtsaf.statement_id
)

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 78 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode


set @StartStep = getdate()
SET @LogStatus = 'Step 79 Start '	

set @curRows = 0  -- for logging 
	
-- Now, for each that needs an 'Other' line
declare curNeedOther cursor LOCAL fast_forward
for
	select statement_id
	from #tblMaxAssessmentFeeExceed
for read only

open curNeedOther
fetch next from curNeedOther into @statement_id

declare @assessmentFeeRemain int

while ( @@fetch_status = 0 )
begin
    set @curRows = @curRows + 1  -- for logging
	set @assessmentFeeRemain = @maxAssessmentFees - 1
	
	-- Insert at most 10 assessment/fees
	set rowcount @assessmentFeeRemain
	insert wa_tax_statement_assessment_fee_display_current_run (
		year, group_id, run_id, statement_id, assessment_fee_id, assessment_fee_amount, item_desc, order_num, fee_cd, agency_id
	)
	select
		year, group_id, run_id, statement_id, assessment_fee_id, assessment_fee_amount, item_desc, order_num, fee_cd, agency_id
	from wa_tax_statement_assessment_fee_current_run_vw as wtsaf with(nolock)
	where wtsaf.group_id = @group_id and wtsaf.year = @year and wtsaf.run_id = @run_id
	and wtsaf.statement_id = @statement_id
	order by wtsaf.order_num asc  -- needed because set rowcount is used
	set @assessmentFeeRemain = @assessmentFeeRemain - @@rowcount
	
	set rowcount 0
	-- Now aggregate the values from any that we had no room for
	-- Ex: those whose values sum into the 'Other' line
	insert wa_tax_statement_assessment_fee_display_current_run (
		year, group_id, run_id, statement_id, assessment_fee_id, assessment_fee_amount, item_desc, order_num, fee_cd, agency_id
	)
	select
		year, group_id, run_id, statement_id, 0, sum(assessment_fee_amount), 'Other Assessments/Fees', @maxAssessmentFees, '', 0
	from wa_tax_statement_assessment_fee_current_run_vw as wtsaf with(nolock)
	where wtsaf.group_id = @group_id and wtsaf.year = @year and wtsaf.run_id = @run_id
	and wtsaf.statement_id = @statement_id
	and not exists (
		select *
		from wa_tax_statement_assessment_fee_display_current_run as wtsafd with(nolock)
		where
			wtsafd.year = wtsaf.year and
			wtsafd.group_id = wtsaf.group_id and
			wtsafd.run_id = wtsaf.run_id and
			wtsafd.statement_id = wtsaf.statement_id and
			wtsafd.assessment_fee_id = wtsaf.assessment_fee_id
	)
	group by year, group_id, run_id, statement_id
	
	fetch next from curNeedOther into @statement_id
end

set rowcount 0

close curNeedOther
deallocate curNeedOther

SELECT @LogTotRows = @curRows, -- # of loops for cursor
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 79 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode


	------------------------------------------
	-- END - wa_tax_statement_assessment_fee_display
	------------------------------------------

	------------------------------------------
	-- BEGIN - wa_tax_statement_levy_details.order_num and row_num
	------------------------------------------
set @StartStep = getdate()
SET @LogStatus = 'Step 80 Start '	
	
update wtsld
set order_num = wtsl.order_num
from wa_tax_statement_levy_details_display_current_run wtsld with (nolock)
join wa_tax_statement_levy_current_run wtsl with (nolock) on 
	wtsl.group_id = wtsld.group_id and
	wtsl.run_id = wtsld.run_id and
	wtsl.year = wtsld.year and
	wtsl.statement_id = wtsld.statement_id and
	wtsl.tax_district_id = wtsld.tax_district_id
where wtsl.group_id = @group_id and wtsl.year = @year and wtsl.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 80 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode


set @StartStep = getdate()
SET @LogStatus = 'Step 81 Start '	
set @curRows = 0  -- for logging

declare @tax_district_id int
declare @levy_cd varchar(12)
declare @desc varchar(50)
declare @priority int

declare curLevyRow cursor LOCAL fast_forward
for
	select distinct 
		td.tax_district_id, l.levy_cd, l.levy_description, isNull(tdt.priority, 999)
	from levy l with (nolock)
	join tax_district td with (nolock) on
		td.tax_district_id = l.tax_district_id
	join tax_district_type tdt with (nolock) on 
		tdt.tax_district_type_cd = td.tax_district_type_cd
	where l.year = @year
	order by 
		isNull(tdt.priority, 999), l.levy_description

open curLevyRow
fetch next from curLevyRow into @tax_district_id, @levy_cd, @desc, @priority

while (@@fetch_status = 0)
begin

    set @curRows = @curRows + 1  -- for logging 

	update wts
	set row_num = (isNull(tmp.maxRowNum, 0) + 1)
	from wa_tax_statement_levy_details_display_current_run as wts
	join (
		select 
			year, group_id, run_id, statement_id, 
			max(isNull(row_num, 0)) maxRowNum
			from wa_tax_statement_levy_details_display_current_run with (nolock)
		group by year, group_id, run_id, statement_id 
	) tmp on 
		tmp.year = wts.year and
		tmp.group_id = wts.group_id and
		tmp.run_id = wts.run_id and
		tmp.statement_id = wts.statement_id
	where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id		
	and wts.tax_district_id = @tax_district_id
	and wts.levy_cd = @levy_cd
	
	fetch next from curLevyRow into @tax_district_id, @levy_cd, @desc, @priority
end

close curLevyRow
deallocate curLevyRow

SELECT @LogTotRows = @curRows, -- # of loops for cursor
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 81 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()

declare @owner_statement_count int
    set @owner_statement_count = 0


    
if (@taxpayer_statement = 1)
	begin
		SET @LogStatus = 'Step 82 Start '	
        exec dbo.CurrentActivityLogInsert @proc,@LogStatus,0,0

    exec dbo.WATaxStatementLevyCreate_Insert_wa_tax_statement_owner_current_run
         @pacs_user_id, @year, @group_id, @run_id,@pacs_user_name,
         @effective_date, @owner_statement_count output
                 
	SELECT @LogTotRows = @curRows, -- # of loops for cursor
		 @LogErrCode = @@ERROR
	SET @LogStatus = 'Step 82 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

   end -- taxpayer tax statement data

   
	-- This is now done up front, since the correct original levy codes are needed 
	-- to select part 1/2 descriptions if multiple part 1/2s types exist.
	-- Former step 83: add levy_cd, levy description and set it to be the main levy
	
set @StartStep = getdate()

-- WATaxStatementCreateAssociatedCopies_Current_Run
-- MUST be the last thing to execute in this stored proc,
-- prior to copying work 
-- tables to real tables using proc:WATaxStatementLevyCreate_InsertFrom_CurrentRun
-- (Any new functionality must come BEFORE this)
if (@owner_only > 0)
begin
	set @StartStep = getdate()
    SET @LogStatus = 'Step 84 Start '	
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,0,0
	
	exec dbo.WATaxStatementCreateAssociatedCopies_Current_Run
	          @year, @group_id, @run_id, @owner_only

	SELECT @LogTotRows = @@ROWCOUNT,
		 @LogErrCode = @@ERROR
	SET @LogStatus = 'Step 84 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

end

	----------------------------------------
	-- BEGIN - barcode text
	----------------------------------------


set @StartStep = getdate()
SET @LogStatus = 'Step 84a Start '	

-- store the statement/year or the proprty ID in the barcode

if @barcode_statement_or_property = 0
begin
	update wa_tax_statement_current_run 
	set barcode = '*' + convert(varchar, year) + '-' + convert(varchar, statement_id) + '*'
	where group_id = @group_id and year = @year and run_id = @run_id
end
else begin
	update wa_tax_statement_current_run
	set barcode = '*' + convert(varchar, prop_id) + '*'
	where group_id = @group_id and year = @year and run_id = @run_id
end

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 84a End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	--------------------------------------
	-- END -  barcode text
	--------------------------------------



	----------------------------------------
	-- BEGIN - statement message text
	----------------------------------------


set @StartStep = getdate()
SET @LogStatus = 'Step 84b Start '	

declare	@tax_statement_message varchar(256)
set @tax_statement_message = ''
set @supplement_reason = 0

if (@run_type = 'D') begin
		select 
			@tax_statement_message = isnull(comment,'')
		from delq_notice_maint
end

if (@tax_statement_message = '') begin
		select 
			@tax_statement_message = isnull(message,''),
			@supplement_reason =  isnull(supplement_reason, 0)
		from tax_statement_config tsc with(nolock)
		inner join wa_tax_statement_current_run wts 
		on tsc.tax_statement_cd = wts.message_cd
		where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id
end

if (@supplement_reason = 1 and @supplement_reason <> '') begin
	update wa_tax_statement_current_run 
	set statement_message = left(supp_reason,256)
	where group_id = @group_id and year = @year and run_id = @run_id

	set @tax_statement_message = '' -- process is complete so blank out message so no further updates will occur
end

if (@tax_statement_message <> '') begin
	update wa_tax_statement_current_run 
	set statement_message = @tax_statement_message
	where group_id = @group_id and year = @year and run_id = @run_id
end


SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 84b End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	--------------------------------------
	-- END -  statement message text
	--------------------------------------

set @StartStep = getdate()
SET @LogStatus = 'Step 85 Start '	

-- if we get here, there were no errors
-- insert work table entries into real tables

exec WATaxStatementLevyCreate_InsertFrom_CurrentRun @pacs_user_id,@year, @group_id, @run_id,
         @statement_count,@owner_statement_count,@generate_event,@run_type, @dtNow

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 85 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 86 Start '

-- call to remove entries from work tables with this run info
exec WATaxStatementLevyCreate_Delete_CurrentRun @year,@group_id,@run_id

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus = 'Step 86 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

-- end of procedure update log
SET @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate()))
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

END TRY  

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
	@AppMsg = 'Error in proc: ' + @proc + ' ' + @LogStatus + @ERROR_MESSAGE
	
	exec dbo.CurrentActivityLogInsert @proc, @AppMsg,0,@ERROR_NUMBER

    -- transaction is no longer used inside application
    -- need to clean up entries if proc errors
    
	-- remove any entries written into permanent tables
	exec WATaxStatementLevyCreate_Delete_Existing @pacs_user_id,@year,@group_id,@run_id

	-- call to remove entries from work tables with this run info
	exec WATaxStatementLevyCreate_Delete_CurrentRun @year,@group_id,@run_id


    RAISERROR(@AppMsg , 16, 1) 

END CATCH

GO

