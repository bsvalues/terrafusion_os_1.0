
CREATE PROCEDURE [dbo].[CreateNewYearLayer]

@input_from_year	int,
@input_to_year		int,
@input_include_future_year_layer varchar(1),

@input_delprop_real bit,
@input_delprop_mh bit,
@input_delprop_mn bit,
@input_delprop_personal bit,
@input_delprop_auto bit,

@input_noncadappr_mark_inactive_real bit,
@input_noncadappr_mark_inactive_mh bit,
@input_noncadappr_mark_inactive_mn bit,
@input_noncadappr_mark_inactive_personal bit,
@input_noncadappr_mark_inactive_auto bit,

@input_bpp_rendered_to_flat bit,
@input_HOF numeric(14,0),

@copy_preliminary bit

as
/* Top of each procedure to capture input parameters */
 SET NOCOUNT ON

DECLARE @ErrorMessage NVARCHAR(4000);
DECLARE @ErrorSeverity INT;
DECLARE @ErrorState INT;

 DECLARE @i varchar(50), @qry varchar(255) 
 CREATE TABLE #inputbuffer 
 ( 
  EventType varchar(30), 
  EventParm smallint, 
  EventInfo nvarchar(4000) 
 ) 
 -- this will capture the procedure name and parameter values
 -- up to 255 characters
 SET @i = 'DBCC INPUTBUFFER(' + STR(@@SPID) + ') WITH NO_INFOMSGS' 
 INSERT INTO #inputbuffer 
 EXEC (@i) 
 SET @qry = LEFT('Start - ' + (SELECT EventInfo FROM #inputbuffer), 255)
 drop table #inputbuffer
 declare @proc varchar(500)
 set @proc = object_name(@@procid)
 exec dbo.CurrentActivityLogInsert @proc, @qry

/* End top of each procedure to capture parameters */


/* turn off logging */
exec SetMachineLogChanges 0

-- call Undo to thoroughly remove any existing records in the target year
exec dbo.CurrentActivityLogInsert @proc, 'Prepare new year layer Start',@@Rowcount,@@ERROR

BEGIN TRY
	exec UndoCreateNewYearLayer @input_to_year
END TRY
BEGIN CATCH
	SELECT @ErrorMessage = ERROR_MESSAGE(), @ErrorSeverity = ERROR_SEVERITY(), @ErrorState = ERROR_STATE();
	RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);       
	return -1
END CATCH
 

exec dbo.CurrentActivityLogInsert @proc, 'CreateScheduleLayer Start',@@Rowcount,@@ERROR

BEGIN TRY
	exec CreateScheduleLayer @input_from_year, @input_to_year
END TRY
BEGIN CATCH
	SELECT @ErrorMessage = ERROR_MESSAGE(), @ErrorSeverity = ERROR_SEVERITY(), @ErrorState = ERROR_STATE();
	RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
           
	return -1
END CATCH

exec dbo.CurrentActivityLogInsert @proc, 'CreateTaxRateLayer Start',@@Rowcount,@@ERROR
-- moved here by jcoco
BEGIN TRY
	exec CreateTaxRateLayer  @input_from_year, @input_to_year
END TRY
BEGIN CATCH
	SELECT @ErrorMessage = ERROR_MESSAGE(), @ErrorSeverity = ERROR_SEVERITY(), @ErrorState = ERROR_STATE();
	RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
           
	return -1
END CATCH

exec dbo.CurrentActivityLogInsert @proc, 'drop indices Start',@@Rowcount,@@ERROR

-- EPA indices
if exists (
	select id
	from sysindexes
	where
		id = object_id('entity_prop_assoc') and
		name = 'idx_prop_id'
)
begin
	exec('drop index entity_prop_assoc.idx_prop_id')
end


-- Feature indices
if exists (
	select id
	from sysindexes
	where
		id = object_id('imprv_attr') and
		name = 'idx_prop_id'
)
begin
	exec('drop index imprv_attr.idx_prop_id')
end

-- Improv detail indices
if exists (
	select id
	from sysindexes
	where
		id = object_id('imprv_detail') and
		name = 'idx_prop_id'
)
begin
	exec('drop index imprv_detail.idx_prop_id')
end

if exists (
	select id
	from sysindexes
	where
		id = object_id('imprv_detail') and
		name = 'idx_condition_cd'
)
begin
	exec('drop index imprv_detail.idx_condition_cd')
end

if exists (
	select id
	from sysindexes
	where
		id = object_id('imprv_detail') and
		name = 'idx_imprv_det_class_cd'
)
begin
	exec('drop index imprv_detail.idx_imprv_det_class_cd')
end

if exists (
	select id
	from sysindexes
	where
		id = object_id('imprv_detail') and
		name = 'idx_imprv_det_meth_cd'
)
begin
	exec('drop index imprv_detail.idx_imprv_det_meth_cd')
end

if exists (
	select id
	from sysindexes
	where
		id = object_id('imprv_detail') and
		name = 'idx_imprv_det_type_cd'
)
begin
	exec('drop index imprv_detail.idx_imprv_det_type_cd')
end

if exists (
	select id
	from sysindexes
	where
		id = object_id('imprv_detail') and
		name = 'idx_ref_id1'
)
begin
	exec('drop index imprv_detail.idx_ref_id1')
end


if (@input_include_future_year_layer = 'Y')
begin
/*	If the Future Year Layer is being included, then we merge the
	neighborhood and abs_subdv tables into the New Year Layer.
	Since the data from @input_from_year  takes precedence over
	the data from the Future Year Layer for these two tables, we
	merge the data from Future Year Layer AFTER the data from
	@input_from_year was put in the New Year Layer by the preceding
	step (CreateScheduleLayer @input_from_year, @input_to_year).
*/
    exec dbo.CurrentActivityLogInsert @proc, 'neighborhood insert Start',@@Rowcount,@@ERROR

	insert into neighborhood
	(
		hood_cd,
		hood_yr,
		hood_name,
		hood_land_pct,
		hood_imprv_pct,
		sys_flag,
		changed_flag,
		reappraisal_status,
		life_cycle,
		phys_comment,
		eco_comment,
		gov_comment,
		soc_comment,
		inactive,
		inactive_date,
		created_date,
		cycle,
		nbhd_descr,
		nbhd_comment,
		ls_id,
		appraiser_id
	)
	select
		hood_cd,
		@input_to_year,
		hood_name,
		hood_land_pct,
		hood_imprv_pct,
		sys_flag,
		changed_flag,
		reappraisal_status,
		life_cycle,
		phys_comment,
		eco_comment,
		gov_comment,
		soc_comment,
		inactive,
		inactive_date,
		created_date,
		cycle,
		nbhd_descr,
		nbhd_comment,
		ls_id,
		appraiser_id
	from neighborhood
	where hood_yr = 0
	and not exists (
				select *
				from neighborhood as n1
				where n1.hood_yr   = @input_to_year
				and  n1.hood_cd    = neighborhood.hood_cd
			)

    exec dbo.CurrentActivityLogInsert @proc, 'abs_subdv insert Start',@@Rowcount,@@ERROR

	insert into abs_subdv
	(
		abs_subdv_cd,
		abs_subdv_yr,
		abs_subdv_desc,
		abs_land_pct,
		abs_imprv_pct,
		abs_subdv_ind,
		sys_flag,
		changed_flag,
        cInCounty,
        bActive,
        ls_id,
        active_year,
        create_date
	)
	select
		abs_subdv_cd,
		@input_to_year,
		abs_subdv_desc,
		abs_land_pct,
		abs_imprv_pct,
		abs_subdv_ind,
		sys_flag,
		changed_flag,
        cInCounty,
        bActive,
        ls_id,
        active_year,
        create_date
	from abs_subdv
	where abs_subdv_yr = 0
	and not exists (
				select *
				from abs_subdv as as1
				where as1.abs_subdv_yr   = @input_to_year
				and  as1.abs_subdv_cd    = abs_subdv.abs_subdv_cd
			)

/*	If the Future Year Layer is being included, then the Property Layer
	created from the Future Year Layer takes precedence over the
	Property Layer from @input_from_year.  For each property, the data
	comes exclusively from either the Future Year Layer or from @input_from_year.
	There is no merge of data for individual properties, as there is for
	the neighborhood and abs_subdv tables.

	The "Include Deleted Properties" flag is not relevant for the Future Year Layer.
	Deleted properties must be included from  the Future Year Layer.
*/
--	exec CreatePropertyLayer 0, @input_to_year, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, @input_HOF, @copy_preliminary
end

exec dbo.CurrentActivityLogInsert @proc, 'CreatePropertyLayer',@@Rowcount,@@ERROR

BEGIN TRY
	exec CreatePropertyLayer @input_include_future_year_layer, @input_from_year, @input_to_year,
		@input_delprop_real, @input_delprop_mh, @input_delprop_mn, @input_delprop_personal, @input_delprop_auto,
		@input_noncadappr_mark_inactive_real, @input_noncadappr_mark_inactive_mh, @input_noncadappr_mark_inactive_mn, @input_noncadappr_mark_inactive_personal, @input_noncadappr_mark_inactive_auto,
		@input_bpp_rendered_to_flat, @input_HOF, @copy_preliminary
END TRY
BEGIN CATCH
	SELECT @ErrorMessage = ERROR_MESSAGE(), @ErrorSeverity = ERROR_SEVERITY(), @ErrorState = ERROR_STATE();
	RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
           
	return -1
END CATCH

exec dbo.CurrentActivityLogInsert @proc, 'Create entity_prop_assoc index',@@Rowcount,@@ERROR
create nonclustered index idx_prop_id on entity_prop_assoc(prop_id) with fillfactor = 90

exec dbo.CurrentActivityLogInsert @proc, 'Create imprv_attr index',@@Rowcount,@@ERROR
create nonclustered index idx_prop_id on imprv_attr(prop_id) with fillfactor = 90

exec dbo.CurrentActivityLogInsert @proc, 'Create imprv_detail(prop_id) index',@@Rowcount,@@ERROR

create nonclustered index idx_prop_id on imprv_detail(prop_id) with fillfactor = 90
exec dbo.CurrentActivityLogInsert @proc, 'Create imprv_detail(prop_id) index',@@Rowcount,@@ERROR

exec dbo.CurrentActivityLogInsert @proc, 'Create imprv_detail(condition_cd) index',@@Rowcount,@@ERROR
create nonclustered index idx_condition_cd on imprv_detail(condition_cd) with fillfactor = 90

exec dbo.CurrentActivityLogInsert @proc, 'Create imprv_detail(imprv_det_class_cd) index',@@Rowcount,@@ERROR
create nonclustered index idx_imprv_det_class_cd on imprv_detail(imprv_det_class_cd) with fillfactor = 90

exec dbo.CurrentActivityLogInsert @proc, 'Create imprv_detail(imprv_det_meth_cd) index',@@Rowcount,@@ERROR
create nonclustered index idx_imprv_det_meth_cd on imprv_detail(imprv_det_meth_cd) with fillfactor = 90

exec dbo.CurrentActivityLogInsert @proc, 'Create imprv_detail(imprv_det_type_cd) index',@@Rowcount,@@ERROR
create nonclustered index idx_imprv_det_type_cd on imprv_detail(imprv_det_type_cd) with fillfactor = 90

exec dbo.CurrentActivityLogInsert @proc, 'Create imprv_detail(ref_id1) index',@@Rowcount,@@ERROR
create nonclustered index idx_ref_id1 on imprv_detail(ref_id1) with fillfactor = 90

--Now populate the property_profile records
BEGIN TRY
	exec CreatePropertyLayer_property_profile @input_from_year, @input_to_year, 'CreateNewYearLayer'
END TRY
BEGIN CATCH
	SELECT @ErrorMessage = ERROR_MESSAGE(), @ErrorSeverity = ERROR_SEVERITY(), @ErrorState = ERROR_STATE();
	RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
           
	return -1
END CATCH

/* lease layer */
declare @lease_flag bit

SELECT @lease_flag = lease_flag
FROM pacs_system
WHERE system_type IN ('A', 'B')

IF @lease_flag = 1
BEGIN
    exec dbo.CurrentActivityLogInsert @proc, 'CreateLeaseLayer Start',@@Rowcount,@@ERROR
	BEGIN TRY
		exec CreateLeaseLayer @input_from_year, @input_to_year
	END TRY
	BEGIN CATCH
		SELECT @ErrorMessage = ERROR_MESSAGE(), @ErrorSeverity = ERROR_SEVERITY(), @ErrorState = ERROR_STATE();
		RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
           
		return -1
	END CATCH		
END

-- master lease groups
exec dbo.CurrentActivityLogInsert @proc, 'CopyMasterLeaseGroups Start',@@Rowcount,@@ERROR
BEGIN TRY
	exec CopyMasterLeaseGroups @input_from_year, @input_to_year
END TRY
BEGIN CATCH
	SELECT @ErrorMessage = ERROR_MESSAGE(), @ErrorSeverity = ERROR_SEVERITY(), @ErrorState = ERROR_STATE();
	RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
           
	return -1
END CATCH

-- Create an Overpayment Credit code for the new year
if not exists (select 1 from refund_type where year = @input_to_year and refund_type_cd = 'OC')
begin
	insert refund_type (year, refund_type_cd, refund_reason, core_refund_type)
	values (@input_to_year, 'OC', 'Overpayment Credit', 1)
end

-- Set all user options for the property search dialog to use the new year as the default search year
update
	pacs_user_settings set value = @input_to_year
where 
	settings_group = 'PROPERTYSEARCHSETTINGS' and name = 'PROPERTYSEARCHSETTINGS_YEAR'

-- If the Marshall & Swift commercial or residential is enabled, make sure it is in the
-- new year layer
declare @commercial_enabled bit
declare @residential_enabled bit

select @commercial_enabled = isnull(commercial_enabled,0),
		@residential_enabled = isnull(residential_enabled,0)
from ms_config
with (nolock)
where [year] = @input_from_year

set @commercial_enabled = isnull(@commercial_enabled,0)
set @residential_enabled = isnull(@residential_enabled,0)

if not exists(select [year]
				from ms_config
				with (nolock)
				where [year] = @input_to_year)
begin
	insert ms_config
	([year])
	values
	(@input_to_year)
end

update ms_config
set commercial_enabled = @commercial_enabled,
	residential_enabled = @residential_enabled
where [year] = @input_to_year

-- Copy the dor_report_config  Stratification Settings

insert dor_report_config
([year], [type], exclude_current_use, sale_date_begin, sale_date_end, use_custom_stratum, custom_stratum_name)

select @input_to_year, drc.[type], drc.exclude_current_use, 
			dateadd(year, 1, drc.sale_date_begin), 
			dateadd(year, 1, drc.sale_date_end),
			use_custom_stratum,
			custom_stratum_name
from dor_report_config as drc
with (nolock)
where drc.[year] = @input_from_year
and not exists(select [year]
								from dor_report_config
								with (nolock)
								where [year] = @input_to_year
								and [type] = drc.[type])
								
insert dor_report_config_stratum
([year], [type], stratum_id, group_type, begin_value,
 end_value, sample_frequency, sample_start)

select @input_to_year, drcs.[type], drcs.stratum_id, drcs.group_type, drcs.begin_value,
			drcs.end_value, drcs.sample_frequency, drcs.sample_start
from dor_report_config_stratum as drcs
with (nolock)
where drcs.[year] = @input_from_year
and not exists(select [year]
							from dor_report_config_stratum
							with (nolock)
							where [year] = @input_to_year
							and [type] = drcs.[type])
								
insert dor_report_config_stratum_use_codes
([year], [type], group_type, property_use_cd)

select @input_to_year, drcsuc.[type], drcsuc.group_type, drcsuc.property_use_cd
from dor_report_config_stratum_use_codes as drcsuc
with (nolock)
where drcsuc.[year] = @input_from_year
and not exists(select [year]
							from dor_report_config_stratum_use_codes
							with (nolock)
							where [year] = @input_to_year
							and [type] = drcsuc.[type])


--Copy over wa_tax_statement_config data from current to future year
insert wa_tax_statement_config 
(statement_option, [year], print_on_back_option, [message], print_levy_details,
 print_levy_rates, print_taxable_value, print_addr_change)

(select statement_option, @input_to_year as [year], print_on_back_option, [message],
	 print_levy_details, print_levy_rates, print_taxable_value, print_addr_change 
from wa_tax_statement_config as wtsg
with (nolock)
where [year] = @input_from_year
and not exists(select [year]
							from wa_tax_statement_config
							with (nolock)
							where [year] = @input_to_year
							and [statement_option] = wtsg.statement_option))

-- Copy pacs_config_year settings for Levy Certification
insert pacs_config_year
([year], szGroup, szConfigName, szConfigValue)

select @input_to_year, szGroup, szConfigName, szConfigValue
from pacs_config_year as pcy
with (nolock)
where [year] = @input_from_year
and not exists(select [year]
								from pacs_config_year
								with (nolock)
								where [year] = @input_to_year
								and szGroup = pcy.szGroup
								and szConfigName = pcy.szConfigName)


update pacs_system
set appr_yr = @input_to_year

/* turn on logging */
exec SetMachineLogChanges 1

-- rebuild fragmented indexes caused by New Year Layer processing
exec dbo.sp_RebuildIndexes

-- update activity log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@@Rowcount,@@ERROR

--INDICATES NO ERRORS, RESPONSE HANDLED BY THE MIDDLE TIER
return 0

GO

