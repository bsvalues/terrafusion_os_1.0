


CREATE procedure [dbo].[MONITOR_IRCC_20_FEES_TO_ADD]



--- This monitor will provide a list of properties that will need to add the $20.00 delinquent CID Fee (IRCC).
--- These are parcels with a Columbia Irrigation assessment that paid the first half timely, but have not paid second half.
----- {CALL MONITOR_IRCC_20_FEES_TO_ADD('2021')}



@year numeric (4,0)


as 




select b.prop_id, b.owner_id, b.sup_num, p.geo_id, b.bill_id, b.year, b.statement_id, saa.assessment_description, ------ 270
saa.assessment_cd, b.payment_status_type_cd, ---(270 row(s) affected)
(b.current_amount_due - b.amount_paid) bill_amt_due,
(bpd.amount_due - bpd.amount_paid) h1_due,
(isnull(bpd2.amount_due, 0) - isnull(bpd2.amount_paid, 0)) h2_due
--into _pmo_H1_due_Irrigation_20211103 ---- (270 row(s) affected)
from bill b with(nolock)
join property p with(nolock)
on p.prop_id = b.prop_id
join assessment_bill ab with(nolock)
on ab.bill_id = b.bill_id
join special_assessment_agency saa with(nolock)
on saa.agency_id = ab.agency_id
join bill_payments_due bpd with(nolock)
on bpd.bill_id = b.bill_id
and bpd.bill_payment_id = 0
left join bill_payments_due bpd2 with(nolock)
on bpd2.bill_id = b.bill_id
and bpd2.bill_payment_id = 1
where b.display_year = @year
and ab.agency_id in (522) ----Columbia = 522
and (bpd.amount_due - bpd.amount_paid) = 0
and (bpd2.amount_due - bpd2.amount_paid) <> 0
and not exists ---------------------------------the section below excludes props where the fee already exists
(select *
from fee f with(nolock)
join fee_prop_assoc fpa with(nolock)
on fpa.fee_id = f.fee_id
where fpa.prop_id = b.prop_id
and f.year = b.year
and f.fee_type_cd = 'IRCC') ------------End of section that excludes already existing Fees
order by b.prop_id

GO

