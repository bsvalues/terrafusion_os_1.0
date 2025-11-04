
create procedure [dbo].CreatePropertySupplementLayer
	@input_prop_id int,
	@input_current_supp int,
	@input_tax_yr numeric(4,0),
	@input_new_supp int,
	@input_new_yr numeric(4,0),
	@input_new_prop_id int = @input_prop_id,
	@input_from_supp char(1) = 'F',
	@input_new_lease_id varchar(20) = '',
	@split_merge_flag bit = 0,
	@bImportPropertyProfile bit = 1,	-- This parameter is not used / ignored
	@szPropType				char(5) = null,	-- If the caller knows the value, it should be passed so this sp doesn't have to query for it
	@bForceKeepLandImprvIDs bit = 0,	--Used to force it to keep same land/imprv ids even if prop ids differ
	@bCopyImprvLandSalesInfo bit = 0	-- If set to 1, then LayerCopyImprovement/Land will copy sale_id records too.

as

set nocount on

--Revision History
--1.0 Created
--1.1 ELZ 01/12/2003; SetPrevSupNum stored proc created and logic added to update property_val.prev_sup_num
--1.1 TrentN 02/20/2004; Updated for new fields in entity_prop_assoc and new tables imprv_entity_assoc, land_entity_assoc, and pers_prop_entity_assoc
--1.3 RossK  02/24/2004  Added pp_rendition_tracking dor SB340
--1.4 TrentN 03/03/2004  Updated for new fields in property_exemption, property_special_entity_exemption, transfer_appaisal_info
--			 Updated for new database tables imprv_exemption_assoc, land_exemption_assoc, pers_prop_exemption_assoc
--1.5 AndrewL 03/10/2004 changes to property_val to add reviewed_dt and reviewed_appraiser
--1.6 RossK 02/05/2004  added HB703 Shared_prop & share_prop_value Supplemented records.  Added shared_other_val to property_val
--1.7 RossK 02/06/2004  added sup_num to shared_prop_values and added insert of pp_rendition_tracking
--1.8 RossK 02/12/2004  updated pp_rendition where clause from Chris's e-mail
--1.9 RossK 02/17/2004  updated pp_rendition where clause changed @input_new_year to @input_tax_year
--1.10 RossK 03/03/2004  Added Personal Property Sub Segments
--1.11 RonaldC 03/24/2004 Added ARB Value distribution fields 'property_val','imprv','land_detail', 'pers_prop_seg'
--2.0 TrentN 04/06/2004  Added entries to imprv_detail and imprv_attr
--2.1 RichA 12/03/2004  Prevent adding entities to years where there is no tax_rate set up.  If a new entity
--			was created in 2004, do not create it in 2003.

--2.2 JamesW 2005-01-08 Performance & concurrency enhancements
--2.3 RossK	2005-02-22  added  hscap_base_yr_override  hscap_override_newhsval_flag	condo_pct last_pacs_user_id
--2.4 Rec   2005-03-23 added copy dist_val for tables property_val, imprv, land_detail, pers_prop_seg
--2.5 TrentN 04/20/2005 Made changes for the Timber 78 project.
--2.6 Rossk  10/05/2005 30272 Shared property change.
--2.7 JeremyS 2005.10.21	Added hs_pct and hs_pct_override to imprv,land_detail, and shared_prop_value (hs_pct only)
--2.8 HenryM 2006.02.01		Added pp_sq_ft and pp_rentable_sq_ft_rate to property_val
--2.9 JeremyS 2005.02.14		Added pp_new_val_override and pp_new_val_yr_override to pers_prop_seg
--2.10 RichA 09/17/2007  Added property_assoc (now year/sup_num based) only if prop_id is same
--2.11 StephenE 07/16/2008 Added flag to allow copying from one prop id to another to keep land/imprv ids - supports splits/merges
--2.12 StephenE 07/21/2008 Removed call to LayerCopyPropertyAssoc - LayerCopyMain already calls it

-- Perform the layer copy in a try-catch block and a transaction, so that errors can be
-- caught and rolled up even if they occur in sub-procedures.
begin try
begin tran


if ( @szPropType is null )
begin
	select @szPropType = prop_type_cd
	from property with(nolock)
	where prop_id = @input_prop_id
end


/* turn off logging */
if (@input_from_supp = 'T')
begin
	exec dbo.SetMachineLogChanges 0
end


-- Copy property, property_val, entity_prop_assoc, owner, psa update
exec dbo.LayerCopyMain
	-- From
	@input_tax_yr,
	@input_current_supp,
	@input_prop_id,
	-- To
	@input_new_yr,
	@input_new_supp,
	@input_new_prop_id




exec dbo.LayerCopyExemption
	-- From
	@input_tax_yr,
	@input_current_supp,
	@input_prop_id,
	-- To
	@input_new_yr,
	@input_new_supp,
	@input_new_prop_id,
	null, -- All owners
	null, -- Same destination owner_id
	null, -- All exemption type codes
	0 -- Do not need to first check that the destination doesn't exist


exec dbo.LayerCopyShared
	-- From
	@input_tax_yr,
	@input_current_supp,
	@input_prop_id,
	-- To
	@input_new_yr,
	@input_new_supp,
	@input_new_prop_id


if ( @input_prop_id = @input_new_prop_id and @input_tax_yr <> @input_new_yr ) -- Same PID, different year
begin
	exec dbo.LayerCopyTableAgentAssoc
		-- From
		@input_tax_yr,
		@input_prop_id,
		-- To
		@input_new_yr,
		@input_new_prop_id,
		null
end

if ( @szPropType in ('R','MH') )
begin
	exec dbo.LayerCopyImprovement
		-- From
		@input_tax_yr,
		@input_current_supp,
		0,
		@input_prop_id,
		-- To
		@input_new_yr,
		@input_new_supp,
		0,
		@input_new_prop_id,
		0, -- Assign new IDs
		null, -- All improvements
		null, -- All details of course
		0, 0, 0, -- Skip entity/exemption/owner assoc
		null, -- All owners
		null, -- no special method
		@bForceKeepLandImprvIDs,
		@bCopyImprvLandSalesInfo

	exec dbo.LayerCopyLand
		-- From
		@input_tax_yr,
		@input_current_supp,
		0,
		@input_prop_id,
		-- To
		@input_new_yr,
		@input_new_supp,
		0,
		@input_new_prop_id,
		0, -- Assign new IDs
		null, -- All land segments
		0, 0, 0, -- Skip entity/exemption/owner assoc
		null, -- All owners
		null, -- no special method
		@bForceKeepLandImprvIDs,
		@bCopyImprvLandSalesInfo

	exec dbo.LayerCopyIncome
		-- From
		@input_tax_yr,
		@input_current_supp,
		@input_prop_id,
		-- To
		@input_new_yr,
		@input_new_supp,
		@input_new_prop_id
end
else if ( @szPropType in ('P','A') )
begin
	exec dbo.LayerCopyPersonal
		-- From
		@input_tax_yr,
		@input_current_supp,
		@input_prop_id,
		-- To
		@input_new_yr,
		@input_new_supp,
		@input_new_prop_id,
		0, -- Assign new IDs
		null, -- All segments
		0, 0, 0, -- Skip entity/exemption/owner assoc
		null -- All owners


	exec dbo.LayerCopyRendition
		-- From
		@input_tax_yr,
		@input_current_supp,
		@input_prop_id,
		-- To
		@input_new_yr,
		@input_new_supp,
		@input_new_prop_id,
		0, 0 -- Skip tracking/penalty tables
end
else -- Mineral
begin
	exec dbo.LayerCopyLease
		-- From
		@input_tax_yr,
		@input_current_supp,
		@input_prop_id,
		-- To
		@input_new_yr,
		@input_new_supp,
		@input_new_prop_id,
		@input_new_lease_id
end


-- turn on logging
if (@input_from_supp = 'T')
begin
	exec dbo.SetMachineLogChanges 1
end


-- If an error is caught, roll back the transaction.
-- Then, raise the error again so it will appear in the PACS client.
commit tran
end try

begin catch
	if @@trancount > 0 rollback tran;

	declare @ErrorMessage nvarchar(max);
	declare @ErrorSeverity int;
	declare @ErrorState int;

	select @ErrorMessage = error_message(),
		@ErrorSeverity = error_severity(),
		@ErrorState = error_state()

	raiserror(@ErrorMessage, @ErrorSeverity, @ErrorState)
end catch

GO

