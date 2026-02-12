


CREATE PROCEDURE GetAppraisalNoticeRunCount
@input_notice_yr	int,
@input_notice_num	int,
@input_prop_id		int
AS

declare @notice_count	numeric(14)

DECLARE APPR_NOTICE_PROP_LIST SCROLL CURSOR
FOR select count(notice_num) as num_notices
	from appr_notice_prop_list
	where notice_yr = @input_notice_yr
	and    notice_num = @input_notice_num
	and    prop_id >= @input_prop_id

OPEN APPR_NOTICE_PROP_LIST
FETCH NEXT FROM APPR_NOTICE_PROP_LIST into @notice_count

CLOSE APPR_NOTICE_PROP_LIST
DEALLOCATE APPR_NOTICE_PROP_LIST

select notice_count = @notice_count

GO

