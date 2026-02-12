
/*
 * This stored procedure will update the following tables:
 *		pers_prop_rendition
 *		pers_prop_seg
 *		pers_prop_sub_seg
 *		property_val
 *		property
 *
 * The tables will only be updated if there was data specified to be updated
 * for the Rendition option of the Import BPP Rendtion process
 */
 
create procedure ImportBPPRenditionProcess
	
	@run_id int,
	@year numeric(4,0),
	@pacs_user_id int
	
as

set nocount on

set xact_abort on

begin tran

declare @next_event_id int
declare @next_segment_id int
declare @next_sub_segment_id int
declare @count int
declare @pacs_user_name varchar(30)

-- Get the user's name for the event
select @pacs_user_name = pacs_user_name
from pacs_user
with (nolock)
where pacs_user_id = @pacs_user_id

delete chg_log_user where machine = host_name()
exec SetChgLogUser -1
exec SetMachineLogChanges 1, @pacs_user_id
	
declare @valid_ids_table table
(prop_id int, primary key (prop_id))

declare @valid_ids_recalc_table table
(prop_id int, primary key (prop_id))

-- Exclude any records for properties that had errors
insert @valid_ids_table
(prop_id)
select distinct ibr.prop_id
from import_bpp_rendition as ibr
with (nolock)
join property as p
with (nolock)
on ibr.prop_id = p.prop_id
where ibr.run_id = @run_id
and ibr.prop_id not in
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
	(@next_event_id, 'A', 'RIU', getdate(), @pacs_user_name,
		'Rendition Import Update', @year, @run_id, @pacs_user_id)
		
	-- Associate the system event to all properties that had renditions created
	insert prop_event_assoc
	(prop_id, event_id)

	select v.prop_id, @next_event_id
	from @valid_ids_table as v
end

-- Create a temp table for those properties where renditions will be created
declare @rendition_created table
(prop_id int, rid int, record_number int identity(0,1), primary key (prop_id))

insert @rendition_created
(prop_id, rid)

select ibr.prop_id, min(ibr.rid)
from import_bpp_rendition as ibr
with (nolock)
join @valid_ids_table as v
on ibr.prop_id = v.prop_id
left outer join pers_prop_rendition as ppr
with (nolock)
on v.prop_id = ppr.prop_id
and ppr.rendition_year = @year
where ibr.run_id = @run_id
and
(
	ibr.rendition_date is not null or
	ibr.filing_status is not null or
	ppr.prop_id is null
)
group by ibr.prop_id

-- Remove any existing renditions for the properties that are to have them created.
delete
from pers_prop_rendition
from pers_prop_rendition as ppr
join @rendition_created as r
on ppr.prop_id = r.prop_id
where ppr.rendition_year = @year

-- Add the renditions
insert pers_prop_rendition
(prop_id, rendition_year, rendition_date, filing_status, comment)

select ibr.prop_id, @year, isnull(ibr.rendition_date, getdate()), ibr.filing_status, ibr.rendition_comment
from import_bpp_rendition as ibr
with (nolock)
join @rendition_created as r
on ibr.prop_id = r.prop_id
and ibr.rid = r.rid
where ibr.run_id = @run_id

-- Create a temp table for those properties where the UBI Number will be updated
declare @ubi_updated table
(prop_id int, rid int, primary key (prop_id))

insert @ubi_updated
(prop_id, rid)

select ibr.prop_id, min(ibr.rid)
from import_bpp_rendition as ibr
with (nolock)
join @valid_ids_table as v
on ibr.prop_id = v.prop_id
where ibr.run_id = @run_id
and ibr.ubi is not null
group by ibr.prop_id

-- Update property_val.ubi_number with a UBI Number if specified
update property_val
set ubi_number = ibr.ubi
from property_val as pv
join @ubi_updated as u
on pv.prop_id = u.prop_id
join import_bpp_rendition as ibr
with (nolock)
on u.prop_id = ibr.prop_id
and u.rid = ibr.rid
where ibr.run_id = @run_id
and pv.prop_val_yr=@year
and sup_num = 0

-- Create a temp table for those properties where the Review Appraiser will be updated
declare @review_appraiser_updated table
(prop_id int, rid int, primary key (prop_id))

insert @review_appraiser_updated
(prop_id, rid)

select ibr.prop_id, min(ibr.rid)
from import_bpp_rendition as ibr
with (nolock)
join @valid_ids_table as v
on ibr.prop_id = v.prop_id
where ibr.run_id = @run_id
and ibr.appraiser_id is not null
group by ibr.prop_id

-- Update property_val.reviewed_appraiser with the Appraiser if specified
update property_val
set reviewed_appraiser = ibr.appraiser_id
from property_val as pv
join @review_appraiser_updated as u
on pv.prop_id = u.prop_id
join import_bpp_rendition as ibr
with (nolock)
on u.prop_id = ibr.prop_id
and u.rid = ibr.rid
where ibr.run_id = @run_id
and pv.prop_val_yr=@year
and pv.sup_num = 0

-- Create a temp table for those properties where the HOF Exemption will be created
declare @hof_created table
(prop_id int, rid int, primary key (prop_id))

insert @hof_created
(prop_id, rid)

select ibr.prop_id, min(ibr.rid)
from import_bpp_rendition as ibr
with (nolock)
join @valid_ids_table as v
on ibr.prop_id = v.prop_id
left outer join property_exemption as pe
with (nolock)
on pe.exmpt_tax_yr = @year
and pe.owner_tax_yr = @year
and pe.sup_num = 0
and pe.prop_id = v.prop_id
and pe.exmpt_type_cd = 'HOF'
where ibr.run_id = @run_id
and ibr.hof_exemption = 1
and pe.prop_id is null
group by ibr.prop_id

-- Create an HOF Exemption on those Properties that were specified if it doesn't already exist
insert property_exemption
(prop_id, owner_id, exmpt_tax_yr, owner_tax_yr, prop_type_cd, exmpt_type_cd,
 applicant_nm, sup_num, exemption_pct, absent_flag, apply_local_option_pct_only, apply_no_exemption_amount)

select ibr.prop_id, o.owner_id, @year, @year, p.prop_type_cd, 'HOF',
			a.file_as_name, 0, 100, 0, 'F', 0
from import_bpp_rendition as ibr
with (nolock)
join @hof_created as hc
on ibr.prop_id = hc.prop_id
and ibr.rid = hc.rid
join property as p
with (nolock)
on ibr.prop_id = p.prop_id
join owner as o
with (nolock)
on p.prop_id = o.prop_id
and o.owner_tax_yr = @year
and o.sup_num = 0
join account as a
with (nolock)
on o.owner_id = a.acct_id
where ibr.run_id = @run_id

insert @valid_ids_recalc_table
	select distinct hc.prop_id from @hof_created hc
	left outer join @valid_ids_recalc_table vid
	on vid.prop_id = hc.prop_id
	where vid.prop_id is null

-- Create a temp table for those properties where the SIC/NAICS code will be updated
declare @sic_updated table
(prop_id int, rid int, primary key (prop_id))

insert @sic_updated
(prop_id, rid)

select ibr.prop_id, min(ibr.rid)
from import_bpp_rendition as ibr
with (nolock)
join @valid_ids_table as v
on ibr.prop_id = v.prop_id
where ibr.run_id = @run_id
and ibr.naics_code is not null
group by ibr.prop_id

-- Update property.prop_sic_cd if Property NAICS code is specified
update property
set prop_sic_cd = ibr.naics_code
from property as p
join @sic_updated as s
on p.prop_id = s.prop_id
join import_bpp_rendition as ibr
with (nolock)
on s.prop_id = ibr.prop_id
and s.rid = ibr.rid
where ibr.run_id = @run_id

-- Create a temp table for those properties where segments will be created.
-- Segments to be created must have unique segment numbers so that subsegments can be matched to them.
declare @segment_created table
(prop_id int, rid int, segment_number int, record_number int identity(0,1), primary key (prop_id, rid))

insert @segment_created
(prop_id, rid, segment_number)

select ibr.prop_id, min(ibr.rid), ibr.segment_number
from import_bpp_rendition as ibr
with (nolock)
join @valid_ids_table as v
on ibr.prop_id = v.prop_id
where ibr.run_id = @run_id
and ibr.segment_type is not null
group by ibr.prop_id, ibr.segment_number

set @count = @@rowcount

-- Delete pers_prop_sub_seg records from those properties where segments would be created
delete
from pers_prop_sub_seg
from pers_prop_sub_seg as ppss
join @segment_created as s
on ppss.prop_id = s.prop_id
where ppss.prop_val_yr = @year
and ppss.sup_num = 0

delete
from pers_prop_entity_assoc
from pers_prop_entity_assoc as ppea
join @segment_created as s
on ppea.prop_id = s.prop_id
where ppea.prop_val_yr = @year
and ppea.sup_num = 0

delete
from pers_prop_exemption_assoc
from pers_prop_exemption_assoc as ppea
join @segment_created as s
on ppea.prop_id = s.prop_id
where ppea.prop_val_yr = @year
and ppea.sup_num = 0

delete
from pers_prop_owner_assoc
from pers_prop_owner_assoc as ppoa
join @segment_created as s
on ppoa.prop_id = s.prop_id
where ppoa.prop_val_yr = @year
and ppoa.sup_num = 0

-- Delete pers_prop_seg records from those properties where segments would be created
delete
from pers_prop_seg
from pers_prop_seg as pps
join @segment_created as s
on pps.prop_id = s.prop_id
where pps.prop_val_yr = @year
and pps.sup_num = 0
and pps.sale_id = 0

if @count > 0
begin
	exec GetUniqueID 'pers_prop_seg', @next_segment_id output, @count

	-- Create the new segments
	insert pers_prop_seg
	(prop_id, prop_val_yr, sup_num, pp_seg_id, sale_id, pp_type_cd,
	 pp_description, pp_yr_aquired, pp_orig_cost, pp_appraise_meth,
	 pp_state_cd, farm_asset, pp_make, pp_model, pp_vin, pp_license, pp_active_flag)
	 
	select s.prop_id, @year, 0, @next_segment_id + s.record_number, 0, ibr.segment_type,
					ibr.segment_description, ibr.segment_year_acquired, ibr.segment_original_cost, ibr.segment_valuation_method,
					ibr.segment_state_code, ibr.segment_farm_asset_flag, ibr.segment_make, ibr.segment_model, ibr.segment_vin, ibr.segment_license_number, 'T'
	from @segment_created as s
	join import_bpp_rendition as ibr
	with (nolock)
	on s.prop_id = ibr.prop_id
	and s.rid = ibr.rid
	where ibr.run_id = @run_id

	-- Create a temp table for cross-referencing to get the right pp_seg_id
	declare @pp_seg_id table
	(prop_id int, segment_number int, pp_seg_id int)

	insert @pp_seg_id
	(prop_id, segment_number, pp_seg_id)
	select s.prop_id, s.segment_number, s.record_number + @next_segment_id
	from @segment_created as s


	-- Create a temp table for those properties where sub segments will be created
	declare @sub_segment_created table
	(prop_id int, rid int, pp_seg_id int, record_number int identity(0,1), primary key (prop_id, rid))

	insert @sub_segment_created
	(prop_id, rid, pp_seg_id)

	select distinct ibr.prop_id, ibr.rid, pp.pp_seg_id
	from import_bpp_rendition as ibr
	with (nolock)
	join @pp_seg_id as pp
	on ibr.prop_id = pp.prop_id
	and ibr.segment_number = pp.segment_number
	join @valid_ids_table as v
	on ibr.prop_id = v.prop_id
	where ibr.run_id = @run_id
	and ibr.sub_segment_type is not null

	set @count = @@rowcount

	if @count > 0
	begin
		exec GetUniqueID 'pers_prop_sub_seg', @next_sub_segment_id output, @count

		-- Create the new sub-segments
		insert pers_prop_sub_seg
		(prop_id, prop_val_yr, sup_num, pp_seg_id, pp_sub_seg_id, descrip, pp_orig_cost,
		 pp_yr_aquired, pp_type_cd, calc_method_flag, pp_sic_cd, pp_dep_type_cd,
		 pp_dep_deprec_cd, asset_id)
		 
		select sub.prop_id, @year, 0, sub.pp_seg_id, @next_sub_segment_id + sub.record_number,
						ibr.sub_segment_description, ibr.sub_segment_orig_cost, ibr.sub_segment_year_acquired,
						ibr.sub_segment_type, ibr.sub_segment_valuation_method, ibr.sub_segment_naics_code,
						ibr.sub_segment_depreciation_type, ibr.sub_segment_depreciation_code, ibr.sub_segment_asset_id
		from @sub_segment_created as sub
		join import_bpp_rendition as ibr
		with (nolock)
		on sub.prop_id = ibr.prop_id
		and sub.rid = ibr.rid
		where ibr.run_id = @run_id
	end
	
	
	insert @valid_ids_recalc_table
	select distinct sc.prop_id from @segment_created sc
	left outer join @valid_ids_recalc_table vid
	on vid.prop_id = sc.prop_id
	where vid.prop_id is null
	
	
end

-- Lastly, update the Run with a Processed status
update import_bpp
set status = 'Processed',
		process_by_id = @pacs_user_id,
		process_date = getdate()
where run_id = @run_id

update pv 
set recalc_flag = 'M'
from property_val pv with (nolock)
join import_bpp_rendition ibr with (nolock)
on pv.prop_id = ibr.prop_id		
join import_bpp ib with (nolock)
on ibr.run_id=ib.run_id
and ib.year=pv.prop_val_yr
join @valid_ids_recalc_table vid
on vid.prop_id = ibr.prop_id
where ib.run_id = @run_id
and ib.import_type = 'Rendition'
and pv.sup_num = 0

commit tran




set ansi_nulls on
set quoted_identifier on

GO

