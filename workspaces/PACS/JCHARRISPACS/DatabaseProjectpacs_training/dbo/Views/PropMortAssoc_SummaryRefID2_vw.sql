
CREATE VIEW PropMortAssoc_SummaryRefID2_vw

as

select distinct lenderNo,
	(select count(lenderNo)
	from PropMortAssoc_data as p1
	with (nolock)
	where pmad.lenderNo = p1.lenderNo) as num_records,
	(select count(lenderNo)
	from PropMortAssoc_data as p2
	with (nolock)
	join property as p
	with (nolock)
	on p2.parcelID = p.ref_id2
	join mortgage_co as mc
	with (nolocK)
	on p2.lenderNo = right('000' + mc.mortgage_cd, 3)
	join mortgage_assoc as ma
	with (nolock)
	on p.prop_id = ma.prop_id
	and mc.mortgage_co_id = ma.mortgage_co_id
	where pmad.lenderNo = p2.lenderNo) as num_matches,
	(select count(lenderNo)
	from PropMortAssoc_data as p3
	with (nolock)
	where pmad.lenderNo = p3.lenderNo
	and (p3.lenderNo is null or p3.loanID is null)) as num_errors
from PropMortAssoc_data as pmad
with (nolock)

GO

