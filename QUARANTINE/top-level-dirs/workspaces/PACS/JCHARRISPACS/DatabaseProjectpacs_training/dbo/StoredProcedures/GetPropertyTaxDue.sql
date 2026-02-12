

create procedure dbo.GetPropertyTaxDue 
	@input_property_id int,
	@input_effective_date varchar(100),
	@input_year numeric(4) = 0

as

declare @bill_id int
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
declare @total numeric(14,2)
declare @base_tax numeric(14,2)
declare @output_str_current_tax_due varchar(100)
declare @output_str_delinquent_tax_due varchar(100)
declare @output_str_attorney_fee_due varchar(100)
declare @output_str_total_due varchar(100)
declare @output_str_fee_due varchar(100)


if (@input_year > 0)
begin
	declare PROPERTY_BILL cursor fast_forward
	for
	select
		bill.bill_id
	from
		bill with (nolock)
	where
		bill.prop_id = @input_property_id
	and	bill.sup_tax_yr = @input_year
	and	isnull(bill.active_bill, 'T') = 'T'
	and	bill.coll_status_cd <> 'RS'
 
end
else
begin
	declare PROPERTY_BILL cursor fast_forward
	for
	select
		bill.bill_id
	from
		bill with (nolock)
	where
		bill.prop_id = @input_property_id
	and	isnull(bill.active_bill, 'T') = 'T'
	and	bill.coll_status_cd <> 'RS'
end

open PROPERTY_BILL
fetch next from PROPERTY_BILL
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
	execute GetBillTaxDue @bill_id, @show_output, 'F', @input_effective_date,
		@str_base_tax output,
       		@str_penalty_mno output, @str_penalty_ins output,
              	@str_interest_mno output, @str_interest_ins output,
       		@str_attorney_fee output,
		@str_total output
 
	set @penalty_mno  = convert(numeric(14,2), @str_penalty_mno)
 	set @penalty_ins  = convert(numeric(14,2), @str_penalty_ins)
 	set @interest_ins = convert(numeric(14,2), @str_interest_mno)
 	set @interest_mno = convert(numeric(14,2), @str_interest_ins)
        set @attorney_fee = convert(numeric(14,2), @str_attorney_fee)
	set @base_tax = convert(numeric(14,2), @str_base_tax)
	set @total = convert(numeric(14,2), @str_total)

 	set @property_tax_due = (@property_tax_due + @base_tax)
	set @delinquent_tax_due = (@delinquent_tax_due + @penalty_mno + @penalty_ins + @interest_mno + @interest_ins)
 	set @property_attorney_fee = (@property_attorney_fee + @attorney_fee)
	set @total_due = (@total_due + @total)
 
fetch next from PROPERTY_BILL
into
	@bill_id
end

set @output_str_current_tax_due = convert(varchar(100), @property_tax_due)
set @output_str_delinquent_tax_due = convert(varchar(100), @delinquent_tax_due)
set @output_str_attorney_fee_due = convert(varchar(100), @property_attorney_fee)
set @output_str_total_due = convert(varchar(100), @total_due)

close PROPERTY_BILL
deallocate PROPERTY_BILL


--Get Fees amounts...
--Added by EricZ - 02/14/2000
declare @total_fee_amt_due numeric(14,2)
declare @fee_amt_due numeric(14,2)

declare PROPERTY_FEE cursor fast_forward
for
select
	fee.amt_due
from
	fee with (nolock)
inner join
	fee_prop_assoc as fpa with (nolock)
on
	fpa.fee_id = fee.fee_id
where
	fpa.prop_id = @input_property_id
and	(fee.amt_due - fee.amt_pd) <> 0


open PROPERTY_FEE
fetch next from PROPERTY_FEE
into
	@fee_amt_due

set @total_fee_amt_due = 0


while (@@fetch_status = 0)
begin
	set @total_fee_amt_due = @total_fee_amt_due + @fee_amt_due

	fetch next from PROPERTY_FEE
	into
		@fee_amt_due
end

set @output_str_fee_due = convert(varchar(100), @total_fee_amt_due)

close PROPERTY_FEE
deallocate PROPERTY_FEE


--Return information...
select
	property_id = @input_property_id,
	current_tax_due = @output_str_current_tax_due,
	delinquent_tax_due = @output_str_delinquent_tax_due,
	attorney_fee_due = @output_str_attorney_fee_due,
	fee_due = @output_str_fee_due,
	total_due = @output_str_total_due

GO

