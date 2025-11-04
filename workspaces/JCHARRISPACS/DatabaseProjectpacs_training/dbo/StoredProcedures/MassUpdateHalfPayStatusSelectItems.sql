
create procedure dbo.MassUpdateHalfPayStatusSelectItems
	@run_id	int
as

-- DO 95922 - Mass Update Half Pay Status
-- 
-- Select bills and fees matching all of a run's criteria and store them in [mass_update_half_pay_run_items].
-- select the count of items found.

set nocount on

-- remove temp tables if they exist
if object_id('tempdb..#prop_ids') is not null
	drop table #prop_ids
if object_id('tempdb..#billfee') is not null
	drop table #billfee
if object_id('tempdb..#years') is not null
	drop table #years
if object_id('tempdb..#districts') is not null
	drop table #districts
if object_id('tempdb..#agencies') is not null
	drop table #agencies
if object_id('tempdb..#feetypes') is not null
	drop table #feetypes

-- select run data
declare @query varchar(max)
declare @query_joins varchar(max)
declare @query_where varchar(max)
declare @selection_type char(2)
declare @convert_to_half_pay bit
declare @exclude_paid bit
declare @exclude_rollback bit
declare @years varchar(max)
declare @district_list varchar(max)
declare @agency_list varchar(max)
declare @fee_type_list varchar(max)
declare @district_filter bit
declare @agency_filter bit
declare @fee_type_filter bit

set @query = ''

select 
	@selection_type = selection_type,
	@convert_to_half_pay = convert_to_half_pay,
	@exclude_paid = exclude_paid,
	@exclude_rollback = exclude_rollback,
	@years = years,
	@district_list = district_list,
	@agency_list = agency_list,
	@fee_type_list = fee_type_list
	
from mass_update_half_pay_run
where run_id = @run_id

declare @nl varchar(2)
set @nl = char(13) + char(10)

-- temp tables
select id as prop_id
into #prop_ids
from mass_update_half_pay_run_ids
where run_id = @run_id
and id_type = 'P'
create clustered index temp_prop_ids_index on #prop_ids (prop_id)

select id
into #billfee
from mass_update_half_pay_run_ids
where run_id = @run_id
and id_type = 'B'
create clustered index temp_billfee_index on #billfee (id)

if @selection_type = 'C'
begin
	-- temp tables for Criteria runs only
	select convert(numeric(4,0), ID) year 
	into #years
	from [dbo].[fn_ReturnTableFromCommaSepValues](@years)
	where isnumeric(ID) = 1
	create clustered index temp_year_index on #years (year)

	select ID code
	into #districts
	from dbo.fn_ReturnTableFromCommaSepValues (@district_list)
	create clustered index temp_district_index on #districts (code)

	select ID code
	into #agencies
	from dbo.fn_ReturnTableFromCommaSepValues (@agency_list)
	create clustered index temp_agency_index on #agencies (code)

	select ID code
	into #feetypes
	from dbo.fn_ReturnTableFromCommaSepValues (@fee_type_list)
	create clustered index temp_feetypes_index on #feetypes (code)
end


-- BILL query start
set @query_joins = '
insert mass_update_half_pay_run_items (run_id, trans_group_id)
select ' + convert(varchar, @run_id) + ' run_id, b.bill_id trans_group_id
from bill b
join property p
	on p.prop_id = b.prop_id
'

-- add joins
if @selection_type in ('C', 'PL', 'PQ')
	set @query_joins = @query_joins + 'join #prop_ids pid on pid.prop_id = p.prop_id ' + @nl -- property ID filter

if @selection_type in ('BL', 'BQ')
	set @query_joins = @query_joins + 'join #billfee bf on bf.id = b.bill_id ' + @nl -- bill ID filter


-- add where clauses
if (@convert_to_half_pay = 1) -- select bills that don't have the new half/full status already
	set @query_where = 'where b.payment_status_type_cd = ''FULL'' ' + @nl + 'and b.current_amount_due > 0.01' + @nl
else
	set @query_where = 'where b.payment_status_type_cd = ''HALF'' ' + @nl + 'and b.current_amount_due > 0.0' + @nl

if (@exclude_paid = 1)
	set @query_where = @query_where + 'and b.current_amount_due > b.amount_paid' + @nl -- exclude unpaid bills
if (@exclude_rollback = 1)
	set @query_where = @query_where + 'and not b.bill_type in (''R'',''RR'')' + @nl -- exclude rollback bills


if @selection_type <> 'C'
begin
	-- for non-Criteria runs, those are all the parameters
	set @query = @query_joins + @query_where
end

else begin
	-- parameters for Criteria runs only
	set @query_joins = @query_joins + 'join #years y on y.year = b.year ' + @nl -- year filter

	-- filtering by tax district and/or agency?
	set @district_filter = case when @district_list is null or ltrim(rtrim(@district_list)) in ('', 'ALL', '<All>') then 0 else 1 end
	set @agency_filter = case when @agency_list is null or ltrim(rtrim(@agency_list)) in ('', 'ALL', '<All>') then 0 else 1 end

	if @district_filter = 1 or @agency_filter = 1
	begin
		-- create separate similar queries for district and agency
		if @district_filter = 1
		begin
			set @query = @query + @query_joins + '
			join levy_bill lb on lb.bill_id = b.bill_id
			join tax_district td on td.tax_district_id = lb.tax_district_id
			' + @query_where + 'and td.tax_district_cd in (select code from #districts)' + @nl
		end

		if @agency_filter = 1
		begin
			set @query = @query + @query_joins + '
			join assessment_bill ab on ab.bill_id = b.bill_id
			join special_assessment_agency saa on saa.agency_id = ab.agency_id	
			' + @query_where + 'and saa.assessment_cd in (select code from #agencies)' + @nl
		end
	end

	else begin
		-- criteria run with no district or agency filters
		set @query = @query_joins + @query_where
	end

end


-- FEE query start
set @query_joins = '
insert mass_update_half_pay_run_items (run_id, trans_group_id)
select ' + convert(varchar, @run_id) + ' run_id, f.fee_id trans_group_id
from fee f
join fee_property_vw fpv
	on fpv.fee_id = f.fee_id
join property p
	on p.prop_id = fpv.prop_id
'

-- add joins
if @selection_type in ('C', 'PL', 'PQ')
	set @query_joins = @query_joins + 'join #prop_ids pid on pid.prop_id = p.prop_id ' + @nl -- property ID filter

if @selection_type in ('BL', 'BQ')
	set @query_joins = @query_joins + 'join #billfee bf on bf.id = f.fee_id ' + @nl -- fee ID filter


-- add where clauses
if (@convert_to_half_pay = 1) -- select fees that don't have the new half/full status already
	set @query_where = 'where f.payment_status_type_cd = ''FULL'' ' + @nl + 'and f.current_amount_due > 0.01' + @nl
else
	set @query_where = 'where f.payment_status_type_cd = ''HALF'' ' + @nl + 'and f.current_amount_due > 0.0' + @nl

if (@exclude_paid = 1)
	set @query_where = @query_where + 'and f.current_amount_due > f.amount_paid' + @nl -- exclude unpaid bills


if @selection_type = 'C'
begin
	-- parameters for Criteria runs only
	set @query_joins = @query_joins + 'join #years y on y.year = f.year ' + @nl -- year filter

	-- filtering by fee type code?
	set @fee_type_filter = case when @fee_type_list is null or ltrim(rtrim(@fee_type_list)) in ('', 'ALL', '<All>') then 0 else 1 end

	if @fee_type_filter = 1
		set @query_where = @query_where + 'and f.fee_type_cd in (select code from #feetypes)' + @nl
end

-- add the fee query
set @query = @query + @query_joins + @query_where



-- for testing
--print @query

-- execute the queries to select the bills and fees
delete mass_update_half_pay_run_items where run_id = @run_id
exec (@query)

-- gather the original payment amounts and dates
update mui -- bill H1
set orig_h1 = bpd1.amount_due, orig_h1_date = bpd1.due_date
from mass_update_half_pay_run_items mui
join bill_payments_due bpd1
	on bpd1.bill_id = mui.trans_group_id
	and bpd1.bill_payment_id = 0
where mui.run_id = @run_id

update mui -- bill H2
set orig_h2 = bpd2.amount_due, orig_h2_date = bpd2.due_date
from mass_update_half_pay_run_items mui
join bill_payments_due bpd2
	on bpd2.bill_id = mui.trans_group_id
	and bpd2.bill_payment_id = 1
where mui.run_id = @run_id

update mui -- fee H1
set orig_h1 = fpd1.amount_due, orig_h1_date = fpd1.due_date
from mass_update_half_pay_run_items mui
join fee_payments_due fpd1
	on fpd1.fee_id = mui.trans_group_id
	and fpd1.fee_payment_id = 0
where mui.run_id = @run_id

update mui -- fee H2
set orig_h2 = fpd2.amount_due, orig_h2_date = fpd2.due_date
from mass_update_half_pay_run_items mui
join fee_payments_due fpd2
	on fpd2.fee_id = mui.trans_group_id
	and fpd2.fee_payment_id = 1
where mui.run_id = @run_id


-- select the count of items for the caller
select count(*) item_count 
from mass_update_half_pay_run_items
where run_id = @run_id

GO

