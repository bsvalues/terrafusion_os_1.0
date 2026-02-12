--Roman Hnativ
--SDS 2031

-- exec WARemoveApprNoticeGroupCodes 2008,3
CREATE PROCEDURE WARemoveApprNoticeGroupCodes 

@input_notice_yr	numeric(4),
@input_notice_num	int

as

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
 + ' @input_notice_yr =' +  convert(varchar(30),@input_notice_yr) + ','
 + ' @input_notice_num =' +  convert(varchar(30),@input_notice_num) + ','
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */

-- Delete group codes that were specified in 'Include properties with any of these group codes' 
-- from properties in the notice run.
delete prop_group_assoc
where prop_id in
(
	select prop_id
	from wash_appraisal_notice_prop_info with(nolock)
	where notice_year = @input_notice_yr
	and notice_run_id = @input_notice_num
)
and prop_group_cd in 
(
	select code
	from wash_appraisal_notice_selection_criteria_code with(nolock)
	where notice_year = @input_notice_yr
	and notice_run_id = @input_notice_num
	and type = 'GROUP' 
)

SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 

-- end of procedure update log
SET @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate()))
exec dbo.CurrentActivityLogInsert @proc, @qry,@LogTotRows,@LogErrCode

GO

