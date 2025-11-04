
-- exec WATaxStatementLevyCreate_Insert_wa_tax_statement_current_run 137,2010,59,28079

create procedure WATaxStatementLevyCreate_Insert_wa_tax_statement_current_run
	@pacs_user_name varchar(30),
	@year numeric(4,0),
	@group_id int,
	@run_id int,
	@suppress_prior_year_values bit,
	@effective_date datetime,
	@statement_count int output 
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
 + ' @pacs_user_name =' +  isnull(@pacs_user_name,'') + ','
 + ' @year =' +  convert(varchar(30),@year) + ','
 + ' @group_id =' +  convert(varchar(30),@group_id) + ','
 + ' @run_id =' +  convert(varchar(30),@run_id) 
 + ' @suppress_prior_year_values =' +  convert(varchar(30),@suppress_prior_year_values)
 + ' @effective_date =' +  convert(varchar(30),@effective_date)
 
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */

declare @prev_yr numeric(4,0)
    set @prev_yr = @year -1

set @StartStep = getdate()
SET @LogStatus =  'Step 3 Start '

-- get the prop_supp_assoc info based on a view
-- view has group by  so do this before big join below

create table #psa
( prop_id int
, sup_num int
, statement_id int
, col_owner_id int
, suppress_notice_prior_year_values bit
, tax_area_number varchar (23)
, geo_id varchar (50)
, file_as_name varchar (70)
, legal_desc varchar (255)
, sup_desc varchar (500)
, is_additional_statement bit
)

insert into #psa
( 
  prop_id
, sup_num
, statement_id
, col_owner_id 
, suppress_notice_prior_year_values 
, tax_area_number 
, geo_id 
, file_as_name
, legal_desc
, sup_desc
, is_additional_statement
)
select 
  psa.prop_id
, psa.sup_num
, p.statement_id
, property.col_owner_id 
, pv.suppress_notice_prior_year_values 
, ta.tax_area_number 
, property.geo_id 
, a.file_as_name
, pv.legal_desc
, pv.sup_desc
, p.is_additional_statement

from prop_accepted_supp_assoc_vw as psa 
  
join #tblStatementInfo as p
on psa.owner_tax_yr = p.year 
and psa.prop_id = p.prop_id
  
join property 
on psa.prop_id = property.prop_id
	
join property_val as pv 
on pv.prop_val_yr = psa.owner_tax_yr 
and pv.sup_num = psa.sup_num 
and pv.prop_id = psa.prop_id
	
join property_tax_area as pta 
on pta.year = psa.owner_tax_yr
and pta.sup_num = psa.sup_num 
and pta.prop_id = psa.prop_id
   
join tax_area as ta 
on ta.tax_area_id = pta.tax_area_id
	 
join account as a 
on a.acct_id = property.col_owner_id
    
where p.year = @year    




--select * into _rbk_tblStatementInfo from #tblStatementInfo
--select * into _rbk_psa from #psa
    
SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 3 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 4 Start '
			
create clustered index idx_prop_id on #psa(prop_id)

SELECT @LogTotRows = @@ROWCOUNT,
	   @LogErrCode = @@ERROR
SET @LogStatus =  'Step 4 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode


set @StartStep = getdate()
SET @LogStatus =  'Step 5 Start '
					

					
insert wa_tax_statement_current_run (
	group_id,
	year,
	run_id,
	statement_id,
	copy_type,
	prop_id,
	owner_id,
	sup_num,
	owner_addr_is_deliverable,
	owner_addr_is_international,
	mailto_addr_is_deliverable,
	mailto_addr_is_international,
	generated_by,
	property_type_desc,
	tax_area_code,
	legal_desc,
	owner_name,
	current_year_value,
	prior_year_value,
	show_half_pay_line,
	supp_reason,
	geo_id,
	has_snrdsbl_curr,
	has_snrdsbl_prev,
	half_tax_amount,
	half_interest_amount,
	half_penalty_amount,
	half_total_due,
	full_tax_amount,
	full_interest_amount,
	full_penalty_amount,
	full_total_due,
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
	current_year_tax_rate,
	suppress_prior_year_values,
	current_year_imprv_taxable, 
	current_year_land_taxable,
	current_year_exmpt_type_cd,
	current_year_exmpt_amt,
	prior_year_imprv_taxable,
	prior_year_land_taxable,
	prior_year_exmpt_amt,
	autopay_enrolled_status,
	full_tax_due_date,
	is_additional_statement		
)
select distinct
	@group_id, -- group_id
	@year, -- year
	@run_id, --run)id
	psa.statement_id, -- statement_id
	0, --copy_type
	psa.prop_id, -- prop_id
	psa.col_owner_id,  -- owner_id
	psa.sup_num,  -- sup_num
	0,  -- owner_addr_is_deliverable
	0,  -- owner_addr_is_international
	0,  -- mailto_addr_is_deliverable
	0,  -- mailto_addr_is_international
	@pacs_user_name, -- generated_by
	cypt.property_type_desc, -- property_type_desc
	psa.tax_area_number, -- tax_area_code,
	psa.legal_desc,  -- legal_desc,
	psa.file_as_name, -- owner_name
	wtsvvcurr.taxable_value, --current_year_value,
	case 
	  when @suppress_prior_year_values = 1 
	       and psa.suppress_notice_prior_year_values = 1 then 0 
	  else isnull(wtsvvprev.taxable_value,0)
	end, --prior_year_value
	0, -- show_half_pay_line
	psa.sup_desc,  -- supp_reason
	psa.geo_id,  -- geo_id
	case 
	  when pecurr.exmpt_tax_yr is not null then 1 
	  else 0 
	  end, -- has_snrdsbl_curr
	case 
	  when peprev.exmpt_tax_yr is not null then 1 
	  else 0 
	  end,   --has_snrdsbl_prev
	0,  -- half_tax_amount
	0,  -- half_interest_amount
	0,  -- half_penalty_amount
	0,  -- half_total_due
	0,  -- full_tax_amount,
	0,  -- full_interest_amount,
	0,  -- full_penalty_amount,
	0,  -- full_total_due,
	0,  -- comparison_voted_sum_prev_levy_rate,
	0,  -- comparison_voted_sum_prev_taxes,
	0,  -- comparison_voted_sum_curr_levy_rate,
	0,  -- comparison_voted_sum_curr_taxes,
	0,  -- comparison_voted_overall_pct_change_levy_rate,
	0,  -- comparison_voted_overall_pct_change_taxes,
	0,  -- comparison_nonvoted_sum_prev_levy_rate,
	0,  -- comparison_nonvoted_sum_prev_taxes,
	0,  -- comparison_nonvoted_sum_curr_levy_rate,
	0,  -- comparison_nonvoted_sum_curr_taxes,
	0,  -- comparison_nonvoted_overall_pct_change_levy_rate,
	0,  -- comparison_nonvoted_overall_pct_change_taxes,
	0,  -- current_year_tax_rate,
	case 
	  when @suppress_prior_year_values = 1 
	       and psa.suppress_notice_prior_year_values = 1 
	    then 1 
	  else 0 
	end, -- suppress_prior_year_values,
	wtsvvcurr.imprv_value, --current_year_imprv_taxable
	wtsvvcurr.land_value, --current_year_land_taxable
	isNull(pecurr.exmpt_type_cd, ''), --current_year_exmpt_type_cd
	wtsvvcurr.exemption_amount, --current_year_exmpt_amt
	case 
	  when @suppress_prior_year_values = 1 
	       and psa.suppress_notice_prior_year_values = 1 then 0 
	  else isnull(wtsvvprev.imprv_value, 0)
    end, --prior_year_imprv_taxable
	case 
	  when @suppress_prior_year_values = 1 
	       and psa.suppress_notice_prior_year_values = 1 then 0 
	  else isNull(wtsvvprev.land_value, 0) 
	end, --prior_year_land_taxable
	case 
	  when @suppress_prior_year_values = 1 
	       and psa.suppress_notice_prior_year_values = 1 then 0 
	  else isNull(wtsvvprev.exemption_amount, 0) 
	end, --prior_year_exmpt_amt
	0,  -- autopay_enrolled_status	
	@effective_date,  -- full_tax_due_date
	is_additional_statement
	
from  current_year_property_type_ioll_vw as cypt 
	  join 
	  #psa as psa 
   on cypt.prop_id = psa.prop_id

	-- Technically this should be an inner join, however,
	-- I have found in testing that some properties did not have rows
	-- That in itself is a user error, but in this SP
	-- it will later cause other SQL errors because the item
	-- doesn't make it into wa_tax_statement
	-- Worse case scenario appears, at present, that the taxable value is blank
	left outer join prop_supp_assoc as psaprev  on
		psaprev.owner_tax_yr = @prev_yr and
		psaprev.prop_id = psa.prop_id
	left outer join property_exemption as pecurr  on
	    pecurr.prop_id = psa.prop_id and
		pecurr.exmpt_tax_yr = @year and
		pecurr.owner_tax_yr = @year and
		pecurr.sup_num = psa.sup_num and
		pecurr.exmpt_type_cd = 'SNR/DSBL'
	left outer join property_exemption as peprev  on
		peprev.exmpt_tax_yr = psaprev.owner_tax_yr and
		peprev.owner_tax_yr = psaprev.owner_tax_yr and
		peprev.sup_num = psaprev.sup_num and
		peprev.prop_id = psaprev.prop_id and
		peprev.exmpt_type_cd = 'SNR/DSBL'
	left outer join wa_tax_statement_values_vw as wtsvvcurr 
		on wtsvvcurr.year = @year
		and psa.sup_num = wtsvvcurr.sup_num
		and psa.prop_id = wtsvvcurr.prop_id
	left outer join wa_tax_statement_values_vw as wtsvvprev 
		on psaprev.owner_tax_yr = wtsvvprev.year
		and psaprev.sup_num = wtsvvprev.sup_num
		and psaprev.prop_id = wtsvvprev.prop_id		
	
	set @statement_count = @@rowcount

	SELECT @LogTotRows = @statement_count,
		   @LogErrCode = @@ERROR
	SET @LogStatus =  'Step 5 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
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

    RAISERROR(@AppMsg , 16, 1) 

	
END CATCH

GO

