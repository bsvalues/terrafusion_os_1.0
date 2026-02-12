
CREATE PROCEDURE ExportSelectSharedPropertyData

	@lYear int,
	@lSupplement int,
	@szSharedCAD varchar(5),
	@szEntities varchar(500),
	@szQuery varchar(5000),
	@szPropertyTypes varchar(50),
	@szBeginDate varchar(10),
	@szEndDate varchar(10),
	@szOptionalSharedCAD varchar(5),
	@szExportTableName varchar(255),
	@lPACSUserId int

with recompile
as

set nocount on



declare @lPropID int
declare @lSharedPropID int
declare @lSupNum int
declare @szARBIndicator varchar(1)
declare @szARBDate datetime
declare @szARBStatus varchar(5)

declare @szOwnerName varchar(70)
declare @szAddress1 varchar(60)
declare @szAddress2 varchar(60)
declare @szAddress3 varchar(60)
declare @szCity varchar(50)
declare @szState varchar(50)
declare @szZip varchar(50)
declare @lOwnerCount int
declare @szMultiOwner varchar(1)

declare @szSitusNum varchar(10)
declare @szSitusStreet varchar(50)
declare @szSitusCity varchar(30)
declare @szSitusState varchar(2)
declare @szSitusZip varchar(10)

declare @lNewImpValue numeric(14,0)
declare @lNewLandValue numeric(14,0)
declare @szProductivityCode varchar(5)
declare @fAcreage numeric(18,4)
declare @fAcreageLandHomesite numeric(18,4)
declare @fAcreageLandNonHomesite numeric(18,4)
declare @fAcreageAgriculture numeric(18,4)
declare @fAcreageTimber numeric(18,4)
declare @szLandHSStateCd varchar(5)
declare @szLandNHSStateCd varchar(5)
declare @szLandAgStateCd varchar(5)
declare @szLandTimberStateCd varchar(5)

declare @ag_use_cd varchar(5)
declare @ag_apply varchar(1)
declare @size_acres numeric(18,4)
declare @land_seg_homesite varchar(1)
declare @state_cd varchar(5)

declare @nSalePrice numeric(14,0)
declare @dtSaleDate datetime
declare @szDeedVolume varchar(20)
declare @dtDeedDate datetime
declare @szDeedPage varchar(20)
declare @szExemptionCodes varchar(50)
declare @szEntityCodes varchar(50)
declare @dtTemp datetime

declare @strSQL varchar(3000)
declare @bNeedOR bit
declare @lCommaPos int
declare @prop_id int
declare @sup_num int
declare @entity_cd varchar(10)
declare @szSharedPropID varchar(30)
declare @owner_id int

if len(@szExportTableName) = 0
begin
	raiserror('Export Table Name is missing', 16, 1)
	return
end

declare @next_event_id int


set @dtTemp = dateadd(day, 1, getdate())

set @strSQL = 'create table ' + @szExportTableName + '( '
set @strSQL = @strSQL + 'prop_id int not null, '
set @strSQL = @strSQL + 'prop_val_yr int not null, '
set @strSQL = @strSQL + 'sup_num int not null, '
set @strSQL = @strSQL + 'sale_id int not null, '
set @strSQL = @strSQL + 'market numeric(14,0) not null, '
set @strSQL = @strSQL + 'appraised_val numeric(14,0) not null) '

exec(@strSQL)

create table #esp_prop_ids
(
	prop_id int not null,
	owner_tax_yr int not null,
	sup_num int not null
)

alter table #esp_prop_ids add constraint CPK_#esp_prop_ids_prop_id primary key clustered ([prop_id],[owner_tax_yr],[sup_num]) with fillfactor = 90 on [primary]

set @strSQL = 'insert into #esp_prop_ids '
set @strSQL = @strSQL + 'select distinct psa.prop_id, psa.owner_tax_yr, psa.sup_num '
set @strSQL = @strSQL + 'from prop_supp_assoc as psa '
set @strSQL = @strSQL + 'with (nolock) '

if len(@szSharedCAD) > 0
begin
	set @strSQL = @strSQL + 'inner join shared_prop as sp '
	set @strSQL = @strSQL + 'with (nolock) '
	set @strSQL = @strSQL + 'on psa.prop_id = sp.pacs_prop_id '
	set @strSQL = @strSQL + 'and psa.owner_tax_yr = sp.shared_year '
	set @strSQL = @strSQL + 'and psa.sup_num = sp.sup_num '
end
else if len(@szEntities) > 0
begin
	set @strSQL = @strSQL + 'inner join entity_prop_assoc as epa '
	set @strSQL = @strSQL + 'with (nolock) '
	set @strSQL = @strSQL + 'on psa.prop_id = epa.prop_id '
	set @strSQL = @strSQL + 'and psa.owner_tax_yr = epa.tax_yr '
	set @strSQL = @strSQL + 'and psa.sup_num = epa.sup_num '
	set @strSQL = @strSQL + 'inner join entity as e '
	set @strSQL = @strSQL + 'with (nolock) '
	set @strSQL = @strSQL + 'on epa.entity_id = e.entity_id '
end

if len(@szPropertyTypes) > 0
begin
	set @strSQL = @strSQL + 'inner join property as p '
	set @strSQL = @strSQL + 'with (nolock) '
	set @strSQL = @strSQL + 'on psa.prop_id = p.prop_id '
end

set @strSQL = @strSQL + 'where psa.owner_tax_yr = ' + convert(varchar(4), @lYear) + ' '
set @strSQL = @strSQL + 'and psa.sup_num in (select max(sup_num) '
set @strSQL = @strSQL + 'from prop_supp_assoc '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'where prop_id = psa.prop_id '
set @strSQL = @strSQL + 'and owner_tax_yr = psa.owner_tax_yr '
set @strSQL = @strSQL + 'and sup_num < = ' + convert(varchar(4), @lSupplement) + ') '

if len(@szEntities) > 0
begin
	set @strSQL = @strSQL + 'and ('

	set @bNeedOR = 0
	set @lCommaPos = charindex(',', @szEntities, 1)

	if @lCommaPos > 0
	begin
		while @lCommaPos > 0
		begin
			if @bNeedOR = 1
			begin
				set @strSQL = @strSQL + ' or '
			end

			set @strSQL = @strSQL + 'e.entity_cd = ''' + rtrim(left(@szEntities, @lCommaPos - 1)) + ''' '
			set @szEntities = ltrim(right(@szEntities, len(@szEntities) - @lCommaPos))

			set @lCommaPos = charindex(',', @szEntities, 1)
			set @bNeedOR = 1
		end
		if len(@szEntities) > 0
		begin
			set @strSQL = @strSQL + ' or e.entity_cd = ''' + @szEntities + ''' '
		end
	end
	else
	begin
		set @strSQL = @strSQL + 'e.entity_cd = ''' + @szEntities + ''' '
	end

	set @strSQL = @strSQL + ') '
end

if len(@szQuery) > 0
begin
	set @strSQL = @strSQL + 'and psa.prop_id in (' + @szQuery + ') '
end

if len(@szSharedCAD) > 0
begin
	set @strSQL = @strSQL + 'and sp.shared_cad_code = ''' + @szSharedCAD + ''' '
end

if len(@szPropertyTypes) > 0
begin
	set @strSQL = @strSQL + 'and ('

	set @bNeedOR = 0
	set @lCommaPos = charindex(',', @szPropertyTypes, 1)

	if @lCommaPos > 0
	begin
		while @lCommaPos > 0
		begin
			if @bNeedOR = 1
			begin
				set @strSQL = @strSQL + ' or '
			end

			set @strSQL = @strSQL + 'p.prop_type_cd = ''' + rtrim(left(@szPropertyTypes, @lCommaPos - 1)) + ''' '
			set @szPropertyTypes = ltrim(right(@szPropertyTypes, len(@szPropertyTypes) - @lCommaPos))

			set @lCommaPos = charindex(',', @szPropertyTypes, 1)
			set @bNeedOR = 1
		end

		if len(@szPropertyTypes) > 0
		begin
			set @strSQL = @strSQL + 'or p.prop_type_cd = ''' + @szPropertyTypes + ''' '
		end
	end
	else
	begin
		set @strSQL = @strSQL + 'p.prop_type_cd = ''' + @szPropertyTypes + ''' '
	end

	set @strSQL = @strSQL + ') '
end

if len(@szBeginDate) > 0 and len(@szEndDate) > 0
begin
	set @strSQL = @strSQL + 'and psa.prop_id in (select distinct clp.prop_id '
	set @strSQL = @strSQL + 'from change_log_propid_vw as clp with(nolock) '
	set @strSQL = @strSQL + 'join change_log as cl with(nolock) on '
	set @strSQL = @strSQL + '    clp.lChangeID = cl.lChangeID '
	set @strSQL = @strSQL + 'where cl.dtChange >= ''' + @szBeginDate + ' 00:00'' '
	set @strSQL = @strSQL + 'and cl.dtChange <= ''' + @szEndDate + ' 23:59'' ) '
end

--print @strSQL
exec(@strSQL)

create table #export_shared_property
(
	SendingId int not null,
	ReceivingId varchar(30) null,
	VendorCode varchar(2) null,
	[Year] int not null,
	SupNum int not null,
	SupCd varchar(10) null,
	SupComment varchar(500) null,
	GeoId varchar(50) null,
	LegalDescription varchar(255) null,
	OwnerName varchar(70) null,
	Address1 varchar(60) null,
	Address2 varchar(60) null,
	Address3 varchar(60) null,
	City varchar(50) null,
	State varchar(50) null,
	Zip varchar(50) null,
	SitusNumber varchar(20) null,
	SitusStreet varchar(50) null,
	SitusCity varchar(30) null,
	SitusState varchar(2) null,
	SitusZip varchar(10) null,
	ARBIndicator varchar(1) null,
	ARBDate datetime null,
	ARBStatus varchar(5) null,
	LandHS numeric(14,0) null,
	LandNHS numeric(14,0) null,
	AgUse numeric(14,0) null,
	AgMarket numeric(14,0) null,
	AgLoss numeric(14,0) null,
	TimberUse numeric(14,0) null,
	TimberMarket numeric(14,0) null,
	TimberLoss numeric(14,0) null,
	ImpHS numeric(14,0) null,
	ImpNHS numeric(14,0) null,
	Market numeric(14,0) null,
	Appraised numeric(14,0) null,
	TenPercentCap numeric(14,0) null,
	Assessed numeric(14,0) null,
	NewImpValue numeric(14,0) null,
	NewLandValue numeric(14,0) null,
	ProductivityCode varchar(5) null,
	Acreage numeric(18,4) null,
	AcreageLandHomesite numeric(18,4) null,
	AcreageLandNonHomesite numeric(18,4) null,
	AcreageAgriculture numeric(18,4) null,
	AcreageTimber numeric(18,4) null,
	MapId varchar(20) null,
	ImprvHSStateCd varchar(5) null,
	ImprvNHSStateCd varchar(5) null,
	LandHSStateCd varchar(5) null,
	LandNHSStateCd varchar(5) null,
	LandAgStateCd varchar(5) null,
	LandTimberStateCd varchar(5) null,
	PersonalStateCd varchar(5) null,
	MineralStateCd varchar(5) null,
	AutoStateCd varchar(5) null,
	ImprvClass varchar(10) null,
	PTDLandType varchar(30) null,
	Appraiser varchar(40) null,
	SalePrice numeric(14,0) null,
	SaleDate datetime null,
	DeedVolume varchar(20) null,
	DeedDate datetime null,
	DeedPage varchar(20) null,
	ExemptionCodes varchar(50) null,
	EntityCodes varchar(50) null,
	DBA varchar(50) null,
	MultiOwner varchar(1) null,
	ExportDate datetime not null
)


insert into #export_shared_property
select distinct
	pv.prop_id as SendingId, 
	convert(varchar(30), 'N/A') as ReceivingId,
	'TA' as VendorCode,
	@lYear as Year,
	pv.sup_num as SupNum,
	isnull(pv.sup_cd,'') as SupCd,
	replace(isnull(pv.sup_desc,''), char(13) + char(10), ' ') as SupComment,
	p.geo_id as GeoId,
	replace(isnull(pv.legal_desc,''), char(13) + char(10), ' ') as LegalDescription,
	convert(varchar(70), '') as OwnerName,
	convert(varchar(60), '') as Address1,
	convert(varchar(60), '') as Address2,
	convert(varchar(60), '') as Address3,
	convert(varchar(50), '') as City,
	convert(varchar(50), '') as State,
	convert(varchar(50), '') as Zip,
	convert(varchar(10), '') as SitusNumber,
	convert(varchar(50), '') as SitusStreet,
	convert(varchar(30), '') as SitusCity,
	convert(varchar(2), '') as SitusState,
	convert(varchar(10), '') as SitusZip,
	'F' as ARBIndicator,
	@dtTemp as ARBDate,
	'     ' as ARBStatus,
	isnull(pv.land_hstd_val,0) as LandHS,
	isnull(pv.land_non_hstd_val,0) as LandNHS,
	isnull(pv.ag_use_val,0) as AgUse,
	isnull(pv.ag_market,0) as AgMarket,
	isnull(pv.ag_loss,0) as AgLoss,
	isnull(pv.timber_use,0) as TimberUse,
	isnull(pv.timber_market,0) as TimberMarket,
	isnull(pv.timber_loss,0) as TimberLoss,
	isnull(pv.imprv_hstd_val,0) as ImpHS,
	isnull(pv.imprv_non_hstd_val,0) as ImpNHS,
	isnull(pv.market,0) as Market,
	isnull(pv.appraised_val,0) as Appraised,
	isnull(pv.ten_percent_cap,0) as TenPercentCap,
	isnull(pv.assessed_val,0) as Assessed,
	0 as NewImpValue,
	0 as NewLandValue,
	convert(varchar(5), '') as ProductivityCode,
	convert(numeric(18,4),0) as Acreage,
	convert(numeric(18,4),0) as AcreageLandHomesite,
	convert(numeric(18,4),0) as AcreageLandNonHomesite,
	convert(numeric(18,4),0) as AcreageAgriculture,
	convert(numeric(18,4),0) as AcreageTimber,
	isnull(pv.map_id,'') as MapId,
	isnull((select top 1 isnull(imprv_state_cd,'')
		from imprv
		with (nolock)
		where prop_id = pv.prop_id
		and prop_val_yr = pv.prop_val_yr
		and sup_num = pv.sup_num
		and sale_id = 0
		and isnull(imprv_homesite,'N') = 'Y'),'') as ImprvHSStateCd,
	isnull((select top 1 isnull(imprv_state_cd,'')
		from imprv
		with (nolock)
		where prop_id = pv.prop_id
		and prop_val_yr = pv.prop_val_yr
		and sup_num = pv.sup_num
		and sale_id = 0
		and isnull(imprv_homesite,'N') = 'N'),'') as ImprvNHSStateCd,
	convert(varchar(5), '') as LandHSStateCd,
	convert(varchar(5), '') as LandNHSStateCd,
	convert(varchar(5), '') as LandAgStateCd,
	convert(varchar(5), '') as LandTimberStateCd,
	isnull((select top 1 isnull(pp_state_cd,'')
		from pers_prop_seg
		with (nolock)
		where prop_id = pv.prop_id
		and prop_val_yr = pv.prop_val_yr
		and sup_num = pv.sup_num
		and sale_id = 0),'') as PersonalStateCd,
	case when p.prop_type_cd = 'MN' then p.state_cd else '' end as MineralStateCd,
	case when p.prop_type_cd = 'A' then p.state_cd else '' end as AutoStateCd,
	isnull(pp.class_cd,'') as ImprvClass,
	isnull(lt.state_land_type_desc,'') as PTDLandType,
	isnull(ap.appraiser_nm,'') as Appraiser,
	convert(numeric(14,0), 0) as SalePrice,
	@dtTemp as SaleDate,
	convert(varchar(20), '') as DeedVolume,
	@dtTemp as DeedDate,
	convert(varchar(20), '') as DeedPage,
	convert(varchar(50), '') as ExemptionCodes,
	convert(varchar(50), '') as EntityCodes,
	isnull(p.dba_name,'') as DBA,
	'F' as MultiOwner,
	getdate() as ExportDate

--into #export_shared_property

		
from property_val as pv
with (nolock)

join property_profile as pp
with (nolock)
on pv.prop_id = pp.prop_id
and pv.prop_val_yr = pp.prop_val_yr
and pv.sup_num = pp.sup_num

join property as p
with (nolock)
on pv.prop_id = p.prop_id

join #esp_prop_ids as esp
on pv.prop_id = esp.prop_id
and pv.prop_val_yr = esp.owner_tax_yr
and pv.sup_num = esp.sup_num

left outer join appraiser as ap
with (nolock)
on pv.last_appraiser_id = ap.appraiser_id

left outer join land_type as lt
with (nolock)
on pp.land_type_cd = lt.land_type_cd

where pv.prop_val_yr = @lYear


alter table #export_shared_property add constraint CPK_#export_shared_property_SendingIdYearSupNum primary key clustered ([SendingId],[Year],[SupNum]) with fillfactor = 90 on [primary]

/*
 * Now update the remaining columns that would significantly
 * slow the select process down if they were to be included
 * above.
 */


declare @dtProtestCreated datetime
declare @dtProtestCompleted datetime
declare @szProtestStatus varchar(5)

declare @exmpt_type_cd varchar(5)
declare @pacs_user_name varchar(30)
declare @market numeric(14,0)
declare @appraised_val numeric(14,0)


declare curExport CURSOR FAST_FORWARD
for select SendingID, SupNum, Market, Appraised
	from #export_shared_property

open curExport

fetch next from curExport into @prop_id, @sup_num, @market, @appraised_val

if @@fetch_status = 0
begin
	select @pacs_user_name = pacs_user_name
	from pacs_user
	with (nolock)
	where pacs_user_id = @lPACSUserId

	exec dbo.GetUniqueID 'event', @next_event_id output, 1, 0
	
	insert into event
	(event_id, system_type, event_type, event_date, pacs_user, event_desc, pacs_user_id)
	values
	(@next_event_id, 'A', 'ESPD', getdate(), @pacs_user_name,
	 'Included in Shared Property Export run on ' + convert(varchar(10), getdate(), 101), @lPACSUserId)
end

while @@fetch_status = 0
begin
	set @szSharedPropID = ''

	select top 1 @owner_id = owner_id
	from owner
	with (nolock)
	where prop_id = @prop_id
	and owner_tax_yr = @lYear
	and sup_num = @sup_num

	select @lOwnerCount = count(owner_id)
	from owner
	with (nolock)
	where prop_id = @prop_id
	and owner_tax_yr = @lYear
	and sup_num = @sup_num

	set @szMultiOwner = 'F'

	if @lOwnerCount > 1
	begin
		set @szMultiOwner = 'T'
	end

	select @szOwnerName = file_as_name
	from account
	with (nolock)
	where acct_id = @owner_Id

	/*
	 * This is here because there have been problems where there have been more than one
	 * primary situs.  This would cause the property to get exported 2 times.  Also,
 	 * if a property does not have a situs, it needs to be exported.
	 */

	select @szAddress1 = addr_line1,
			@szAddress2 = addr_line2,
			@szAddress3 = addr_line3,
			@szCity = addr_city,
			@szState = addr_state,
			@szZip = addr_zip
	from address
	with (nolock)
	where primary_addr = 'Y'
	and acct_id = @owner_id

	set @szSitusNum = ''
	set @szSitusStreet = ''
	set @szSitusCity = ''
	set @szSitusState = ''
	set @szSitusZip = ''

	select top 1 @szSitusNum = situs_num,
			@szSitusStreet = situs_street,
			@szSitusCity = situs_city,
			@szSitusState = situs_state,
			@szSitusZip = situs_zip
	from situs
	with (nolock)
	where prop_id = @prop_id
	and primary_situs = 'Y'

	if len(@szSharedCAD) > 0
	begin
		select top 1 @szSharedPropID = shared_prop_id
		from shared_prop
		with (nolock)
		where pacs_prop_id = @prop_id
		and shared_year = @lYear
		and shared_cad_code = @szSharedCAD
	end
	else if len(@szOptionalSharedCAD) > 0
	begin
		select top 1 @szSharedPropID = shared_prop_id
		from shared_prop
		with (nolock)
		where pacs_prop_id = @prop_id
		and shared_year = @lYear
		and shared_cad_code = @szOptionalSharedCAD
	end

	/*
	 * removed from big query for performance
	 */

	set @lNewImpValue = 0
	set @lNewLandValue = 0

	select @lNewImpValue = sum(isnull(imp_new_val,0)),
			@lNewLandValue = sum(isnull(land_new_val,0))
	from property_val_state_cd
	with (nolock)
	where prop_id = @prop_id
	and prop_val_yr = @lYear
	and sup_num = @sup_num


	set @szProductivityCode = ''
	set @fAcreage = 0
	set @fAcreageLandHomesite = 0
	set @fAcreageLandNonHomesite = 0
	set @fAcreageAgriculture = 0
	set @fAcreageTimber = 0
	set @szLandHSStateCd = ''
	set @szLandNHSStateCd = ''
	set @szLandAgStateCd = ''
	set @szLandTimberStateCd = ''

	declare curLand cursor fast_forward
	for select isnull(ag_use_cd,''), isnull(ag_apply,'F'), isnull(size_acres,0), isnull(land_seg_homesite,'F'), isnull(state_cd,'')
		from land_detail
		with (nolock)
		where prop_id = @prop_id
		and prop_val_yr = @lYear
		and sup_num = @sup_num
		and sale_id = 0

	open curLand

	fetch next from curLand into @ag_use_cd, @ag_apply, @size_acres, @land_seg_homesite, @state_cd

	while @@fetch_status = 0
	begin
		set @fAcreage = @fAcreage + @size_acres
		if @land_seg_homesite = 'T'
		begin
			set @szLandHSStateCd = @state_cd
			set @fAcreageLandHomesite = @fAcreageLandHomesite + @size_acres
		end
		else
		begin
			set @szLandNHSStateCd = @state_cd
			set @fAcreageLandNonHomesite = @fAcreageLandNonHomesite + @size_acres
		end

		if @ag_apply = 'T'
		begin
			set @szProductivityCode = @ag_use_cd
			if @ag_use_cd IN ('1D', '1D1')
			begin
				set @szLandAgStateCd = @state_cd
				set @fAcreageAgriculture = @fAcreageAgriculture + @size_acres
			end
			else if @ag_use_cd = 'TIM'
			begin
				set @szLandTimberStateCd = @state_cd
				set @fAcreageTimber = @fAcreageTimber + @size_acres
			end
		end

		fetch next from curLand into @ag_use_cd, @ag_apply, @size_acres, @land_seg_homesite, @state_cd
	end

	close curLand
	deallocate curLand


	set @dtProtestCreated = null
	set @dtProtestCompleted = null
	set @szProtestStatus = ''
	set @szARBIndicator = 'F'

	select top 1 @dtProtestCreated = prot_create_dt, 
				@dtProtestCompleted = prot_complete_dt, 
				@szProtestStatus = prot_status
	from _arb_protest
	with (nolock)
	where prop_id = @prop_id
	and prop_val_yr = @lYear
	order by prot_create_dt desc

	if @dtProtestCreated is not null and @dtProtestCompleted is null
	begin
		set @szARBIndicator = 'T'
	end
	else
	begin
		set @dtProtestCreated = null
		set @szProtestStatus = ''
	end


	declare property_exemption CURSOR FAST_FORWARD
	for select rtrim(exmpt_type_cd)
	from property_exemption with (nolock)
	where prop_id      = @prop_id
	and   owner_id     = @owner_id
	and   sup_num      = @sup_num
	and   owner_tax_yr = @lYear

	open property_exemption
	fetch next from property_exemption into @exmpt_type_cd

	set @szExemptionCodes = ''

	while (@@FETCH_STATUS = 0)
	begin
		if len(@szExemptionCodes) > 0
		begin
			set @szExemptionCodes = @szExemptionCodes + ','
		end

		set @szExemptionCodes = @szExemptionCodes + @exmpt_type_cd

		fetch next from property_exemption into @exmpt_type_cd
	end	

	close property_exemption
	deallocate property_exemption


	set @dtSaleDate = null
	set @nSalePrice = null
	set @szDeedVolume = ''
	set @dtDeedDate = null
	set @szDeedPage = ''

	select top 1 @dtSaleDate = sa.sl_dt,
				@nSalePrice = isnull(sa.sl_price,0),
				@szDeedVolume = isnull(coo.deed_book_id,''),
				@dtDeedDate = coo.deed_dt,
				@szDeedPage = isnull(coo.deed_book_page,'')
	from chg_of_owner_prop_assoc as coopa
	with (nolock)
	join chg_of_owner as coo
	with (nolock)
	on coopa.chg_of_owner_id = coo.chg_of_owner_id
	left outer join sale as sa
	with (nolock)
	on coopa.chg_of_owner_id = sa.chg_of_owner_id
	where sa.sl_dt is not null
	and sa.sl_price is not null
	and coopa.prop_id = @prop_id
	order by sa.sl_dt desc

	declare curEntities CURSOR FAST_FORWARD
	for select rtrim(e.entity_cd)
		from entity_prop_assoc as epa
		with (nolock)
		join entity as e
		with (nolock)
		on epa.entity_id = e.entity_id
		where epa.prop_id = @prop_id
		and epa.tax_yr = @lYear
		and epa.sup_num = @sup_num

	open curEntities
	
	fetch next from curEntities into @entity_cd

	set @szEntityCodes = ''

	while @@fetch_status = 0
	begin
		if len(@szEntityCodes) > 0
		begin
			set @szEntityCodes = @szEntityCodes + ','
		end

		set @szEntityCodes = @szEntityCodes + @entity_cd

		fetch next from curEntities into @entity_cd
	end

	close curEntities
	deallocate curEntities

	update #export_shared_property
	with (tablock)
	set ReceivingId = @szSharedPropID,
		OwnerName = @szOwnerName,
		Address1 = @szAddress1,
		Address2 = @szAddress2,
		Address3 = @szAddress3,
		City = @szCity,
		State = @szState,
		Zip = @szZip,
		SitusNumber = @szSitusNum,
		SitusStreet = @szSitusStreet,
		SitusCity = @szSitusCity,
		SitusState = @szSitusState,
		SitusZip = @szSitusZip,
		ARBIndicator = @szARBIndicator,
		ARBDate = @dtProtestCreated,
		ARBStatus = @szProtestStatus,
		NewImpValue = isnull(@lNewImpValue,0),
		NewLandValue = isnull(@lNewLandValue,0),
		ProductivityCode = @szProductivityCode,
		Acreage = @fAcreage,
		AcreageLandHomesite = @fAcreageLandHomesite,
		AcreageLandNonHomesite = @fAcreageLandNonHomesite,
		AcreageAgriculture = @fAcreageAgriculture,
		AcreageTimber = @fAcreageTimber,
		LandHSStateCd = @szLandHSStateCd,
		LandNHSStateCd = @szLandNHSStateCd,
		LandAgStateCd = @szLandAgStateCd,
		LandTimberStateCd = @szLandTimberStateCd,
		SalePrice = isnull(@nSalePrice,0),
		SaleDate = @dtSaleDate,
		DeedVolume = @szDeedVolume,
		DeedDate = @dtDeedDate,
		DeedPage = @szDeedPage,
		ExemptionCodes = @szExemptionCodes,
		EntityCodes = @szEntityCodes,
		MultiOwner = @szMultiOwner
	where SendingID = @prop_id
	and Year = @lYear
	and SupNum = @sup_num

	fetch next from curExport into @prop_id, @sup_num, @market, @appraised_val
end

close curExport
deallocate curExport

set @strSQL = 'insert into ' + @szExportTableName + '('
set @strSQL = @strSQL + 'prop_id, prop_val_yr, sup_num, sale_id, market, appraised_val) '

set @strSQL = @strSQL + 'select convert(int, SendingId), ' + convert(varchar(4), @lYear) + ', '
set @strSQL = @strSQL + 'SupNum, 0, Market, Appraised '
set @strSQL = @strSQL + 'from #export_shared_property '

exec(@strSQL)

insert into prop_event_assoc
(prop_id, event_id)
select convert(int, SendingId), @next_event_id
from #export_shared_property

select *
from #export_shared_property
order by SendingID

GO

