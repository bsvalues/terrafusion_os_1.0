

CREATE PROCEDURE TaxCertReport
@input_batch_id		int,
@input_batch_begin_dt	varchar(10),
@input_batch_end_dt	varchar(10),
@input_entity		varchar(10),
@input_requestor	varchar(70),
@input_user_id		int

AS

declare @strSQL	varchar(2048)
declare @strUID varchar(100)

--Create report table if necessary
if not exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_tax_cert_report_criteria]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	CREATE TABLE [dbo].[_tax_cert_report_criteria] (
		[pacs_user_id] [int] NOT NULL ,
		[criteria] [varchar] (255) NULL
	) ON [PRIMARY]
end

if not exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_tax_cert_report]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	CREATE TABLE [dbo].[_tax_cert_report] (
		[pacs_user_id] [int] NOT NULL ,
		[fee_id] [int] NULL ,
		[requestor] [varchar] (70) NULL ,
		[entity_cd] [varchar] (10) NULL ,
		[tax_cert_num] [int] NULL ,
		[prop_id] [int] NULL ,
		[legal_desc] [varchar] (255) NULL ,
		[post_date] [datetime] NULL ,
		[batch_id] [int] NULL ,
		[batch_desc] [varchar] (255) NULL ,
		[tax_cert_amt] [numeric](14, 2) NULL ,
		[tax_cert_entity_amt] [numeric](14, 2) NULL ,
		[payment_type] [char] (5) NULL
	) ON [PRIMARY]
end

--Delete rows for the PACS user
delete from _tax_cert_report where pacs_user_id = @input_user_id

delete from _tax_cert_report_criteria where pacs_user_id = @input_user_id

--Insert initial rows based on criteria from PACS
set @strSQL = '
insert into _tax_cert_report
(
	pacs_user_id,
	fee_id,
	prop_id,
	legal_desc,
	tax_cert_num,
	requestor,
	tax_cert_amt,
	entity_cd,
	tax_cert_entity_amt,
	payment_type
)
select ' + cast(@input_user_id as varchar(20)) + ',
	fee_prop_entity_assoc.fee_id,
	fee_prop_entity_assoc.prop_id,
	get_legal_desc_vw.legal_desc,
	fee_tax_cert_assoc.tax_cert_num,
	account.file_as_name,
	fee.amt_due,
	entity.entity_cd,
	fee_prop_entity_assoc.entity_amt,
	payment.payment_type
from fee_prop_entity_assoc
join fee_tax_cert_assoc on
	fee_prop_entity_assoc.fee_id = fee_tax_cert_assoc.fee_id
join fee on
	fee_prop_entity_assoc.fee_id = fee.fee_id
join entity on
	fee_prop_entity_assoc.entity_id = entity.entity_id
join get_legal_desc_vw on
	fee_prop_entity_assoc.prop_id = get_legal_desc_vw.prop_id
left outer join fee_acct_assoc on
	fee.fee_id = fee_acct_assoc.fee_id
left outer join fee_prop_assoc on
	fee.fee_id = fee_prop_assoc.fee_id
left outer join  fee_litigation_assoc on
	fee.fee_id = fee_litigation_assoc.fee_id
left outer join account on
	fee_acct_assoc.acct_id = account.acct_id or
	fee_prop_assoc.prop_id = account.acct_id or
	fee_litigation_assoc.litigation_id = account.acct_id
join payment_trans on 
	payment_trans.fee_id = fee.fee_id 
join payment on 
	payment.payment_id = payment_trans.payment_id
where 0 = 0 and fee_prop_entity_assoc.bill_entity_flag = ''F'' '

if (len(@input_entity) > 0)
begin
	set @strSQL = @strSQL + 'and entity.entity_cd = ''' + @input_entity + ''' '
end

if ((@input_batch_id > 0) or (len(@input_batch_begin_dt) > 0) or (len(@input_batch_end_dt) > 0))
begin
	set @strSQL = @strSQL + 'and fee_prop_entity_assoc.fee_id in
	(
		select distinct pt.fee_id
		from payment_trans as pt, payment as p, batch as b
		where pt.payment_id = p.payment_id
		and p.batch_id = b.batch_id '
		
		if (@input_batch_id > 0)
		begin
			set @strSQL = @strSQL + 'and b.batch_id = ' + cast(@input_batch_id as varchar(20)) + ' '
		end

		if (len(@input_batch_begin_dt) > 0)
 		begin
			set @strSQL = @strSQL + 'and b.balance_dt >= ''' + @input_batch_begin_dt + ''' '
		end

		if (len(@input_batch_end_dt) > 0)
 		begin
			set @strSQL = @strSQL + 'and b.balance_dt <= ''' + @input_batch_end_dt + ''' '
		end

		set @strSQL = @strSQL + '
	) '
end

if (len(@input_requestor) > 0)
begin
	set @strSQL = @strSQL + ' and fee_prop_entity_assoc.fee_id in
	(
		select distinct f.fee_id
		from fee as f
		join fee_acct_assoc as faa on
			f.fee_id = faa.fee_id
		join account as a on
			faa.acct_id = a.acct_id
		where a.file_as_name like ''' + @input_requestor + '%'' '

	set @strSQL = @strSQL + '
	) '
end

exec(@strSQL)

--Update the rest of the fields
--HS 35880 & HS 36511
Set @strSQL = 
' update _tax_cert_report
set
	_tax_cert_report.post_date = payment.post_date,
	_tax_cert_report.batch_id = batch.batch_id,
	_tax_cert_report.batch_desc = batch.description,
	_tax_cert_report.tax_cert_entity_amt = 
	CASE RTrim(payment.payment_type)
	When ''VP'' Then _tax_cert_report.tax_cert_entity_amt * -1 
	Else
		_tax_cert_report.tax_cert_entity_amt
	End
from _tax_cert_report, payment, payment_trans, batch
where _tax_cert_report.fee_id = payment_trans.fee_id
and payment_trans.payment_id = payment.payment_id
and payment.batch_id = batch.batch_id 
and _tax_cert_report.payment_type = payment.payment_type '
if( @input_batch_id > 0 )
begin
	Set @strSQL = @strSQL + ' and batch.batch_id = ' + cast(@input_batch_id as varchar(20)) + ' '
end
if (len(@input_batch_begin_dt) > 0)
begin
	Set @strSQL = @strSQL + 'and batch.balance_dt >= ''' + @input_batch_begin_dt + ''' '
end
if (len(@input_batch_end_dt) > 0)
begin
	Set @strSQL = @strSQL + 'and batch.balance_dt <= ''' + @input_batch_end_dt + ''' '
end
Set @strSQL = @strSQL + ' and _tax_cert_report.pacs_user_id = ' + cast(@input_user_id as varchar(20)) + ' '

exec(@strSQL)

--Delete those records that aren't paid
delete from _tax_cert_report
where (post_date is null
or batch_id is null
or batch_desc is null)
and pacs_user_id = @input_user_id

--Insert criteria record
select @strUID = pacs_user_name from pacs_user where pacs_user_id = @input_user_id

set @strSQL = 'insert into _tax_cert_report_criteria values (' + cast(@input_user_id as varchar(20)) + ', '''

set @strSQL = @strSQL + 'PACS User: ' + @strUID + char(10) + char(13)

if ((@input_batch_id = 0) and (len(@input_batch_begin_dt) = 0) and (len(@input_batch_end_dt) = 0))
begin
	set @strSQL = @strSQL + 'Batch ID: (ALL)' + char(10) + char(13)
end

if (@input_batch_id > 0)
begin
	set @strSQL = @strSQL + 'Batch ID: ' + rtrim(cast(@input_batch_id as varchar(20))) + char(10) + char(13)
end

if (len(@input_batch_begin_dt) > 0)
begin
	set @strSQL = @strSQL + 'Batch Begin Date: ' + @input_batch_begin_dt + char(10) + char(13)
end

if (len(@input_batch_end_dt) > 0)
begin
	set @strSQL = @strSQL + 'Batch End Date: ' + @input_batch_end_dt + char(10) + char(13)
end

if (len(@input_entity) > 0)
begin
	set @strSQL = @strSQL + 'Entity Code: ' + @input_entity + char(10) + char(13)
end

if (len(@input_requestor) > 0)
begin
	set @strSQL = @strSQL + 'Requestor: ' + @input_requestor + char(10) + char(13)
end

set @strSQL = @strSQL + ''')'

exec(@strSQL)

GO

