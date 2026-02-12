

-- HS 28851, By Sai K On Feb 2nd 2006
-- This procedure retrieves all the personal properties in the year (@input_prop_val_yr) 
-- where prop_sic_cd of the property = @input_pp_type_cd 
-- and property has segment(s) with pp_type_cd = @input_sic_cd
-- The procedure then would insert into the temp table with the dataset id provided
-- Incase a property has multiple segments of the given type, it will aggregate fields
-- like value, value per sqft etc and 
-- display nulls for segments specific fields like quality_cd, pp_appraised_meth etc

CREATE PROCEDURE PopulatePPSicsummaryTables

@dataset_id bigint,
@input_pp_type_cd  varchar(10),
@input_sic_cd varchar(10),
@input_prop_val_yr numeric(4,0)

as

declare @prop_id int
declare @sup_num int
declare @count int
declare @legal_desc varchar(255)
declare @dba_name varchar(50)
declare @udi_parent char(1) 
declare @appr_method char(5)
declare @reviewed_dt smalldatetime
declare @geo_id varchar(50)
declare @ubi_number varchar(50)
declare @last_appraisal_yr numeric(4,0)

-- clear the output table 
delete from ##pers_prop_sic_summary
where dataset_id = @dataset_id

-- build an initial cursor over the properties that match the input criteria
declare prop_match cursor fast_forward
for
select distinct
	pv.prop_id,
	pv.sup_num,
	pv.legal_desc,
	p.dba_name,
	isnull(pv.udi_parent, 'F') as udi_parent,
	pv.appr_method,
	pv.reviewed_dt,
	p.geo_id,
	pv.ubi_number,
	pv.last_appraisal_yr

from property_val pv with(nolock)
	
inner join prop_supp_assoc psa with(nolock)
on pv.prop_val_yr = @input_prop_val_yr 
and psa.prop_id = pv.prop_id
and psa.owner_tax_yr = pv.prop_val_yr
and psa.sup_num = pv.sup_num

inner join property p with(nolock)
on p.prop_id = pv.prop_id	
and p.prop_sic_cd = @input_sic_cd
and p.prop_type_cd = 'P'

inner join pers_prop_seg pps with(nolock)
on pps.prop_id = pv.prop_id
and pps.prop_val_yr= pv.prop_val_yr						
and pps.sup_num = pv.sup_num
and pps.pp_type_cd = @input_pp_type_cd
and pps.pp_active_flag = 'T'
and pps.sale_id is not null		
		
where pv.prop_inactive_dt is null
	-- UDI Parent Check 
	

-- Open property Cursor
open prop_match
fetch next from prop_match 
into @prop_id, @sup_num, @legal_desc, @dba_name, @udi_parent, 
	@appr_method, @reviewed_dt, @geo_id, @ubi_number, @last_appraisal_yr


while @@FETCH_STATUS = 0
begin
	set @count = null		
	set @appr_method = ltrim(@appr_method)
	set @appr_method = rtrim(@appr_method)			
	  
	-- Get the count of pers prop segments with this pp_type_cd	
	select @count = count(*)
	from pers_prop_seg pps
	
	where pps.prop_id = @prop_id
	and pps.prop_val_yr = @input_prop_val_yr						
	and pps.sup_num = @sup_num
	and pps.pp_type_cd = @input_pp_type_cd
	and pps.pp_active_flag = 'T'
	and pps.sale_id is not null				
	
	-- If a property has multiple matching segments, then aggregate
	-- value fields and return nulls in segment specific fields
	if @count > 1  
	begin 
		insert ##pers_prop_sic_summary
		(dataset_id, prop_id, prop_val_yr, owner_id, c_taxpayer, taxpayer,
		 situs_address, legal_desc, situs_num, situs_street,
		 situs_suffix, situs_prefix, situs_unit, situs_state,
		 dba_name, confidential_flag, sic_cd,
		 pp_type_cd, seg_area, rend,
		 pps_value, udi_parent, reviewed_dt,
		 geo_id, ubi_number, last_appraisal_yr)

		select top 1
			@dataset_id,
			pps.prop_id,
			pps.prop_val_yr,
			o.owner_id,
			a.confidential_file_as_name as c_taxpayer,
			a.file_as_name as taxpayer,
			replace( isnull(s.situs_display, ''), char(13) + char(10), ' ') as situs_address,
			@legal_desc as legal_desc,
			s.situs_num,
			s.situs_street,
			s.situs_street_sufix,
			s.situs_street_prefx,
			s.situs_unit,
			s.situs_state,
			@dba_name as dba_name,
			isnull(a.confidential_flag, 'F') as confidential_flag,
			@input_sic_cd as sic_cd,
			pps.pp_type_cd,
			isnull(pps.pp_area, 0) as seg_area,
			case when ppr.prop_id is null then 'N' else 'Y' end as rend,	
			isnull(pps.aggregate_value, 0) as pps_value,
			@udi_parent, @reviewed_dt,
			@geo_id, @ubi_number, @last_appraisal_yr
					
			
		from 
			( 
			select 
				prop_id,
				prop_val_yr,
				sup_num,
				pp_type_cd,
				sum(isnull(pp_area, 0)) as pp_area,
				sum
				(
					cast((	
						case @appr_method
							when 'A' then isnull(arb_val,0)
							when 'D' then isnull(dist_val, 0)
							else isnull (pp_mkt_val, 0)		 
						end 
					) as numeric(18,4)) 	
				) as aggregate_value

			from pers_prop_seg

			where prop_id = @prop_id
			and prop_val_yr = @input_prop_val_yr						
			and sup_num = @sup_num
			and pp_type_cd = @input_pp_type_cd
			and pp_active_flag = 'T'
			and sale_id is not null	
	
			GROUP BY
				prop_id,
				prop_val_yr,
				sup_num,
				pp_type_cd		 
			) as pps

		inner join owner as o
		on o.prop_id = pps.prop_id
		and o.owner_tax_yr = pps.prop_val_yr
		and o.sup_num = pps.sup_num
			
		inner join account as a
		on o.owner_id = a.acct_id	
			 
		left join situs as s
		on s.prop_id = pps.prop_id
		and s.primary_situs = 'Y'
			
		left join 
		property_profile as pp
		on pp.prop_id = pps.prop_id
		and pp.prop_val_yr = pps.prop_val_yr	
			
		left outer join pers_prop_rendition as ppr
		on ppr.prop_id = pps.prop_id
		and ppr.rendition_year = pps.prop_val_yr
				
	end -- end of count > 1
	
	-- only one segment matched, return all fields
	else if @count = 1  
	begin   	
		
		insert into ##pers_prop_sic_summary
		(dataset_id, prop_id, prop_val_yr, owner_id, c_taxpayer, taxpayer,
		 situs_address, legal_desc, situs_num, situs_street,
		 situs_suffix, situs_prefix, situs_unit, situs_state,
		 dba_name, confidential_flag, sic_cd,
		 pp_seg_id, pp_type_cd, seg_area, rend,
		 pps_appraised_method, pps_value, quality_cd, density_cd,
		 udi_parent, reviewed_dt,
		 geo_id, ubi_number, last_appraisal_yr,
		 dep_schedule, dep_percent)

		select top 1
			@dataset_id as dataset_id,		
			pps.prop_id,
			pps.prop_val_yr,
			o.owner_id,
			a.confidential_file_as_name,
			a.file_as_name as taxpayer,
			replace( isnull(s.situs_display, ''), char(13) + char(10), ' ') as situs_address,
			@legal_desc as legal_desc,
			s.situs_num,
			s.situs_street,
			s.situs_street_sufix,
			s.situs_street_prefx,
			s.situs_unit,
			s.situs_state,
			@dba_name as dba_name,
			isnull(a.confidential_flag, 'F') as confidential_flag,
			@input_sic_cd as sic_cd,
			pps.pp_seg_id,
			pps.pp_type_cd,
			isnull(pps.pp_area, 0) as seg_area,
			case 
				when ppr.prop_id is null 
				then 'N' else 'Y' 
			end as rend,	
		
			case pps.pp_appraise_meth
				when 'SUB' then 'SS'
				when 'O' then 'OC'
				when 'F' then 'FV'
				when 'R' then 'RV'
				when 'A' then 'AV'
				else pps.pp_appraise_meth 		 
			end as pps_appraised_method,
			isnull(
			cast
				(
					(	
					case @appr_method
							when 'A' then isnull(arb_val,0)
							when 'D' then isnull(dist_val, 0)
							else isnull (pp_mkt_val, 0)		 
						end 
					) as numeric(18,4)
			)
			, 0) as pps_value,
			isnull(pps.pp_qual_cd, '') as quality_cd,
			isnull(pps.pp_density_cd, '') as density_cd,
			@udi_parent, @reviewed_dt,
			@geo_id, @ubi_number, @last_appraisal_yr,
			ds.dep_schedule, isnull(pps.pp_deprec_pct, 100)
			
		from pers_prop_seg as pps
		
		inner join owner as o
		on o.prop_id = pps.prop_id
		and o.owner_tax_yr = pps.prop_val_yr
		and o.sup_num = pps.sup_num
		
		inner join account as a
		on o.owner_id = a.acct_id	
			 
		left join situs as s
		on s.prop_id = pps.prop_id
		and s.primary_situs = 'Y'
		
		left join property_profile as pp
		on pp.prop_id = pps.prop_id
		and pp.prop_val_yr = pps.prop_val_yr	
		
		left join pers_prop_rendition as ppr
		on ppr.prop_id = pps.prop_id
		and ppr.rendition_year = pps.prop_val_yr
		
		outer apply (
			select top 1 d.description as dep_schedule
			from depreciation d with(nolock)
			where type_cd = pps.pp_deprec_type_cd
			and deprec_cd = pps.pp_deprec_deprec_cd
			and prop_type_cd = 'P'
			and year = @input_prop_val_yr
		) ds

		where pps.prop_id = @prop_id
		and pps.prop_val_yr = @input_prop_val_yr						
		and pps.sup_num = @sup_num
		and pps.pp_type_cd = @input_pp_type_cd
		and pps.pp_active_flag = 'T'
		and pps.sale_id is not null	

	end -- end of count = 1
							
fetch next from prop_match 
into @prop_id, @sup_num, @legal_desc, @dba_name, @udi_parent, 
	@appr_method, @reviewed_dt, @geo_id, @ubi_number, @last_appraisal_yr

end -- end of fetch

close prop_match
deallocate prop_match

GO

