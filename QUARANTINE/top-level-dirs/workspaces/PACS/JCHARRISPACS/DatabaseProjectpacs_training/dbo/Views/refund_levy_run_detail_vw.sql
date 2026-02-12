
create view refund_levy_run_detail_vw
as
select TOP 100 PERCENT rlrtdd.refund_levy_run_id, 
rlrtdd.fund_number,
	td.tax_district_desc,
	l.levy_description,
	rlrtdd.refund_amount,
	ISNULL(rlrtdd.additional_amount, 0) as additional_amount,
	(rlrtdd.refund_amount + ISNULL(rlrtdd.additional_amount, 0)) as Total,
	l2.levy_description as refund_levy_desc,
	isnull(rlrtdd.adjustment_amount, 0) as adjustment_amount,
	isnull(rlrtdd.ADREF_amount, 0) as ADREF_amount,
	case when IsNull(rlr.calc_adref,0) = 0 or IsNull(fund_number,0) = 0 then
		0
	else
		isnull(rlrtdd.ADREF_amount,0) - (isnull(rlrtdd.refund_amount,0) + isnull(rlrtdd.additional_amount,0))
	end as difference	
from refund_levy_run_tax_district_detail rlrtdd with (nolock) 
inner join refund_levy_run as rlr with(nolock)
on rlrtdd.refund_levy_run_id = rlr.refund_levy_run_id and rlrtdd.year = rlr.year
join tax_district td with (nolock) on rlrtdd.tax_district_id = td.tax_district_id
join levy l with (nolock) on l.levy_cd = rlrtdd.levy_cd
	and l.year = rlrtdd.year
join levy l2 with (nolock) on rlrtdd.refund_levy_cd = l2.levy_cd
	and l2.year = rlrtdd.year
order by l2.levy_cd

GO

