

/*
 * Removed the with (tablock) on the update to shared_prop because it was causing locking problems
 * which prevented users from running this process during the day.  This was for Collin 04/05/2004.
 */

create procedure SharedPropertyMatch

	@lRunId int,
	@lYear int,
	@lSupNum int,
	@szCADCode varchar(5),
	@bMissingOverlapCADData bit,
	@bMultipleCADProperties bit,
	@bMultipleOverlapCADProperties bit,
	@bNoCADProperty bit,
	@szMatchUser varchar(30)

with recompile
as

set nocount on


declare @lRecordId int
declare @szSendingId varchar(35)
declare @szReceivingId varchar(35)
declare @szVendorCode varchar(20)
declare @szSupplement varchar(12)
declare @szSupCd varchar(10)
declare @szSupComment varchar(100)
declare @szGeoId varchar(50)
declare @szLegalDescription varchar(200)
declare @szOwnerName varchar(70)
declare @szAddress1 varchar(60)
declare @szAddress2 varchar(60)
declare @szAddress3 varchar(60)
declare @szCity varchar(50)
declare @szState varchar(50)
declare @szZip varchar(50)
declare @szSitusNumber varchar(10)
declare @szSitusStreet varchar(50)
declare @szSitusCity varchar(30)
declare @szSitusState varchar(2)
declare @szSitusZip varchar(10)
declare @szARBIndicator varchar(1)
declare @szARBDate varchar(10)
declare @szARBStatus varchar(5)
declare @fLandHS numeric(14,0)
declare @fLandNHS numeric(14,0)
declare @fAgUse numeric(14,0)
declare @fAgMarket numeric(14,0)
declare @fAgLoss numeric(14,0)
declare @fTimberUse numeric(14,0)
declare @fTimberMarket numeric(14,0)
declare @fTimberLoss numeric(14,0)
declare @fImpHS numeric(14,0)
declare @fImpNHS numeric(14,0)
declare @fMarket numeric(14,0)
declare @fAppraised numeric(14,0)
declare @fTenPercentCap numeric(14,0)
declare @fAssessed numeric(14,0)
declare @fImpNewValue numeric(14,0)
declare @fLandNewValue numeric(14,0)
declare @szProductivityCode varchar(10)
declare @fAcreage numeric(18,4)
declare @fAcreageLandHomesite numeric(18,4)
declare @fAcreageLandNonHomesite numeric(18,4)
declare @fAcreageAgriculture numeric(18,4)
declare @fAcreageTimber numeric(18,4)
declare @szMapId varchar(25)
declare @szImprvHSStateCd varchar(10)
declare @szImprvNHSStateCd varchar(10)
declare @szLandHSStateCd varchar(10)
declare @szLandNHSStateCd varchar(10)
declare @szLandAgStateCd varchar(10)
declare @szLandTimberStateCd varchar(10)
declare @szPersonalStateCd varchar(10)
declare @szMineralStateCd varchar(10)
declare @szAutoStateCd varchar(10)
declare @szImprvClass varchar(10)
declare @szPTDLandType varchar(10)
declare @szAppraiser varchar(10)
declare @fSalePrice numeric(14,0)
declare @szSaleDate varchar(25)
declare @szDeedVolume varchar(20)
declare @szDeedDate varchar(25)
declare @szDeedPage varchar(20)
declare @szExemptions varchar(50)
declare @szEntities varchar(50)
declare @szDBA varchar(50)
declare @szMultiOwner varchar(1)
declare @szExportDate varchar(10)

declare @pacs_prop_id int
declare @lCurrSupNum int
declare @prop_type_cd varchar(5)
declare @tape_run_dt varchar(10)
declare @deed_dt varchar(10)
declare @szMappedProductivityCode varchar(5)
declare @szMappedMineralStateCd varchar(5)
declare @szMappedPersonalStateCd varchar(5)
declare @szMappedAutoStateCd varchar(5)
declare @sales_dt varchar(10)
declare @arb_dt varchar(10)
declare @pacs_state_code varchar(5)
declare @pacs_productivity_code varchar(5)
declare @szValueMethod varchar(1)
declare @szOverlapValueMethod varchar(1)
declare @fCADMarket numeric(14,0)

declare @lCountCADProperties int
declare @lCountOverlapProperties int
declare @lCountSharedCAD int
declare @szDescription varchar(255)
declare @lTempPropId int
declare @szTempOverlapPropId varchar(35)

declare @current_appr_method varchar(1)
declare @appr_method varchar(1)
declare @cad_value_option varchar(1)
declare @cost_value numeric(14,0)
declare @income_value numeric(14,0)
declare @shared_prop_cad_code varchar(5)

declare @lNumRecords int
declare @fTotalMarket numeric(14,0)
declare @fTotalAppraised numeric(14,0)
declare @lNumMatches int
declare @lNumWarnings int
declare @lNumErrors int

declare @bEventCreated bit
declare @lError int
declare @next_event_id int


select @szOverlapValueMethod = value_option
from cad
where CAD_code = @szCADCode

declare curImport CURSOR FAST_FORWARD
for select lRecordId, szSendingId, szReceivingId, szVendorCode, szSupplement, szSupCd, szSupComment, szGeoId, szLegalDescription, 
			szOwnerName, szAddress1, szAddress2, szAddress3, szCity, szState, szZip, szSitusNumber,
			szSitusStreet, szSitusCity, szSitusState, szSitusZip, szARBIndicator, szARBDate,
			szARBStatus, fLandHS, fLandNHS, fAgUse, fAgMarket, fAgLoss, fTimberUse, fTimberMarket,
			fTimberLoss, fImpHS, fImpNHS, fMarket, fAppraised, fTenPercentCap, fAssessed,
			fImpNewValue, fLandNewValue, szProductivityCode, fAcreage, fAcreageLandHomesite,
			fAcreageLandNonHomesite, fAcreageAgriculture, fAcreageTimber, szMapId, szImprvHSStateCd,
			szImprvNHSStateCd, szLandHSStateCd, szLandNHSStateCd, szLandAgStateCd, szLandTimberStateCd,
			szPersonalStateCd, szMineralStateCd, szAutoStateCd, szImprvClass, szPTDLandType, szAppraiser, fSalePrice,
			szSaleDate, szDeedVolume, szDeedDate, szDeedPage, szExemptions, szEntities, szDBA, szMultiOwner,
			szExportDate
	from import_shared_prop_detail
	with (nolock)
	where lRunId = @lRunId
	order by lRecordId

open curImport

fetch next from curImport into @lRecordId, @szSendingId, @szReceivingId, @szVendorCode, @szSupplement, @szSupCd, @szSupComment, @szGeoId, @szLegalDescription, 
			@szOwnerName, @szAddress1, @szAddress2, @szAddress3, @szCity, @szState, @szZip, @szSitusNumber,
			@szSitusStreet, @szSitusCity, @szSitusState, @szSitusZip, @szARBIndicator, @szARBDate,
			@szARBStatus, @fLandHS, @fLandNHS, @fAgUse, @fAgMarket, @fAgLoss, @fTimberUse, @fTimberMarket,
			@fTimberLoss, @fImpHS, @fImpNHS, @fMarket, @fAppraised, @fTenPercentCap, @fAssessed,
			@fImpNewValue, @fLandNewValue, @szProductivityCode, @fAcreage, @fAcreageLandHomesite,
			@fAcreageLandNonHomesite, @fAcreageAgriculture, @fAcreageTimber, @szMapId, @szImprvHSStateCd,
			@szImprvNHSStateCd, @szLandHSStateCd, @szLandNHSStateCd, @szLandAgStateCd, @szLandTimberStateCd,
			@szPersonalStateCd, @szMineralStateCd, @szAutoStateCd, @szImprvClass, @szPTDLandType, @szAppraiser, @fSalePrice,
			@szSaleDate, @szDeedVolume, @szDeedDate, @szDeedPage, @szExemptions, @szEntities, @szDBA, @szMultiOwner,
			@szExportDate


set @lError = 0
set @bEventCreated = 0

while @@fetch_status = 0
begin
	set @pacs_prop_id  = 0
	set @lCountCADProperties = 0
	set @lCountOverlapProperties = 0

	if @szVendorCode = 'TA'
	begin
		if left(@szSendingId, 1) = '0'
		begin
			set @szSendingId = convert(varchar(30), convert(int, @szSendingId))
		end
	end

	select top 1 @pacs_prop_id = sp.pacs_prop_id,
			@prop_type_cd = rtrim(p.prop_type_cd)
	from shared_prop as sp
	with (nolock)
	join prop_supp_assoc as psa
	with (nolock)
	on sp.pacs_prop_id = psa.prop_id
	and sp.shared_year = psa.owner_tax_yr
	and sp.sup_num = psa.sup_num
	join property as p
	with (nolock)
	on sp.pacs_prop_id = p.prop_id
	where sp.shared_year = @lYear
	and sp.shared_cad_code = @szCADCode
	and sp.shared_prop_id = @szSendingId


	/*
	 * First check to see if there are errors.  If there are errors, do not touch the shared property.
	 */


	if isnull(@pacs_prop_id, 0) <> 0
	begin
		if @bMultipleCADProperties = 1
		begin
			select @lCountCADProperties = count(pacs_prop_id)
			from shared_prop as sp
			with (nolock)
			join prop_supp_assoc as psa
			with (nolock)
			on sp.pacs_prop_id = psa.prop_id
			and sp.shared_year = psa.owner_tax_yr
			and sp.sup_num = psa.sup_num
			where sp.shared_year = @lYear
			and sp.shared_cad_code = @szCADCode
			and sp.shared_prop_id = @szSendingId		
		
			if @lCountCADProperties > 1
			begin
				set @szDescription = 'The overlap CAD property matches to CAD properties: '
		
				declare curMultCAD cursor fast_forward
				for select pacs_prop_id
				from shared_prop as sp
				with (nolock)
				join prop_supp_assoc as psa
				with (nolock)
				on sp.pacs_prop_id = psa.prop_id
				and sp.shared_year = psa.owner_tax_yr
				and sp.sup_num = psa.sup_num
				where sp.shared_year = @lYear
				and sp.shared_cad_code = @szCADCode
				and sp.shared_prop_id = @szSendingId
		
				open curMultCAD
		
				fetch next from curMultCAD into @lTempPropId
		
				set @lCountCADProperties = 1
		
				while @@fetch_status = 0
				begin
					if @lCountCADProperties > 1
					begin
						set @szDescription = @szDescription + ', '
					end
		
					set @szDescription = @szDescription + convert(varchar(10), @lTempPropId)
		
					set @lCountCADProperties = @lCountCADProperties + 1
	
					fetch next from curMultCAD into @lTempPropId			
				end
		
				insert into import_shared_prop_warning
				(lRunId, lPACSPropId, szCADPropId, szGeoId, szOwnerName, szLegalDescription, szDescription)
				values
				(@lRunId, @pacs_prop_id, @szSendingId, @szGeoId, @szOwnerName, @szLegalDescription, left(@szDescription,255))
		
				close curMultCAD
				deallocate curMultCAD
			end
		end
	
		if @bMultipleOverlapCADProperties = 1
		begin
			select @lCountOverlapProperties = count(szSendingId)
			from import_shared_prop_detail
			with (nolock)
			where lRunId = @lRunId
			and szReceivingId = @szReceivingId
	
			if @lCountOverlapProperties > 1
			begin
				set @szDescription = 'The CAD property matched to overlap CAD properties: '
	
				declare curMultOverlap cursor fast_forward
				for select szSendingId
					from import_shared_prop_detail
					with (nolock)
					where lRunId = @lRunId
					and szReceivingId = @szReceivingId
	
				open curMultOverlap
	
				set @lCountOverlapProperties = 1
	
				fetch next from curMultOverlap into @szTempOverlapPropId
	
				while @@fetch_status = 0
				begin
					if @lCountOverlapProperties > 1
					begin
						set @szDescription = @szDescription + ', '
					end
	
					set @szDescription = @szDescription + @szTempOverlapPropId
	
					set @lCountOverlapProperties = @lCountOverlapProperties + 1
	
					fetch next from curMultOverlap into @szTempOverlapPropId
				end
	
				insert into import_shared_prop_warning
				(lRunId, lPACSPropId, szCADPropId, szGeoId, szOwnerName, szLegalDescription, szDescription)
				values
				(@lRunId, @pacs_prop_id, @szSendingId, @szGeoId, @szOwnerName, @szLegalDescription, left(@szDescription,255))
				
				close curMultOverlap
				deallocate curMultOverlap
			end
		end

		/*
		 * If the supplement number is not zero, that means that the property needs to be added to the
		 * supplement and the shared_prop* tables need to be copied to this supplement as well.  This
		 * all happens in CreatePropertySupplementLayer.
		 */

		if @lSupNum > 0
		begin
			select @lCurrSupNum = sup_num
			from prop_supp_assoc
			with (nolock)
			where prop_id = @pacs_prop_id
			and owner_tax_yr = @lYear

			if @lCurrSupNum <> @lSupNum
			begin
				exec CreatePropertySupplementLayer @pacs_prop_id, @lCurrSupNum, @lYear, @lSupNum, @lYear
			end
		end

		/*
		 * Dates should come in as mmddyyyy
		 * however, plan for mm/dd/yy, mm/dd/yyyy, mm-dd-yy, mm-dd-yyyy
		 */

		set @szExportDate = ltrim(rtrim(@szExportDate))
		set @tape_run_dt = null

		if charindex('-', @szExportDate, 1) > 0 or charindex('/', @szExportDate, 1) > 0
		begin
			set @tape_run_dt = @szExportDate
		end
		else
		begin
			if len(@szExportDate) = 6
			begin
				set @tape_run_dt = left(@szExportDate, 2) + '/' + substring(@szExportDate, 3, 2) + '/' + right(@szExportDate, 2)
			end
			else if len(@szExportDate) = 8
			begin
				set @tape_run_dt = left(@szExportDate, 2) + '/' + substring(@szExportDate, 3, 2) + '/' + right(@szExportDate, 4)
			end
		end

		set @szDeedDate = ltrim(rtrim(@szDeedDate))
		set @deed_dt = null

		if charindex('-', @szDeedDate, 1) > 0 or charindex('/', @szDeedDate, 1) > 0
		begin
			set @deed_dt = @szDeedDate
		end
		else
		begin
			if len(@szDeedDate) = 6
			begin
				set @deed_dt = left(@szDeedDate, 2) + '/' + substring(@szDeedDate, 3, 2) + '/' + right(@szDeedDate, 2)
			end
			else if len(@szDeedDate) = 8
			begin

				set @deed_dt = left(@szDeedDate, 2) + '/' + substring(@szDeedDate, 3, 2) + '/' + right(@szDeedDate, 4)
			end
		end

		set @szSaleDate = ltrim(rtrim(@szSaleDate))
		set @sales_dt = null

		if charindex('-', @szSaleDate, 1) > 0 or charindex('/', @szSaleDate, 1) > 0
		begin
			set @sales_dt = @szSaleDate
		end
		else
		begin
			if len(@szSaleDate) = 6
			begin
				set @sales_dt = left(@szSaleDate, 2) + '/' + substring(@szSaleDate, 3, 2) + '/' + right(@szSaleDate, 2)
			end
			else if len(@szSaleDate) = 8
			begin
				set @sales_dt = left(@szSaleDate, 2) + '/' + substring(@szSaleDate, 3, 2) + '/' + right(@szSaleDate, 4)
			end
		end

		set @szARBDate = ltrim(rtrim(@szARBDate))
		set @arb_dt = null

		if charindex('-', @szARBDate, 1) > 0 or charindex('/', @szARBDate, 1) > 0
		begin
			set @arb_dt = @szARBDate
		end
		else
		begin
			if len(@szARBDate) = 6
			begin
				set @arb_dt = left(@szARBDate, 2) + '/' + substring(@szARBDate, 3, 2) + '/' + right(@szARBDate, 2)
			end
			else if len(@szARBDate) = 8
			begin
				set @arb_dt = left(@szARBDate, 2) + '/' + substring(@szARBDate, 3, 2) + '/' + right(@szARBDate, 4)
			end
		end

		if ltrim(@szProductivityCode) <> ''
		begin
			select @pacs_productivity_code = rtrim(pacs_productivity_code)
			from cad_productivity_codes
			with (nolock)
			where cad_code = @szCADCode
			and cad_productivity_code = @szProductivityCode
		end
		else
		begin
			set @pacs_productivity_code = ''
		end

		if @prop_type_cd = 'P'
		begin
			select @szMappedPersonalStateCd = rtrim(pacs_state_code)
			from cad_state_codes
			with (nolock)
			where cad_code = @szCADCode
			and cad_state_code = @szPersonalStateCd
		end
		else
		begin
			set @szMappedPersonalStateCd = ''
		end

		if @prop_type_cd = 'MN'
		begin
			select @szMappedMineralStateCd = rtrim(pacs_state_code)
			from cad_state_codes
			with (nolock)
			where cad_code = @szCADCode
			and cad_state_code = @szMineralStateCd
		end
		else
		begin
			set @szMappedMineralStateCd = ''
		end

		if @prop_type_cd = 'A'
		begin
			select @szMappedAutoStateCd = rtrim(pacs_state_code)
			from cad_state_codes
			with (nolock)
			where cad_code = @szCADCode
			and cad_state_code = @szAutoStateCd
		end
		else
		begin
			set @szMappedAutoStateCd = ''
		end

		update shared_prop
--		with (tablock)
		set tape_run_dt = @tape_run_dt,
			tape_load_dt = convert(varchar(10), getdate(), 101),
			link_dt = getdate(),
			deed_dt = @deed_dt,
			situs_city = @szSitusCity,
			legal = @szLegalDescription,
			map_id = @szMapId,
			prev_tax_unfrozen = null,
			owner_name = @szOwnerName,
			owner_addr = null,
			owner_state = @szState,
			owner_zip = @szZip,
			ag_use = null,
			special_exmpt_entity_cd = null,
			situs_street_num = @szSitusNumber,
			dv_exemption_amount = null,
			cad_name = null,
			exmpt = @szExemptions,
			deed_volume = @szDeedVolume,
			ref_id = null,
			prorated_qualify_dt = null,
			prorated_remove_dt = null,
			arb_hearing_dt = null,
			oa_qual_dt = null,
			owner_addr2 = null,
			owner_city = @szCity,
			prorated_exmpt_flg = null,
			productivity_code = @pacs_productivity_code,
			oa_remove_dt = null,
			situs_zip = @szSitusZip,
			situs_state = @szSitusState,
			prev_tax_due = null,
			special_exmpt_amt = null,
			arb_indicator = @szARBIndicator,
			deed_page = @szDeedPage,
			special_exemption_cd = null,
			situs_street = @szSitusStreet,
			dba_name = @szDBA,
			new_hs_value = null,
			owner_addr_line1 = @szAddress1,
			owner_addr_line2 = @szAddress2,
			owner_addr_line3 = @szAddress3,
			cad_sup_num = convert(int, isnull(@szSupplement,0)),
			cad_sup_code = @szSupCd,
			num_imprv_segs = null,
			imprv_ptd_code = null,
			imprv_class = @szImprvClass,
			num_land_segs = null,
			land_ptd_code = null,
			size_acres = @fAcreage,
			mineral_ptd_code = @szMappedMineralStateCd,
			personal_ptd_code = @szMappedPersonalStateCd,
			entities = @szEntities,
			freeze_transfer_flag = null,
			transfer_pct = null,
			imprv_hs_val = @fImpHS,
			imprv_non_hs_val = @fImpNHS,
			land_hs = @fLandHS,
			land_non_hs = @fLandNHS,
			ag_market = @fAgMarket,
			timber_use = @fTimberUse,
			timber_market = @fTimberMarket,
			market = @fMarket,
			appraised_val = @fAppraised,
			cad_ten_percent_cap = @fTenPercentCap,
			cad_assessed_val = @fAssessed,
			arb_status = @szARBStatus,
			sales_dt = @sales_dt,
			sales_price = @fSalePrice,
			appraiser = @szAppraiser,
			cad_sup_comment = @szSupComment,
			exempt_prev_tax = null,
			exempt_prev_tax_unfrozen = null,
			ag_use_val = @fAgUse,
			multi_owner = @szMultiOwner,
			imp_new_value = @fImpNewValue,
			land_new_value = @fLandNewValue,
			run_id = @lRunId,
			arb_dt = @arb_dt,
			productivity_loss = @fAgMarket + @fTimberMarket - @fAgUse - @fTimberUse
		where pacs_prop_id = @pacs_prop_id
		and shared_prop_id = @szSendingId
		and shared_year = @lYear
		and shared_cad_code = @szCADCode
		and sup_num = @lSupNum

		delete from shared_prop_value
		where pacs_prop_id = @pacs_prop_id
		and shared_prop_id = @szSendingId
		and shared_year = @lYear
		and shared_cad_code = @szCADCode
		and sup_num = @lSupNum

		if @prop_type_cd in ('R', 'MH') 
		begin
			if @fLandHS > 0
			begin
				select @pacs_state_code = rtrim(pacs_state_code)
				from cad_state_codes
				with (nolock)
				where cad_code = @szCADCode
				and cad_state_code = @szLandHSStateCd
	
				insert into shared_prop_value
				(pacs_prop_id, shared_prop_id, shared_year, shared_cad_code, shared_value_id, state_code,
				shared_value, acres, record_type, homesite_flag, ag_use_value, sup_num)
				values
				(@pacs_prop_id, @szSendingId, @lYear, @szCADCode, 1, @pacs_state_code,
				@fLandHS, @fAcreageLandHomesite, 'L', 'T', 0, @lSupNum)
			end

			if @fLandNHS > 0
			begin
				select @pacs_state_code = rtrim(pacs_state_code)
				from cad_state_codes
				with (nolock)
				where cad_code = @szCADCode
				and cad_state_code = @szLandNHSStateCd

				insert into shared_prop_value
				(pacs_prop_id, shared_prop_id, shared_year, shared_cad_code, shared_value_id, state_code,
				shared_value, acres, record_type, homesite_flag, ag_use_value, sup_num)
				values
				(@pacs_prop_id, @szSendingId, @lYear, @szCADCode, 2, @pacs_state_code,
				@fLandNHS, @fAcreageLandNonHomesite, 'L', 'F', 0, @lSupNum)
			end

			if @fAgUse + @fAgMarket > 0
			begin
				select @pacs_state_code = rtrim(pacs_state_code)
				from cad_state_codes
				with (nolock)
				where cad_code = @szCADCode
				and cad_state_code = @szLandAgStateCd

				insert into shared_prop_value
				(pacs_prop_id, shared_prop_id, shared_year, shared_cad_code, shared_value_id, state_code,
				shared_value, acres, ag_use_code, record_type, homesite_flag, ag_use_value, sup_num)
				values
				(@pacs_prop_id, @szSendingId, @lYear, @szCADCode, 3, @pacs_state_code,
				@fAgMarket, @fAcreageAgriculture, @pacs_productivity_code, 'L', 'F', @fAgUse, @lSupNum)
			end

			if @fTimberUse + @fTimberMarket > 0 and @fAgUse + @fAgMarket = 0
			begin
				select @pacs_state_code = rtrim(pacs_state_code)
				from cad_state_codes
				with (nolock)
				where cad_code = @szCADCode
				and cad_state_code = @szLandTimberStateCd

				insert into shared_prop_value
				(pacs_prop_id, shared_prop_id, shared_year, shared_cad_code, shared_value_id, state_code,
				shared_value, acres, ag_use_code, record_type, homesite_flag, ag_use_value, sup_num)
				values
				(@pacs_prop_id, @szSendingId, @lYear, @szCADCode, 4, @pacs_state_code,
				@fTimberMarket, @fAcreageTimber, @pacs_productivity_code, 'L', 'F', @fTimberUse, @lSupNum)
			end

			if @fImpHS > 0
			begin
				select @pacs_state_code = rtrim(pacs_state_code)
				from cad_state_codes
				with (nolock)
				where cad_code = @szCADCode
				and cad_state_code = @szImprvHSStateCd

				insert into shared_prop_value
				(pacs_prop_id, shared_prop_id, shared_year, shared_cad_code, shared_value_id, state_code,
				shared_value, acres, record_type, homesite_flag, ag_use_value, sup_num)
				values
				(@pacs_prop_id, @szSendingId, @lYear, @szCADCode, 5, @pacs_state_code,
				@fImpHS, 0, 'I', 'T', 0, @lSupNum)
			end

			if @fImpNHS > 0
			begin
				select @pacs_state_code = rtrim(pacs_state_code)
				from cad_state_codes
				with (nolock)
				where cad_code = @szCADCode
				and cad_state_code = @szImprvNHSStateCd

				insert into shared_prop_value
				(pacs_prop_id, shared_prop_id, shared_year, shared_cad_code, shared_value_id, state_code,
				shared_value, acres, record_type, homesite_flag, ag_use_value, sup_num)
				values
				(@pacs_prop_id, @szSendingId, @lYear, @szCADCode, 6, @pacs_state_code,
				@fImpNHS, 0, 'I', 'F', 0, @lSupNum)
			end
		end

		if @prop_type_cd = 'P'
		begin
			insert into shared_prop_value
			(pacs_prop_id, shared_prop_id, shared_year, shared_cad_code, shared_value_id, state_code,
			shared_value, acres, record_type, homesite_flag, ag_use_value, sup_num)
			values
			(@pacs_prop_id, @szSendingId, @lYear, @szCADCode, 7, @szMappedPersonalStateCd,
			@fAssessed, 0, 'P', 'F', 0, @lSupNum)
		end

		if @prop_type_cd = 'A'
		begin
			insert into shared_prop_value
			(pacs_prop_id, shared_prop_id, shared_year, shared_cad_code, shared_value_id, state_code,
			shared_value, acres, record_type, homesite_flag, ag_use_value, sup_num)
			values
			(@pacs_prop_id, @szSendingId, @lYear, @szCADCode, 8, @szMappedAutoStateCd,
			@fAssessed, 0, 'A', 'F', 0, @lSupNum)
		end

		if @prop_type_cd = 'MN'
		begin
			insert into shared_prop_value
			(pacs_prop_id, shared_prop_id, shared_year, shared_cad_code, shared_value_id, state_code,
			shared_value, acres, record_type, homesite_flag, ag_use_value, sup_num)
			values
			(@pacs_prop_id, @szSendingId, @lYear, @szCADCode, 9, @szMappedMineralStateCd,
			@fAssessed, 0, 'MN', 'F', 0, @lSupNum)
		end

		select @fCADMarket = market,
				@current_appr_method = appr_method,
				@cad_value_option = isnull(cad_value_option,''),
				@cost_value = isnull(cost_value,0),
				@income_value = isnull(income_value,0)
		from property_val as pv
		with (nolock)
		join prop_supp_assoc as psa
		with (nolock)
		on pv.prop_id = psa.prop_id
		and pv.prop_val_yr = psa.owner_tax_yr
		and pv.sup_num = psa.sup_num
		where pv.prop_val_yr = @lYear
		and pv.prop_id = @pacs_prop_id

		/*
		 * Now that all the matching is complete, update the property_val columns/values
		 */

		set @appr_method = @current_appr_method

		if @szOverlapValueMethod = 'N'
		begin
			set @appr_method = 'S'
		end
		else if @szOverlapValueMethod = 'L'
		begin
			if @current_appr_method = 'S'
			begin
				if @cad_value_option = 'C'
				begin
					if @cost_value < @fAppraised
					begin
						set @appr_method = 'C'
					end
					else
					begin
						set @appr_method = 'S'
					end
				end
				else if @cad_value_option = 'I'
				begin
					if @income_value < @fAppraised
					begin
						set @appr_method = 'I'
					end
					else
					begin
						set @appr_method = 'S'
					end
				end
			end
			else if @current_appr_method = 'C'
			begin
				if @cost_value < @fAppraised
				begin
					set @appr_method = 'C'
				end
				else
				begin
					set @appr_method = 'S'
				end
			end
			else if @current_appr_method = 'I'
			begin
				if @income_value < @fAppraised
				begin
					set @appr_method = 'I'
				end
				else
				begin
					set @appr_method = 'S'
				end
			end
		end
		else if @szOverlapValueMethod = 'D'
		begin
			if @current_appr_method = 'S'
			begin
				if @cad_value_option in ('C','I')
				begin
					set @appr_method = @cad_value_option
				end
			end
		end

		insert into import_shared_prop_match
		(lRunId, lRecordId, lPACSPropId, szCADPropId, szGeoId, szLegalDescription, szOwnerName, szValueMethod,
		fCADMarket, fOverlapCADMarket, fDifference)
		values
		(@lRunId, @lRecordId, @pacs_prop_id, @szSendingId, @szGeoId, @szLegalDescription, @szOwnerName, @appr_method,
		@fCADMarket, @fMarket, @fCADMarket - @fMarket)

		set @lCountSharedCAD = 0

		/*
		 * If the appraisal method should be set to Shared and there is more than one
		 * overlapping CAD, this will create a warning to the user to set the correct
		 * overlapping CAD code and value.
		 */

		/*
		 * Change request made by Jon 04/22/2005 to allow the recalc process to update
		 * the overlap CAD value on the Values screen in a property.
		 */

		set @shared_prop_cad_code = @szCADCode

		if @appr_method = 'S'
		begin
			select @lCountSharedCAD = count(pacs_prop_id)
			from shared_prop as sp
			with (nolock)
			join prop_supp_assoc as psa
			with (nolock)
			on sp.pacs_prop_id = psa.prop_id
			and sp.shared_year = psa.owner_tax_yr
			and sp.sup_num = psa.sup_num
			where sp.pacs_prop_id = @pacs_prop_id
			and sp.shared_year = @lYear
			and sp.sup_num = @lSupNum
	
			if @lCountSharedCAD > 1
			begin
				set @shared_prop_cad_code = NULL

				set @szDescription = 'CAD property is shared by more than overlapping CAD.  The Shared CAD code and value must be set manually.'
				insert into import_shared_prop_warning
				(lRunId, lPACSPropId, szCADPropId, szGeoId, szOwnerName, szLegalDescription, szDescription)
				values
				(@lRunId, @pacs_prop_id, @szSendingId, @szGeoId, @szOwnerName, @szLegalDescription, @szDescription)
			end
		end

		update property_val
		set appr_method = @appr_method,
			shared_prop_cad_code = @shared_prop_cad_code
		where prop_id = @pacs_prop_id
		and prop_val_yr = @lYear
		and sup_num = @lSupNum
	end 
	else
	begin
		/*
		 * Error.  Overlap CAD has a property the CAD does not
		 */

		set @szDescription = 'The overlap CAD has a property the CAD does not.'

		insert into import_shared_prop_error
		(lRunId, lPACSPropId, szCADPropId, szGeoId, szLegalDescription, szOwnerName, szDescription)
		values
		(@lRunId, @pacs_prop_id, @szSendingId, @szGeoId, @szLegalDescription, @szOwnerName, @szDescription)
	end

	fetch next from curImport into @lRecordId, @szSendingId, @szReceivingId, @szVendorCode, @szSupplement, @szSupCd, @szSupComment, @szGeoId, @szLegalDescription, 
			@szOwnerName, @szAddress1, @szAddress2, @szAddress3, @szCity, @szState, @szZip, @szSitusNumber,
			@szSitusStreet, @szSitusCity, @szSitusState, @szSitusZip, @szARBIndicator, @szARBDate,
			@szARBStatus, @fLandHS, @fLandNHS, @fAgUse, @fAgMarket, @fAgLoss, @fTimberUse, @fTimberMarket,
			@fTimberLoss, @fImpHS, @fImpNHS, @fMarket, @fAppraised, @fTenPercentCap, @fAssessed,
			@fImpNewValue, @fLandNewValue, @szProductivityCode, @fAcreage, @fAcreageLandHomesite,
			@fAcreageLandNonHomesite, @fAcreageAgriculture, @fAcreageTimber, @szMapId, @szImprvHSStateCd,
			@szImprvNHSStateCd, @szLandHSStateCd, @szLandNHSStateCd, @szLandAgStateCd, @szLandTimberStateCd,
			@szPersonalStateCd, @szMineralStateCd, @szAutoStateCd, @szImprvClass, @szPTDLandType, @szAppraiser, @fSalePrice,
			@szSaleDate, @szDeedVolume, @szDeedDate, @szDeedPage, @szExemptions, @szEntities, @szDBA,
			@szMultiOwner, @szExportDate
end

close curImport
deallocate curImport

/*
 * Ok, now check for The CAD has overlap property information, but did not receive
 * any data from the overlap CAD error.
 */

if @bMissingOverlapCADData = 1
begin
	declare curNoData cursor fast_forward
	for select distinct pacs_prop_id, shared_prop_id, p.geo_id, pv.legal_desc, a.file_as_name
		from shared_prop as sp
		with (nolock)
		join prop_supp_assoc as psa
		with (nolock)
		on sp.pacs_prop_id = psa.prop_id
		and sp.shared_year = psa.owner_tax_yr
		and sp.sup_num = psa.sup_num
		join property as p
		with (nolock)
		on sp.pacs_prop_id = p.prop_id
		join property_val as pv
		with (nolock)
		on sp.pacs_prop_id = pv.prop_id
		and sp.shared_year = pv.prop_val_yr
		and sp.sup_num = pv.sup_num
		join owner as o
		with (nolock)
		on sp.pacs_prop_id = o.prop_id
		and sp.shared_year = o.owner_tax_yr
		and sp.sup_num = o.sup_num
		join account as a
		with (nolock)
		on o.owner_id = a.acct_id

		where sp.shared_year = @lYear
		and sp.shared_cad_code = @szCADCode
		and shared_prop_id not in (select case when szVendorCode = 'TA' then convert(varchar(30),convert(int,szSendingId)) else szSendingId end
									from import_shared_prop_detail
									with (nolock)
									where lRunId = @lRunId)
	
	open curNoData
	
	fetch next from curNoData into @pacs_prop_id, @szTempOverlapPropId, @szGeoId, @szLegalDescription, @szOwnerName
	
	set @szDescription = 'No data received for CAD property: '
	
	while @@fetch_status = 0
	begin
		insert into import_shared_prop_error
		(lRunId, lPACSPropId, szCADPropId, szGeoId, szLegalDescription, szOwnerName, szDescription)
		values
		(@lRunId, @pacs_prop_id, @szTempOverlapPropId, @szGeoId, @szLegalDescription, @szOwnerName, @szDescription + convert(varchar(10), @pacs_prop_id))
	
		fetch next from curNoData into @pacs_prop_id, @szTempOverlapPropId, @szGeoId, @szLegalDescription, @szOwnerName
	end
	
	close curNoData
	deallocate curNoData
end

if @@error = 0
begin
	/*
	 * Create the event for the each property that matched
	 */

	exec dbo.GetUniqueID 'event', @next_event_id output, 1, 0
	
	insert into event
	(event_id, system_type, event_type, event_date, pacs_user, event_desc)
	values
	(@next_event_id, 'A', 'ISPD', getdate(), @szMatchUser,
	 'Imported from CAD: ' + @szCADCode + ', Run Id: ' + convert(varchar(10), @lRunId) + ' on ' + convert(varchar(10), getdate(), 101))

	insert into prop_event_assoc
	(prop_id, event_id)
	select distinct lPACSPropID, @next_event_id
	from import_shared_prop_match
	with (nolock)
	where lRunId = @lRunId


	/*
	 * determine the counts for matches, errors and warnings
	 */

	select @lNumMatches = count(lRunId)
	from import_shared_prop_match
	with (nolock)
	where lRunId = @lRunId
	
	select @lNumWarnings = count(lRunId)
	from import_shared_prop_warning
	with (nolock)
	where lRunId = @lRunId
	
	select @lNumErrors = count(lRunId)
	from import_shared_prop_error
	with (nolock)
	where lRunId = @lRunId

	update import_shared_prop
	set szStatus = 'M',
		dtStatus = getdate(),
		szMatchUser = @szMatchUser,
		lSupplement = @lSupNum,
		lNumMatches = @lNumMatches,
		lNumWarnings = @lNumWarnings,
		lNumErrors = @lNumErrors,
		bMissingOverlapCADData = @bMissingOverlapCADData,
		bMultipleCADProperties = @bMultipleCADProperties,
		bMultipleOverlapCADProperties = @bMultipleOverlapCADProperties,
		bNoCADProperty = @bNoCADProperty
	where lRunId = @lRunId
end

GO

