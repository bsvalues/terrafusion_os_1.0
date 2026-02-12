
CREATE procedure [dbo].[CopyStatutoryLimitDetails]
	@source_levy_cert_run_id int,
	@dest_levy_cert_run_id int,
	@source_year numeric(4),
	@dest_year numeric(4)
as

--First, delete the existing reduction levies associated with the destination run 
delete from [dbo].[levy_cert_stat_limit_reduction_assoc]
where levy_cert_run_id = @dest_levy_cert_run_id
	and [year] = @dest_year


--Then, insert the reduction levies that exist for the source run for the destination run
--The reduction levy cannot be a linked levy for the destination year
--The reduction levy cannot have a Statutory levy limit for the destination year
--The reduction levy cannot be selected by multiple levies
--The reduction levy must exist in the source levy run

insert into	[dbo].[levy_cert_stat_limit_reduction_assoc]
	(levy_cert_run_id ,[year] ,tax_district_id ,levy_cd ,reduction_levy_cd ,reduction_tax_district_id)     
select
	@dest_levy_cert_run_id, @dest_year, sourceTable.[tax_district_id], sourceTable.[levy_cd], sourceTable.[reduction_levy_cd], 
	sourceTable.[reduction_tax_district_id]
from [dbo].[levy_cert_stat_limit_reduction_assoc] as sourceTable with (nolock)
join levy_cert_run_detail as lcrd with(nolock)
	on lcrd.tax_district_id = sourceTable.tax_district_id
	and lcrd.levy_cd = sourceTable.levy_cd
where lcrd.levy_cert_run_id = @dest_levy_cert_run_id
	and lcrd.[year] = @dest_year
	and sourceTable.levy_cert_run_id = @source_levy_cert_run_id
	and sourceTable.year = @source_year
	and sourceTable.reduction_levy_cd not in (select reduction.reduction_levy_cd 
							from levy_cert_stat_limit_reduction_assoc as reduction with (nolock)
							where reduction.reduction_levy_cd = sourceTable.reduction_levy_cd
							and reduction.year = @dest_year
							and reduction.levy_cert_run_id = @dest_levy_cert_run_id)
	and sourceTable.reduction_levy_cd in (select stat.levy_cd from levy_cert_run_detail as stat
							where stat.levy_cert_run_id = @dest_levy_cert_run_id
							and stat.[year] = @dest_year
							and stat.levy_cd = sourceTable.reduction_levy_cd)
	and sourceTable.levy_cd in (select stat.levy_cd from levy_cert_run_detail as stat
							where stat.levy_cert_run_id = @dest_levy_cert_run_id
							and stat.[year] = @dest_year
							and stat.levy_cd = sourceTable.levy_cd)



--Lastly, update the statutory limit detail records using the source run's data
--The levy must exist in the destination levy run.

-- update the linked levy rate
update levy_cert_stat_limit_detail set
	linked_levy_rate = case when isnull(lcrd_linked.final_levy_rate, 0) >= isnull(lcrd_linked.final_senior_levy_rate, 0)
		then lcrd_linked.final_levy_rate else lcrd_linked.final_senior_levy_rate end
from levy_cert_stat_limit_detail
join levy_cert_run_detail as lcrd on
		lcrd.levy_cert_run_id	= levy_cert_stat_limit_detail.levy_cert_run_id
	and lcrd.[year]				= levy_cert_stat_limit_detail.[year]
	and lcrd.tax_district_id	= levy_cert_stat_limit_detail.tax_district_id
	and lcrd.levy_cd			= levy_cert_stat_limit_detail.levy_cd
join levy_link as ll on
		lcrd.[year]				= ll.[year] 
	and lcrd.tax_district_id	= ll.tax_district_id 
	and lcrd.levy_cd			= ll.levy_cd
join levy_cert_run_detail as lcrd_linked on
		lcrd_linked.[year]				= ll.[year] 
	and lcrd_linked.levy_cert_run_id	= lcrd.levy_cert_run_id
	and lcrd_linked.tax_district_id		= ll.tax_district_id 
	and lcrd_linked.levy_cd				= ll.levy_cd_linked
where	levy_cert_stat_limit_detail.levy_cert_run_id = @dest_levy_cert_run_id
	and levy_cert_stat_limit_detail.[year] = @dest_year



update levy_cert_stat_limit_detail
set
	statutory_limit = isnull(src.statutory_limit, 0),
	calculated_limit = 
		case 
			when src.statutory_limit is null then 0
			else 
				src.statutory_limit + isnull(src.linked_levy_rate, 0) - 
					(select sum(case when isnull(det.final_levy_rate, 0) >= isnull(det.final_senior_levy_rate, 0)
						then isnull(det.final_levy_rate, 0) else isnull(det.final_senior_levy_rate, 0) end)
					from [levy_cert_stat_limit_reduction_assoc] as reduction
					left join levy_cert_run_detail det
						on reduction.reduction_tax_district_id=det.tax_district_id
						and reduction.reduction_levy_cd = det.levy_cd
					where reduction.levy_cert_run_id = @dest_levy_cert_run_id
						and reduction.[year] = @dest_year
						and reduction.levy_cd = levy_cert_stat_limit_detail.levy_cd
				  ) 
			end
from levy_cert_stat_limit_detail
left join levy_cert_stat_limit_detail as src on
	src.tax_district_id = levy_cert_stat_limit_detail.tax_district_id
	and src.levy_cd = levy_cert_stat_limit_detail.levy_cd
	and src.levy_cert_run_id = @source_levy_cert_run_id
	and src.[year] = @source_year
where levy_cert_stat_limit_detail.levy_cert_run_id = @dest_levy_cert_run_id
	and levy_cert_stat_limit_detail.[year] = @dest_year

--update statutory limit for the tax district

update lcsl
	set lcsl.statutory_limit = tld.statutory_limit

from levy_cert_stat_limit as lcsl
join 
(
	select tax_district_id,
		sum(statutory_limit) as statutory_limit
	from levy_cert_stat_limit_detail as det (nolock) 
	where det.levy_cert_run_id = @dest_levy_cert_run_id
	and det.[year] = @dest_year
	group by det.tax_district_id
) as tld
on lcsl.tax_district_id = tld.tax_district_id
where lcsl.levy_cert_run_id = @dest_levy_cert_run_id
and lcsl.[year] = @dest_year

GO

