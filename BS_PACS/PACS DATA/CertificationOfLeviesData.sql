
CREATE PROCEDURE CertificationOfLeviesData
	@datasetID int
AS

declare 
@return_message varchar(255),
@taxDistrictID int,
@levyCode varchar(10),
@groupNumber int,
@isLinked bit,
@isParent bit,
@prevTaxDistrictID int,
@prevLevyDesc varchar(50),
@levyDesc varchar(50),
@prevSingle bit,
@prevLinked bit

set nocount on

if	not exists(	select * 
				from ##CertOfLeviesReport
				where dataset_id = @datasetID) 
	or 
	not exists(	select * 
				from ##CertOfLeviesReportGroup
				where dataset_id = @datasetID) 
	begin
		set @return_message = 'Missing temporary tables.'
		goto quit
	end


--Determine the grouping for the levies in each tax district
declare groupData cursor fast_forward
for select tax_district_id, levy_cd, is_linked, is_parent, parent_levy_description
	from ##CertOfLeviesReport 
	where dataset_id = @datasetID
	order by tax_district_id, parent_levy_description, is_linked
open groupData 
fetch next from groupData into @taxDistrictID, @levyCode, @isLinked, @isParent, @levyDesc

set @prevTaxDistrictID = null
set @groupNumber = 1

while @@fetch_status = 0
begin
	if(@prevTaxDistrictID = null)
	begin 
		update ##CertOfLeviesReport 
		set group_number = @groupNumber
		where tax_district_id = @taxDistrictID
		and levy_cd = @levyCode
		and dataset_id = @datasetID

		set @prevLevyDesc = case when @isLinked = 0 and @isParent = 0 then null else @levyDesc end
		set @prevTaxDistrictID = @taxDistrictID
		set @prevLinked = @isLinked
		set @prevSingle = case when @isLinked = 0 and @isParent = 0 then 1 else 0 end
	end 
	else 
	begin
		if(@prevTaxDistrictID <>  @taxDistrictID)
		begin
			set @prevLinked = 0
			set @prevLevyDesc = @levyDesc
			set @prevTaxDistrictID =  @taxDistrictID
			set @groupNumber = 1
		end

		if ((@prevLinked = 1 and @isLinked = 0) or (isNull(@prevLevyDesc, @levyDesc) <> @levyDesc) or
			(@prevLinked = 1 and @isParent = 1))
		begin
			if (select count(*) from ##CertOfLeviesReport
				where dataset_id = @datasetID
					and tax_district_id =  @taxDistrictID
					and group_number = @groupNumber) > 1 
			begin
				set @groupNumber = @groupNumber + 1	
			end
		end
		
		update ##CertOfLeviesReport 
		set group_number = @groupNumber
		where tax_district_id =  @taxDistrictID
		and levy_cd = @levyCode
		and dataset_id = @datasetID

		set @prevLinked = @isLinked
		set @prevLevyDesc = case when @isLinked = 0 and @isParent = 0 then null else @levyDesc end
		set @prevTaxDistrictID = @taxDistrictID
		set @prevSingle = case when @isLinked = 0 and @isParent = 0 then 1 else 0 end
		
	end
	fetch next from groupData into @taxDistrictID, @levyCode, @isLinked, @isParent, @levyDesc
end
close groupData
deallocate groupData


--Determine the regular taxable values to summarize per group and tax district
declare 
@taxableAV numeric(16, 2),
@timberAV numeric(16, 2),
@voted bit,
@timberCode varchar(10)

declare districtData cursor fast_forward
for select distinct tax_district_id, max(taxable_value)
	from ##CertOfLeviesReport 
	where dataset_id = @datasetID
	and voted = 0
	group by tax_district_id
	order by tax_district_id

open districtData 
fetch next from districtData into @taxDistrictID, @taxableAV
while @@fetch_status = 0
begin
	set @levyCode = null

	--Set the levy code 
	select top 1 @levyCode = levy_cd
		from ##CertOfLeviesReport
		where tax_district_id = @taxDistrictID
			and dataset_id = @datasetID
			and taxable_value = @taxableAV
			and summarize_av = 0
			and voted = 0
			
	--Check that the value has not been used from any group in the tax district
	if @taxableAV > 0 and not exists (select * 
				from ##CertOfLeviesReport
				where dataset_id = @datasetID and
					tax_district_id = @taxDistrictID and
					taxable_value = @taxableAV and
					voted = 0 and
					summarize_av = 1)
	begin
		update ##CertOfLeviesReportGroup
		set summary_assessed_value = summary_assessed_value + @taxableAV
		where tax_district_id = @taxDistrictID
		and dataset_id = @datasetID
		
		update ##CertOfLeviesReport
		set summarize_av = 1
		where tax_district_id = @taxDistrictID
			and levy_cd = @levyCode
			and dataset_id = @datasetID
	end
fetch next from districtData into @taxDistrictID, @taxableAV
end	
close districtData
deallocate districtData


--Determine the excess taxable values to summarize per group and tax district
declare districtData cursor fast_forward
for select distinct x.tax_district_id, max(x.taxable_value), x.group_number
	from ##CertOfLeviesReport x
	join levy_exemption le (nolock)
	on le.levy_cd = x.levy_cd
		and le.year = x.year
		and le.exmpt_type_cd = 'SNR/DSBL' 
	where x.dataset_id = @datasetID
	and x.voted = 1
	group by x.tax_district_id, x.group_number
	order by x.tax_district_id


open districtData 
fetch next from districtData into @taxDistrictID, @taxableAV, @groupNumber
while @@fetch_status = 0
begin
	set @levyCode = null

	--Set the levy code 
	select top 1 @levyCode = levy_cd
		from ##CertOfLeviesReport
		where tax_district_id = @taxDistrictID
			and dataset_id = @datasetID
			and taxable_value = @taxableAV
			and summarize_av = 0
			and voted = 1
			and group_number = @groupNumber
			
	--Check that the value has not been used from any group in the tax district
	if @taxableAV > 0 and not exists (select * 
				from ##CertOfLeviesReport
				where dataset_id = @datasetID and
					tax_district_id = @taxDistrictID and
					taxable_value = @taxableAV and
					voted = 1 and
					summarize_av = 1)
	begin
		update ##CertOfLeviesReportGroup
		set summary_excess_assessed_value = summary_excess_assessed_value + @taxableAV
		where tax_district_id = @taxDistrictID
		and dataset_id = @datasetID
		
		update ##CertOfLeviesReport
		set summarize_av = 1
		where tax_district_id = @taxDistrictID
			and levy_cd = @levyCode
			and dataset_id = @datasetID
	end
fetch next from districtData into @taxDistrictID, @taxableAV, @groupNumber
end	
close districtData
deallocate districtData


--Timber
declare districtData cursor fast_forward
for select distinct tax_district_id, group_number, tav_value, voted, timber_assessed_cd
	from ##CertOfLeviesReport where dataset_id = @datasetID
	order by tax_district_id

open districtData 
fetch next from districtData into @taxDistrictID, @groupNumber, @timberAV, @voted, @timberCode
while @@fetch_status = 0
begin
	set @levyCode = null

	--Set the levy code and voted values
	select top 1 @levyCode = levy_cd
		from ##CertOfLeviesReport
		where tax_district_id = @taxDistrictID
			and dataset_id = @datasetID
			and tav_value = @timberAV
			and summarize_tav = 0
			and group_number = @groupNumber
			and timber_assessed_cd = @timberCode
			and voted = @voted

	--Check that the value has not been used from any group in the tax district
	if  @timberAV > 0 and not exists (select * 
				from ##CertOfLeviesReport
				where dataset_id = @datasetID and
					tax_district_id = @taxDistrictID and
					tav_value = @timberAV and
					voted = @voted and
					summarize_tav = 1 and
					timber_assessed_cd = @timberCode)
	begin
		if (@timberCode = 'HALF/ROLL')
		begin
			update ##CertOfLeviesReportGroup
			set summary_half_tav_value = summary_half_tav_value + @timberAV
			where tax_district_id = @taxDistrictID
				and dataset_id = @datasetID
		end

		else if (@timberCode = 'Full')
		begin
			update ##CertOfLeviesReportGroup
			set summary_full_tav_value = summary_full_tav_value + @timberAV
			where tax_district_id = @taxDistrictID
				and dataset_id = @datasetID
		end
		
		update ##CertOfLeviesReport
		set summarize_tav = 1
		where tax_district_id = @taxDistrictID
			and levy_cd = @levyCode
			and dataset_id = @datasetID
			and group_number = @groupNumber
			and voted = @voted
			and timber_assessed_cd = @timberCode
	end
fetch next from districtData into @taxDistrictID, @groupNumber, @timberAV, @voted, @timberCode
end	
close districtData
deallocate districtData


-- make a temporary list of levy rates that should be counted in the total
if object_id('tempdb..#include_levy_rates') is not null
	drop table #include_levy_rates

select distinct tax_district_id, levy_cd
into #include_levy_rates
from #CertOfLeviesReport
where dataset_id = @datasetID
and is_tif_spon = 0

create index idx_include_levy_rates on #include_levy_rates (tax_district_id, levy_cd)


update ##CertOfLeviesReportGroup set 

summary_assessed_rate = isnull((
	select sum(levy_rate) from (
		select distinct grp.year, grp.tax_district_id, grp.levy_cd, isnull(grp.levy_rate, 0) levy_rate
		from ##CertOfLeviesReport grp
		join #include_levy_rates ilr
			on ilr.tax_district_id = grp.tax_district_id
			and ilr.levy_cd = grp.levy_cd
		join levy l
			on grp.year = l.year
			and grp.levy_cd = l.levy_cd
		where grp.dataset_id = rpt.dataset_id
		and grp.tax_district_id = rpt.tax_district_id
		and (grp.voted = 0 or l.levy_type_cd = 'EMS')
	)x 
), 0),

summary_excess_rate = isnull((
	select sum(levy_rate) from (
		select distinct grp.year, grp.tax_district_id, grp.levy_cd, isnull(grp.levy_rate, 0) levy_rate
		from ##CertOfLeviesReport grp
		join #include_levy_rates ilr
			on ilr.tax_district_id = grp.tax_district_id
			and ilr.levy_cd = grp.levy_cd
		join levy l
			on grp.year = l.year
			and grp.levy_cd = l.levy_cd
		where grp.dataset_id = rpt.dataset_id
		and grp.tax_district_id = rpt.tax_district_id
		and (grp.voted = 1 and l.levy_type_cd <> 'EMS')
	)x 
), 0),

summary_half_tav_rate = isnull((
	select sum(levy_rate) from (
		select distinct grp.year, grp.tax_district_id, grp.levy_cd, isnull(grp.levy_rate, 0) levy_rate
		from ##CertOfLeviesReport grp
		join #include_levy_rates ilr
			on ilr.tax_district_id = grp.tax_district_id
			and ilr.levy_cd = grp.levy_cd
		where grp.dataset_id = rpt.dataset_id
		and grp.tax_district_id = rpt.tax_district_id	
		and grp.timber_Assessed_cd = 'HALF/ROLL'
		and grp.tav_value > 0
	)x
), 0),

summary_full_tav_rate = isnull((
	select sum(levy_rate) from (
		select distinct grp.year, grp.tax_district_id, grp.levy_cd, isnull(grp.levy_rate, 0) levy_rate
		from ##CertOfLeviesReport grp
		join #include_levy_rates ilr
			on ilr.tax_district_id = grp.tax_district_id
			and ilr.levy_cd = grp.levy_cd
		where grp.dataset_id = rpt.dataset_id
		and grp.tax_district_id = rpt.tax_district_id	
		and grp.timber_Assessed_cd = 'Full'
		and grp.tav_value > 0
	)x
), 0),

[summary_assessed_taxes] = isNull((	select sum(isNull(grp.total_taxes, 0))
								from ##CertOfLeviesReport as grp
								join levy as l
								on grp.year = l.year and
								grp.levy_cd = l.levy_cd
								where grp.dataset_id = @datasetID
								and grp.tax_district_id = rpt.tax_district_id	
								and (grp.voted = 0 or l.levy_type_cd = 'EMS')), 0),


[summary_excess_taxes] = isNull((	select sum(isNull(grp.total_taxes, 0))
								from ##CertOfLeviesReport as grp
								join levy as l
								on grp.year = l.year and
								grp.levy_cd = l.levy_cd
								where grp.dataset_id = @datasetID
								and grp.tax_district_id = rpt.tax_district_id	
								and (grp.voted = 1 and l.levy_type_cd <> 'EMS')), 0),


[summary_full_tav_taxes] = isNull((	select sum(isNull(tav_total_taxes, 0))
								from ##CertOfLeviesReport as grp
								where grp.dataset_id = @datasetID
								and grp.tax_district_id = rpt.tax_district_id	
								and grp.timber_Assessed_cd = 'Full'), 0),


[summary_half_tav_taxes] = isNull((	select sum(isNull(tav_total_taxes, 0))
								from ##CertOfLeviesReport as grp
								where grp.dataset_id = @datasetID
								and grp.tax_district_id = rpt.tax_district_id	
								and grp.timber_Assessed_cd = 'HALF/ROLL'), 0)

from ##CertOfLeviesReportGroup as rpt
where rpt.dataset_id = @datasetID

-- remove temp table
drop table #include_levy_rates


insert into ##CertOfLeviesReportGroupCode
select dataset_id, tax_district_type_cd, 
	sum(summary_assessed_value),
	sum(summary_excess_assessed_value),
	sum(summary_half_tav_value),
	sum(summary_full_tav_value),
	sum(summary_assessed_rate),
	sum(summary_excess_rate),
	sum(summary_half_tav_rate),
	sum(summary_full_tav_rate),
	sum(summary_assessed_taxes),
	sum(summary_excess_taxes),
	sum(summary_half_tav_taxes),
	sum(summary_full_tav_taxes)
from ##CertOfLeviesReportGroup
	where dataset_id = @datasetID
group by tax_district_type_cd, dataset_id

quit:
	select @return_message as return_message
	set nocount off

GO

