
create procedure LitigationGetBills
	@lLitigationID int
as

	select
		bill.statement_id,
		a.file_as_name,
		lb.tax_district_id,
		bill.year,
		bill.bill_type,
		bill.adjustment_code,
		bill.bill_id
	from litigation_bill_assoc as lba 
	with(nolock)
	join bill 
	with(nolock) 
	on lba.bill_id = bill.bill_id
	join levy_bill as lb
	with (nolock)
	on bill.bill_id = lb.bill_id
	and bill.year = lb.year
	left outer join account as a 
	with(nolock) 
	on bill.owner_id = a.acct_id
	where lba.litigation_id = @lLitigationID
	order by bill.statement_id asc

GO

