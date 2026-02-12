
CREATE FUNCTION dbo.fn_BillLastTaxAreaId
(
	@billId int,
	@asOfDate datetime
)
RETURNS int
AS
BEGIN
	declare @taxAreaId int

	if( @asOfDate is null )
	begin
		select @taxAreaId = tax_area_id
		from (
			select top 1 tax_area_id
			from bill_adjustment as ba with(Nolock)
			where ba.bill_id = @billId
			order by ba.bill_adj_id desc
		) as adj
	end
	else
	begin
		select @taxAreaId = tax_area_id
		from (
			select top 1 tax_area_id
			from bill_adjustment as ba with(Nolock)
			join batch as b with(Nolock) on
				b.batch_id = ba.batch_id
			where ba.bill_id = @billId
			and b.balance_dt <= @asOfDate
			order by ba.bill_adj_id desc
		) as adj
	end

	if( @taxAreaId is null )
	begin
		select @taxAreaId = tax_area_id
		from levy_bill as lb with(Nolock)
		where lb.bill_id = @billId
	end

	RETURN (@taxAreaId)
END

GO

