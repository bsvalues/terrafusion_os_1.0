
CREATE PROCEDURE TaxCertificateBillInfo

@input_fee_id		int,
@input_owner_id	int

AS

SET NOCOUNT ON

select 	1					as DumbID,
	file_as_name				as entity,
	tax_yr 					as year,
	bill.bill_taxable_val 			as taxable,
	pt.stmnt_id 		as statement,
	tax_due,
	disc_pi,
	att_fee,
	tax_due + disc_pi + att_fee 	as total_due,
	pt.entity_id as entity_id
	from 	
		prop_tax_cert_info as pt, 
		bill,
		 account
	where 	
		pt.bill_id = bill.bill_id
		--and	bill.owner_id = @input_owner_id
		and	pt.entity_id = account.acct_id
	and	fee_id = @input_fee_id
	and     bill.active_bill = 'T' and active_bill is not null
	and 	pt.entity_id <> 0
	--order by tax_yr

UNION

SELECT 
	1 AS DumbID,
	"Late Rendition Penalty" AS entity,
	tax_yr AS year,
	0 AS taxable,
	0 AS statement,
	tax_due,
	disc_pi,
	att_fee,
	tax_due + disc_pi + att_fee AS total_due,
	0 as entity_id
FROM
        prop_tax_cert_info
WHERE 
	fee_id=@input_fee_id
--	AND
--	entity_cd='BPP'
	AND
	entity_id=0	 

ORDER BY
	year desc,
	pt.entity_id desc

GO

