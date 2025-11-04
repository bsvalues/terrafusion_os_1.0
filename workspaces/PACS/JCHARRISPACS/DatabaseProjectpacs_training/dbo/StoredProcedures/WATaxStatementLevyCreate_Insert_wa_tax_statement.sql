
-- exec WATaxStatementLevyCreate_Insert_wa_tax_statement 137,2010,59,28079

create procedure WATaxStatementLevyCreate_Insert_wa_tax_statement
	@pacs_user_id int,
	@year numeric(4,0),
	@group_id int,
	@run_id int 
as

/*  PROCESSING NOTES:
    This is called by the stored proc:  WATaxStatementLevyCreate_InsertFrom_CurrentRun
    which is called by the stored proc:  WATaxStatementLevyCreate
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


INSERT INTO dbo.wa_tax_statement
(  [group_id]
  ,[year]
  ,[run_id]
  ,[statement_id]
  ,[copy_type]
  ,[prop_id]
  ,[owner_id]
  ,[sup_num]
  ,[property_type_desc]
  ,[tax_area_code]
  ,[legal_desc]
  ,[situs_display]
  ,[owner_name]
  ,[care_of_name]
  ,[owner_addr_line1]
  ,[owner_addr_line2]
  ,[owner_addr_line3]
  ,[owner_carrier_route]
  ,[owner_addr_city]
  ,[owner_addr_state]
  ,[owner_addr_zip]
  ,[owner_addr_country]
  ,[owner_addr_is_deliverable]
  ,[owner_addr_is_international]
  ,[mailto_id]
  ,[mailto_name]
  ,[mailto_addr_line1]
  ,[mailto_addr_line2]
  ,[mailto_addr_line3]
  ,[mailto_carrier_route]
  ,[mailto_addr_city]
  ,[mailto_addr_state]
  ,[mailto_addr_zip]
  ,[mailto_addr_country]
  ,[mailto_addr_is_deliverable]
  ,[mailto_addr_is_international]
  ,[message_cd]
  ,[prior_year_taxes_paid]
  ,[prior_year_pi_paid]
  ,[prior_year_value]
  ,[prior_year_tax_rate]
  ,[current_year_value]
  ,[current_year_tax_rate]
  ,[total_taxes_assessments_fees]
  ,[agent_id]
  ,[mortgage_co_id]
  ,[mortgage_company]
  ,[due_date]
  ,[full_tax_amount]
  ,[full_interest_amount]
  ,[full_penalty_amount]
  ,[full_total_due]
  ,[half_tax_amount]
  ,[half_interest_amount]
  ,[half_penalty_amount]
  ,[half_total_due]
  ,[delinquent_tax_amount]
  ,[delinquent_interest_amount]
  ,[delinquent_penalty_amount]
  ,[delinquent_total_due]
  ,[total_due]
  ,[generated_by]
  ,[taxserver_id]
  ,[scanline]
  ,[comparison_voted_sum_prev_levy_rate]
  ,[comparison_voted_sum_prev_taxes]
  ,[comparison_voted_sum_curr_levy_rate]
  ,[comparison_voted_sum_curr_taxes]
  ,[comparison_voted_overall_pct_change_levy_rate]
  ,[comparison_voted_overall_pct_change_taxes]
  ,[comparison_nonvoted_sum_prev_levy_rate]
  ,[comparison_nonvoted_sum_prev_taxes]
  ,[comparison_nonvoted_sum_curr_levy_rate]
  ,[comparison_nonvoted_sum_curr_taxes]
  ,[comparison_nonvoted_overall_pct_change_levy_rate]
  ,[comparison_nonvoted_overall_pct_change_taxes]
  ,[show_half_pay_line]
  ,[supp_reason]
  ,[geo_id]
  ,[has_snrdsbl_curr]
  ,[has_snrdsbl_prev]
  ,[full_tax_due_date]
  ,[suppress_prior_year_values]
  ,[assmt_tax_amount]
  ,[fee_tax_amount]
  ,[current_year_imprv_taxable]
  ,[current_year_land_taxable]
  ,[current_year_exmpt_type_cd]
  ,[current_year_exmpt_amt]
  ,[autopay_enrolled_status]
  ,[prior_year_imprv_taxable]
  ,[prior_year_land_taxable]
  ,[prior_year_exmpt_amt]
  ,[prior_year_0_tax_amount]
  ,[prior_year_0_interest]
  ,[prior_year_0_penalty]
  ,[prior_year_1_tax_amount]
  ,[prior_year_1_interest]
  ,[prior_year_1_penalty]
  ,[prior_year_delq_tax_amount]
  ,[prior_year_delq_interest]
  ,[prior_year_delq_penalty]
  ,[gross_tax_amount]
  ,[scanline2]
	,[exempt_tax_amount]
	,[is_additional_statement]
	,[barcode]
	,[statement_message]
)

SELECT [group_id]
      ,[year]
      ,[run_id]
      ,[statement_id]
      ,[copy_type]
      ,[prop_id]
      ,[owner_id]
      ,[sup_num]
      ,[property_type_desc]
      ,[tax_area_code]
      ,[legal_desc]
      ,[situs_display]
      ,[owner_name]
      ,[care_of_name]
      ,[owner_addr_line1]
      ,[owner_addr_line2]
      ,[owner_addr_line3]
      ,[owner_carrier_route]
      ,[owner_addr_city]
      ,[owner_addr_state]
      ,[owner_addr_zip]
      ,[owner_addr_country]
      ,[owner_addr_is_deliverable]
      ,[owner_addr_is_international]
      ,[mailto_id]
      ,[mailto_name]
      ,[mailto_addr_line1]
      ,[mailto_addr_line2]
      ,[mailto_addr_line3]
      ,[mailto_carrier_route]
      ,[mailto_addr_city]
      ,[mailto_addr_state]
      ,[mailto_addr_zip]
      ,[mailto_addr_country]
      ,[mailto_addr_is_deliverable]
      ,[mailto_addr_is_international]
      ,[message_cd]
      ,[prior_year_taxes_paid]
      ,[prior_year_pi_paid]
      ,[prior_year_value]
      ,[prior_year_tax_rate]
      ,[current_year_value]
      ,[current_year_tax_rate]
      ,[total_taxes_assessments_fees]
      ,[agent_id]
      ,[mortgage_co_id]
      ,[mortgage_company]
      ,[due_date]
      ,[full_tax_amount]
      ,[full_interest_amount]
      ,[full_penalty_amount]
      ,[full_total_due]
      ,[half_tax_amount]
      ,[half_interest_amount]
      ,[half_penalty_amount]
      ,[half_total_due]
      ,[delinquent_tax_amount]
      ,[delinquent_interest_amount]
      ,[delinquent_penalty_amount]
      ,[delinquent_total_due]
      ,[total_due]
      ,[generated_by]
      ,[taxserver_id]
      ,[scanline]
      ,[comparison_voted_sum_prev_levy_rate]
      ,[comparison_voted_sum_prev_taxes]
      ,[comparison_voted_sum_curr_levy_rate]
      ,[comparison_voted_sum_curr_taxes]
      ,[comparison_voted_overall_pct_change_levy_rate]
      ,[comparison_voted_overall_pct_change_taxes]
      ,[comparison_nonvoted_sum_prev_levy_rate]
      ,[comparison_nonvoted_sum_prev_taxes]
      ,[comparison_nonvoted_sum_curr_levy_rate]
      ,[comparison_nonvoted_sum_curr_taxes]
      ,[comparison_nonvoted_overall_pct_change_levy_rate]
      ,[comparison_nonvoted_overall_pct_change_taxes]
      ,[show_half_pay_line]
      ,[supp_reason]
      ,[geo_id]
      ,[has_snrdsbl_curr]
      ,[has_snrdsbl_prev]
      ,[full_tax_due_date]
      ,[suppress_prior_year_values]
      ,[assmt_tax_amount]
      ,[fee_tax_amount]
      ,[current_year_imprv_taxable]
      ,[current_year_land_taxable]
      ,[current_year_exmpt_type_cd]
      ,[current_year_exmpt_amt]
      ,[autopay_enrolled_status]
      ,[prior_year_imprv_taxable]
      ,[prior_year_land_taxable]
      ,[prior_year_exmpt_amt]
      ,[prior_year_0_tax_amount]
      ,[prior_year_0_interest]
      ,[prior_year_0_penalty]
      ,[prior_year_1_tax_amount]
      ,[prior_year_1_interest]
      ,[prior_year_1_penalty]
      ,[prior_year_delq_tax_amount]
      ,[prior_year_delq_interest]
      ,[prior_year_delq_penalty]
      ,[gross_tax_amount]
      ,[scanline2]	
	,[exempt_tax_amount]
	,[is_additional_statement]
	,[barcode]
	,[statement_message]
  FROM dbo.wa_tax_statement_current_run
where group_id = @group_id and year = @year and run_id = @run_id

SELECT @LogTotRows = @@ROWCOUNT,
   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode


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

