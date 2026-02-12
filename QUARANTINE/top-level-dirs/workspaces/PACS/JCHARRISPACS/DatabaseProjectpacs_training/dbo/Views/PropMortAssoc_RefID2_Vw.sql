
CREATE VIEW PropMortAssoc_RefID2_Vw 

AS

SELECT pmad.recNo, pmad.parcelID, 
		pmad.lenderNo, pmad.loanID, 
		p.prop_id, mc.mortgage_co_id,
		mc.mortgage_cd, ma.mortgage_acct_id,
		a.file_as_name
FROM PropMortAssoc_data  as pmad
with (nolock)
LEFT OUTER JOIN property as p
with (nolock)
ON ltrim(rtrim(pmad.parcelID)) = ltrim(rtrim(p.ref_id2)) 
LEFT OUTER JOIN mortgage_co as mc
with (nolock)
ON pmad.lenderNo = right('000' + mc.mortgage_cd, 3)
left outer join account as a
with (nolock)
on mc.mortgage_co_id = a.acct_id
left outer join mortgage_assoc as ma
with (nolock)
on mc.mortgage_co_id = ma.mortgage_co_id
and p.prop_id = ma.prop_id

GO

