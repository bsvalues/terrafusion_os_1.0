





CREATE procedure [dbo].[monitor_RefundInfo]



/****
This monitor was written for Benton Treasurer.  It returns a list of all refund information 

for the specified check numbers given.

{Call monitor_RefundInfo (\\jcharrispacs\oltp\pacs_oltp\ImportDataPath\benton_check_numbers.csv)}

****/


 @location varchar (255)

as

set nocount on


set @location = '\\jcharrispacs\oltp\pacs_oltp\ImportDataPath\Benton_Check_Numbers_2.txt'

if object_id ('[_monitortmp]') is not null 
begin
drop table _monitortmp 
end

create table _monitortmp
(
check_num varchar (50)
)



declare @szSQL varchar (2048)
set @szSQL = 'BULK INSERT _monitortmp '
set @szSQL = @szSQL + 'FROM''' + @location + ''' '
set @szSQL = @szSQL + 'With (FIELDTERMINATOR = '','', ROWTERMINATOR = ''\n'') '

exec (@szSQL)

select distinct p.prop_id, r.status,r.check_number, r.refund_date, r.refund_amount, 
r.refund_to_name, r.refund_to_address1,r.refund_to_address2,
r.refund_to_address3, r.refund_to_city, r.refund_to_state,
r.refund_to_zip, r.refund_to_country_cd, p.geo_id,rt.refund_reason
from refund r with (nolock)
	inner join refund_transaction_assoc rta with (nolock)
	on r.refund_id = rta.refund_id
	inner join property p with (nolock)
	on rta.prop_id = p.prop_id
	left join refund_type rt
	on rta.year = rt.year
	and rta.refund_type_cd = rt.refund_type_cd
join _monitortmp t
on r.check_number = t.check_num
order by r.refund_date

GO

