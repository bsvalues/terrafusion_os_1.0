






CREATE PROCEDURE UpdateMortgagePaymentRun
@input_run_id		int,
@input_effective_dt	varchar(20)

as

declare @prop_id	    int
declare @year		    numeric(4,0)
declare @tax_year	    numeric(4,0)
declare @current_tax_due    numeric(14,2)
declare @delinquent_tax_due numeric(14,2)
declare @attorney_fee_due   numeric(14,2)
declare @fees_due	    numeric(14,2)
declare @base_tax_due	    numeric(14,2)
declare @status		    varchar(5)
declare @amt_pd		    numeric(14,2)

select @tax_year = isnull(tax_yr, 0) from pacs_system

update  mortgage_payment
set 	mortgage_payment.pacs_base_tax = 0
where 	mortgage_payment.mortgage_run_id = @input_run_id
and	((mortgage_payment.status <> 'AP') or (mortgage_payment.status is null))


DECLARE MORTGAGE_PAYMENT_RUN SCROLL CURSOR
FOR
select mortgage_payment.prop_id,
       mortgage_payment.year,
       mortgage_payment.amt_pd
from   mortgage_payment
where  mortgage_payment.mortgage_run_id = @input_run_id
and    ((mortgage_payment.status <> 'AP') or (mortgage_payment.status is null))

OPEN MORTGAGE_PAYMENT_RUN
FETCH NEXT FROM  MORTGAGE_PAYMENT_RUN into
        @prop_id,
       	@year,
        @amt_pd

while (@@FETCH_STATUS = 0)
begin
	select @current_tax_due 	= 0
	select @delinquent_tax_due 	= 0
	select @attorney_fee_due 	= 0
	select @fees_due		= 0
	select @base_tax_due 		= 0	

	exec GetPropertyTaxDueOutput @prop_id,
			@input_effective_dt, 
			@year,
			@current_tax_due OUTPUT,
			@delinquent_tax_due OUTPUT,
			@attorney_fee_due OUTPUT,
			@fees_due OUTPUT

	--Not going to add in @fees_due for now...
	select @base_tax_due = isnull(@current_tax_due, 0) + isnull(@delinquent_tax_due, 0) + isnull(@attorney_fee_due, 0)

	if (@year = @tax_year)
	begin
		if (@base_tax_due = @amt_pd)
		begin
			select @status = 'A'
		end
		else
		begin
			select @status = 'R'
		end
	end
	else
	begin
		select @status = 'R'
	end

	--Update mortgage_payment table with amount due from PACS
	update mortgage_payment
	set   pacs_base_tax 	= @base_tax_due,
	       status		= @status
	where mortgage_run_id 	= @input_run_id
	and   prop_id		= @prop_id

	FETCH NEXT FROM  MORTGAGE_PAYMENT_RUN into
        	@prop_id,
	       	@year,
	@amt_pd
end

CLOSE MORTGAGE_PAYMENT_RUN
DEALLOCATE MORTGAGE_PAYMENT_RUN

-- Update the mortgage_payment_run table to reflect the payments have been updated.
update mortgage_payment_run
set status = 'U',
updated_date = GetDate()
where mortgage_run_id = @input_run_id

--Update mortgage_payment.owner_id column with property owner ID (so the file_as_name prints on receipt)
/*
update mortgage_payment
set mortgage_payment.owner_id = o.owner_id
from prop_supp_assoc psa, owner o
where mortgage_payment.prop_id = psa.prop_id
	and mortgage_payment.year = psa.owner_tax_yr
	and psa.prop_id = o.prop_id
	and psa.owner_tax_yr = o.owner_tax_yr
	and psa.sup_num = o.sup_num
*/
update
	mortgage_payment
set
	mortgage_payment.owner_id = p.col_owner_id
from
	property as p with (nolock)
where
	mortgage_payment.prop_id = p.prop_id

GO

