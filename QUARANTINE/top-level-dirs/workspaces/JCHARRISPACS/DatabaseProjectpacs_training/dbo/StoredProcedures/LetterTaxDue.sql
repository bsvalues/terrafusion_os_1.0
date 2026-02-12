
create procedure LetterTaxDue

@id1 		int,
@id2		int,
@Year		numeric(4,0) = null,
@SupNum		int = null

as

declare @curr_date  	varchar(25)
declare @next_date	varchar(25)
declare @curr_amt_due	numeric(14,2)
declare @next_amt_due	numeric(14,2)

set @curr_date = convert(varchar(25), GetDate())
set @next_date = convert(varchar(25), dateadd(m, 1, getdate()))


if (@id1 <> 0)
begin
	exec GetPropertyOwnerTaxDueOutput @id1, @id2, @curr_date, 0, @curr_amt_due output
	exec GetPropertyOwnerTaxDueOutput @id1, @id2, @next_date, 0, @next_amt_due output

	select  @id1 as PROP_ID,
		convert(varchar(20), convert(money, @curr_amt_due)) as CURR_MONTH_AMT_DUE,
	        convert(varchar(20), convert(money, @next_amt_due)) as NEXT_MONTH_AMT_DUE
END
ELSE
BEGIN
	select 'Prop ID' as PROP_ID,
	       'Current Month Amt Due' as CURR_MONTH_AMT_DUE,
	       'Next Month Amt Due '   as NEXT_MONTH_AMT_DUE
END

GO

