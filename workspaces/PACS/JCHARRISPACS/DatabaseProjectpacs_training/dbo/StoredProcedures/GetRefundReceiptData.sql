
/******************************************************************************************
GetRefundReceiptData

Takes a comma-separated list of refund IDs and returns data for the
Refund Receipt Report
******************************************************************************************/

create procedure GetRefundReceiptData
	@id_string varchar(2048)
as

-- make temporary tables 
if object_id(N'tempdb..#refund_receipt_refund_data') is not null
	drop table #refund_receipt_refund_data

create table #refund_receipt_refund_data
	(refund_id int not null, last_payment_id int null, check_tender_id int null)

if object_id(N'tempdb..#refund_receipt_all_payments_for_refund') is not null
	drop table #refund_receipt_all_payments_for_refund

create table #refund_receipt_all_payments_for_refund
	(payment_id int, post_date datetime)

-- insert the refund IDs
declare @insert_query varchar(2048)
set @insert_query = 
	'select refund_id, null, null from refund ' +
	'where refund_id in (' + @id_string + ')'

insert into #refund_receipt_refund_data
exec (@insert_query)

-- loop through the refunds
declare @refund_id int
declare @payment_id int
declare @tender_id int

declare refund_cursor cursor for
select refund_id from #refund_receipt_refund_data
open refund_cursor
fetch next from refund_cursor into @refund_id

while @@fetch_status = 0
begin

-- find the last payment associated with this refund

delete #refund_receipt_all_payments_for_refund

-- normal refund transactions

insert #refund_receipt_all_payments_for_refund
select payment.payment_id, payment.post_date

from refund with(nolock)

inner join refund_transaction_assoc rta with(nolock)
on refund.refund_id = rta.refund_id
and rta.voided = 0

inner join coll_transaction refund_trans with(nolock)
on refund_trans.transaction_id = rta.transaction_id

inner join coll_transaction payment_trans with(nolock)
on payment_trans.trans_group_id = refund_trans.trans_group_id

inner join payment_transaction_assoc pta with(nolock)
on pta.transaction_id = payment_trans.transaction_id
and pta.voided = 0

inner join payment with(nolock)
on payment.payment_id = pta.payment_id

where refund.refund_id = @refund_id

-- pending refund transactions

insert #refund_receipt_all_payments_for_refund
select payment.payment_id, payment.post_date

from refund with(nolock)

inner join refund_transaction_assoc rta with(nolock)
on refund.refund_id = rta.refund_id
and rta.voided = 0

inner join pending_coll_transaction refund_trans with(nolock)
on refund_trans.pending_transaction_id = rta.transaction_id

inner join coll_transaction payment_trans with(nolock)
on payment_trans.trans_group_id = refund_trans.trans_group_id

inner join payment_transaction_assoc pta with(nolock)
on pta.transaction_id = payment_trans.transaction_id
and pta.voided = 0

inner join payment with(nolock)
on payment.payment_id = pta.payment_id

where refund.refund_id = @refund_id

-- take the payment with the latest posting date
select top 1 @payment_id = payment_id
from #refund_receipt_all_payments_for_refund
order by post_date desc

-- look for tender with a reference ID in that payment
select top 1 @tender_id = tender_id
from tender with(nolock)
where tender.payment_id = @payment_id
and rtrim(isnull(ref_number, '')) <> ''
order by amount desc

-- fill in the table
update #refund_receipt_refund_data
set last_payment_id = @payment_id,
	check_tender_id = @tender_id
where refund_id = @refund_id

-- loop end
fetch next from refund_cursor into @refund_id
end
close refund_cursor
deallocate refund_cursor

-- now build the report data

select refund.refund_id,

(select top 1 
	case when isnull(addr_line1, '') <> '' then addr_line1 + char(13) else '' end + 
	case when isnull(addr_line2, '') <> '' then addr_line2 + char(13) else '' end + 
	case when isnull(addr_line3, '') <> '' then addr_line3 + char(13) else '' end + 
	case when isnull(city, '') <> '' then city + ',' else '' end + 
	isnull(state, '') + isnull(zip, '') as Expr1
	from system_address
	where (system_type = 'C')
) as system_address, 

case when isnull(refund.refund_to_name, '') <> '' then refund.refund_to_name + char(13) else '' end + 
case when isnull(refund.refund_to_address1, '') <> '' then refund.refund_to_address1 + char(13) else '' end + 
case when isnull(refund.refund_to_address2, '') <> '' then refund.refund_to_address2 + char(13) else '' end + 
case when isnull(refund.refund_to_address3, '') <> '' then refund.refund_to_address3 + char(13) else '' end + 
isnull(refund.refund_to_city, '') +
case when isnull(refund.refund_to_state, '') <> '' then ',' + ' ' +  isnull(refund.refund_to_state, ' ')  else ' ' end + 
case when address.is_international = 1 then 
case when isnull(refund.refund_to_zip, '')  <> '' then '  ' + refund.refund_to_zip else '' end 
+ char(13) 
+ isnull(country.country_name, '')
else '  ' + isnull(refund.refund_to_zip, '')  + ' ' end 
as address,

case when exists
(select 1 from mortgage_co where mortgage_co_id = account_id)
then account_id else null end as mortgage_id, 

refund.refund_amount,
refund.check_number as refund_check_number,
refund_list.last_payment_id as last_payment_id, 
payment.amount_paid as last_payment_amount,
tender.ref_number as last_payment_check_number

from #refund_receipt_refund_data refund_list

inner join refund with(nolock)
on refund_list.refund_id = refund.refund_id

left join payment with(nolock)
on payment.payment_id = refund_list.last_payment_id

left join tender with(nolock)
on tender.tender_id = refund_list.check_tender_id

left join address with(nolock)
on address.acct_id=refund.account_id

left join country with(nolock) 
on refund.refund_to_country_cd=country.country_cd

order by refund.check_number, refund.refund_id


-- cleanup
drop table #refund_receipt_refund_data
drop table #refund_receipt_all_payments_for_refund

GO

