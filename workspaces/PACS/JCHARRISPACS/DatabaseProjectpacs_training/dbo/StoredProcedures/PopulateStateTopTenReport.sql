








CREATE  procedure PopulateStateTopTenReport
@input_yr int
as
---------------------------------------------------------------------
--
--                    TOP TEN REPORT SECTION
--
-- Prepare top ten report data from ptd_state_report_cd_detail_data
--
--
---------------------------------------------------------------------
delete from ptd_state_report_top_ten_data where year = @input_yr
delete from ptd_state_report_top_ten where year = @input_yr

insert into ptd_state_report_top_ten_data 
select entity_id, year, 0, owner_id, owner_id as owner_id_links, 
sum(appraised_val) as market_val, sum(taxable_val)
from property_owner_entity_state_cd with (nolock), 
     ptd_supp_assoc with (nolock)
where year = @input_yr
and    property_owner_entity_state_cd.prop_id = ptd_supp_assoc.prop_id
and    property_owner_entity_state_cd.sup_num = ptd_supp_assoc.sup_num
and    property_owner_entity_state_cd.year   = ptd_supp_assoc.sup_yr
group by entity_id, year, owner_id

-------------------------------------------------
--update owner links so that multiple owner_ids are reported as 1 owner on top ten
-------------------------------------------------
update ptd_state_report_top_ten_data set owner_id_main = owner_links.main_owner_id
from owner_links with (nolock)
where owner_id = owner_links.child_owner_id

-- now populate ptd_state_report_top_ten from ..._data


---------------------------------------------------------
--Get Top 10 from the ptd_state_report_top_ten_data table for market value
---------------------------------------------------------
declare @entity_id int

DECLARE ENTITY_ITEM SCROLL CURSOR
FOR select entity_id
	 from entity_yr_vw with (nolock) where prop_val_yr = @input_yr

OPEN ENTITY_ITEM
FETCH NEXT FROM ENTITY_ITEM into	@entity_id

while (@@FETCH_STATUS = 0)
begin
	insert into ptd_state_report_top_ten
	(
		entity_id,
		year,
		as_of_sup_num,
		owner_id,
		owner_name,
		total_market_val,
		total_taxable_val
	)
	select top 20 
		entity_id,
		year,
		as_of_sup_num,
		owner_id_main as owner_id,
		file_as_name,
		sum(isnull(market_val, 0)) as total_market_val,
		sum(isnull(taxable_val, 0)) as total_taxable_val
	from ptd_state_report_top_ten_data with (nolock), 
             account with (nolock)
	where year = @input_yr and
	entity_id = @entity_id and
	ptd_state_report_top_ten_data.owner_id = account.acct_id
	group by entity_id, year, as_of_sup_num, owner_id_main, file_as_name
	order by sum(isnull(taxable_val, 0)) desc

	FETCH NEXT FROM ENTITY_ITEM into @entity_id
end

CLOSE ENTITY_ITEM
DEALLOCATE ENTITY_ITEM

GO

