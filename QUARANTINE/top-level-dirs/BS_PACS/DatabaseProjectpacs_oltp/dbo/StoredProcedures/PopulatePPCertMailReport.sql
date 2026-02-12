
CREATE PROCEDURE PopulatePPCertMailReport
@dataset_id bigint,
@input_prop_id int,
@input_sup_tax_yr numeric(4),
@input_effective_date     varchar(100)

AS

DECLARE @bill_id		int
DECLARE @bill_tax_due           numeric(14,2) 
DECLARE @penalty_mno 		numeric(14,2) 
DECLARE @penalty_ins    	numeric(14,2)
DECLARE @int_mno 		numeric(14,2)
DECLARE @int_ins		numeric(14,2)
DECLARE @att_fee		numeric(14,2)
DECLARE @total			numeric(14,2)
DECLARE @str_penalty_mno_amt   	varchar(100)
DECLARE @str_penalty_ins_amt  	varchar(100)
DECLARE @str_interest_mno_amt 	varchar(100)
DECLARE @str_interest_ins_amt 	varchar(100)
DECLARE @str_attorney_fee_amt 	varchar(100)
DECLARE @str_base_tax		varchar(100)
DECLARE @str_total		varchar(100)

SET @bill_tax_due = 0
SET @penalty_mno = 0
SET @penalty_ins = 0
SET @int_mno = 0
SET @int_ins = 0
SET @att_fee  = 0
SET @total = 0


DECLARE BPP_BILL CURSOR FAST_FORWARD
FOR
	
	SELECT 
		b.bill_id
		
	FROM 
		bill AS b
		--INNER JOIN
		--property_val as pv
		--	ON b.prop_id = pv.prop_id
		--	AND b.sup_tax_yr = pv.prop_val_yr
		--	AND b.sup_num = pv.sup_num
		--property AS p
		--	ON pv.prop_id = p.prop_id
		--	AND p.prop_type_cd IN ('P', 'MH')
	
	WHERE 
		b.prop_id = @input_prop_id
		AND b.sup_tax_yr = @input_sup_tax_yr
		AND b.coll_status_cd <> 'RS'
		AND b.active_bill = 'T'
		AND (b.bill_adj_m_n_o + b.bill_adj_i_n_s) - 
 		((b.bill_m_n_o_pd + b.bill_i_n_s_pd + b.discount_mno_pd + b.discount_ins_pd + b.underage_mno_pd +  b.underage_ins_pd) - 
    		(b.refund_m_n_o_pd + b.refund_i_n_s_pd + b.refund_disc_mno_pd + b.refund_disc_ins_pd)) > 0
		AND b.prop_id > 0
	
		
OPEN BPP_BILL 
FETCH NEXT FROM BPP_BILL INTO @bill_id


WHILE (@@FETCH_STATUS = 0)
BEGIN
	 EXEC GetBillTaxDue 	@bill_id, 0, 'F', @input_effective_date, @str_base_tax OUTPUT,
				@str_penalty_mno_amt  OUTPUT, @str_penalty_ins_amt  OUTPUT, 
				@str_interest_mno_amt OUTPUT, @str_interest_ins_amt OUTPUT,
				@str_attorney_fee_amt OUTPUT, @str_total OUTPUT 


	SELECT @bill_tax_due = @bill_tax_due + CONVERT(numeric(14,2), @str_base_tax)

	SELECT @penalty_mno = @penalty_mno + CONVERT(numeric(14,2),@str_penalty_mno_amt)
	SELECT @penalty_ins = @penalty_ins + CONVERT(numeric(14,2),@str_penalty_ins_amt)
	SELECT @int_mno = @int_mno + CONVERT(numeric(14,2),@str_interest_mno_amt)
	SELECT @int_ins = @int_ins + CONVERT(numeric(14,2),@str_interest_ins_amt)
	SELECT @att_fee = @att_fee + CONVERT(numeric(14,2),@str_attorney_fee_amt)
	SELECT @total = @total + CONVERT(numeric(14,2),@str_total)

	FETCH NEXT FROM BPP_BILL INTO @bill_id

END

CLOSE BPP_BILL
DEALLOCATE BPP_BILL


IF (@total > 10000.00)
BEGIN
 	INSERT ##pp_cert_mail
	SELECT
		pv.prop_id as prop_id,
		o.owner_id as owner_id,
		a.file_as_name as file_as_name,
		pv.legal_desc as legal_desc,
		pv.legal_desc_2 as legal_desc_2,
		addr.addr_line1 as addr_line1,
		addr.addr_line2 as addr_line2,
		addr.addr_line3 as addr_line3,
		addr.addr_city as city,
		addr.addr_state as state,
		addr.zip as zip,
		@bill_tax_due as tax_due,
		@penalty_mno as penalty_mno,
		@penalty_ins as penalty_ins,
		@int_mno as interest_mno,
		@int_ins as interest_ins,
		@att_fee as attorney_fee,
		@total as total,
		pt.prop_type_desc as prop_type,
		@dataset_id as dataset_id
	FROM
		property_val as pv
		INNER JOIN 
		prop_supp_assoc as psa
			ON 
			pv.prop_id = @input_prop_id
			AND
			pv.prop_val_yr = @input_sup_tax_yr
			AND
			psa.prop_id = pv.prop_id
			AND
			psa.owner_tax_yr = pv.prop_val_yr
			AND 
			psa.sup_num = pv.sup_num
		INNER JOIN
		property as p
			ON
			pv.prop_id=p.prop_id
		INNER JOIN
		property_type as pt
			ON
			pt.prop_type_cd=p.prop_type_cd			
		INNER JOIN
		owner as o
			ON
			o.prop_id = pv.prop_id
			AND
			o.owner_tax_yr = pv.prop_val_yr
			AND
			o.sup_num = pv.sup_num
		INNER JOIN
		account as a
			ON
			o.owner_id = a.acct_id	
		INNER JOIN 
		address as addr
			ON 
			addr.acct_id = a.acct_id
			AND
			addr.primary_addr = 'Y'			
		
		 

END

GO

