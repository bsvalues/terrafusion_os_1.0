CREATE PROCEDURE CreateFY_NY_SL_special_assessment
		@lInputFromYear numeric(4,0),
		@lCopyToYear numeric(4,0),
		@CalledBy varchar(10)
 
AS
 
/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @Rows int
DECLARE @qry varchar(255)

declare @proc varchar(500)

set @proc = object_name(@@procid)

SET @qry = 'Start - ' + @proc + ' ' + convert(char(4),@lInputFromYear)
         + ',' + convert(char(4),@lCopyToYear) + ',' + @CalledBy
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */
DECLARE @agencyID int,
@fromRuleID int,
@ruleID int

--Each agency that is copied forward has to be inserted one at a time
--so that the calculation builder records can be copied per rule id
declare saData cursor fast_forward for
	select sa.agency_id, sa.rule_id 
	FROM special_assessment as sa 
	with (nolock)
	LEFT JOIN 
     (	select @lInputFromYear as year,agency_id
        from special_assessment with (nolock) 
		where year = @lCopyToYear) as fy_sa
		on sa.year = fy_sa.year
	  and sa.agency_id = fy_sa.agency_id
	INNER JOIN special_assessment_agency as saa
	with (nolock)
		on sa.agency_id = saa.agency_id
	where sa.year = @lInputFromYear
		and fy_sa.year is null -- only return those not already inserted
		and isNull(year(saa.end_date), @lCopyToYear) >= @lCopyToYear
		and (sa.end_year is null or sa.end_year >= @lCopyToYear)
	
	open saData
	fetch next from saData into @agencyID, @fromRuleID
	
	while @@fetch_status = 0
	begin
		--Copy the calculation builder records 
		set @ruleID = null
		if(isNull(@fromRuleID, 0) > 0)
		begin
			exec CopyCalculationRuleToAgency @fromRuleID, @ruleID output
		end
	
		INSERT INTO 
			special_assessment
		(
			year
		   ,agency_id
		   ,calculate_fee
		   ,flat_fee
		   ,has_additional_fee
		   ,has_flat_additional_fee
		   ,fee_type_cd
		   ,assessment_fee_amt
		   ,additional_fee_amt
		   ,recalculate_during_supplement
		   ,calc_source
		   ,status_cd
		   ,created_date
		   ,calculated_date
		   ,bill_create_date
		   ,createdby
		   ,calculatedby
		   ,bills_createdby
		   ,has_additional_fee_as_percent
		   ,additional_fee_as_percent
		   ,disburse
		   ,disburse_acct_id
		   ,rule_id
		   ,import_or_calculate
		   ,end_year
		)
		SELECT 
			@lCopyToYear
			,agency_id
			,calculate_fee
			,flat_fee
			,has_additional_fee
			,has_flat_additional_fee
			,fee_type_cd
			,assessment_fee_amt
			,additional_fee_amt
			,recalculate_during_supplement
			,calc_source
			,'C'
			,created_date
			,null
			,null
			,null
			,null
			,null
			,has_additional_fee_as_percent
			,additional_fee_as_percent
			,disburse
			,disburse_acct_id
			,@ruleID
			,import_or_calculate
			,end_year
		FROM special_assessment 
		where [year] = @lInputFromYear and
			    agency_id = @agencyID and
			    (end_year is null or end_year >= @lCopyToYear)

		fetch next from saData into @agencyID, @fromRuleID
	end
	close saData 
	deallocate saData

-- update log
exec dbo.CurrentActivityLogInsert @proc, @qry,@@Rowcount,@@ERROR

GO

