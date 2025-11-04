
create procedure NewConstructionCertificateGenerator
	@dataset_id int,
	@year int,
	@sup_num int

as

set nocount on


declare @county varchar(30)
select @county = county_name from system_address with(nolock) where system_type = 'A'

declare @new_construction_value numeric(14,2)
declare @new_construction_land numeric(14,2)

insert ##as_of (dataset_id, year, prop_id, sup_num)
select @dataset_id, prop_val_yr, prop_id, max(sup_num)
from property_val with(nolock) 
where prop_val_yr = @year
and sup_num <= @sup_num
group by prop_val_yr, prop_id

insert into ##new_construction_prop_assoc
(
dataset_id,
prop_val_yr,
sup_num,
prop_id
)
select @dataset_id, pv.prop_val_yr, pv.sup_num, pv.prop_id
from ##as_of as asof with(nolock) 
join property as p with(nolock) on
p.prop_id = asof.prop_id
join property_val as pv with(nolock) on
pv.prop_val_yr = asof.year and
pv.sup_num = asof.sup_num and
pv.prop_id = asof.prop_id
where 1 = 1
and pv.prop_inactive_dt is null
and isnull(pv.prop_state, '') <> 'P'
and isnull(p.reference_flag, '') <> 'T'
 and p.prop_type_cd in ('R','MH','P','MN','A')
 group by pv.prop_id, pv.prop_val_yr, pv.sup_num 


insert into ##new_construction_detail
(
dataset_id,
total_nc
)
select	@dataset_id,
		wpov.new_val_hs + wpov.new_val_nhs + wpov.new_val_p
from  ##new_construction_prop_assoc ncpa
inner join  wash_prop_owner_val wpov 
with (nolock)
on 
      ncpa.prop_id  = wpov.prop_id
and   ncpa.sup_num  = wpov.sup_num
and   ncpa.prop_val_yr = wpov.year
inner join wash_prop_owner_tax_area_assoc wpota 
with (nolock)
on 
	  wpov.prop_id  = wpota.prop_id
and   wpov.owner_id = wpota.owner_id
and   wpov.sup_num  = wpota.sup_num
and   wpov.year     = wpota.year
and   isnull(wpota.pending, 0) = 0
inner join tax_area ta with (nolock)
on 
      wpota.tax_area_id = ta.tax_area_id     
inner join property_val pv with (nolock)
on
      wpov.prop_id  = pv.prop_id
and   wpov.sup_num  = pv.sup_num
and   wpov.year     = pv.prop_val_yr      
inner join property p 
with (nolock)
on 
      pv.prop_id    = p.prop_id
left outer join property_sub_type as pst
with (nolock)
on pv.sub_type = pst.property_sub_cd
left outer join 
(
	select wpoe.year, wpoe.sup_num, wpoe.prop_id, sum(wpoe.exempt_value) as exempt_value
	from ##new_construction_prop_assoc as ncpa
	with (nolock)
	join wash_prop_owner_exemption as wpoe
	with (nolock)
	on ncpa.prop_val_yr = wpoe.year
	and ncpa.sup_num = wpoe.sup_num
	and ncpa.prop_id = wpoe.prop_id
	where exmpt_type_cd in ('EX')
	and ncpa.dataset_id = @dataset_id
	group by wpoe.year, wpoe.sup_num, wpoe.prop_id
) as wpoe 
on wpov.year     = wpoe.year 
and wpov.sup_num  = wpoe.sup_num
and wpov.prop_id  = wpoe.prop_id
where ncpa.dataset_id = @dataset_id
and isnull(pst.state_assessed_utility,0) = 0
 order by pv.prop_id

delete from ##as_of where dataset_id = @dataset_id

select @new_construction_value = sum(total_nc)
from ##new_construction_detail


--select @new_construction_value = sum( isnull(wpov.new_val_hs, 0) + isnull(wpov.new_val_nhs, 0) + isnull(wpov.new_val_p, 0) )
--from wash_prop_owner_val as wpov with(nolock)
--where wpov.year = @year and wpov.sup_num >= @sup_num
--
--select @new_construction_land = sum(isnull(pv.new_val_land_hs, 0) + isnull(pv.new_val_land_nhs, 0))
--from property_val as pv with(nolock)
--inner join property as p with(nolock) on
--	p.prop_id = pv.prop_id
--left join property_sub_type as pst with (nolock) on
--	pst.property_sub_cd = pv.sub_type
--where pv.prop_val_yr = @year and pv.sup_num >= @sup_num
--	and (p.prop_type_cd <> 'R' or (isnull(pst.imp_leased_land, 0) = 0))

insert into ##new_construction_certificate_report
select
	@dataset_id,
	@year,
	@county,
	@new_construction_value

GO

