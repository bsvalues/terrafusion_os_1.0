


create procedure IADelete

@ia_id	int

as


delete from installment_agreement_schedule where ia_id = @ia_id
delete from installment_agreement_payment_history where ia_id = @ia_id
delete from installment_agreement_bill_assoc where ia_id = @ia_id
delete from installment_agreement where ia_id = @ia_id

update bill set ia_id = 0
where ia_id = @ia_id

GO

