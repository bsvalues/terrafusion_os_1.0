
create procedure ARBInquiryDelete

@case_id	int,
@prop_val_yr 	numeric(4)

as

delete from _arb_inquiry
where case_id = @case_id
and   prop_val_yr = @prop_val_yr

GO

