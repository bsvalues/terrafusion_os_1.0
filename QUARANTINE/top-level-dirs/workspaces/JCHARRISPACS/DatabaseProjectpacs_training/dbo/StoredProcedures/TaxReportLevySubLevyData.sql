

CREATE PROCEDURE [dbo].[TaxReportLevySubLevyData]
	@group_id	int,
	@year numeric(4,0),
	@run_id		int

AS

/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @StartProc datetime
    SET @StartProc = getdate()
DECLARE @StartStep datetime
DECLARE @LogTotRows int
DECLARE @LogStatus varchar(200)
DECLARE @LogErrCode int
DECLARE @qry varchar(1000)
 declare @proc varchar(100)
 set @proc = object_name(@@procid)
 
 SET @qry = 'Start - ' + @proc  
 + ' @group_id =' +  convert(varchar(30),@group_id) + ','
 + ' @year =' +  convert(varchar(30),@year) + ','
 + ' @run_id =' +  convert(varchar(30),@run_id) 

 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */
 
DECLARE @sublevies int

set @StartStep = getdate()  --logging capture start time of step

--pk group_id, year, run_id, statement_id, tax_district_id, voted, levy_cd, main
declare @tax_report_levy_subreport table (
	[group_id] [int] NULL,
	[year] [numeric] (4,0) NULL,
	[run_id] [int] NULL,
	[statement_id] [int] NULL,
	[tax_district_id] [int] NULL,
	[voted] [bit] NULL,
	[levy_cd] varchar (20) not null,
	[main] [bit] not NULL,
	[levy_rate] [numeric] (13,10) NULL,
	[tax_amount] [numeric] (14,2) NULL,
	[order_num] [int] NULL,
	[taxable_value] [numeric] (18,0) NULL,
	[levy_description] [varchar] (255) NULL 
) 

 Insert into @tax_report_levy_subreport
 (
	group_id,
	year,
	run_id,
	statement_id,
	tax_district_id,
	voted,
	levy_cd,
	main,
	levy_rate,
	tax_amount,
	order_num,
	taxable_value,
	levy_description 
 )
select 
	wtsld.group_id,
	wtsld.year,
	wtsld.run_id,
	wtsld.statement_id,
	wtsld.tax_district_id,
	wtsld.voted,
	wtsld.levy_cd,
	1,
	wtsld.levy_rate,
	wtsld.tax_amount,
	wtsld.order_num,
	ISNULL(wtsld.taxable_value,0),
	wtsld.levy_description 

from wa_tax_statement_levy_display as wtsld with (nolock)
--pk group_id, year, run_id, statement_id, tax_district_id, voted, levy_cd, main
     join 
     ( select distinct year,tax_district_id
         from levy_statement_option with (nolock)
           --pk year, tax_district_id, levy_cd
        where separate_levy_display = 1
     ) as lso
  on lso.year = wtsld.year
	and lso.tax_district_id  = wtsld.tax_district_id
where wtsld.group_id = @group_id
and wtsld.year = @year
and wtsld.run_id = @run_id

--capture records inserted with @@Rowcount
set @sublevies = @@ROWCOUNT
-- sample end statement for individual steps 
 
-- logging end of step 
SELECT @LogTotRows = @sublevies, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step

if @sublevies > 0
   begin	

	Insert into wa_tax_statement_levy_display
		 (
			group_id,
			year,
			run_id,
			statement_id,
			tax_district_id,
			voted,
			levy_rate,
			tax_amount,
			order_num,
			taxable_value,
			levy_cd,
			levy_description,
			main
		 )

		SELECT 
		sub.group_id,
		sub.year,
		sub.run_id,
		sub.statement_id,
		sub.tax_district_id,
		l.voted,
		l.levy_rate,
		sub.taxable_value*l.levy_rate/1000,
		sub.order_num,
		sub.taxable_value,
		L.levy_cd,
		lso.levy_description,
		0
		from @tax_report_levy_subreport as sub 
             join
             levy_statement_option as lso WITH (NOLOCK)
          on lso.year = sub.year
	     and lso.tax_district_id  = sub.tax_district_id
		     join 
             levy as L WITH (NOLOCK)
		  on lso.year = l.year
		 and lso.tax_district_id = L.tax_district_id
		 and lso.levy_cd = L.levy_cd
		 and sub.voted = L.voted
	   where lso.separate_levy_display = 1
	   and not exists (select * from wa_tax_statement_levy_display where sub.tax_district_id = wa_tax_statement_levy_display.tax_district_id)

		-- logging end of step 
		SELECT @LogTotRows = @sublevies, -- if above counter set changes, change this
			   @LogErrCode = @@ERROR 
		   SET @LogStatus =  'Step 2 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

		set @StartStep = getdate()  --logging capture start time of step

        create table #sum(statement_id int,
                           tax_district_id int,
                           order_num int,
                           levy_rate numeric (13,10), 
                           tax_amount numeric (14,2))

        
        insert into #sum
             ( statement_id,
               tax_district_id,
               order_num,
               levy_rate ,
               tax_amount
             )
        select statement_id,
               tax_district_id,
               order_num,
               sum(levy_rate) as levy_rate ,
               sum(tax_amount) as tax_amount

          from wa_tax_statement_levy_display   WITH (NOLOCK)
         where group_id = @group_id
           and year = @year
           and run_id = @run_id
           and main = 0
        group by tax_district_id,
                 statement_id,
                 order_num

		-- logging end of step 
		SELECT @LogTotRows = @sublevies, -- if above counter set changes, change this
			   @LogErrCode = @@ERROR 
		   SET @LogStatus =  'Step 3 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

		set @StartStep = getdate()  --logging capture start time of step

		update wtsld --pk group_id, year, run_id, statement_id, tax_district_id, voted, levy_cd, main
		set levy_rate = wtsld.levy_rate - s.levy_rate ,
		    tax_amount = wtsld.tax_amount - s.tax_amount 

        from wa_tax_statement_levy_display as wtsld
             join
             @tax_report_levy_subreport as sub 
		   on wtsld.run_id = sub.run_id 
          and wtsld.tax_district_id = sub.tax_district_id 
          and wtsld.statement_id = sub.statement_id 
          and wtsld.order_num = sub.order_num 
          and wtsld.main = 1
              join
              #sum as s
           on sub.statement_id = s.statement_id
          and sub.tax_district_id = s.tax_district_id
          and sub.order_num = s.order_num

		-- logging end of step 
		SELECT @LogTotRows = @sublevies, -- if above counter set changes, change this
			   @LogErrCode = @@ERROR 
		   SET @LogStatus =  'Step 4 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


    end	

-- end of procedure update log
SET @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate()))
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO

