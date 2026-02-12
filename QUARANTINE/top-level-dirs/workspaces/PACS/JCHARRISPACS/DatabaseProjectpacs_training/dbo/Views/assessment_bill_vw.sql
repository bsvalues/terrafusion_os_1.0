
	
CREATE VIEW [dbo].[assessment_bill_vw]
AS
SELECT ab.*,
  sas.assessment_fee_amt,
  saa.assessment_cd, saa.assessment_description,
  saa.assessment_description as agency_name,
  acc.file_as_name as tax_payer,
  b.prop_id, b.sup_num, b.statement_id, b.bill_type, b.code, b.last_modified, b.amount_paid,
  b.current_amount_due, b.effective_due_date, b.payment_status_type_cd as bill_payment_status_type_cd,
  sae.ex_amount as exemption_amount,
  owner_id, b.display_year
FROM dbo.assessment_bill ab
  INNER JOIN dbo.special_assessment sas with (nolock)
    ON sas.agency_id = ab.agency_id AND sas.year = ab.year
  INNER JOIN dbo.special_assessment_agency saa with (nolock)
    ON saa.agency_id = sas.agency_id
  INNER JOIN dbo.bill b with (nolock)
    ON b.bill_id = ab.bill_id
  INNER JOIN dbo.account acc with (nolock)
    ON acc.acct_id = b.owner_id
  LEFT JOIN (
    SELECT t.year, t.agency_id,
      Sum(
        case when (t.has_minimum_amount = 1) AND (t.minimum_amount > t.amount_chosen)
        then t.minimum_amount else t.amount_chosen end
      ) AS ex_amount
    FROM (
	  SELECT sae.*,
        (case when sae.exemption_amount_selection = 'P'
        then sa.assessment_fee_amt * sae.pct
        else (case when sae.exemption_amount_selection is null then 0 else sae.amount end)
        end) as amount_chosen
      FROM dbo.special_assessment_exemption sae with(nolock)
        INNER JOIN dbo.special_assessment sa with (nolock)
          ON sa.[year] = sae.[year] and sa.agency_id = sae.agency_id
    ) t
    GROUP BY t.year, t.agency_id
  ) sae
    ON sae.year = sas.year AND sae.agency_id = sas.agency_id

GO

