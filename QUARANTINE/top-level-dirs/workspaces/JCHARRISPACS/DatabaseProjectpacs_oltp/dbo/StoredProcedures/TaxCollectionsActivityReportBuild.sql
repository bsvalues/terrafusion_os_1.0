



CREATE  PROCEDURE TaxCollectionsActivityReportBuild

@input_user_id	int,
@input_debug	bit = 0

AS

SET NOCOUNT ON

--Drop/Create/Delete Tables
if not exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_tcary_entity]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	CREATE TABLE [dbo].[_tcary_entity] (
		[pacs_user_id] [int] NOT NULL ,
		[entity_cd] [varchar] (5) NOT NULL 
	) ON [PRIMARY]
end

if not exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_tcary_payments]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	CREATE TABLE [dbo].[_tcary_payments] (
		[pacs_user_id] [int] NOT NULL ,
		[entity_cd] [varchar] (5) NOT NULL ,
		[sup_tax_yr] [numeric](4, 0) NOT NULL ,
		[mno_amt] [numeric](14, 2) NULL ,
		[ins_amt] [numeric](14, 2) NULL ,
		[underage_amt] [numeric](14, 2) NULL ,
		[discount_amt] [numeric](14, 2) NULL ,
		[amt_pd] [numeric](14, 2) NULL ,
		[penalty_mno_amt] [numeric](14, 2) NULL ,
		[penalty_ins_amt] [numeric](14, 2) NULL ,
		[interest_mno_amt] [numeric](14, 2) NULL ,
		[interest_ins_amt] [numeric](14, 2) NULL ,
		[attorney_fee_amt] [numeric](14, 2) NULL ,
		[fee_amt] [numeric](14, 2) NULL ,
		[overage_amt] [numeric](14, 2) NULL ,
		[total_collected] [numeric](14, 2) NULL 
	) ON [PRIMARY]
end

if not exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_tcary_refunds]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	CREATE TABLE [dbo].[_tcary_refunds] (
		[pacs_user_id] [int] NOT NULL ,
		[entity_cd] [varchar] (5) NOT NULL ,
		[sup_tax_yr] [numeric](4, 0) NOT NULL ,
		[refund_mno_pd] [numeric](14, 2) NULL ,
		[refund_ins_pd] [numeric](14, 2) NULL ,
		[refund_disc_pd] [numeric](14,2) NULL ,
		[refund_pen_mno_pd] [numeric](14, 2) NULL ,
		[refund_pen_ins_pd] [numeric](14, 2) NULL ,
		[refund_int_mno_pd] [numeric](14, 2) NULL ,
		[refund_int_ins_pd] [numeric](14, 2) NULL ,
		[refund_atty_fee_pd] [numeric](14, 2) NULL ,
		[refund_amt] [numeric](14, 2) NULL 
	) ON [PRIMARY]
end

if not exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_tcary_totals]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	CREATE TABLE [dbo].[_tcary_totals] (
		[pacs_user_id] [int] NOT NULL ,
		[entity_cd] [varchar] (5) NOT NULL ,
		[total_payments] [numeric](14, 2) NULL ,
		[total_refunds] [numeric](14, 2) NULL ,
		[total] [numeric](14, 2) NULL
	) ON [PRIMARY]
end

if not exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_tcary_grand_totals]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	CREATE TABLE [dbo].[_tcary_grand_totals] (
		[pacs_user_id] [int] NOT NULL ,
		[total_payments] [numeric](14, 2) NULL ,
		[total_refunds] [numeric](14, 2) NULL ,
		[total] [numeric](14, 2) NULL
	) ON [PRIMARY]
end

delete from [dbo].[_tcary_entity]   	where pacs_user_id = @input_user_id
delete from [dbo].[_tcary_payments] 	where pacs_user_id = @input_user_id
delete from [dbo].[_tcary_refunds]  	where pacs_user_id = @input_user_id
delete from [dbo].[_tcary_totals]   	where pacs_user_id = @input_user_id
delete from [dbo].[_tcary_grand_totals]	where pacs_user_id = @input_user_id

--Get the parameters from the 'coll_activity_report_criteria' table
declare @entity_cd	varchar(5)
declare @begin_date	varchar(10)
declare @end_date	varchar(10)
declare @tax_year	varchar(4)
declare @sql		varchar(8000)

select  @entity_cd 	= case when entity <> 'ALL' then rtrim(left(entity, charindex('(', entity, 1) - 1)) else NULL end,
	@begin_date 	= case when date_range <> 'ALL' then rtrim(left(date_range, charindex('t', date_range, 1) - 1)) else NULL end,
	@end_date 	= case when date_range <> 'ALL' then rtrim(right(date_range, charindex('o', date_range, 1) - 3)) else NULL end,
	@tax_year 	= case when coll_year <> 'ALL' then coll_year else NULL end
from coll_activity_report_criteria
where pacs_user_id = @input_user_id

if (@input_debug = 1)
begin
	select 'Entity' 	= @entity_cd
	select 'Year'   	= @tax_year
	select 'Begin Date' 	= @begin_date
	select 'End Date' 	= @end_date

	if not exists (select *
		from coll_activity_report_batch
		where pacs_user_id = @input_user_id
		and batch = 'ALL')
	begin
		select 'Batches' = rtrim(left(batch, charindex('(', batch, 1) - 1)) from coll_activity_report_batch where pacs_user_id = @input_user_id
	end
end

--Populate payments info
set @sql = 'insert into [dbo].[_tcary_payments] select ' + rtrim(cast(@input_user_id as varchar(10))) + ', '
set @sql = @sql + 'e.entity_cd,
		b.sup_tax_yr,
		sum(isnull(pt.mno_amt, 0) + isnull(pt.discount_mno_amt, 0) + isnull(pt.underage_mno_amt, 0)) as mno_amt,
		sum(isnull(pt.ins_amt, 0) + isnull(pt.discount_ins_amt, 0) + isnull(pt.underage_ins_amt, 0)) as ins_amt,
		sum(isnull(pt.underage_mno_amt, 0) + isnull(pt.underage_ins_amt, 0)) as underage_amt,
		sum(isnull(pt.discount_mno_amt, 0) + isnull(pt.discount_ins_amt, 0)) as discount_amt,
		sum(isnull(pt.mno_amt, 0) + isnull(pt.ins_amt, 0)) as amt_pd,
		sum(isnull(pt.penalty_mno_amt, 0)) as penalty_mno_amt,
		sum(isnull(pt.penalty_ins_amt, 0)) as penalty_ins_amt,
		sum(isnull(pt.interest_mno_amt, 0)) as interest_mno_amt,
		sum(isnull(pt.interest_ins_amt, 0)) as interest_ins_amt,
		sum(isnull(pt.attorney_fee_amt, 0)) as attorney_fee_amt,
		sum(isnull(pt.fee_amt, 0)) as fee_amt,
		sum(isnull(pt.overage_mno_amt, 0) + isnull(pt.overage_ins_amt, 0)) as overage_amt,
		sum(isnull(pt.mno_amt, 0) + isnull(pt.ins_amt, 0) + isnull(pt.penalty_mno_amt, 0) + isnull(pt.penalty_ins_amt, 0) + isnull(pt.interest_mno_amt, 0) + isnull(pt.interest_ins_amt, 0) + isnull(pt.attorney_fee_amt, 0) + isnull(pt.overage_mno_amt, 0) + isnull(pt.overage_ins_amt, 0)) as total_collected
	from payment as p with (nolock),	
		payment_trans as pt with (nolock),
		batch as ba with (nolock),
		entity as e with (nolock),
		bill as b with (nolock)
	where p.payment_id = pt.payment_id	
		and p.batch_id = ba.batch_id
		and pt.bill_id = b.bill_id
		and b.entity_id = e.entity_id'

if (@entity_cd is not null)
begin
	set @sql = @sql + ' and e.entity_cd = ''' + @entity_cd + ''''
end

if (@tax_year is not null)
begin
	set @sql = @sql + ' and b.sup_tax_yr = ' + @tax_year
end

if (@begin_date is not null)
begin
	set @sql = @sql + ' and ba.balance_dt >= ''' + @begin_date + ''''
end

if (@end_date is not null)
begin
	set @sql = @sql + ' and ba.balance_dt <= ''' + @end_date + ''''
end

if not exists (select *
		from coll_activity_report_batch
		where pacs_user_id = @input_user_id
		and batch = 'ALL')
begin
	set @sql = @sql + ' and ba.batch_id in ('
	set @sql = @sql + ' select rtrim(left(batch, charindex(''('', batch, 1) - 1))'
	set @sql = @sql + ' from coll_activity_report_batch where pacs_user_id = ' + rtrim(cast(@input_user_id as varchar(10))) + ')'
end

set @sql = @sql + ' group by e.entity_cd, b.sup_tax_yr'
set @sql = @sql + ' order by e.entity_cd, b.sup_tax_yr'

exec(@sql)

--Populate refunds info
set @sql = 'insert into [dbo].[_tcary_refunds] select ' + rtrim(cast(@input_user_id as varchar(10))) + ', '
set @sql = @sql + 'e.entity_cd,
		b.sup_tax_yr,
		sum(isnull(rt.refund_m_n_o_pd, 0) - isnull(rt.refund_disc_mno_pd, 0)) as refund_mno_pd,
		sum(isnull(rt.refund_i_n_s_pd, 0) - isnull(rt.refund_disc_ins_pd, 0)) as refund_ins_pd,
		sum(isnull(rt.refund_disc_mno_pd, 0) + isnull(rt.refund_disc_ins_pd, 0)) as refund_disc_pd,
		sum(isnull(rt.refund_pen_m_n_o_pd, 0)) as refund_pen_mno_pd,
		sum(isnull(rt.refund_pen_i_n_s_pd, 0)) as refund_pen_ins_pd,
		sum(isnull(rt.refund_int_m_n_o_pd, 0)) as refund_int_mno_pd,
		sum(isnull(rt.refund_int_i_n_s_pd, 0)) as refund_int_ins_pd,
		sum(isnull(rt.refund_atty_fee_pd, 0)) as refund_atty_fee_pd,
		sum(isnull(rt.refund_m_n_o_pd, 0) + isnull(rt.refund_i_n_s_pd, 0) + isnull(rt.refund_pen_m_n_o_pd, 0) + isnull(rt.refund_pen_i_n_s_pd, 0) + isnull(rt.refund_int_m_n_o_pd, 0) + isnull(rt.refund_int_i_n_s_pd, 0) + isnull(rt.refund_atty_fee_pd, 0)) as refund_amt
	from refund as r with (nolock),	
		refund_trans as rt with (nolock),
		batch as ba with (nolock),
		entity as e with (nolock),
		bill as b with (nolock)
	where r.refund_id = rt.refund_id	
		and r.batch_id = ba.batch_id
		and rt.bill_id = b.bill_id
		and b.entity_id = e.entity_id'

if (@entity_cd is not null)
begin
	set @sql = @sql + ' and e.entity_cd = ''' + @entity_cd + ''''
end

if (@tax_year is not null)
begin
	set @sql = @sql + ' and b.sup_tax_yr = ' + @tax_year
end

if (@begin_date is not null)
begin
	set @sql = @sql + ' and ba.balance_dt >= ''' + @begin_date + ''''
end

if (@end_date is not null)
begin
	set @sql = @sql + ' and ba.balance_dt <= ''' + @end_date + ''''
end

if not exists (select *
		from coll_activity_report_batch
		where pacs_user_id = @input_user_id
		and batch = 'ALL')
begin
	set @sql = @sql + ' and ba.batch_id in ('
	set @sql = @sql + ' select rtrim(left(batch, charindex(''('', batch, 1) - 1))'
	set @sql = @sql + ' from coll_activity_report_batch where pacs_user_id = ' + rtrim(cast(@input_user_id as varchar(10))) + ')'
end

set @sql = @sql + ' group by e.entity_cd, b.sup_tax_yr'
set @sql = @sql + ' order by e.entity_cd, b.sup_tax_yr'

exec(@sql)

--Insert entities into from payments
set @sql = ' insert into [dbo].[_tcary_entity]'
set @sql = @sql + ' select distinct ' + rtrim(cast(@input_user_id as varchar(10))) + ', entity_cd'
set @sql = @sql + ' from [dbo].[_tcary_payments]'
set @sql = @sql + ' where pacs_user_id = ' + rtrim(cast(@input_user_id as varchar(10)))

exec(@sql)


--Insert entities into from refunds
set @sql = ' insert into [dbo].[_tcary_entity]'
set @sql = @sql + ' select distinct ' + rtrim(cast(@input_user_id as varchar(10))) + ', entity_cd'
set @sql = @sql + ' from [dbo].[_tcary_refunds]'
set @sql = @sql + ' where entity_cd not in
			(
				select entity_cd
				from [dbo].[_tcary_entity]
				where pacs_user_id = ' + rtrim(cast(@input_user_id as varchar(10))) + '
			)'
set @sql = @sql + ' and pacs_user_id = ' + rtrim(cast(@input_user_id as varchar(10)))

exec(@sql)

--Insert totals
set @sql = 'insert into [dbo].[_tcary_totals]
		select e.pacs_user_id,
			e.entity_cd,
			isnull((select sum(total_collected) from [dbo].[_tcary_payments] where entity_cd = e.entity_cd and pacs_user_id = ' + rtrim(cast(@input_user_id as varchar(10))) + '), 0),
			isnull((select sum(refund_amt) from [dbo].[_tcary_refunds] where entity_cd = e.entity_cd and pacs_user_id = ' + rtrim(cast(@input_user_id as varchar(10))) + '), 0),
			0
		from [dbo].[_tcary_entity] as e
		where e.pacs_user_id = ' + rtrim(cast(@input_user_id as varchar(10)))
set @sql = @sql + ' group by e.pacs_user_id, e.entity_cd'

exec(@sql)

update [dbo].[_tcary_totals]
	set total = total_payments - total_refunds
where pacs_user_id = @input_user_id

--Insert grand totals
set @sql = 'insert into [dbo].[_tcary_grand_totals]
		select t.pacs_user_id, sum(t.total_payments), sum(t.total_refunds), sum(t.total_payments - t.total_refunds)
		from [dbo].[_tcary_totals] as t
		where t.pacs_user_id = ' + rtrim(cast(@input_user_id as varchar(10)))
set @sql = @sql + ' group by t.pacs_user_id'

exec(@sql)

GO

