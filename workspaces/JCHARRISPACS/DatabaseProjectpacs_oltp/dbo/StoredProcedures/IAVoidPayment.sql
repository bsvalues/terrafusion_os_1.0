




CREATE  procedure IAVoidPayment

@PaymentID	int,
@VoidPaymentID	int

as

declare @ia_id			int
declare @ia_schedule_id	int
declare @payment_amt		numeric(14,2)
declare @sum_payment_amt 	numeric(14,2)

set @sum_payment_amt = 0


DECLARE ia_history CURSOR FAST_FORWARD
FOR select ia_id, 
           ia_schedule_id,
	   payment_amt
From installment_agreement_payment_history
where payment_id = @PaymentID;

open ia_history
fetch next from ia_history into @ia_id, @ia_schedule_id, @payment_amt

while (@@FETCH_STATUS = 0)
begin
	insert into installment_agreement_payment_history
	(
	ia_id,
	ia_schedule_id,
	payment_id,
	payment_amt
	)
	values
	(
	@ia_id,
	@ia_schedule_id,
	@VoidPaymentID,
	@payment_amt * -1
	)

	update installment_agreement_schedule
	set ia_amt_pd = ia_amt_pd - @payment_amt,
	    ia_dt_pd  = case when ia_amt_pd - @payment_amt = 0 then null else ia_dt_pd end,
	    ia_status = case when ia_amt_pd - @payment_amt = 0 then '' else 'PP' end
	where ia_id = @ia_id
	and   ia_schedule_id = @ia_schedule_id
		
	set @sum_payment_amt = @sum_payment_amt + @payment_amt

	fetch next from ia_history into  @ia_id, @ia_schedule_id, @payment_amt
end

close ia_history
deallocate ia_history

if (@sum_payment_amt > 0)
begin
	update installment_agreement
	set  ia_status = 'A'
	where ia_id = @ia_id
	and     ia_status = 'P'
end

GO

