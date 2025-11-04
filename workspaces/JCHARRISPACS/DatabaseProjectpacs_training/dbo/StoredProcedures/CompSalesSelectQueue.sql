

create procedure CompSalesSelectQueue

as

set nocount on

	/* Only select ARB items from the current year */
	/* (In case previous year items were imported into the _arb_[inquiry|protest] tables upon client install) */
	declare @lYear numeric(4,0)
	exec GetApprYear @lYear output

set nocount off

	select
		convert(int, prop_val_yr) as yr, prop_id, case_id, cast(1 as bit) as bARBInquiry, ait.priority
	from _arb_inquiry as ai
	join _arb_inquiry_type as ait on
		ai.inq_type = ait.inquiry_type_cd
	where
		prop_val_yr = @lYear and
		bGridComplete = 0 and
		bGenerateCompGrid = 1
	union all
	select
		convert(int, prop_val_yr) as yr, prop_id, case_id, cast(0 as bit) as bARBInquiry, 2 /* Default medium priority for protests */
	from _arb_protest
	where
		prop_val_yr = @lYear and
		bGridComplete = 0 and
		bGenerateCompGrid = 1
	order by 3

GO

