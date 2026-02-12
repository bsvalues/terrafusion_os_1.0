



create procedure dbo.GetPropertyOwnerStatementTaxDue 
	@input_statement_id int,
	@input_prop_id int,
	@input_owner_id int,
	@input_effective_date varchar(100),
	@input_year numeric(4) = 0
as 

declare @bill_id int
declare @bill_tax_due numeric(14,2)
declare @refund_due numeric(14,2)
declare @property_tax_due numeric(14,2)
declare @property_attorney_fee numeric(14,2)
declare @delinquent_tax_due numeric(14,2)
declare @total_due numeric(14,2)
declare @show_output int
declare @str_penalty_mno varchar(100)
declare @str_penalty_ins varchar(100)
declare @str_interest_ins varchar(100)
declare @str_interest_mno varchar(100)
declare @str_attorney_fee varchar(100)
declare @str_total varchar(100)
declare @str_base_tax varchar(100)
declare @penalty_mno numeric(14,2)
declare @penalty_ins numeric(14,2)
declare @interest_mno numeric(14,2)
declare @interest_ins numeric(14,2)
declare @attorney_fee numeric(14,2)
declare @base_tax numeric(14,2)
declare @total numeric(14,2)


if (@input_year > 0)
begin
	declare STATEMENT_BILL cursor fast_forward
	for
	select
		bill.bill_id
	from
		bill with (nolock)
	where
		bill.stmnt_id = @input_statement_id
	and	bill.prop_id = @input_prop_id
	and	bill.sup_tax_yr = @input_year
	and	isnull(bill.active_bill, 'T') = 'T'
	and	isnull(bill.coll_status_cd, '') <> 'RS'
end
else
begin
	declare STATEMENT_BILL cursor fast_forward
	for
	select
		bill.bill_id
	from
		bill with (nolock)
	where
		bill.stmnt_id = @input_statement_id
	and	bill.prop_id = @input_prop_id
	and	isnull(bill.active_bill, 'T') = 'T'
	and	isnull(bill.coll_status_cd, '') <> 'RS'
end

open STATEMENT_BILL
fetch next from STATEMENT_BILL
into
	@bill_id

/* initialize property tax due */
set @property_tax_due = 0
set @property_attorney_fee = 0
set @delinquent_tax_due = 0
set @total_due = 0
set @show_output = 0

while (@@fetch_status = 0)
begin
	execute GetBillTaxDue @bill_id, @show_output, 'F', @input_effective_date, @str_base_tax output,
			@str_penalty_mno output, @str_penalty_ins output,
			@str_interest_mno output, @str_interest_ins output,
			@str_attorney_fee output,  @str_total output
 
	set @penalty_mno = convert(numeric(14,2), @str_penalty_mno)
 	set @penalty_ins = convert(numeric(14,2), @str_penalty_ins)
 	set @interest_ins = convert(numeric(14,2), @str_interest_mno)
 	set @interest_mno = convert(numeric(14,2), @str_interest_ins)
	set @attorney_fee = convert(numeric(14,2), @str_attorney_fee)
	set @base_tax = convert(numeric(14,2), @str_base_tax)
	set @total = convert(numeric(14,2), @str_total)

 	set @property_tax_due = @property_tax_due + @base_tax
	set @delinquent_tax_due = @delinquent_tax_due + @penalty_mno + @penalty_ins + @interest_mno + @interest_ins
 	set @property_attorney_fee = @property_attorney_fee + @attorney_fee
	set @total_due = @total_due + @total

	fetch next from STATEMENT_BILL
	into
		@bill_id
end


select
	statement_id = @input_statement_id,
	prop_id = @input_prop_id,
	owner_id = @input_owner_id,
	current_tax_due = @property_tax_due,
	delinquent_tax_due = @delinquent_tax_due,
	attorney_fee_due = @property_attorney_fee,
	total_due = @total_due


close STATEMENT_BILL
deallocate STATEMENT_BILL

GO

