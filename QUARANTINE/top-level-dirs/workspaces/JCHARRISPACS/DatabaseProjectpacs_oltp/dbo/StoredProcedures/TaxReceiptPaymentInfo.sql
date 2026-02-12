

CREATE    PROCEDURE TaxReceiptPaymentInfo

@input_payment_id	int = 0,
@input_batch_id	int = 0

AS

SET NOCOUNT ON

declare @payment_id 	int
declare @batch_id 	int
declare @check_num 	varchar(50)
declare @mo_num 	varchar(50)
declare @cc_num		varchar(50)
declare @check_amt	numeric(14,2)
declare @cash_amt	numeric(14,2)
declare @mo_amt		numeric(14,2)
declare @cc_amt		numeric(14,2)
declare @cc_fee		numeric(14,2)
declare @total_paid	numeric(14,2)
declare @payment_type	varchar(5)
declare @payment_code	varchar(15)
declare @rcpt_num	int
declare @operator_id	int
declare @post_date	datetime
declare @paid_by	varchar(50)
declare @payee_id	int


if (@input_payment_id > 0)
begin
	SELECT @payment_id 	= payment_id, 
		@batch_id 	= batch_id, 
		@check_num 	= check_num,
		@mo_num 	= mo_num,
		@cc_num		= case when cc_amt <> 0 then cc_type + ' XX-' + cc_last_four_digits else '' end,
		@check_amt 	= check_amt,
		@cash_amt 	= cash_amt,
		@mo_amt 	= mo_amt,
		@cc_amt		= cc_amt,
		@cc_fee		= cc_fee,
		@total_paid	= isnull(check_amt, 0) + isnull(cash_amt, 0) + isnull(mo_amt, 0) + isnull(cc_amt, 0) + isnull(cc_fee, 0),
		@payment_type 	= payment_type,
		@payment_code 	= case when payment_code = 'F' then 'Full'
					when payment_code = 'PP' then 'Partial ***'
					when payment_code = 'OPR' then 'Over/Refund'
					when payment_code = 'OP' then 'Over'
					when payment_code = 'UP' then 'Under'
					when payment_code = 'SA' then 'System'
					else 'Unknown' end,
		@rcpt_num 	= rcpt_num,
		@operator_id 	= operator_id,
		@post_date 	= post_date,
		@paid_by 	= paid_by,
		@payee_id 	= payee_id
	FROM payment
	WHERE payment_id = @input_payment_id
end
else
begin
	SELECT @payment_id 	= payment_id, 
		@batch_id 	= batch_id, 
		@check_num 	= check_num,
		@mo_num 	= mo_num, 
		@cc_num		= case when cc_amt <> 0 then cc_type + ' XX-' + cc_last_four_digits else '' end,
		@check_amt 	= check_amt,
		@cash_amt 	= cash_amt,
		@mo_amt 	= mo_amt,
		@cc_amt		= cc_amt,
		@cc_fee		= cc_fee,
		@total_paid	= isnull(check_amt, 0) + isnull(cash_amt, 0) + isnull(mo_amt, 0) + isnull(cc_amt, 0) + isnull(cc_fee, 0),
		@payment_type 	= payment_type,
		@payment_code 	= case when payment_code = 'F' then 'Full'
					when payment_code = 'PP' then 'Partial ***'
					when payment_code = 'OPR' then 'Over/Refund'
					when payment_code = 'OP' then 'Over'
					when payment_code = 'UP' then 'Under'
					when payment_code = 'SA' then 'System'
					else 'Unknown' end,
		@rcpt_num 	= rcpt_num,
		@operator_id 	= operator_id,
		@post_date 	= post_date,
		@paid_by 	= paid_by,
		@payee_id 	= payee_id
	FROM payment
	WHERE batch_id = @input_batch_id
	ORDER BY payment_id
end





--
-- Check if payee_id = 0 and paid_by = "" and take the first owner from the
-- bills and use that name.  This is for Quick Post, per Jon.
--

declare @bill_id		int

if (@payee_id = 0 and isnull(@paid_by,'') = '')
begin
	select top 1 @bill_id = bill_id
	from payment_trans
	where payment_id = @input_payment_id

	select @payee_id = col_owner_id
	from bill
	inner join property as p with(nolock) on
	bill.prop_id=p.prop_id
	where bill_id = @bill_id
end




declare @file_as_name	varchar(70)

select @file_as_name = file_as_name
from account
where acct_id = @payee_id





declare @addr_line1	varchar(60)
declare @addr_line2	varchar(60)
declare @addr_line3	varchar(60)
declare @addr_city	varchar(50)
declare @addr_state	varchar(50)
declare @addr_zip	varchar(50)
-- Jeremy Wilson 34585 changes
declare @addr_is_international bit
declare @addr_country_cd char(5)
declare @addr_country_name varchar(50)

select @addr_line1	= addr_line1,
	@addr_line2	= addr_line2,
	@addr_line3	= addr_line3,
	@addr_city	= addr_city,
	@addr_state	= addr_state,
	@addr_zip	= addr_zip,
	@addr_is_international = is_international,
	@addr_country_cd = address.country_cd,
	@addr_country_name = country.country_name
from address
left outer join country on country.country_cd = address.country_cd
where acct_id = @payee_id
and address.primary_addr = 'Y'





declare @pacs_user_name	varchar(30)

select @pacs_user_name = pacs_user_name
from pacs_user
where pacs_user_id = @operator_id




declare @description		varchar(255)

select @description = description
from batch
where batch_id = @batch_id



select @@ROWCOUNT as DumbID,
	@payment_id 	as payment_id,
	@batch_id  	as batch_id,
	@check_num 	as check_num,
	@mo_num 	as mo_num,
	@cc_num		as cc_num,
	@check_amt 	as check_amt,
	@cash_amt 	as cash_amt,
	@mo_amt 	as mo_amt,
	@cc_amt		as cc_amt,
	@cc_fee		as cc_fee,
	@total_paid	as total_paid,
	@payment_type	as payment_type,
	@payment_code	as payment_code,
	@rcpt_num 	as rcpt_num,
	@operator_id 	as operator_id,
	@post_date	as post_date,
	@paid_by	as paid_by,
	@payee_id	as payee_id,
	@file_as_name	as file_as_name,
	@addr_line1	as addr_line1,
	@addr_line2	as addr_line2,
	@addr_line3	as addr_line3,
	@addr_city	as addr_city,
	@addr_state	as addr_state,
	@addr_zip	as addr_zip,
	@addr_is_international as is_international,
	@addr_country_cd as country_cd,
	@addr_country_name as country_name,
	@pacs_user_name	as pacs_user_name,
	@description	as description

GO

