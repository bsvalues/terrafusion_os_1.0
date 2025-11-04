
create procedure SpecialAssessmentUpdateCalcValues
	@year numeric(4,0),
	@sup_num int,
	@prop_id int,
	@agency_id int,
	
	@assessment_amt numeric(14,2),
	@additional_fee_amt numeric(14,2),
	@exemption_amt numeric(14,2)
as

set nocount on

	update property_special_assessment
	set
		assessment_amt = @assessment_amt,
		additional_fee_amt = @additional_fee_amt,
		exemption_amt = @exemption_amt
	where
		year = @year and
		sup_num = @sup_num and
		prop_id = @prop_id and
		agency_id = @agency_id and
		is_locked = 0

GO

