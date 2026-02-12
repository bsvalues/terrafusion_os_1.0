



CREATE  PROCEDURE TaxReceiptPaymentTransInfo

	@input_payment_id 	int,
	@input_prop_id int = 0

AS

--SET NOCOUNT ON

declare @tax_year int

select @tax_year = tax_yr from pacs_system

if @input_prop_id = 0
begin
	SELECT 1 as DumbID,
		payment_trans.payment_id,
		payment_trans.bill_id,
		payment_trans.mno_amt,
		payment_trans.ins_amt,
		payment_trans.discount_mno_amt,
		payment_trans.discount_ins_amt,
		payment_trans.penalty_mno_amt,
		payment_trans.penalty_ins_amt,
		payment_trans.interest_ins_amt,
		payment_trans.interest_mno_amt,
		payment_trans.attorney_fee_amt,
		payment_trans.overage_mno_amt + payment_trans.overage_ins_amt as overage_amt,
		0,
		bill.sup_tax_yr,
		bill.sup_num,
		bill.entity_id,
		property.col_owner_id as owner_id,
		bill.bill_taxable_val,
		bill.stmnt_id,
		bill.prop_id,
		bill.adjustment_code,
		account.acct_id,
		account.file_as_name,
		tax_rate.tax_rate_yr,
		tax_rate.m_n_o_tax_pct,
		tax_rate.i_n_s_tax_pct,
		tax_rate.prot_i_n_s_tax_pct,
		account1.file_as_name AS owner_name,
		address.addr_line1,
		address.addr_line2,
		address.addr_line3,
		address.addr_city,
		address.addr_state,
		address.addr_zip,
		address.primary_addr,
		property.geo_id,
		get_legal_desc_vw.legal_desc,
		get_legal_desc_vw.legal_acreage as legal_acres,
		property.dba_name,
		REPLACE(isnull(situs.situs_display, ''), CHAR(13) + CHAR(10), ' ') as situs_address,
		ISNULL(payment_trans.void_trans, '') as void_trans
	FROM 	payment_trans
	
	INNER JOIN bill 
	ON 	payment_trans.bill_id = bill.bill_id 
	
	INNER JOIN account 
	ON 	bill.entity_id = account.acct_id 
	
	INNER JOIN property 
	ON 	bill.prop_id = property.prop_id
	
	INNER JOIN account account1
	ON 	property.col_owner_id = account1.acct_id 
	
	LEFT OUTER JOIN tax_rate 
	ON 	bill.entity_id = tax_rate.entity_id AND 
		bill.sup_tax_yr = tax_rate.tax_rate_yr 
	
	LEFT OUTER JOIN address 
	ON account1.acct_id = address.acct_id
	and address.primary_addr = 'Y'
	
	LEFT OUTER JOIN GET_LEGAL_DESC_TAX_VW get_legal_desc_vw
	ON bill.prop_id = get_legal_desc_vw.prop_id

	LEFT OUTER JOIN situs
	ON	property.prop_id = situs.prop_id AND
	situs.primary_situs = 'Y'

	
	where payment_trans.payment_id = @input_payment_id
	ORDER BY  bill.prop_id
end 
else
begin
	SELECT 1 as DumbID,
		payment_trans.payment_id,
		payment_trans.bill_id,
		payment_trans.mno_amt,
		payment_trans.ins_amt,
		payment_trans.discount_mno_amt,
		payment_trans.discount_ins_amt,
		payment_trans.penalty_mno_amt,
		payment_trans.penalty_ins_amt,
		payment_trans.interest_ins_amt,
		payment_trans.interest_mno_amt,
		payment_trans.attorney_fee_amt,
		payment_trans.overage_mno_amt + payment_trans.overage_ins_amt as overage_amt,
		0,
		bill.sup_tax_yr,
		bill.sup_num,
		bill.entity_id,
		property.col_owner_id as owner_id,
		bill.bill_taxable_val,
		bill.stmnt_id,
		bill.prop_id,
		bill.adjustment_code,
		account.acct_id,
		account.file_as_name,
		tax_rate.tax_rate_yr,
		tax_rate.m_n_o_tax_pct,
		tax_rate.i_n_s_tax_pct,
		tax_rate.prot_i_n_s_tax_pct,
		account1.file_as_name AS owner_name,
		address.addr_line1,
		address.addr_line2,
		address.addr_line3,
		address.addr_city,
		address.addr_state,
		address.addr_zip,
		address.primary_addr,
		property.geo_id,
		get_legal_desc_vw.legal_desc,
		get_legal_desc_vw.legal_acreage as legal_acres,
		property.dba_name,
		REPLACE(isnull(situs.situs_display, ''), CHAR(13) + CHAR(10), ' ') as situs_address,
		ISNULL(payment_trans.void_trans, '') as void_trans
	FROM 	payment_trans
	
	INNER JOIN bill 
	ON 	payment_trans.bill_id = bill.bill_id 
	
	INNER JOIN account 
	ON 	bill.entity_id = account.acct_id 
	
	INNER JOIN property 
	ON 	bill.prop_id = property.prop_id
	
	INNER JOIN account account1
	ON 	property.col_owner_id = account1.acct_id 
	
	LEFT OUTER JOIN tax_rate 
	ON 	bill.entity_id = tax_rate.entity_id AND 
		bill.sup_tax_yr = tax_rate.tax_rate_yr 
	
	LEFT OUTER JOIN address 
	ON account1.acct_id = address.acct_id
	and address.primary_addr = 'Y'
	
	LEFT OUTER JOIN GET_LEGAL_DESC_TAX_VW get_legal_desc_vw
	ON bill.prop_id = get_legal_desc_vw.prop_id

	LEFT OUTER JOIN situs
	ON	property.prop_id = situs.prop_id AND
	situs.primary_situs = 'Y'
	
	where payment_trans.payment_id = @input_payment_id
	and bill.prop_id = @input_prop_id
	ORDER BY  bill.prop_id
end

GO

