
create procedure ARBScheduleHearing
	@lYear numeric(4,0),
	@lCaseID int,
	@lPropID int,
	@lDocketID int
as

if (select prop_type_cd from property where prop_id = @lPropID) in 
   (select szPropertyType from _arb_protest_hearing_property_type
        where lHearingID = (select lHearingID from _arb_protest_hearing_docket where docket_id = @lDocketID))
      BEGIN
         update _arb_protest with(rowlock)
         set    docket_id = @lDocketID
         where  prop_id = @lPropID
            and prop_val_yr = @lYear
           and case_id = @lCaseID

         select bModified = @@ROWCOUNT
      END
      ELSE
      BEGIN
         select bModified = -2
      END

GO

