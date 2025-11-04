


CREATE   procedure ptd_tu_proc

@input_yr int,
@input_cad_id_code char(3)

as

truncate table ptd_tu

select entity_id, year, owner_id, 
sum(market) as market_val, sum(taxable_val) as taxable_val, 
owner_id as owner_id_main
into #ptd_tu
from property_owner_entity_state_cd, ptd_supp_assoc
where year = @input_yr
and    property_owner_entity_state_cd.prop_id = ptd_supp_assoc.prop_id
and    property_owner_entity_state_cd.sup_num = ptd_supp_assoc.sup_num
and    property_owner_entity_state_cd.year   = ptd_supp_assoc.sup_yr
group by entity_id, year, owner_id

-------------------------------------------------
--update owner links so that multiple owner_ids are reported as 1 owner on top ten
-------------------------------------------------
update #ptd_tu set owner_id_main = owner_links.main_owner_id
from owner_links
where owner_id = owner_links.child_owner_id

declare @entity_id int

DECLARE ENTITY_ITEM CURSOR fast_forward
FOR select entity.entity_id
    from entity, tax_rate
    where entity.entity_id = tax_rate.entity_id
    and   tax_rate.ptd_option = 'T'
    and   not IsNull(entity.ptd_multi_unit, '') in('d','x')
    and   tax_rate.tax_rate_yr = @input_yr

OPEN ENTITY_ITEM
FETCH NEXT FROM ENTITY_ITEM into @entity_id

while (@@FETCH_STATUS = 0)
begin
	declare @entity_type_cd		varchar(5)
	declare @taxing_unit_num	varchar(50)
	declare @ptd_multi_unit		varchar(1)
	declare @county_taxing_unit_ind	varchar(1)
	declare @owner_id		int
	declare @file_as_name		varchar(70)
	declare @market			numeric(11)
	declare @taxable		numeric(11)
	declare @counter		int
	declare @record_type		varchar(3)

	set @record_type = 'TU2'
	set @counter = 1

	declare ptd_tu cursor fast_forward for
	select  top 10 
		entity.entity_type_cd, 
		replace(entity.taxing_unit_num, '-', ''), 
    		entity.ptd_multi_unit, 
		entity.county_taxing_unit_ind, 
		owner_id_main as owner_id,
		file_as_name,
		sum(isnull(market_val, 0)) as total_market_val,
		sum(isnull(taxable_val, 0)) as total_taxable_val
	from #ptd_tu, account, entity
	where #ptd_tu.owner_id_main = account.acct_id
	and   #ptd_tu.entity_id     = entity.entity_id
	and   #ptd_tu.entity_id     = @entity_id
	group by entity.entity_id, entity.entity_type_cd, replace(entity.taxing_unit_num, '-', ''), entity.ptd_multi_unit, entity.county_taxing_unit_ind, owner_id_main, file_as_name
	order by sum(isnull(taxable_val, 0)) desc

	open ptd_tu
	fetch next from ptd_tu into @entity_type_cd, @taxing_unit_num, @ptd_multi_unit,		
				    @county_taxing_unit_ind, @owner_id, @file_as_name, @market, @taxable

	while (@@FETCH_STATUS = 0)
	begin
		
		insert into ptd_tu
		(
		record_type,
		cad_id_code,
		taxing_unit_id_code,
		county_fund_type_ind,
		ranking,
		owner_name,
		market_val,
		taxable_val,
		owner_id,
		entity_id,
		year
		)
		values
		(
		@record_type,
		@input_cad_id_code,
		@taxing_unit_num,
		@ptd_multi_unit,
		@counter,
		right(@file_as_name, 50),
		@market,
		@taxable,
		@owner_id,
		@entity_id,
		@input_yr
		)

		set @counter = @counter + 1
		
		fetch next from ptd_tu into @entity_type_cd, @taxing_unit_num, @ptd_multi_unit,		
				    @county_taxing_unit_ind, @owner_id, @file_as_name, @market, @taxable
	end

	close ptd_tu
	deallocate ptd_tu
		

	FETCH NEXT FROM ENTITY_ITEM into @entity_id
end

CLOSE ENTITY_ITEM
DEALLOCATE ENTITY_ITEM


drop table #ptd_tu

GO

