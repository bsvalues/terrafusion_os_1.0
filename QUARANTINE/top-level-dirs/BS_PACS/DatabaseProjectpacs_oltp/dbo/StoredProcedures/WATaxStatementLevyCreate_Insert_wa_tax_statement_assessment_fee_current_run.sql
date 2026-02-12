
-- exec WATaxStatementLevyCreate_Insert_wa_tax_statement_assessment_fee_current_run 137,2010,59,28079

create procedure WATaxStatementLevyCreate_Insert_wa_tax_statement_assessment_fee_current_run
	@pacs_user_id int,
	@year numeric(4,0),
	@group_id int,
	@run_id int 
as
/*  PROCESSING NOTES:
    This is called by the stored proc:  WATaxStatementLevyCreate
    
    Cannot be a stand-alone proc since it requires some temp tables
    to already exist and be populated
*/
/* Top of each procedure to capture input parameters */
SET NOCOUNT ON

BEGIN TRY

DECLARE @StartProc datetime
    SET @StartProc = getdate()
DECLARE @StartStep datetime
DECLARE @LogTotRows int
DECLARE @LogStatus varchar(200)
DECLARE @LogErrCode int
DECLARE @qry varchar(255)
 declare @proc varchar(500)
 set @proc = object_name(@@procid)

 SET @qry = 'Start - ' + @proc
 + ' @pacs_user_id =' +  convert(varchar(30),@pacs_user_id) + ','
 + ' @year =' +  convert(varchar(30),@year) + ','
 + ' @group_id =' +  convert(varchar(30),@group_id) + ','
 + ' @run_id =' +  convert(varchar(30),@run_id) 
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */

set @StartStep = getdate()
SET @LogStatus =  'Step 1 Start '

create table #feeTaxAmount 
(
	group_id int null,
	year numeric(4,0) null,
	run_id int null,
	statement_id int null,
	fee_id int null,
	fee_tax_amount numeric(14,2)
)

Create Table #assmtTaxAmount 
(
	group_id int null,
	year numeric(4,0) null,
	run_id int null,
	statement_id int null,
	assmt_fee_id int null,
	assmt_tax_amount numeric(14,2)
)
	
-- The 'other' fees, that is, those not associated with a bill
insert wa_tax_statement_assessment_fee_current_run  (
	group_id, year, run_id, statement_id, assessment_fee_id,
	assessment_fee_amount, fee_cd, agency_id
)
select
	@group_id, @year, @run_id, wts.statement_id, wts.fee_id,
	wts.current_amount_due, wts.fee_type_cd, 0
from #wa_tax_statement_calc_fee as wts 
join fee_prop_assoc as fpa  on
	fpa.fee_id = wts.fee_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 2 Start '
	
--Grab the fee amounts and keep them with the fees
insert into #feeTaxAmount
(group_id, year, run_id, statement_id, fee_id, fee_tax_amount)
select
	@group_id,
	@year,
	@run_id,
	wts.statement_id,
	wts.fee_id,
	wts.current_amount_due
from #wa_tax_statement_calc_fee wts 
inner join fee_prop_assoc fpa 
on fpa.fee_id = wts.fee_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 2 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 3 Start '
		
-- Statement fees associated with levy bills
insert wa_tax_statement_assessment_fee_current_run  (
	group_id, year, run_id, statement_id, assessment_fee_id,
	assessment_fee_amount, fee_cd, agency_id
)
select
	@group_id, @year, @run_id, wts.statement_id, wts.fee_id,
	wts.current_amount_due, wts.fee_type_cd, 0
from #wa_tax_statement_calc_fee as wts 
join bill_fee_assoc as bfa  on
	bfa.fee_id = wts.fee_id
join levy_bill as lb  on
	lb.bill_id = bfa.bill_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 3 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus = 'Step 4 Start '
		
--Grab the fee amounts and keep them with the fees
insert into #feeTaxAmount 
(group_id, year, run_id, statement_id, fee_id, fee_tax_amount)
select
	@group_id,
	@year,
	@run_id,
	wts.statement_id,
	wts.fee_id,
	wts.current_amount_due
from #wa_tax_statement_calc_fee wts 
join bill_fee_assoc bfa 
on bfa.fee_id = wts.fee_id
join levy_bill lb 
on lb.bill_id = bfa.bill_id
--where wts.run_year = @year and wts.group_id = @group_id and wts.run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 4 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	-- Assessment bills and their associated fees
	
set @StartStep = getdate()

if exists(select 1 from wa_tax_statement_assessment 
			where group_id = @group_id and year = @year )
   begin
    SET @LogStatus = 'Step 5 Start '

   	exec dbo.CurrentActivityLogInsert @proc, @LogStatus,0,0

-- first grab data that will be used for both fee and non fee processing
	create table #AgencyHold
	(bill_id int
	,statement_id int
	,current_amount_due numeric(14,2) not null 
	,agency_id int
	,combine_fees bit
	)

	insert into #AgencyHold
	(bill_id 
	,statement_id 
	,current_amount_due  
	,agency_id 
	,combine_fees
	)
	select wtsb.bill_id
		  ,wtsb.statement_id
		  ,wtsb.current_amount_due 
		  ,wtsa.agency_id
		  ,wtsa.combine_fees
	 from #wa_tax_statement_calc_bill as wtsb 
		-- pk run_year, group_id, run_id, bill_id
		  join 
		  assessment_bill as ab 
	   on ab.bill_id = wtsb.bill_id 
		  join
		  wa_tax_statement_assessment as wtsa 
		  -- pk group_id, year, agency_id
	   on wtsa.group_id = @group_id
	  and wtsa.year = @year 
	  and ab.agency_id = wtsa.agency_id

	SELECT @LogTotRows = @@ROWCOUNT,
		 @LogErrCode = @@ERROR
	SET @LogStatus = 'Step 5 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode
	
	set @StartStep = getdate()
	SET @LogStatus = 'Step 6 Start '

	create clustered index idx_bill_id on #AgencyHold(bill_id)

	SELECT @LogTotRows = @@ROWCOUNT,
		 @LogErrCode = @@ERROR
	SET @LogStatus = 'Step 6 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	set @StartStep = getdate()
	SET @LogStatus = 'Step 7 Start '

	-- now get related fee info 
	create table #AgencyFee
	(bill_id int
	,fee_id int
	,current_amount_due numeric(14,2) not null 
	,fee_type_cd varchar(10)
	)

	insert into #AgencyFee
	(bill_id
	,fee_id
	,current_amount_due
	,fee_type_cd
	)
	select bfa.bill_id
		  ,bfa.fee_id
		  ,wtsf.current_amount_due
		  ,wtsf.fee_type_cd
	 from #wa_tax_statement_calc_fee as wtsf 
		  join 
		  bill_fee_assoc as bfa 
	   on bfa.fee_id = wtsf.fee_id
		  join
		  #AgencyHold as ah
	   on ah.bill_id = bfa.bill_id
	      
	SELECT @LogTotRows = @@ROWCOUNT,
		 @LogErrCode = @@ERROR
	SET @LogStatus = 'Step 7 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	set @StartStep = getdate()
	SET @LogStatus = 'Step 8 Start '

    create clustered index idx_bill_id on #AgencyFee(bill_id)

	SELECT @LogTotRows = @@ROWCOUNT,
		 @LogErrCode = @@ERROR
	SET @LogStatus = 'Step 8 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	set @StartStep = getdate()

	if exists(select 1 from wa_tax_statement_assessment 
			   where group_id = @group_id  
                 and year = @year
				 and combine_fees = 1)
	   begin
	   	SET @LogStatus = 'Step 9 Start '
     	exec dbo.CurrentActivityLogInsert @proc, @LogStatus,0,0

		insert wa_tax_statement_assessment_fee_current_run
		   (group_id
			,year
			, run_id
			, statement_id
			, assessment_fee_id
			, assessment_fee_amount
			, fee_cd
			, agency_id
		   )
	 select @group_id
		  , @year
		  , @run_id
		  , wtsb.statement_id
		  , wtsb.bill_id
		  ,	wtsb.current_amount_due + isnull(associatedFees.fee_amt_due, 0)
		  ,	null
		  , agency_id
	  from #AgencyHold as wtsb 
		   left outer join (
					select
						bill_id,
						fee_amt_due = sum(isnull(current_amount_due, 0))
					from #AgencyFee
					group by bill_id
				) as associatedFees
	   on associatedFees.bill_id = wtsb.bill_id
	  where wtsb.combine_fees = 1	

	  SELECT @LogTotRows = @@ROWCOUNT,
		     @LogErrCode = @@ERROR
		SET @LogStatus = 'Step 9 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode


	  set @StartStep = getdate()
	  SET @LogStatus = 'Step 10 Start '
	  
	  --Since we are combining fees with the assessments,
	  -- then the amounts are all considered assessments
	  insert into #assmtTaxAmount
	   (group_id, year, run_id, statement_id, assmt_fee_id, assmt_tax_amount)
	  select @group_id
	       , @year
	       , @run_id
	       , wtsb.statement_id
	       , wtsb.bill_id
	       , wtsb.current_amount_due + isnull(associatedFees.fee_amt_due, 0)
	   from #AgencyHold as wtsb 
		    left outer join (
					select
						bill_id,
						fee_amt_due = sum(isnull(current_amount_due, 0))
					from #AgencyFee
					group by bill_id
				) as associatedFees
	   on associatedFees.bill_id = wtsb.bill_id
	  where wtsb.combine_fees = 1

	  SELECT @LogTotRows = @@ROWCOUNT,
		     @LogErrCode = @@ERROR
		SET @LogStatus = 'Step 10 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode


	    set @StartStep = getdate()
	  
					   
	   end

	if exists(select 1 from wa_tax_statement_assessment 
				where group_id = @group_id and year = @year  
				 and combine_fees <> 1)
	   begin
	   	SET @LogStatus = 'Step 11 Start '
   	    exec dbo.CurrentActivityLogInsert @proc, @LogStatus,0,0

   		insert wa_tax_statement_assessment_fee_current_run
	   (group_id
		,year
		, run_id
		, statement_id
		, assessment_fee_id
		, assessment_fee_amount
		, fee_cd
		, agency_id
	   )
	 select @group_id
		  , @year
		  , @run_id
		  , wtsb.statement_id
		  , wtsb.bill_id
		  ,	wtsb.current_amount_due 
		  ,	null
		  , agency_id
	  from #AgencyHold as wtsb 
	  where wtsb.combine_fees <> 1

	  SELECT @LogTotRows = @@ROWCOUNT,
		     @LogErrCode = @@ERROR
	  SET @LogStatus = 'Step 11 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	  exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	  set @StartStep = getdate()
	  SET @LogStatus = 'Step 12 Start '
	  
	  --Grab the assessment amounts
	  insert into #assmtTaxAmount
		(group_id, year, run_id, statement_id, assmt_fee_id, assmt_tax_amount)
     select @group_id
		  , @year
		  , @run_id
		  , wtsb.statement_id
		  , wtsb.bill_id
		  ,	wtsb.current_amount_due 
	  from #AgencyHold as wtsb 
	  where wtsb.combine_fees <> 1

	  SELECT @LogTotRows = @@ROWCOUNT,
		     @LogErrCode = @@ERROR
		SET @LogStatus = 'Step 12 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

		set @StartStep = getdate()
	   	SET @LogStatus = 'Step 13 Start '
	   	
	  -- Rows for the assessment bill's statement fees
  		insert wa_tax_statement_assessment_fee_current_run
	   (group_id
		,year
		, run_id
		, statement_id
		, assessment_fee_id
		, assessment_fee_amount
		, fee_cd
		, agency_id
	   )
	 select @group_id
		  , @year
		  , @run_id
		  , wtsb.statement_id
		  , wtsf.fee_id
		  ,	wtsf.current_amount_due 
		  ,	wtsf.fee_type_cd
		  , agency_id
	  from #AgencyHold as wtsb 
		   join 
		   #AgencyFee as wtsf
	   on wtsf.bill_id = wtsb.bill_id
	  where wtsb.combine_fees <> 1
	  
	  SELECT @LogTotRows = @@ROWCOUNT,
		     @LogErrCode = @@ERROR
		SET @LogStatus = 'Step 13 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

		set @StartStep = getdate()
	   	SET @LogStatus = 'Step 14 Start '
	  
	  --Grab the fee amounts
		insert into #feeTaxAmount
		( group_id
         ,year
		 ,run_id
		 ,statement_id
		 ,fee_id
		 ,fee_tax_amount)
		 select @group_id
		  , @year
		  , @run_id
		  , wtsb.statement_id
		  , wtsf.fee_id
		  ,	wtsf.current_amount_due 
	  from #AgencyHold as wtsb 
		   join 
		   #AgencyFee as wtsf
	   on wtsf.bill_id = wtsb.bill_id
	  where wtsb.combine_fees <> 1	
	
	  SELECT @LogTotRows = @@ROWCOUNT,
		     @LogErrCode = @@ERROR
		SET @LogStatus = 'Step 14 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode
		
		set @StartStep = getdate()
	  			
	   END
	   
	 set @StartStep = getdate()
	 SET @LogStatus = 'Step 15 Start '

     create clustered index idx_assmtTaxAmount 
        on #assmtTaxAmount(group_id, [year], run_id, statement_id)
        
	  SELECT @LogTotRows = @@ROWCOUNT,
		     @LogErrCode = @@ERROR
		SET @LogStatus = 'Step 15 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	 set @StartStep = getdate()
	 SET @LogStatus = 'Step 16 Start '

      create clustered index idx_feeTaxAmount 
        on #feeTaxAmount(group_id, [year], run_id, statement_id)

	  SELECT @LogTotRows = @@ROWCOUNT,
		     @LogErrCode = @@ERROR
		SET @LogStatus = 'Step 16 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

		set @StartStep = getdate()			

	
  end   
       
--Needed for taxpayer statements
-- Set wa_tax_statement.fee_tax_amount & assmt_tax_amount
set @StartStep = getdate()
SET @LogStatus = 'Step 17 Start '

update wts
set wts.assmt_tax_amount = isnull(ata.assmt_tax_amount, 0)
from wa_tax_statement_current_run wts  -- pk group_id, year, run_id, statement_id, copy_type
 join (
	select group_id, year, run_id, statement_id, sum(isnull(assmt_tax_amount, 0)) as assmt_tax_amount
	from #assmtTaxAmount
	group by group_id, year, run_id, statement_id
) ata
	on wts.group_id = ata.group_id
   and wts.year = ata.year 
   and wts.run_id = ata.run_id 
   and wts.statement_id = ata.statement_id
 where wts.group_id = @group_id 
   and wts.year = @year 
   and wts.run_id = @run_id 
   and wts.copy_type = 0

  SELECT @LogTotRows = @@ROWCOUNT,
	     @LogErrCode = @@ERROR
SET @LogStatus = 'Step 17 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()			
SET @LogStatus = 'Step 18 Start '

update wts
set wts.fee_tax_amount = isnull(fta.fee_tax_amount, 0)
from wa_tax_statement_current_run wts  -- pk group_id, year, run_id, statement_id, copy_type
     join
     (
		select group_id, year, run_id, statement_id, sum(isnull(fee_tax_amount, 0)) as fee_tax_amount
		from #feeTaxAmount
		group by group_id, year, run_id, statement_id
	) fta
on wts.group_id = fta.group_id 
and wts.year = fta.year 
and wts.run_id = fta.run_id 
and wts.statement_id = fta.statement_id
where wts.group_id = @group_id 
and wts.year = @year 
and wts.run_id = @run_id 
and wts.copy_type = 0

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus = 'Step 18 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode


set @StartStep = getdate()
SET @LogStatus =  'Step 19 Start '

-- determine order number based on statement_id
create table #fee_order
( statement_id int
 ,assessment_fee_id int
 ,order_num int
)

insert into #fee_order(statement_id,assessment_fee_id,order_num)
select  statement_id,assessment_fee_id
        ,ROW_NUMBER() OVER (PARTITION BY statement_id
          ORDER BY statement_id,assessment_fee_id ) as order_num
       from wa_tax_statement_assessment_fee_current_run wts 
      where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id
      order by statement_id,assessment_fee_id

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 19 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 20 Start '
      
update wts
   set order_num = tmp.order_num
 
 from wa_tax_statement_assessment_fee_current_run as wts
      join
      #fee_order as tmp
  on wts.statement_id = tmp.statement_id
 and wts.assessment_fee_id = tmp.assessment_fee_id
 where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id


SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 20 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

drop table #fee_order

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

    RAISERROR(@AppMsg , 16, 1) 

	
END CATCH

GO

