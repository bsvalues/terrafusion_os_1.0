

CREATE PROCEDURE ReportSplitMergePropertyWithExemptions
	@begin_date as datetime = null,
	@end_date as datetime = null,
	@appr_year int = null,
	@report_type char(1) = 'B'

AS

--drop table #split_table_filter
--drop table #split_parent_table
--drop table #split_child_table

declare @doSplit bit
declare @doMerge bit

-- I use these definitions to debug
--declare	@begin_date as datetime
--declare	@end_date as datetime
--declare	@appr_year int
--declare	@report_type char

-- Set bit flags from report type
if @report_type='B'
begin
	select @doSplit = 1
	select @doMerge = 1
end
if @report_type='S'
begin
	select @doSplit = 1
	select @doMerge = 0
end
if @report_type='M'
begin
	select @doSplit = 0
	select @doMerge = 1
end


-- Delete any previous records associated with this SPID
delete from ##split_merge_report_working where session_id=@@SPID
delete from ##split_merge_report_all where session_id=@@SPID

if	@begin_date is null and @end_date is null and @appr_year is null
	return

if	@begin_date is null
	select @begin_date='1-1-1993'
if	@end_date is null
	select	@end_date='1-1-2003'
if	@appr_year is null
	select	@appr_year=2003



-----------------------------------------------------------------------------
-- Add split properties to the table
-----------------------------------------------------------------------------
if @doSplit = 1
begin

-- Select the split from parents involved in a split during specified date range
select 	si.parent_id as prop_id,
	si.split_id,
	si.parent_id,
	si.child_id,
	si.owner,
	sa.split_dt

into 	#split_table_filter

from 	split_into si,
	split_assoc sa,
	prop_supp_assoc psa,
	property_val pv

where 	si.split_id=sa.split_id

and	psa.prop_id=si.parent_id
and   	psa.owner_tax_yr = pv.prop_val_yr
and   	psa.sup_num=pv.sup_num

and 	pv.prop_id=si.parent_id
and 	pv.prop_val_yr = @appr_year
and   	pv.prop_inactive_dt is null

and 	sa.split_dt >= @begin_date
and 	sa.split_dt < (@end_date + 1)
and   
(
	exists (select * from property_exemption pe
	where pe.prop_id = pv.prop_id
	and   pe.sup_num = pv.sup_num
	and   pe.owner_tax_yr = pv.prop_val_yr
	and   pe.exmpt_type_cd = 'HS')
	or   exists (select * from property_exemption pe
	where pe.prop_id = pv.prop_id
	and   pe.sup_num = pv.sup_num
	and   pe.owner_tax_yr = pv.prop_val_yr
	and   pe.exmpt_type_cd = 'OV65')
)

-- Save all parent records in the ##split_merge_report_all
insert into ##split_merge_report_all
(
	session_id,
	prop_id,
	assoc_id,
	parent_id,
	child_id,
	type,
	type_date,
	parent_child_cd
)
select 	@@SPID,
	prop_id,
	split_id,
	parent_id,
	child_id,
	'S',
	split_dt,
	'P'
	
from #split_table_filter
order by prop_id

-- Keep a local temporary table of the parents split_assoc record
-- this will elliminate multiple parent records from multiple split_into 
-- (children records)

select * 
into #split_parent_table
from split_assoc sa 
where exists (select st.prop_id from #split_table_filter st where sa.prop_id=st.prop_id)
order by prop_id

-- Delete duplicate property records, these records will exist if there were multiple
-- splits to the property and therefore, multiple split_assoc records.
-- This algorithm looks for adjacent prop_id's that are equal, the order by
-- clause guarentees equal prop_id's are adjacent.
declare scur cursor
for
   select prop_id,split_id
   from #split_parent_table
   order by prop_id

open scur
declare @index_id int
declare @index_cur_id int
declare @row_id int

select @index_cur_id=null

fetch next from scur into @index_id,@row_id

while (@@FETCH_STATUS <> -1)
begin
   if (@@FETCH_STATUS <> -2)
   begin   
	fetch next from scur into @index_cur_id,@row_id
	if (@@FETCH_STATUS <> -1 and @@FETCH_STATUS <> -2)
	begin
		if @index_cur_id = @index_id
		begin
			delete from #split_parent_table
			where split_id=@row_id
		end
		else
		begin
			select @index_id = @index_cur_id
		end
	end
	
   end

end

close scur
deallocate scur

-- Select the split into involved in a split during specified date range
select 	si.child_id as prop_id,
	si.split_id,
	si.parent_id,
	si.child_id,
	si.owner,
	sa.split_dt

into 	#split_child_table

from 	split_into si,
	split_assoc sa,
	prop_supp_assoc psa,
	property_val pv

where 	si.split_id=sa.split_id

and	psa.prop_id=si.child_id
and   	psa.owner_tax_yr = pv.prop_val_yr
and   	psa.sup_num=pv.sup_num

and 	pv.prop_id=si.child_id
and 	pv.prop_val_yr = @appr_year
and   	pv.prop_inactive_dt is null

and 	sa.split_dt >= @begin_date
and 	sa.split_dt < (@end_date + 1)
and   
(
	exists (select * from property_exemption pe
	where pe.prop_id = pv.prop_id
	and   pe.sup_num = pv.sup_num
	and   pe.owner_tax_yr = pv.prop_val_yr
	and   pe.exmpt_type_cd = 'HS')
	or   exists (select * from property_exemption pe
	where pe.prop_id = pv.prop_id
	and   pe.sup_num = pv.sup_num
	and   pe.owner_tax_yr = pv.prop_val_yr
	and   pe.exmpt_type_cd = 'OV65')
)
and not exists (select prop_id from #split_parent_table where prop_id=si.child_id)


-- Insert the parents into the global ##split_merge_report_working table
insert into ##split_merge_report_working
(
	session_id,
	sup_num,
	prop_val_yr,
	prop_id,
	Type,
	type_date,
	parent_child_cd
)
select 	@@SPID,
	psa.sup_num,
	psa.owner_tax_yr,
	spt.prop_id,
	'S',
	spt.split_dt,
	'P'	

from 	#split_parent_table spt,
	prop_supp_assoc psa,
	property_val pv

where 	psa.prop_id=spt.prop_id
and   	psa.owner_tax_yr = pv.prop_val_yr
and   	psa.sup_num=pv.sup_num

and 	pv.prop_id=spt.prop_id
and 	pv.prop_val_yr = @appr_year

-- Save all child records in the ##split_merge_report_all
insert into ##split_merge_report_all
(
	session_id,
	prop_id,
	assoc_id,
	parent_id,
	child_id,
	type,
	type_date,
	parent_child_cd
)
select 	@@SPID,
	spt.prop_id,
	spt.split_id,
	spt.parent_id,
	spt.child_id,
	'S',
	spt.split_dt,
	'C'
	
from 	#split_child_table spt

-- Insert the children into the global ##split_merge_report_working table
insert into ##split_merge_report_working
(
	session_id,
	sup_num,
	prop_val_yr,
	prop_id,
	Type,
	type_date,
	parent_child_cd
)
select 	@@SPID,
	psa.sup_num,
	psa.owner_tax_yr,
	spt.prop_id,
	'S',
	spt.split_dt,
	'C'	

from 	#split_child_table spt,
	prop_supp_assoc psa,
	property_val pv,
	split_assoc sa

where 	sa.split_id=spt.split_id
and	psa.prop_id=spt.prop_id
and   	psa.owner_tax_yr = pv.prop_val_yr
and   	psa.sup_num=pv.sup_num

and 	pv.prop_id=spt.prop_id
and 	pv.prop_val_yr = @appr_year
--select * from ##split_merge_report_working
end

-----------------------------------------------------------------------------
-- Add merged properties to the table
-----------------------------------------------------------------------------
if @doMerge = 1
begin
-- Select children involved in a merge during specified date range
select 	mf.child_id as prop_id,
	mf.merge_id,
	mf.parent_id,
	mf.child_id,
	mf.owner,
	ma.merge_dt

into 	#merge_table_filter

from 	merge_from mf,
	merge_assoc ma,
	prop_supp_assoc psa,
	property_val pv

where 	mf.merge_id=ma.merge_id

and	psa.prop_id=mf.child_id
and   	psa.owner_tax_yr = pv.prop_val_yr
and   	psa.sup_num=pv.sup_num

and 	pv.prop_id=mf.child_id
and 	pv.prop_val_yr = @appr_year
and   	pv.prop_inactive_dt is null

and 	ma.merge_dt >= @begin_date
and 	ma.merge_dt < (@end_date + 1)
and   
(
	exists (select * from property_exemption pe
	where pe.prop_id = pv.prop_id
	and   pe.sup_num = pv.sup_num
	and   pe.owner_tax_yr = pv.prop_val_yr
	and   pe.exmpt_type_cd = 'HS')
	or   exists (select * from property_exemption pe
	where pe.prop_id = pv.prop_id
	and   pe.sup_num = pv.sup_num
	and   pe.owner_tax_yr = pv.prop_val_yr
	and   pe.exmpt_type_cd = 'OV65')
)

-- Save all child records in the ##split_merge_report_all
insert into ##split_merge_report_all
(
	session_id,
	prop_id,
	assoc_id,
	parent_id,
	child_id,
	type,
	type_date,
	parent_child_cd
)
select 	@@SPID,
	mtf.prop_id,
	mtf.merge_id,
	mtf.parent_id,
	mtf.child_id,
	'M',
	mtf.merge_dt,
	'C'
	
from 	#merge_table_filter mtf

-- Keep the merged children's merge_assoc record in a temporary table
select * 
into #merge_child_table
from merge_assoc ma 
where exists (select prop_id from #merge_table_filter mt where ma.prop_id=mt.prop_id)
order by prop_id

-- Delete duplicate property records, these records will exist if there were multiple
-- merges to the property and therefore, multiple merge_assoc records
-- This algorithm looks for adjacent prop_id's that are equal, the order by
-- clause guarentees equal porp_id's are adjacent.
declare mcur cursor
for
   select prop_id,merge_id
   from #merge_child_table
   order by prop_id

open mcur

select @index_cur_id=null

fetch next from mcur into @index_id,@row_id

while (@@FETCH_STATUS <> -1)
begin
   if (@@FETCH_STATUS <> -2)
   begin   
	fetch next from mcur into @index_cur_id,@row_id
	if (@@FETCH_STATUS <> -1 and @@FETCH_STATUS <> -2)
	begin
		if @index_cur_id = @index_id
		begin

			delete from #merge_child_table
			where merge_id=@row_id
		end
		else
		begin
			select @index_id = @index_cur_id
		end
	end
	
   end

end

close mcur
deallocate mcur

-- Select the merged into parents involved in a merge during specified date range
select 	mf.parent_id as prop_id,
	mf.merge_id,
	mf.parent_id,
	mf.child_id,
	mf.owner,
	ma.merge_dt

into 	#merge_parent_table

from 	merge_from mf,
	merge_assoc ma,
	prop_supp_assoc psa,
	property_val pv

where 	mf.merge_id=ma.merge_id

and	psa.prop_id=mf.parent_id
and   	psa.owner_tax_yr = pv.prop_val_yr
and   	psa.sup_num=pv.sup_num

and 	pv.prop_id=mf.parent_id
and 	pv.prop_val_yr = @appr_year
and   	pv.prop_inactive_dt is null

and 	ma.merge_dt >= @begin_date
and 	ma.merge_dt < (@end_date + 1)
and   
(
	exists (select * from property_exemption pe
	where pe.prop_id = pv.prop_id
	and   pe.sup_num = pv.sup_num
	and   pe.owner_tax_yr = pv.prop_val_yr
	and   pe.exmpt_type_cd = 'HS')
	or   exists (select * from property_exemption pe
	where pe.prop_id = pv.prop_id
	and   pe.sup_num = pv.sup_num
	and   pe.owner_tax_yr = pv.prop_val_yr
	and   pe.exmpt_type_cd = 'OV65')
)
and not exists (select prop_id from #merge_child_table where prop_id=mf.parent_id)

-- Save all child records in the ##split_merge_report_all
insert into ##split_merge_report_all
(
	session_id,
	prop_id,
	assoc_id,
	parent_id,
	child_id,
	type,
	type_date,
	parent_child_cd
)
select 	@@SPID,
	mpt.prop_id,
	mpt.merge_id,
	mpt.parent_id,
	mpt.child_id,
	'M',
	mpt.merge_dt,
	'P'
	
from 	#merge_parent_table mpt

-- Insert the children into the global ##split_merge_report_working table
insert into ##split_merge_report_working
(
	session_id,
	sup_num,
	prop_val_yr,
	prop_id,
	Type,
	type_date,
	parent_child_cd
)
select 	@@SPID,
	psa.sup_num,
	psa.owner_tax_yr,
	mct.prop_id,
	'M',
	mct.merge_dt,
	'C'	

from 	#merge_child_table mct,
	prop_supp_assoc psa,
	property_val pv

where 	psa.prop_id=mct.prop_id
and   	psa.owner_tax_yr = pv.prop_val_yr
and   	psa.sup_num=pv.sup_num

and 	pv.prop_id=mct.prop_id
and 	pv.prop_val_yr = @appr_year
and 	not exists (select prop_id from ##split_merge_report_working 
	where mct.prop_id=##split_merge_report_working.prop_id and session_id = @@spid)

-- Insert the parents into the global ##split_merge_report_working table
insert into ##split_merge_report_working
(
	session_id,
	sup_num,
	prop_val_yr,
	prop_id,
	Type,
	type_date,
	parent_child_cd
)
select 	@@SPID,
	psa.sup_num,
	psa.owner_tax_yr,
	mpt.prop_id,
	'M',
	mpt.merge_dt,
	'P'	

from 	#merge_parent_table mpt,
	prop_supp_assoc psa,
	property_val pv,
	merge_assoc ma

where 	ma.merge_id=mpt.merge_id
and	psa.prop_id=mpt.prop_id
and   	psa.owner_tax_yr = pv.prop_val_yr
and   	psa.sup_num=pv.sup_num

and 	pv.prop_id=mpt.prop_id
and 	pv.prop_val_yr = @appr_year
and 	not exists (select prop_id from ##split_merge_report_working 
	where mpt.prop_id=##split_merge_report_working.prop_id and session_id = @@spid)
end

GO

