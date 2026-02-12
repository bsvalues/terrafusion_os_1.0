
CREATE PROCEDURE UpdateStatementItemsDueDate
   @year numeric(4,0),
   @prop_id int,
   @statement_id int,
   @effective_due_date datetime,
   @set_h2_due_date bit = 0,
   @effective_due_date2 datetime = ''
   
AS

if exists(select id from tempdb..sysobjects where id = object_id('tempdb..#tmpStmtUpdate'))
begin
	drop table #tmpStmtUpdate
end	

if exists(select id from tempdb..sysobjects where id = object_id('tempdb..#tmpRollbackIDs'))
begin
	drop table #tmpRollbackIDs
end	

create table #tmpStmtUpdate (year numeric(4, 0), prop_id int, statement_id int)
create index #ndx_year_prop_id_statement_id on #tmpStmtUpdate (year, prop_id, statement_id)

create table #tmpRollbackIDs (rollback_id int)

insert into #tmpStmtUpdate 
values (@year, @prop_id, @statement_id)

insert into #tmpRollbackIDs
	select distinct rollback_id 
	from (	select rollback_id
			from bill with (nolock)
			where year = @year
			and prop_id = @prop_id
			and isNull(statement_id, 0) = @statement_id 
			and isNull(case when bill_type = 'RR' then 0 else rollback_id end, 0) > 0

			union all

			select f.rollback_id
			from fee f with (nolock)
			join fee_property_vw fpv with (nolock) 
			on f.fee_id = fpv.fee_id
			where f.year = @year 
			and fpv.prop_id = @prop_id
			and isNull(f.statement_id, 0) = @statement_id
			and isNull(f.rollback_id, 0) > 0 )tmp


insert into #tmpStmtUpdate 
select distinct year, prop_id, statement_id
	from (	select year, prop_id, statement_id
			from bill b with (nolock)
			join #tmpRollbackIDs rb
			on rb.rollback_id = isNull(case when bill_type = 'RR' then 0 else b.rollback_id end, 0)
			where isNull(statement_id, 0) > 0
			
			union all
			
			select f.year, fpv.prop_id, f.statement_id
			from fee f with (nolock)
			join fee_property_vw fpv with (nolock) 
			on f.fee_id = fpv.fee_id
			join #tmpRollbackIDs rb 
			on rb.rollback_id = isNull(f.rollback_id, 0)) tmp


update b 
set effective_due_date = @effective_due_date
from bill b with (nolock)
join #tmpStmtUpdate rb on rb.year = b.year
and rb.prop_id = b.prop_id
and rb.statement_id = b.statement_id

update bpd
set due_date = @effective_due_date 
from bill_payments_due bpd with (nolock)
join bill b with (nolock)
on bpd.bill_id = b.bill_id
join #tmpStmtUpdate rb on rb.year = b.year
and rb.prop_id = b.prop_id
and rb.statement_id = b.statement_id
where bpd.bill_payment_id = 0

if @set_h2_due_date = 1
begin
	update bpd
	set due_date = @effective_due_date2 
	from bill_payments_due bpd with (nolock)
	join bill b with (nolock)
	on bpd.bill_id = b.bill_id
	join #tmpStmtUpdate rb on rb.year = b.year
	and rb.prop_id = b.prop_id
	and rb.statement_id = b.statement_id
	where bpd.bill_payment_id = 1
end

update f
set effective_due_date = @effective_due_date
from fee f with (nolock)
join fee_property_vw fpv with (nolock)
on fpv.fee_id = f.fee_id
join #tmpStmtUpdate rb on rb.year = f.year
and rb.prop_id = fpv.prop_id
and rb.statement_id = f.statement_id

update fpd
set due_date = @effective_due_date 
from fee_payments_due fpd with (nolock)
join fee f with (nolock)
on fpd.fee_id = f.fee_id
join fee_property_vw fpv with (nolock)
on fpv.fee_id = f.fee_id
join #tmpStmtUpdate rb on rb.year = f.year
and rb.prop_id = fpv.prop_id
and rb.statement_id = f.statement_id
where fpd.fee_payment_id = 0

if @set_h2_due_date = 1
begin
	update fpd
set due_date = @effective_due_date2
from fee_payments_due fpd with (nolock)
join fee f with (nolock)
on fpd.fee_id = f.fee_id
join fee_property_vw fpv with (nolock)
on fpv.fee_id = f.fee_id
join #tmpStmtUpdate rb on rb.year = f.year
and rb.prop_id = fpv.prop_id
and rb.statement_id = f.statement_id
where fpd.fee_payment_id = 1
end

GO

