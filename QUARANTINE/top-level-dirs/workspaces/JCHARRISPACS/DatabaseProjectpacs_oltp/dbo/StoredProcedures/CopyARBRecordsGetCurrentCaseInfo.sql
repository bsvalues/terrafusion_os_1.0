-- This procedure will feed the CARBCCopyProtestFieldsSelectDlg with the data
-- for the list box
----Version Info
--1.0 Created -REC
CREATE PROCEDURE CopyARBRecordsGetCurrentCaseInfo

	@case_id int,
	@prop_id int,
    @prop_val_yr int

AS
--************************************************
	DECLARE @panel_members as varchar(255)
	DECLARE @member as varchar(20)
	--
	select @panel_members = ''
	select @member = ''
	--
	DECLARE panel_members_cursor CURSOR FOR
	select	member_cd
	from		_arb_protest_panel_member  
	where		prop_id     = @prop_id 
	        AND prop_val_yr = @prop_val_yr
		    AND	case_id     = @case_id
	--  
	OPEN panel_members_cursor
	
	FETCH NEXT FROM panel_members_cursor INTO @member
	
	WHILE @@FETCH_STATUS = 0
	BEGIN
		
	    if (@member is not null)
		begin
			if (@panel_members!='') select @panel_members=@panel_members +','
			--
			select @panel_members = @panel_members + @member
	
		end
		FETCH NEXT FROM panel_members_cursor INTO @member
	END--while

	
	
	CLOSE panel_members_cursor
	DEALLOCATE panel_members_cursor
--************************************************
SELECT case WHEN aps.status_desc IS NULL THEN  ap.prot_status else CAST (ap.prot_status  AS VARCHAR(30)) + '(' + CAST(aps.status_desc AS VARCHAR(50) )+ ')' END as 'General Detail -Status' , 
1,
       ap.prot_taxpayer_comments  as 'General Detail -Comments',
2,
       --evidence requeted
       case when (ap.prot_taxpayer_evidence_requested ='T' OR 
                  ap.prot_taxpayer_evidence_requested ='t') THEN
                  'True' ELSE 'FALSE' END  as 'General Evidence -Requested',
4,
	   --Date Requested
       dbo.fn_FormatDate(ap.prot_taxpayer_evidence_requested_dt, 0) as 'General Evidence -Date Requested',
8,
       --the Panel
	   case WHEN appl.panel_cd IS NULL THEN ap.prot_assigned_panel else CAST (ap.prot_assigned_panel  AS VARCHAR(30)) + '(' + CAST( appl.panel_desc AS VARCHAR(50) )+ ')' END as 'General Hearing -Panel', 
16,
	   --hearing start date
       case WHEN ap.prot_hearing_start_dt IS NULL THEN '' ELSE dbo.fn_FormatDate(ap.prot_hearing_start_dt, 1) END as 'Hearing Minutes -Hearing Start Time', 
32,
	   -- 
       case WHEN ap.prot_hearing_finished_dt IS NULL THEN '' ELSE dbo.fn_FormatDate(ap.prot_hearing_finished_dt, 1) END as 'Hearing Minutes -Hearing End Time', 
64, 
	   --
	   case when (a.appraiser_full_name IS NOT NULL AND a.appraiser_nm IS NOT NULL ) then 
            CAST(a.appraiser_nm AS VARCHAR(10)) + '(' + CAST(a.appraiser_full_name AS VARCHAR(50)) +')' 
            WHEN a.appraiser_nm IS NOT NULL  then CAST(a.appraiser_nm  AS VARCHAR(10))
            ELSE '' END as 'Hearing Minutes -Appraiser',
128,
       --Recorder is actually a pacs user
	    'Hearing Minutes -Recorder' = (SELECT full_name FROM pacs_user where pacs_user_id = ap.prot_hearing_recorder_id) ,
256, 
       --ap.prot_hearing_appraisal_staff
	   @panel_members as 'Hearing Minutes -Members', 
512,
       ap.prot_first_motion as 'Hearing Minutes 1st Motion -Detail', 
1024,  
	   'Hearing Minutes 1st Motion -Made by' = CAST(ap.prot_first_motion_by AS VARCHAR(10)) + '(' + (SELECT member_desc FROM _arb_protest_panel_member_cd WHERE member_cd = ap.prot_first_motion_by) + ')',
2048,
       'Hearing Minutes 1st Motion -Seconded by' = CAST(ap.prot_first_motion_seconded_by AS VARCHAR(10)) + '(' + (SELECT member_desc FROM _arb_protest_panel_member_cd WHERE member_cd = ap.prot_first_motion_seconded_by ) + ')'  ,
4096,
	   'Hearing Minutes 1st Motion -Decision' = CAST ( ap.prot_first_motion_decision_cd AS VARCHAR(10)) + '(' + (SELECT decision_desc FROM _arb_protest_decision WHERE decision_cd = ap.prot_first_motion_decision_cd) + ')',
8192,
       dbo.fn_FormatDate(ap.prot_first_motion_decision_dt,0) as 'Hearing Minutes 1st Motion -Decision Date',
16384,
       --
	   ap.prot_second_motion as 'Hearing Minutes 2nd Motion -Detail',
32768,
       'Hearing Minutes 2nd Motion -Made by'= CAST(ap.prot_second_motion_by AS VARCHAR(10)) + '(' + (SELECT member_desc FROM _arb_protest_panel_member_cd WHERE member_cd = ap.prot_second_motion_by) +')' , 
65536,
       'Hearing Minutes 2nd Motion -Seconded by' = CAST(ap.prot_second_motion_seconded_by AS VARCHAR(10)) + '(' +(SELECT member_desc FROM _arb_protest_panel_member_cd WHERE member_cd = ap.prot_second_motion_seconded_by) + ')' , 
131072,
       'Hearing Minutes 2nd Motion -Decision' = CAST(ap.prot_second_motion_decision_cd AS VARCHAR(10)) + '(' + (SELECT decision_desc FROM _arb_protest_decision WHERE decision_cd = ap.prot_second_motion_decision_cd) + ')'  ,
262144,
       dbo.fn_FormatDate(ap.prot_second_motion_decision_dt,0) as 'Hearing Minutes 2nd Motion -Decision Date',
524288,
	   --
       ap.prot_comments as 'Hearing Minutes Testimony -Taxpayer/Ag', 
1048576,
       ap.prot_district_comments as 'Hearing Minutes Testimony -District', 
2097152,
       ap.prot_other_motion as 'Hearing Minutes Testimony -Other motions/comments', 
4194304 

FROM _arb_protest as ap
LEFT OUTER JOIN _arb_protest_status as aps on aps.status_cd=ap.prot_status
LEFT OUTER JOIN _arb_protest_panel  as appl on appl.panel_cd=ap.prot_assigned_panel
LEFT OUTER JOIN appraiser as a on a.appraiser_id = ap.prot_hearing_appraisal_staff
--LEFT OUTER JOIN pacs_user as pu on pu.pacs_user_id = ap.prot_hearing_recorder_id

WHERE     ap.case_id     = @case_id
      AND ap.prop_id     = @prop_id
      AND ap.prop_val_yr = @prop_val_yr

GO

