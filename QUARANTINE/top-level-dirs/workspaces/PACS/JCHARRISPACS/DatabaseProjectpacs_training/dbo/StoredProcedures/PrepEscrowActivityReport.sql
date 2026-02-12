


CREATE procedure PrepEscrowActivityReport 
@input_user_id		int

as

declare @escrow_payment numeric(14,2)
declare @escrow_void	numeric(14,2)
declare @escrow_total	numeric(14,2)

select @escrow_void = NULL
select @escrow_payment = null

SELECT @escrow_payment = sum(amount)
FROM ESCROW_PAYMENT_TRANS_VW
WHERE year in (select escrow_year from escrow_activity_report_year_list   where pacs_user_id = @input_user_id)
and   batch_id in (select batch_id from escrow_activity_report_batch_list where pacs_user_id = @input_user_id)
and   (ESCROW_PAYMENT_TRANS_VW.status = 'ER' OR
       ESCROW_PAYMENT_TRANS_VW.status = 'EP' OR
       ESCROW_PAYMENT_TRANS_VW.status = 'VEP' OR
       ESCROW_PAYMENT_TRANS_VW.status = 'VER')



SELECT @escrow_void = sum(amount)
FROM ESCROW_PAYMENT_TRANS_VW
WHERE year in (select escrow_year from escrow_activity_report_year_list   where pacs_user_id = @input_user_id)
and   batch_id in (select batch_id from escrow_activity_report_batch_list where pacs_user_id = @input_user_id)
and   (ESCROW_PAYMENT_TRANS_VW.status = 'ER' OR
       ESCROW_PAYMENT_TRANS_VW.status = 'VER')


if (@escrow_void is null)
begin
	select @escrow_void = 0
end

if (@escrow_payment is null)
begin
	select @escrow_payment = 0
end

select @escrow_total = @escrow_payment - @escrow_void

insert into escrow_activity_report
(
pacs_user_id,
total_payment,
total_void,
total_escrow
)
select
@input_user_id,
@escrow_payment,
@escrow_void,
@escrow_total

GO

