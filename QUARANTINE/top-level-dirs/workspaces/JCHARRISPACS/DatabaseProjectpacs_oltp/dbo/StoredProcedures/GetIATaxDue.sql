





CREATE  PROCEDURE GetIATaxDue 
@input_ia_id      	int,
@input_eff_dt		varchar(10)
AS 
declare @bill_id    		int
declare @sup_tax_yr		numeric(4,0)
declare @refund_due      	numeric(14,2)
declare @property_tax_due      	numeric(14,2)
declare @property_attorney_fee 	numeric(14,2)
declare @delinquent_tax_due    	numeric(14,2)
declare @show_output      	int
declare @str_penalty_mno     	varchar(15)
declare @str_penalty_ins     	varchar(15)
declare @str_interest_ins    	varchar(15)
declare @str_interest_mno    	varchar(15)
declare @str_attorney_fee    	varchar(15)
declare @str_total		varchar(15)
declare @str_base_tax		varchar(15)
declare @penalty_mno      	numeric(14,2)
declare @penalty_ins      	numeric(14,2)
declare @interest_mno      	numeric(14,2)
declare @interest_ins      	numeric(14,2)
declare @attorney_fee        	numeric(14,2)
declare @total			numeric(14,2)
declare @base_tax		numeric(14,2)
declare @output_str_current_tax_due    varchar(15)
declare @output_str_delinquent_tax_due varchar(15)
declare @output_str_attorney_fee_due   varchar(15)

DECLARE IA_BILL CURSOR FAST_FORWARD FOR
select iaba.bill_id
from installment_agreement_bill as iab, installment_agreement_bill_assoc as iaba
where iab.bill_id = iaba.bill_id
and iaba.ia_id = @input_ia_id and (iab.active_bill = 'T' or iab.active_bill is null) and iab.coll_status_cd <> 'RS'

OPEN IA_BILL
FETCH NEXT FROM IA_BILL into @bill_id
       
/* initialize property tax due */
select @property_tax_due 	= 0
select @property_attorney_fee 	= 0
select @delinquent_tax_due 	= 0

while (@@FETCH_STATUS = 0)
begin
	execute GetIABillTaxDue @bill_id, @input_eff_dt, @str_base_tax OUTPUT,
		@str_penalty_mno OUTPUT, @str_penalty_ins OUTPUT,
		@str_interest_mno OUTPUT, @str_interest_ins OUTPUT,
		@str_attorney_fee OUTPUT,  @str_total OUTPUT

	select @penalty_mno  	= convert(numeric(14,2), @str_penalty_mno)
	select @penalty_ins  	= convert(numeric(14,2), @str_penalty_ins)
	select @interest_ins 	= convert(numeric(14,2), @str_interest_mno)
	select @interest_mno 	= convert(numeric(14,2), @str_interest_ins)
	select @attorney_fee 	= convert(numeric(14,2), @str_attorney_fee)
	select @base_tax 	= convert(numeric(14,2), @str_base_tax)
	select @total 		= convert(numeric(14,2), @str_total)

	select @property_tax_due 	= @property_tax_due + @base_tax
	select @delinquent_tax_due    	= @delinquent_tax_due + @penalty_mno + @penalty_ins + @interest_mno + @interest_ins
	select @property_attorney_fee 	= @property_attorney_fee + @attorney_fee
 
	FETCH NEXT FROM IA_BILL into @bill_id
end

select @output_str_current_tax_due    = convert(varchar(15), @property_tax_due)
select @output_str_delinquent_tax_due = convert(varchar(15), @delinquent_tax_due)
select @output_str_attorney_fee_due   = convert(varchar(15), @property_attorney_fee)

CLOSE IA_BILL
DEALLOCATE IA_BILL

--Return information...
select 	ia_id 			= @input_ia_id,
	current_tax_due 	= @output_str_current_tax_due,
	delinquent_tax_due 	= @output_str_delinquent_tax_due,
	attorney_fee_due 	= @output_str_attorney_fee_due

GO

