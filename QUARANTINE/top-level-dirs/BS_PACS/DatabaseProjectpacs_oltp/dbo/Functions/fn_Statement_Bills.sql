
CREATE FUNCTION dbo.fn_Statement_Bills(@prop_id int, @postingDate datetime)
RETURNS TABLE
AS RETURN
	SELECT s.*, acc.acct_id, acc.file_as_name as tax_payer
	FROM (
		select lb.statement_id, lb.bill_id, lb.bill_id as item_id, lb.year,
			lb.prop_id, lb.current_amount_due, lb.bill_payment_status_type_cd,
			(CASE WHEN EXISTS(
					SELECT *
					FROM bill_payments_due bpd with(nolock)
					WHERE bpd.bill_id = lb.bill_id AND bpd.amount_due > 0 AND bpd.due_date < @postingDate
				)
				THEN 1 ELSE 0 END
			) AS delinq_status,
			owner_id, lb.display_year
		from levy_bill_vw lb
		union all
		select ab.statement_id, ab.bill_id, ab.bill_id as item_id, ab.year,
			ab.prop_id, ab.current_amount_due, ab.bill_payment_status_type_cd,
			(CASE WHEN EXISTS(
					SELECT *
					FROM bill_payments_due bpd with(nolock)
					WHERE bpd.bill_id = ab.bill_id AND bpd.amount_due > 0 AND bpd.due_date < @postingDate
				)
				THEN 1 ELSE 0 END
			) AS delinq_status,
			owner_id, ab.display_year
		from assessment_bill_vw ab
		union all
		select fb.statement_id, fb.bill_id, fb.fee_id as item_id, fb.year,
			fb.prop_id, fb.current_amount_due, fb.bill_payment_status_type_cd,
			(CASE WHEN EXISTS(
					SELECT *
					FROM fee_payments_due fpd with(nolock)
					WHERE fpd.fee_id = fb.fee_id AND fpd.amount_due > 0 AND fpd.due_date < @postingDate
				)
				THEN 1 ELSE 0 END
			) AS delinq_status,
			owner_id, fb.display_year
		from fee_bill_vw fb
		union all
		select f.statement_id, 0, f.fee_id as item_id, f.year,
			fpa.prop_id, f.current_amount_due, f.payment_status_type_cd,
			(CASE WHEN EXISTS(
					SELECT *
					FROM fee_payments_due fpd with(nolock)
					WHERE fpd.fee_id = f.fee_id AND fpd.amount_due > 0 AND fpd.due_date < @postingDate
				)
				THEN 1 ELSE 0 END
			) AS delinq_status,
			owner_id, f.display_year
		from fee f
		join fee_prop_assoc fpa on f.fee_id = fpa.fee_id
	) s
		INNER JOIN account as acc with(nolock)
			on (acc.acct_id = s.owner_id)
WHERE s.prop_id = @prop_id

GO

