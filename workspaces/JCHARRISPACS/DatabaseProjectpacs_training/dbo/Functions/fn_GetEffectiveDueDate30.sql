
CREATE FUNCTION fn_GetEffectiveDueDate30 (@date datetime)
RETURNS varchar(30)
AS
BEGIN
	declare		@effective_due_date		datetime,
				@current_tax_yr			int,
				@offset					int

	set @effective_due_date = dateadd(month, 1, dateadd(day, 30, @date))
	set @offset = datepart(day, @effective_due_date) * -1

	RETURN (dbo.fn_FormatDate(dateadd(day, @offset, @effective_due_date), 0))
END

GO

