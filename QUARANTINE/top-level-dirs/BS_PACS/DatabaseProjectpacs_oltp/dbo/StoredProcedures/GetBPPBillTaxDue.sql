



CREATE procedure GetBPPBillTaxDue

	@input_prop_id 			int,
	@input_sup_num 			int,
	@input_sup_tax_yr 		numeric(4),
	@input_str_oct_acutal_date	varchar(100),
	@output_str_base_tax		varchar(100) OUTPUT,
	@output_str_penalty_mno  	varchar(100) OUTPUT,
	@output_str_penalty_ins  	varchar(100) OUTPUT,
	@output_str_interest_mno 	varchar(100) OUTPUT,
	@output_str_interest_ins 	varchar(100) OUTPUT,
	@output_str_attorney_fee 	varchar(100) OUTPUT,
	@output_total			varchar(100) OUTPUT


as
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



DECLARE Get_BPP_Bill_Id cursor
FOR 

SELECT 
	bill_id 
FROM 
	bill WITH (NOLOCK)
INNER JOIN 
	entity  WITH (NOLOCK)
ON
	bill.entity_id = entity.entity_id
WHERE 
	prop_id = @input_prop_id
AND 
	sup_tax_yr = @input_sup_tax_yr
--AND 
	--sup_num = @input_sup_num
AND 
	ISNULL(rendition_entity,0) = 1

OPEN Get_BPP_Bill_Id
FETCH NEXT FROM Get_BPP_Bill_Id INTO @bill_id

WHILE (@@fetch_status = 0)
BEGIN 


	EXEC GetBillTaxDue 	@bill_id, 0, 'F', @input_str_oct_acutal_date, @str_base_tax OUTPUT,
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

	FETCH NEXT FROM Get_BPP_Bill_Id INTO @bill_id
END

CLOSE Get_BPP_Bill_Id

DEALLOCATE Get_BPP_Bill_Id



SELECT @output_str_base_tax = CONVERT(varchar(100), @bill_tax_due)
SELECT @output_str_penalty_mno = CONVERT(varchar(100),@penalty_mno)
SELECT @output_str_penalty_ins = CONVERT(varchar(100),@penalty_ins)
SELECT @output_str_interest_mno = CONVERT(varchar(100),@int_mno)
SELECT @output_str_interest_ins = CONVERT(varchar(100),@int_ins)
SELECT @output_str_attorney_fee = CONVERT(varchar(100),@att_fee)
SELECT @output_total = CONVERT(varchar(100),@total)

GO

