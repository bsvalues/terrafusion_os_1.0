
create procedure [dbo].[WATaxStatementCreateAssociatedCopiesExtra]
	@year numeric(4,0),
	@group_id int,
	@run_id int,
	@owner_only int -- 0 is owner, 1 is agent, 2 is mortgage, 3 is taxserver and 4 is all
as

	-- When columns are added to wa_tax_statement, this procedure must be updated to copy them
	
set nocount on
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
 set @proc = object_name(@@procid)

 SET @qry = 'Start - ' + @proc  
 + ' @year =' +  convert(varchar(30),@year) + ','
 + ' @group_id =' +  convert(varchar(30),@group_id) + ','
 + ' @run_id =' +  convert(varchar(30),@run_id) + ','
 + ' @owner_only =' +  convert(varchar(30),@owner_only) 
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */

set @StartStep = getdate()

	/*
		copy_type meanings:
			0 Taxpayer
			1 Agent
			2 Mortgage
			4 Taxserver
	*/
	
	-- To hold the list of copies we will be making
	declare @tblCopy table (
		statement_id int not null,
		copy_type bigint not null,
		
		primary key clustered (statement_id, copy_type)
		with fillfactor = 100
	)

	-- Agent
	if (@owner_only = 1 or @owner_only = 4)
	begin
		insert @tblCopy (statement_id, copy_type)
		select wts.statement_id, 1
		from wa_tax_statement as wts with(nolock)
		where wts.year = @year and wts.group_id = @group_id and wts.run_id = @run_id and wts.copy_type = 0
		and wts.agent_id > 0
		
		SELECT @LogTotRows = @@ROWCOUNT, @LogErrCode = @@ERROR
		SET @LogStatus =  'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode
	
	end
	
	-- Mortgage
	if (@owner_only = 2 or @owner_only = 4)
	begin
		insert @tblCopy (statement_id, copy_type)
		select wts.statement_id, 2
		from wa_tax_statement as wts with(nolock)
		where wts.year = @year and wts.group_id = @group_id and wts.run_id = @run_id and wts.copy_type = 0
		and wts.mortgage_co_id > 0

		SELECT @LogTotRows = @@ROWCOUNT, @LogErrCode = @@ERROR
		SET @LogStatus =  'Step 2 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	end
	
	-- Taxserver
	if (@owner_only = 3 or @owner_only = 4)
	begin
		insert @tblCopy (statement_id, copy_type)
		select wts.statement_id, 4
		from wa_tax_statement as wts with(nolock)
		where wts.year = @year and wts.group_id = @group_id and wts.run_id = @run_id and wts.copy_type = 0
		and wts.taxserver_id > 0
		
		SELECT @LogTotRows = @@ROWCOUNT, @LogErrCode = @@ERROR
		SET @LogStatus =  'Step 3 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode
		
	end
	
	set @StartStep = getdate()
	SET @LogStatus =  'Step 4 Start '

	--Note for reference by KJB:  
	--Clustered index is created in WATaxStatementCreateAssociatedCopies_Current_Run which performs
	--similar functionality as this store procedure, where as not created in WATaxStatementCreateAssociatedCopies 
	--from which this store procedure is cloned but with slightly different functionality. Need to check 
	--if this clustered index on #tblCopy is also required in this store procedure or not. 
	
	--create clustered index idx_statement_id on #tblCopy(statement_id,copy_type)

	SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
	SET @LogStatus =  'Step 4 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	set @StartStep = getdate()
	SET @LogStatus =  'Step 5 Start '
	
	-- Copy the wa_tax_statement rows
	-- This is the section to be updated as columns are added
	insert wa_tax_statement with(tablock) (
		year, group_id, run_id, statement_id, copy_type,
		prop_id,
		owner_id,
		sup_num,
		property_type_desc,
		tax_area_code,
		legal_desc,
		situs_display,
		owner_name,
		care_of_name,
		owner_addr_line1,
		owner_addr_line2,
		owner_addr_line3,
		owner_addr_city,
		owner_addr_state,
		owner_addr_zip,
		owner_addr_country,
		owner_addr_is_deliverable,
		owner_addr_is_international,
		mailto_id,
		mailto_name,
		mailto_addr_line1,
		mailto_addr_line2,
		mailto_addr_line3,
		mailto_addr_city,
		mailto_addr_state,
		mailto_addr_zip,
		mailto_addr_country,
		mailto_addr_is_deliverable,
		mailto_addr_is_international,
		message_cd,
		prior_year_taxes_paid,
		prior_year_pi_paid,
		prior_year_value,
		prior_year_tax_rate,
		current_year_value,
		current_year_tax_rate,
		total_taxes_assessments_fees,
		agent_id,
		mortgage_co_id,
		mortgage_company,
		due_date,
		full_tax_amount,
		full_interest_amount,
		full_penalty_amount,
		full_total_due,
		half_tax_amount,
		half_interest_amount,
		half_penalty_amount,
		half_total_due,
		delinquent_tax_amount,
		delinquent_interest_amount,
		delinquent_penalty_amount,
		delinquent_total_due,
		total_due,
		generated_by,
		taxserver_id,
		scanline,
		show_half_pay_line,
		comparison_voted_sum_prev_levy_rate,
		comparison_voted_sum_prev_taxes,
		comparison_voted_sum_curr_levy_rate,
		comparison_voted_sum_curr_taxes,
		comparison_voted_overall_pct_change_levy_rate,
		comparison_voted_overall_pct_change_taxes,
		comparison_nonvoted_sum_prev_levy_rate,
		comparison_nonvoted_sum_prev_taxes,
		comparison_nonvoted_sum_curr_levy_rate,
		comparison_nonvoted_sum_curr_taxes,
		comparison_nonvoted_overall_pct_change_levy_rate,
		comparison_nonvoted_overall_pct_change_taxes,
		supp_reason,
		geo_id,
		full_tax_due_date,
		assmt_tax_amount,
		fee_tax_amount,
		current_year_imprv_taxable,
		current_year_land_taxable,
		current_year_exmpt_type_cd,
		current_year_exmpt_amt,
		autopay_enrolled_status,
		prior_year_imprv_taxable,
		prior_year_land_taxable,
		prior_year_exmpt_amt,
		prior_year_0_tax_amount,
		prior_year_0_interest,
		prior_year_0_penalty,
		prior_year_1_tax_amount,
		prior_year_1_interest,
		prior_year_1_penalty,
		prior_year_delq_tax_amount,
		prior_year_delq_interest,
		prior_year_delq_penalty,
		gross_tax_amount,
		scanline2,
		exempt_tax_amount,
		is_additional_statement
	)
	select
		@year, @group_id, @run_id, t.statement_id, t.copy_type,
		wts.prop_id,
		wts.owner_id,
		wts.sup_num,
		wts.property_type_desc,
		wts.tax_area_code,
		wts.legal_desc,
		wts.situs_display,
		wts.owner_name,
		wts.care_of_name,
		wts.owner_addr_line1,
		wts.owner_addr_line2,
		wts.owner_addr_line3,
		wts.owner_addr_city,
		wts.owner_addr_state,
		wts.owner_addr_zip,
		wts.owner_addr_country,
		wts.owner_addr_is_deliverable,
		wts.owner_addr_is_international,
		wts.mailto_id,
		wts.mailto_name,
		wts.mailto_addr_line1,
		wts.mailto_addr_line2,
		wts.mailto_addr_line3,
		wts.mailto_addr_city,
		wts.mailto_addr_state,
		wts.mailto_addr_zip,
		wts.mailto_addr_country,
		wts.mailto_addr_is_deliverable,
		wts.mailto_addr_is_international,
		wts.message_cd,
		wts.prior_year_taxes_paid,
		wts.prior_year_pi_paid,
		wts.prior_year_value,
		wts.prior_year_tax_rate,
		wts.current_year_value,
		wts.current_year_tax_rate,
		wts.total_taxes_assessments_fees,
		wts.agent_id,
		wts.mortgage_co_id,
		wts.mortgage_company,
		wts.due_date,
		wts.full_tax_amount,
		wts.full_interest_amount,
		wts.full_penalty_amount,
		wts.full_total_due,
		wts.half_tax_amount,
		wts.half_interest_amount,
		wts.half_penalty_amount,
		wts.half_total_due,
		wts.delinquent_tax_amount,
		wts.delinquent_interest_amount,
		wts.delinquent_penalty_amount,
		wts.delinquent_total_due,
		wts.total_due,
		wts.generated_by,
		wts.taxserver_id,
		wts.scanline,
		wts.show_half_pay_line,
		wts.comparison_voted_sum_prev_levy_rate,
		wts.comparison_voted_sum_prev_taxes,
		wts.comparison_voted_sum_curr_levy_rate,
		wts.comparison_voted_sum_curr_taxes,
		wts.comparison_voted_overall_pct_change_levy_rate,
		wts.comparison_voted_overall_pct_change_taxes,
		wts.comparison_nonvoted_sum_prev_levy_rate,
		wts.comparison_nonvoted_sum_prev_taxes,
		wts.comparison_nonvoted_sum_curr_levy_rate,
		wts.comparison_nonvoted_sum_curr_taxes,
		wts.comparison_nonvoted_overall_pct_change_levy_rate,
		wts.comparison_nonvoted_overall_pct_change_taxes,
		wts.supp_reason,
		geo_id,
		wts.full_tax_due_date,
		wts.assmt_tax_amount,
		wts.fee_tax_amount,
		wts.current_year_imprv_taxable,
		wts.current_year_land_taxable,
		wts.current_year_exmpt_type_cd,
		wts.current_year_exmpt_amt,
		wts.autopay_enrolled_status,
		wts.prior_year_imprv_taxable,
		wts.prior_year_land_taxable,
		wts.prior_year_exmpt_amt,
		wts.prior_year_0_tax_amount,
		wts.prior_year_0_interest,
		wts.prior_year_0_penalty,
		wts.prior_year_1_tax_amount,
		wts.prior_year_1_interest,
		wts.prior_year_1_penalty,
		wts.prior_year_delq_tax_amount,
		wts.prior_year_delq_interest,
		wts.prior_year_delq_penalty,
		wts.gross_tax_amount,
		scanline2,
		exempt_tax_amount,
		is_additional_statement
	from wa_tax_statement as wts with(nolock)
	join @tblCopy as t on
		t.statement_id = wts.statement_id
	where wts.year = @year and wts.group_id = @group_id and wts.run_id = @run_id and wts.copy_type = 0

	SELECT @LogTotRows = @@ROWCOUNT, @LogErrCode = @@ERROR
	SET @LogStatus =  'Step 5 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	set @StartStep = getdate()
	SET @LogStatus =  'Step 6 Start '

	update wts
	set
		wts.mailto_id = case copy_type
			when 1 then wts.agent_id
			when 2 then wts.mortgage_co_id
			when 4 then wts.taxserver_id
		end,
		-- Also at this time null the mailto fields, in case the agent/mortgage/taxserver has no primary address
		-- Otherwise, the mailto info would still contain the taxpayer data
		wts.mailto_name = null,
		wts.mailto_addr_line1 = null,
		wts.mailto_addr_line2 = null,
		wts.mailto_addr_line3 = null,
		wts.mailto_addr_city = null,
		wts.mailto_addr_state = null,
		wts.mailto_addr_zip = null,
		wts.mailto_addr_country = null,
		wts.mailto_addr_is_deliverable = 0,
		wts.mailto_addr_is_international = 0
	from wa_tax_statement as wts with(tablock)
	where wts.year = @year and wts.group_id = @group_id and wts.run_id = @run_id
	and wts.copy_type in (1,2,4)

	SELECT @LogTotRows = @@ROWCOUNT, @LogErrCode = @@ERROR
	SET @LogStatus =  'Step 6 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	set @StartStep = getdate()
	SET @LogStatus =  'Step 7 Start '

	update wts
	set
		wts.mailto_name = a.file_as_name,
		wts.mailto_addr_line1 = addr.addr_line1,
		wts.mailto_addr_line2 = addr.addr_line2,
		wts.mailto_addr_line3 = addr.addr_line3,
		wts.mailto_addr_city = addr.addr_city,
		wts.mailto_addr_state = addr.addr_state,
		wts.mailto_addr_zip = addr.addr_zip,
		wts.mailto_addr_country = case	when isNull(country.country_name, '') = '' then addr.country_cd 
										else country.country_name end,
		wts.mailto_addr_is_deliverable = case
			when IsNull(addr.ml_deliverable, 'T') in ('T','Y')
			then 1
			else 0
		end,
		wts.mailto_addr_is_international = addr.is_international
	from wa_tax_statement as wts with(tablock)
	join account as a with(nolock) on
		a.acct_id = wts.mailto_id
	join address as addr with(nolock) on
		addr.acct_id = wts.mailto_id and
		isNull(addr.primary_addr, 'N') = 'Y'
	left join country with (nolock) on
		country.country_cd = addr.country_cd
	where wts.year = @year and wts.group_id = @group_id and wts.run_id = @run_id
	and wts.copy_type in (1,2,4)

	SELECT @LogTotRows = @@ROWCOUNT, @LogErrCode = @@ERROR
	SET @LogStatus =  'Step 7 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	set @StartStep = getdate()
	SET @LogStatus =  'Step 8 Start '

	-- Auto-Pay Enrollment
	update wts
	set
		wts.autopay_enrolled_status = isNull(ae.enrolled_status, 0)
	from wa_tax_statement as wts 
	join autopay_enrollment ae on 
		wts.prop_id = ae.prop_id and
		wts.mailto_id = ae.acct_id
	where wts.year = @year and wts.group_id = @group_id and wts.run_id = @run_id
	
	SELECT @LogTotRows = @@ROWCOUNT, @LogErrCode = @@ERROR
	SET @LogStatus =  'Step 8 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	set @StartStep = getdate()


	-- If Agent, Mortgage or Taxserver only copy - delete the owner row.
	--if (@owner_only = 1 or @owner_only = 2 or @owner_only = 3)
	--begin
	
	--  SET @LogStatus =  'Step 9 Start '
	
	--	delete 
	--	from wa_tax_statement
	--	where year = @year and group_id = @group_id and run_id = @run_id and copy_type = 0
	
	--	SELECT @LogTotRows = @@ROWCOUNT, @LogErrCode = @@ERROR
	--  SET @LogStatus =  'Step 9 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	--  exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode
	
	--end

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

