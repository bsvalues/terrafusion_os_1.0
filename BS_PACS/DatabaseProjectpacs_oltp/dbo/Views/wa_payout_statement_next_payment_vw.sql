

create view wa_payout_statement_next_payment_vw

as

select wps.statement_id,
       wps.run_id, 
       sum(wpad.total_due) as next_payment_amount

 from wa_payout_amount_due wpad, wa_payout_statement wps
where wps.run_id = wpad.run_id
  and wps.statement_id = wpad.statement_id
  and wpad.payment_date <= wps.next_payment_due

group by wps.statement_id, wps.run_id

GO

