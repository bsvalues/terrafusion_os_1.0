







CREATE  PROCEDURE IATaxDue
@input_ia_id      	int,
@input_effective_date        	varchar(100)
AS 
declare @bill_id    		int
declare @show_output      	int
declare @str_penalty_mno     	varchar(100)
declare @str_penalty_ins     	varchar(100)
declare @str_interest_ins    	varchar(100)
declare @str_interest_mno    	varchar(100)
declare @str_attorney_fee    	varchar(100)
declare @str_total		varchar(100)
declare @str_base_tax		varchar(100)
declare @total			numeric(14,2)

DECLARE IA_BILL CURSOR  FAST_FORWARD
FOR select bill.bill_id
    from   bill, installment_agreement_bill_assoc iaba
    where  bill.bill_id = iaba.bill_id
and         iaba.ia_id = @input_ia_id
    and   (bill.active_bill = 'T' or
           bill.active_bill is null)
    and     bill.coll_status_cd <> 'RS'


OPEN IA_BILL
FETCH NEXT FROM  IA_BILL into @bill_id

/* initialize property tax due */
select @total = 0
select @show_output = 0

while (@@FETCH_STATUS = 0)
   begin

	execute GetBillTaxDue @bill_id, @show_output, 'F', @input_effective_date, @str_base_tax OUTPUT,
       		@str_penalty_mno OUTPUT, @str_penalty_ins OUTPUT,
              	@str_interest_mno OUTPUT, @str_interest_ins OUTPUT,
       		@str_attorney_fee OUTPUT,  @str_total OUTPUT
 

	set @total = @total + convert(numeric(14,2), @str_total)
	
 FETCH NEXT FROM  IA_BILL into @bill_id
   end

select ia_id = @input_ia_id, total = @total

CLOSE IA_BILL
DEALLOCATE IA_BILL

GO

