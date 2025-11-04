
CREATE PROCEDURE GetAbstractSubdivisionWorksheetPropertyInfo
   @input_abs_subdv_cd	varchar(10)
with recompile 
AS

declare @date_entered		datetime
declare	@prop_id		int
declare @geo_id			varchar(50)
declare	@existing_acreage	decimal(14,4)
declare @deleted_acreage	decimal(14,4)
declare @remaining_acreage	decimal(14,4)
declare @city			varchar(5)
declare @county			varchar(5)
declare	@school			varchar(5)
declare @market_val	decimal(14,0)

declare @appr_year		numeric(4,0)
exec GetApprYear @appr_year output

create table #tmp_abs_subdv_ws
(
	date_entered		datetime not null,
	prop_id			int not null,
	geo_id			varchar(50) not null,
	existing_acreage	decimal(14,4) not null,
	deleted_acreage		decimal(14,4) not null,
	remaining_acreage	decimal(14,4) not null,
	city			varchar(5) not null,
	county			varchar(5) not null,
	school			varchar(5) not null,
	market_val		decimal(14,0) not null
)

declare ABSSUBDVWS scroll cursor for
select
	isnull(date_entered, GetDate()),
	prop_id,
	isnull(geo_id, ''),
	isnull(existing_acreage, 0.0),
	isnull(deleted_acreage, 0.0),
	isnull(remaining_acreage, 0.0),
	isnull(market_val, 0.0)
from
	abs_subdv_worksheet_prop_assoc
where
	abs_subdv_cd = @input_abs_subdv_cd

open ABSSUBDVWS
fetch next from ABSSUBDVWS into
	@date_entered,
	@prop_id,
	@geo_id,
	@existing_acreage,
	@deleted_acreage,
	@remaining_acreage,
	@market_val

set nocount on 

while (@@fetch_status = 0)
begin
	set @city = ''
	select
		@city = entity.entity_cd
	from
		entity_prop_assoc
	inner join
		prop_supp_assoc
	on
		entity_prop_assoc.prop_id = prop_supp_assoc.prop_id
	and	entity_prop_assoc.tax_yr = prop_supp_assoc.owner_tax_yr
	and	entity_prop_assoc.sup_num = prop_supp_assoc.sup_num
	inner join
		entity
	on	entity_prop_assoc.entity_id = entity.entity_id
	and	entity.entity_type_cd = 'C'
	where
		entity_prop_assoc.prop_id = @prop_id
	and	entity_prop_assoc.tax_yr = @appr_year


	set @county = ''
	select
		@county = entity.entity_cd
	from
		entity_prop_assoc
	inner join
		prop_supp_assoc
	on
		entity_prop_assoc.prop_id = prop_supp_assoc.prop_id
	and	entity_prop_assoc.tax_yr = prop_supp_assoc.owner_tax_yr
	and	entity_prop_assoc.sup_num = prop_supp_assoc.sup_num
	inner join
		entity
	on	entity_prop_assoc.entity_id = entity.entity_id
	and	entity.entity_type_cd = 'G'
	where
		entity_prop_assoc.prop_id = @prop_id
	and	entity_prop_assoc.tax_yr = @appr_year


	set @school = ''
	select
		@school = entity.entity_cd
	from
		entity_prop_assoc
	inner join
		prop_supp_assoc
	on
		entity_prop_assoc.prop_id = prop_supp_assoc.prop_id
	and	entity_prop_assoc.tax_yr = prop_supp_assoc.owner_tax_yr
	and	entity_prop_assoc.sup_num = prop_supp_assoc.sup_num
	inner join
		entity
	on	entity_prop_assoc.entity_id = entity.entity_id
	and	entity.entity_type_cd = 'S'
	where
		entity_prop_assoc.prop_id = @prop_id
	and	entity_prop_assoc.tax_yr = @appr_year

	insert into #tmp_abs_subdv_ws
	(
		date_entered,
		prop_id,
		geo_id,
		existing_acreage,
		deleted_acreage,
		remaining_acreage,
		city,
		county,
		school,
		market_val
	)
	values
	(
		@date_entered,
		@prop_id,
		@geo_id,
		@existing_acreage,
		@deleted_acreage,
		@remaining_acreage,
		@city,
		@county,
		@school,
		@market_val
	)


	fetch next from ABSSUBDVWS into
		@date_entered,
		@prop_id,
		@geo_id,
		@existing_acreage,
		@deleted_acreage,
		@remaining_acreage,
		@market_val
end

close ABSSUBDVWS
deallocate ABSSUBDVWS

set nocount off

select
	date_entered,
	prop_id,
	geo_id,
	existing_acreage,
	deleted_acreage,
	remaining_acreage,
	city,
	county,
	school,
	market_val
from
	#tmp_abs_subdv_ws
order by
	date_entered,
	prop_id

drop table #tmp_abs_subdv_ws

GO

