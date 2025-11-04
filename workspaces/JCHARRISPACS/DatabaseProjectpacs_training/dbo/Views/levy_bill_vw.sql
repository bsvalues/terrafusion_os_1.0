
CREATE VIEW [dbo].[levy_bill_vw]
AS
SELECT lb.bill_id, lb.levy_cd, lb.year, lb.tax_district_id, b.rollback_id, 
  isNull(ba.taxable_val, lb.taxable_val) as taxable_val, l.levy_rate,
  b.prop_id, b.statement_id, b.bill_type, b.code, b.amount_paid,
  b.current_amount_due, b.payment_status_type_cd as bill_payment_status_type_cd,
  td.tax_district_desc as tax_district,
  owner_id, b.display_year
FROM dbo.levy_bill lb
  INNER JOIN dbo.bill b with (nolock) ON b.bill_id = lb.bill_id
  INNER JOIN dbo.levy l with(nolock)
    ON l.year = lb.year AND l.tax_district_id = lb.tax_district_id AND l.levy_cd = lb.levy_cd
  LEFT JOIN dbo.tax_district td with(nolock)
    ON td.tax_district_id = lb.tax_district_id
  LEFT JOIN dbo.bill_adjustment ba with (nolock)
		ON ba.bill_id = b.bill_id
	  AND ba.bill_adj_id = (select max(baa.bill_adj_id) from dbo.bill_adjustment baa with (nolock)
														where baa.bill_id = b.bill_id)

GO

