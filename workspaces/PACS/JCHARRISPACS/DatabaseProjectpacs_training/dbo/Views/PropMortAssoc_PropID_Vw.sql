
CREATE VIEW PropMortAssoc_PropID_Vw AS

SELECT pmd.recNo, pmd.parcelID, 
			pmd.lenderNo, pmd.loanID, 
			property.prop_id AS propID, mortgage_co.mortgage_co_id AS mortID
			
FROM PropMortAssoc_data as pmd
with (nolock)
LEFT OUTER JOIN property
with (nolock)
ON convert(int, pmd.parcelID) = property.prop_id
LEFT OUTER JOIN mortgage_co 
with (nolock)
ON pmd.lenderNo = mortgage_co.lender_num

GO

