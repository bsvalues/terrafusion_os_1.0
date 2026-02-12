
/*
 * This stored procedure will update the following tables:
 *		situs
 *
 * for the Situs Update option of the Import BPP Rendtion process
 */
 
create procedure ImportBPPSitusProcess
	
	@run_id int,
	@year numeric(4,0),
	@pacs_user_id int
	
as

set nocount on

set xact_abort on

begin tran

delete chg_log_user where machine = host_name()
exec SetChgLogUser -1
exec SetMachineLogChanges 1, @pacs_user_id

declare @next_event_id int
declare @next_situs_id int
declare @count int
declare @pacs_user_name varchar(30)

-- Get the user's name for the event
select @pacs_user_name = pacs_user_name
from pacs_user
with (nolock)
where pacs_user_id = @pacs_user_id

-- First exclude all records where there was an error for the Owner ID
declare @valid_ids_table table
(prop_id int, primary key (prop_id))

insert @valid_ids_table
(prop_id)
select distinct ibsi.prop_id
from import_bpp_situs_info as ibsi
with (nolock)
where ibsi.run_id = @run_id
and ibsi.prop_id not in
(select prop_id
 from import_bpp_error
 with (nolock)
 where run_id = @run_id)

if @@rowcount > 0
begin
	exec GetUniqueID 'event', @next_event_id output

	-- Create the system event
	insert event
	(event_id, system_type, event_type, event_date, pacs_user,
	 event_desc, ref_year, ref_id1, pacs_user_id)
	values
	(@next_event_id, 'A', 'RISU', getdate(), @pacs_user_name,
		'Rendition Import Situs Update', @year, @run_id, @pacs_user_id)
		
	-- Associate the system event to all properties that had renditions created
	insert prop_event_assoc
	(prop_id, event_id)

	select v.prop_id, @next_event_id
	from @valid_ids_table as v
end

-- Next update only the Primary Situs records if there are any, overwriting all fields
-- with what was specified from the import
update situs
set situs_num = ibsi.situs_number,
		situs_street_prefx = ibsi.situs_street_prefix,
		situs_street = ibsi.situs_street,
		situs_street_sufix = ibsi.situs_street_suffix,
		situs_unit = ibsi.situs_unit,
		situs_city = ibsi.situs_city,
		situs_state = ibsi.situs_state,
		situs_zip = ibsi.situs_zip,
		building_num = ibsi.building_num,
		sub_num = ibsi.sub_num
from situs as s
join @valid_ids_table as v
on s.prop_id = v.prop_id
join import_bpp_situs_info as ibsi
with (nolock)
on s.prop_id = ibsi.prop_id
and s.primary_situs = ibsi.primary_situs
where ibsi.run_id = @run_id
and ibsi.primary_situs = 'Y'

-- create a temp table of those imported situs records that will be added
declare @new_situs_table table
(sid int, record_number int identity(0,1), primary key (sid))

-- populate the temp table with the id of those imported situs records that will be added
insert @new_situs_table
(sid)

select sid
from import_bpp_situs_info as ibsi
with (nolock)
join @valid_ids_table as v
on ibsi.prop_id = v.prop_id
left outer join situs as s
with (nolock)
on ibsi.prop_id = s.prop_id
and ibsi.primary_situs = s.primary_situs
and ibsi.primary_situs = 'Y'
where ibsi.run_id = @run_id
and s.prop_id is null

union

select sid
from import_bpp_situs_info as ibsi
with (nolock)
join @valid_ids_table as v
on ibsi.prop_id = v.prop_id
where ibsi.run_id = @run_id
and ibsi.primary_situs = 'N'

-- record the count of how many will be added
set @count = @@rowcount

if @count > 0
begin
	-- get the next id and reserve for the number of records to be added
	exec GetUniqueID 'situs', @next_situs_id output, @count

	-- add the new situs records using the Next ID and adding the record_number as an offset
	-- to keep the ids unique
	insert situs
	(prop_id, situs_id, primary_situs, situs_num, situs_street_prefx,
	 situs_street, situs_street_sufix, situs_unit, situs_city,
	 situs_state, situs_zip, building_num, sub_num)
	 
	select ibsi.prop_id, n.record_number + @next_situs_id, ibsi.primary_situs, ibsi.situs_number,
					ibsi.situs_street_prefix, ibsi.situs_street, ibsi.situs_street_suffix, ibsi.situs_unit,
					ibsi.situs_city, ibsi.situs_state, ibsi.situs_zip, ibsi.building_num, ibsi.sub_num
	from import_bpp_situs_info as ibsi
	with (nolock)
	join @new_situs_table as n
	on ibsi.sid = n.sid
	where ibsi.run_id = @run_id
end

-- PACS requires that a situs be primary, if it is the only situs. 
  
update situs
set situs.primary_situs = 'Y'
from
	(select isbi.prop_id, count(*) as situs_count
	from situs s with (nolock)
	join import_bpp_situs_info isbi with (nolock)
	on isbi.prop_id = s.prop_id
	and isbi.run_id = @run_id
	group by isbi.prop_id ) as ist
where ist.prop_id = situs.prop_id
and ist.situs_count = 1
and situs.primary_situs = 'N'

-- Lastly, update the Import run so it shows as Processed.

update import_bpp
set status = 'Processed',
		process_by_id = @pacs_user_id,
		process_date = getdate()
where run_id = @run_id

commit tran

set ansi_nulls on
set quoted_identifier on

GO

