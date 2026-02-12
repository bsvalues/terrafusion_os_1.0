

CREATE PROCEDURE GetPropertyTaxDueOutput
@input_property_id      	int,
@input_effective_date        	varchar(100),
@input_year			numeric(4) = 0,
@output_current_tax_due     	numeric(14,2) OUTPUT,
@output_delinquent_tax_due  	numeric(14,2) OUTPUT,
@output_attorney_fee_due    	numeric(14,2) OUTPUT,
@output_fee_due	        	numeric(14,2) OUTPUT

AS

declare @bill_id    		int
declare @refund_due      	numeric(14,2)
declare @property_tax_due      	numeric(14,2)
declare @property_attorney_fee 	numeric(14,2)
declare @delinquent_tax_due    	numeric(14,2)
declare @show_output      	int
declare @str_penalty_mno     	varchar(100)
declare @str_penalty_ins     	varchar(100)
declare @str_interest_ins    	varchar(100)
declare @str_interest_mno    	varchar(100)
declare @str_attorney_fee    	varchar(100)
declare @str_total		varchar(100)
declare @str_base_tax		varchar(100)
declare @penalty_mno      	numeric(14,2)
declare @penalty_ins      	numeric(14,2)
declare @interest_mno      	numeric(14,2)
declare @interest_ins      	numeric(14,2)
declare @attorney_fee        	numeric(14,2)
declare @total			numeric(14,2)
declare @base_tax		numeric(14,2)

if (@input_year > 0)
begin
	DECLARE PROPERTY_BILL CURSOR  FAST_FORWARD
	FOR select bill.bill_id
        	         from   bill
	    where  bill.prop_id = @input_property_id
	    and    bill.sup_tax_yr = @input_year
    	    and   (bill.active_bill = 'T' or
                            bill.active_bill is null)
	    and     bill.coll_status_cd <> 'RS'
 
end
else
begin
	DECLARE PROPERTY_BILL CURSOR FAST_FORWARD
	FOR select bill.bill_id
        	       from   bill
	    where  bill.prop_id = @input_property_id
   	 and   (bill.active_bill = 'T' or
           		   bill.active_bill is null)
	   and     bill.coll_status_cd <> 'RS'
end

OPEN PROPERTY_BILL
FETCH NEXT FROM  PROPERTY_BILL into @bill_id
       
/* initialize property tax due */
select @property_tax_due = 0
select @property_attorney_fee = 0
select @delinquent_tax_due = 0
select @show_output = 0

while (@@FETCH_STATUS = 0)
   begin
	execute GetBillTaxDue @bill_id, @show_output, 'F', @input_effective_date, @str_base_tax OUTPUT,
       		@str_penalty_mno OUTPUT, @str_penalty_ins OUTPUT,
              	@str_interest_mno OUTPUT, @str_interest_ins OUTPUT,
       		@str_attorney_fee OUTPUT,  @str_total OUTPUT
 
	select @penalty_mno  = convert(numeric(14,2), @str_penalty_mno)
 	select @penalty_ins  = convert(numeric(14,2), @str_penalty_ins)
 	select @interest_ins = convert(numeric(14,2), @str_interest_mno)
 	select @interest_mno = convert(numeric(14,2), @str_interest_ins)
        select @attorney_fee = convert(numeric(14,2), @str_attorney_fee)
	select @base_tax     = convert(numeric(14,2), @str_base_tax)
	select @total        = convert(numeric(14,2), @str_total)

 	select @property_tax_due 	= @property_tax_due + @base_tax
	select @delinquent_tax_due    	= @delinquent_tax_due + @penalty_mno + @penalty_ins + @interest_mno + @interest_ins
 	select @property_attorney_fee 	= @property_attorney_fee + @attorney_fee
 
 FETCH NEXT FROM  PROPERTY_BILL into @bill_id
   end

select @output_current_tax_due    = @property_tax_due
select @output_delinquent_tax_due = @delinquent_tax_due
select @output_attorney_fee_due   = @property_attorney_fee

CLOSE PROPERTY_BILL
DEALLOCATE PROPERTY_BILL

--Get Fees amounts...
--Added by EricZ - 02/14/2000
declare @total_fee_amt_due 	numeric(14,2)
declare @fee_amt_due		numeric(14,2)

DECLARE PROPERTY_FEE CURSOR  FAST_FORWARD
	FOR select fee.amt_due
	    from   fee
		join   fee_prop_assoc on
			fee.fee_id = fee_prop_assoc.fee_id
	    where  fee_prop_assoc.prop_id = @input_property_id
	    and    (fee.amt_due - fee.amt_pd) <> 0

OPEN PROPERTY_FEE
FETCH NEXT FROM  PROPERTY_FEE into @fee_amt_due

select @total_fee_amt_due = 0

while (@@FETCH_STATUS = 0)
begin
	select @total_fee_amt_due = @total_fee_amt_due + @fee_amt_due

	FETCH NEXT FROM  PROPERTY_FEE into @fee_amt_due
end

select @output_fee_due = @total_fee_amt_due

CLOSE PROPERTY_FEE
DEALLOCATE PROPERTY_FEE

GO

