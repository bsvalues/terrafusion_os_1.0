



CREATE   PROCEDURE GetInstallmentTempTaxDue 
@input_effective_date        	varchar(100)
AS 
declare @bill_id    		int

declare @show_output      	int
declare @str_base_tax		varchar(100)
declare @str_penalty_mno     	varchar(100)
declare @str_penalty_ins     	varchar(100)
declare @str_interest_ins    	varchar(100)
declare @str_interest_mno    	varchar(100)
declare @str_attorney_fee    	varchar(100)
declare @str_total		varchar(100)
declare @total			numeric(14,2)
declare @base_tax		numeric(14,2)

set @total    = 0
set @base_tax = 0


DECLARE BILL_LIST CURSOR  FAST_FORWARD
FOR select bill_id
    from   #bill
OPEN BILL_LIST
FETCH NEXT FROM  BILL_LIST into @bill_id
       

while (@@FETCH_STATUS = 0)
begin

	execute GetBillTaxDue @bill_id, 0, 'I', @input_effective_date, @str_base_tax OUTPUT,
       		@str_penalty_mno OUTPUT, @str_penalty_ins OUTPUT,
              	@str_interest_mno OUTPUT, @str_interest_ins OUTPUT,
       		@str_attorney_fee OUTPUT,  @str_total OUTPUT
 
	set @base_tax = @base_tax + convert(numeric(14,2), @str_base_tax)
	set @total    = @total + convert(numeric(14,2), @str_total)

	FETCH NEXT FROM  BILL_LIST into @bill_id
end

select base_tax = @base_tax,
       total = @total

CLOSE BILL_LIST
DEALLOCATE BILL_LIST

GO

