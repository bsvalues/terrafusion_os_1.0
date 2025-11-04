

create view dbo.pp_rendition_prop_penalty_vw
as
select
	prpp.prop_id,
	prpp.owner_id,
        prpp.sup_num,
	prpp.rendition_year,
        prpp.owner_name,
	prpp.legal_desc,
	prpp.situs_address,
	prpp.market_value,
	prpp.rendition_dt,
	prpp.rendition_penalty,
	prpp.rendition_fraud_penalty,
	prpp.geo_id,
	prpp.ref_id1,
	prpp.ref_id2,
	isnull(prpp.late_rendition_penalty_flag, 0) as late_rendition_penalty_flag,
	isnull(prpp.fraud_penalty_flag, 0) as fraud_penalty_flag
from
	pp_rendition_prop_penalty as prpp with (nolock)
inner join
	prop_supp_assoc as psa with (nolock)
on 
	psa.prop_id = prpp.prop_id
and	psa.owner_tax_yr = prpp.rendition_year
and	psa.sup_num = prpp.sup_num

GO

