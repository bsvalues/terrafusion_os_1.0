
create procedure dbo.MassUpdateHalfPayStatusReport
	@dataset_id int,
	@run_id	int
as

set nocount on

-- Mass Update Half Pay Status - Report data generation

-- delete any conflicting records in the report tables
delete ##mass_update_half_pay_status_report
where dataset_id = @dataset_id

delete ##mass_update_half_pay_status_prop
where dataset_id = @dataset_id

-- get the Collections county name
declare @county_name varchar(30)
select top 1 @county_name = county_name
from system_address
order by case when system_type = 'C' then 1 else 2 end


-- report table
insert ##mass_update_half_pay_status_report
(dataset_id, run_id, county_name, created_by_name, created_date, years_text, new_status, modify_reason)
select @dataset_id dataset_id, @run_id run_id, @county_name county_name,
	pu.pacs_user_name as created_by_name, mur.created_date, mur.years, 
	case mur.convert_to_half_pay when 1 then 'Half Pay' else 'Full Pay' end new_status,
	modify_reason
from mass_update_half_pay_run mur
join pacs_user pu
	on mur.created_by = pu.pacs_user_id
where mur.run_id = @run_id


-- properties table
insert ##mass_update_half_pay_status_prop
(dataset_id, prop_id, statement_id, year, owner_id, owner_name, billfee_count)
select @dataset_id dataset_id, prop_id, statement_id, year, owner_id, file_as_name as owner_name, billfee_count 
from
(
	select prop_id, statement_id, owner_id, year, count(*) billfee_count
	from (
		select b.bill_id item_id, b.prop_id, b.statement_id, b.owner_id, b.year
		from mass_update_half_pay_run_items mui
		join bill b
			on b.bill_id = mui.trans_group_id
		where mui.run_id = @run_id

		union

		select f.fee_id item_id, fpv.prop_id, f.statement_id, f.owner_id, f.year
		from mass_update_half_pay_run_items mui
		join fee f
			on f.fee_id = mui.trans_group_id
		join fee_property_vw fpv
			on f.fee_id = fpv.fee_id
		where mui.run_id = @run_id
	) items
	group by prop_id, statement_id, owner_id, year
)x
join account a
	on a.acct_id = x.owner_id

GO

