


CREATE  view ia_report_payment_vw

as

select distinct iaph.ia_id, p.payment_id, p.date_paid,
       (cash_amt + mo_amt + check_amt + cc_amt) as amt_paid,
       file_as_name as payer
from installment_agreement_payment_history iaph,
     payment p,
     account a
where iaph.payment_id = p.payment_id
and   p.payee_id      = a.acct_id

GO

