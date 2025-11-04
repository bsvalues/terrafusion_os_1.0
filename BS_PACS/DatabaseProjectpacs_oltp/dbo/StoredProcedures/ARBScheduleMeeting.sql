
create procedure ARBScheduleMeeting
	@lYear numeric(4,0),
	@lCaseID int,
	@lPropID int,
	@lDocketID int
as

update _arb_protest with(rowlock)
set    prot_appr_docket_id = @lDocketID
where  prop_id = @lPropID
       and prop_val_yr = @lYear
       and case_id = @lCaseID

select bModified = @@ROWCOUNT

GO

