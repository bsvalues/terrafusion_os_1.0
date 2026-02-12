
CREATE PROCEDURE CM
	@case_id int,
	@ID1 int,
	@ID2 int = NULL
as

DECLARE @prop_val_yr int
DECLARE @prot_by_id int

if @ID2 IS NULL 
	set @prop_val_yr = @ID1
else
begin
	set @prop_val_yr = @ID2
	set @prot_by_id = @ID1
end


declare @cert_mail_cd varchar(50)
declare @cert_mail_num varchar(50)
declare @agent_id int
declare @agent_or_owner_id int
declare @mailer_type int
declare @agent_id_str varchar(20)
declare @ag_or_owner_id_str varchar(20)

declare @postage_fee money
declare @certified_fee money
declare @rtn_receipt_fee money
declare @rest_del_fee money
declare @total_postage money

declare @full_cert_num varchar(50)
declare @coded_cert_num varchar(50)
declare @bc_char char(1)
declare @digit_char varchar(7)

-- MOD 103 checksum vars
DECLARE @idx int
DECLARE @multiplier int
DECLARE @digit int
DECLARE @sum int

IF @case_id <> 0 OR @prop_val_yr <> 0
BEGIN

SELECT TOP 1 
@cert_mail_cd = cert_mail_cd,@agent_id=agent_id,@mailer_type=mailer_type
FROM
certified_mailer
WHERE case_id = @case_id AND prop_val_yr = @prop_val_yr AND prot_by_id = @prot_by_id

If @mailer_type = 1 OR @mailer_type = 2
BEGIN
 SELECT @agent_id_str = ' '
END
ELSE
BEGIN
 SELECT @agent_id_str = CAST(@agent_id as varchar(20))
-- Test code. please leave for later debugging
--if @agent_id_str is NULL
--begin
-- select @agent_id_str = 'Its Null'
--end
END

SELECT @postage_fee = postage_fee,@certified_fee = certified_fee,@rtn_receipt_fee = receipt_fee,
     @rest_del_fee = restricted_delivery,@total_postage = total_postage_fees 
     FROM postal_fees where type = @mailer_type

if @total_postage IS NULL
BEGIN
SELECT @total_postage = ISNULL(@postage_fee,0.0) + ISNULL(@certified_fee,0.0) + ISNULL(@rtn_receipt_fee,0.0) + ISNULL(@rest_del_fee,0.0)
END

SELECT @ag_or_owner_id_str = CAST(@agent_id as varchar(20))

---------------------------------------------------------------
-- Calc 128C bar code

-- get rid of spaces
SELECT @full_cert_num = REPLACE(@cert_mail_cd,' ','')

-- start barcode
exec Get128BarCodeMapping 'start c','c',@char_out = @bc_char OUTPUT
SELECT @coded_cert_num = @bc_char

-- MOD 103 checksum calc
SELECT @idx = 1
SELECT @multiplier = 1
SELECT @sum = 105 -- start C value
WHILE @idx <= len(@full_cert_num)
BEGIN
    SELECT @digit_char = SUBSTRING(@full_cert_num,@idx,2)
    exec Get128BarCodeMapping @digit_char,'c',@char_out = @bc_char OUTPUT
    SELECT @coded_cert_num = @coded_cert_num + @bc_char

    SELECT @digit = CAST(@digit_char AS INT)
    SELECT @sum = @sum + (@digit * @multiplier)
    SELECT @idx = @idx + 2
    SELECT @multiplier = @multiplier + 1
END

SELECT @sum = @sum % 103
-- END MOD 103

-- add sum and  stop character
SELECT @digit_char = STR(@sum,4,0)
exec Get128BarCodeMapping @digit_char,'c',@char_out = @bc_char OUTPUT
SELECT @coded_cert_num = @coded_cert_num + @bc_char
exec Get128BarCodeMapping 'stop','c',@char_out = @bc_char OUTPUT
SELECT @coded_cert_num = @coded_cert_num + @bc_char

SELECT TOP 1
      @cert_mail_cd as cert_mail_cd,
      @coded_cert_num as cert_mail_num,
      @agent_id_str as agent_id,
      @ag_or_owner_id_str as ag_or_owner_id,
      ISNULL(CAST(@postage_fee as varchar(10)),' ') as postage_fee, 
      ISNULL(CAST(@certified_fee  as varchar(10)),' ') as certified_fee,
      ISNULL(CAST(@rtn_receipt_fee  as varchar(10)),' ') as rtn_receipt_fee,
      ISNULL(CAST(@rest_del_fee  as varchar(10)),' ') as rest_del_fee,
      ISNULL(CAST(@total_postage  as varchar(10)),' ') as total_postage
END
ELSE
BEGIN

SELECT TOP 1
      @cert_mail_cd as cert_mail_cd,
      @coded_cert_num as cert_mail_num,
      @agent_id_str as agent_id,
      @ag_or_owner_id_str as ag_or_owner_id,
      ISNULL(CAST(@postage_fee as varchar(10)),' ') as postage_fee, 
      ISNULL(CAST(@certified_fee  as varchar(10)),' ') as certified_fee,
      ISNULL(CAST(@rtn_receipt_fee  as varchar(10)),' ') as rtn_receipt_fee,
      ISNULL(CAST(@rest_del_fee  as varchar(10)),' ') as rest_del_fee,
      ISNULL(CAST(@total_postage  as varchar(10)),' ') as total_postage
WHERE 0 = 1

END

GO

