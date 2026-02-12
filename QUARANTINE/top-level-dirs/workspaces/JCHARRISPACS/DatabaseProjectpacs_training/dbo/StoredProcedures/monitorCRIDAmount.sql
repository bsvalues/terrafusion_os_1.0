

/***


	Command:  {call monitorCRIDAmount}


***/

CREATE PROCEDURE [dbo].[monitorCRIDAmount]


as

Select p.prop_id, saa.agency_id, saa.assessment_type_cd, saa.assessment_description, a.file_as_name,
ad.addr_line1,ad.addr_city,ad.addr_state, ad.addr_zip, pa.status_cd, pv.legal_desc,
SUM (b.current_amount_due - b.amount_paid) as amount_due, ab.year
From special_assessment_agency as saa
inner join special_assessment as sa
on saa.agency_ID = sa.agency_id

inner join assessment_bill as ab
on ab.year=sa.year

inner join bill as b
on b.bill_id =ab.bill_id
and b.year=ab.year
and sa.agency_id=ab.agency_id

inner join payout_agreement_bill_assoc pab
on b.bill_id = pab.bill_id

join payout_agreement pa 
on pab.payout_agreement_id = pa.payout_agreement_id

inner join property as P
on p.prop_id=b.prop_id

join property_val pv with (nolock)
on b.prop_id = pv.prop_id
and b.year = pv.prop_val_yr 
and b.sup_num = pv.sup_num 


inner join account as a
on a.acct_id=b.owner_id

inner join address as ad
on ad.acct_id=a.acct_id
and primary_addr='Y'

where sa.agency_id in (14,18,19,20,25)
group by saa.agency_id, saa.assessment_type_cd, saa.assessment_description, a.file_as_name, p.prop_id,
ad.addr_line1,ad.addr_city, ad.addr_state, ad.addr_state, ad.addr_zip,ab.year,pa.status_cd,pv.legal_desc
order by p.prop_id, saa.agency_id

GO

