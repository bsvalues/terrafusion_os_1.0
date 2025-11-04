

/*
 * This procedure builds the web_internet_<countyname> database for the
 * True Automation PropertyAccess website.  Formerly ClientDB.
 */

CREATE PROCEDURE [dbo].[ExportPropertyAccess_original_bak]

@input_database_name	varchar(50) = '',
@input_num_years		int = -1

--WITH RECOMPILE

AS

SET NOCOUNT ON

declare @sql varchar(8000)
declare @sql2 varchar(8000)
declare @log_id int
declare @error_flag int
declare @texas varchar(10)
declare @washington varchar(10)
declare @status varchar (250)
declare @start_date datetime

set @texas = 'TX'
set @washington = 'WA'
set @start_date = getdate()

if (len(@input_database_name) = 0)
begin
	declare @county_name varchar(20)

	select @county_name = lower(isnull(county_name, 'cad')) from system_address where system_type = 'A'

	set @input_database_name = 'web_internet_' + isnull(@county_name, 'cad') + '_auto'
end

--*****************************************************************************
	--CREATE NEW WEB DATABASE IF IT DOESN'T EXIST
	declare @db_path varchar(255)

	select @db_path = filename from master..sysdatabases where name = db_name()

	set @db_path = reverse(@db_path)
	set @db_path = right(@db_path, len(@db_path) - charindex('\', @db_path, 1) + 1) --'escape text fix
	set @db_path = reverse(@db_path)


	-- Create Database if not exists
	if not exists (select * from master..sysdatabases where name = @input_database_name)
	begin
		set @sql = 'CREATE DATABASE ' + @input_database_name + ' ON 
			(
				NAME = ' + @input_database_name + ',
				SIZE = 5GB,
				FILEGROWTH = 256MB,
				FILENAME = ''' + @db_path + @input_database_name + '.MDF' + '''' + '
			)
			LOG ON
			(
				NAME = ' + @input_database_name + '_log,
				SIZE = 3GB,
				FILEGROWTH = 128MB,
				FILENAME = ''' + @db_path + @input_database_name + '.LDF' + '''' + '
			)'
		exec(@sql)
		
		print '    Done Creating Database '+ @input_database_name + ' at ' + convert(varchar(30), getdate(), 109)
	end
	
	set @sql = 'alter database ' + @input_database_name + ' set recovery simple'
	exec(@sql)
--*****************************************************************************

if (select category from master..sysdatabases where name = @input_database_name) > 0
begin
	print 'Dropping Replication'
	-- Start: drop publications

	-- Drop all subscriptions if they exist.
	set @sql = '
	if exists (
		select *
		from ' + @input_database_name + '..syssubscriptions
		where dest_db = ''' + @input_database_name + '''
	)
	begin
		exec ' + @input_database_name + '..sp_dropsubscription @publication = N''all'', @article = N''all'', @subscriber = N''all'', @destination_db = N''all''
	end
'
	exec (@sql)
		
	-- Dropping the snapshot publication
	-- Drop publications only if they exists
	set @sql = '
	if exists (
		select *
		from ' + @input_database_name + '..syspublications
		where name = ''' + @input_database_name + '''
	)
	begin
		exec ' + @input_database_name + '..sp_droppublication @publication = N''all''
	end
'
	exec (@sql)
	
	-- Stop: drop publications
	print '    Done Dropping Replication at ' + convert(varchar(30), getdate(), 109)
end

-- Start: drop objects
if exists (select * from master..sysdatabases where name = @input_database_name)
begin
	print 'Dropping Objects in ' + @input_database_name
	DECLARE @obj_name varchar(255)
	DECLARE @type char (2)
	declare @order_by Integer
	DECLARE @key_tablename varchar(128)

	set @sql = 'declare cur_object insensitive cursor for select so.name, so.xtype, lOrderByDummy = case when so.xtype = ''F'' then 0 else 1 end, stables.name
	from ' + @input_database_name + '..sysobjects as so
	left outer join ' + @input_database_name + '..sysconstraints as sc on sc.constid = so.id
	left outer join ' + @input_database_name + '..sysobjects as stables on stables.id = sc.id
	where so.xtype in (''U'',''P'',''FN'',''V'',''F'', ''TF'')
	--bitwise - detect non system object
	and (so.category & 2) = 0
	order by lOrderByDummy
	for read only'

	execute(@sql)

	DECLARE @drop_obj varchar(255)

	OPEN cur_object
	FETCH NEXT FROM cur_object
	INTO @obj_name, @type, @order_by, @key_tablename

	WHILE @@FETCH_STATUS = 0
	BEGIN
		set @sql = 'use ' + @input_database_name + ' '

		set @drop_obj = 
			CASE @type
				When 'P' Then ' drop procedure ' + @obj_name
				When 'V' Then ' drop view ' + @obj_name
				When 'U' Then ' truncate table ' + @obj_name + '; drop table ' + @obj_name
				When 'TF' Then ' drop function ' + @obj_name
				When 'F' Then ' alter table ' + @key_tablename + ' drop constraint ' + @obj_name
			END
		set @sql = 'use ' + @input_database_name + ' ' + @drop_obj
		exec (@sql)	
		
		FETCH NEXT FROM cur_object
		INTO @obj_name, @type, @order_by, @key_tablename
	END

	CLOSE cur_object
	DEALLOCATE cur_object	
	
	print '    Done Dropping Droping Objects in '+ @input_database_name + ' at ' + convert(varchar(30), getdate(), 109)
end
-- Stop: drop objects
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
-- Start: Export Process
print 'Exporting!'
	declare @use_col_owner_id bit

	select
		@use_col_owner_id = case szConfigValue when 'T' then 1 else 0 end
	from pacs_config with (nolock)
	where szGroup = 'Property Access' and szConfigname = 'col_owner_id'
	set @use_col_owner_id = isnull(@use_col_owner_id, 0)
	
	declare @region varchar(5)
	select @region = szConfigValue 
	from core_config with (nolock) where szConfigName = 'REGION'
	if(@region is null) set @region = 'WA'
	
	declare @collections_only bit
	select
		@collections_only = case szConfigValue when 'T' then 1 else 0 end
	from pacs_config with (nolock)
	where szGroup = 'Property Access' and szConfigname = 'Collections Only'
	set @collections_only = isnull(@collections_only, 0)
	
	declare @hide_minerals bit
	select
		@hide_minerals = case szConfigValue when 'T' then 1 else 0 end
	from pacs_config with (nolock)
	where szGroup = 'Property Access' and szConfigname = 'hide_minerals'
	set @hide_minerals = isnull(@hide_minerals, 0)
	
	
	declare @township_enabled bit
	select
		@township_enabled = case szConfigValue when 'T' then 1 else 0 end
	from pacs_config with (nolock)
	where szGroup = 'SYSTEM' and szConfigname = 'Township Enabled'
	set @township_enabled = isnull(@township_enabled, 0)


	declare @all_imprv_features bit
	select
		@all_imprv_features = case szConfigValue when 'T' then 1 else 0 end
	from pacs_config with (nolock)
	where szGroup = 'Property Access' and szConfigname = 'All Improvement Features'
	set @all_imprv_features = isnull(@all_imprv_features, 0)


	set @error_flag = 0

	set @sql = ''

	exec DropPATempTables
	
	if not(exists(select id from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_log]') and OBJECTPROPERTY(id, N'IsUserTable') = 1))
	begin
		create table _clientdb_log
		(
			[id] int not null,-- identity(1,1),
			[start_dt] datetime null,
			[finish_dt] datetime null,
			[status] varchar(500) null,
			[error] int null
		)
		set @log_id = 0
	end
	else 
	begin
		select @log_id = max(id) from _clientdb_log
		set @log_id = @log_id + 1
	end

	set @status = 'Starting Export'
	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)

	set @start_date = getdate()
	--*****************************************************************************

	--Year History - Export Info

	create table _clientdb_pacs_year
	(
		tax_yr numeric(4,0) not null,
		certification_dt datetime null,
		prev_reappraised_yr numeric(4,0) null
	)

	declare @max_year numeric(4,0)
	declare @sys_tax_year numeric(4,0)
	declare @min_year numeric(4,0)

	select @max_year = max(tax_yr)
	from pacs_year with (nolock)

	select @sys_tax_year = tax_yr
	from pacs_system with (nolock)

	if @input_num_years < 0
	begin
		insert _clientdb_pacs_year
		(tax_yr, certification_dt, prev_reappraised_yr)
		
		select tax_yr, certification_dt, prev_reappraised_yr
		from pacs_year with (nolock)
		order by tax_yr
	end
	else
	begin
		set @min_year = @max_year - @input_num_years

		insert _clientdb_pacs_year
		(tax_yr, certification_dt, prev_reappraised_yr)
		
		select tax_yr, certification_dt, prev_reappraised_yr
		from pacs_year with (nolock)
		where tax_yr > @min_year
		order by tax_yr
	end

	create nonclustered index IDX__clientdb_pacs_year_tax_yr
	on _clientdb_pacs_year (tax_yr)
	with fillfactor = 90

	-- Temp Table to store most recent ACCEPTED Supplement on a 
	-- property in a given year
	set @status = 'Layer Assoc'
	create table #layer_assoc
	(
		owner_tax_yr numeric(4,0) not null,
		sup_num int not null,
		prop_id int not null,
		primary key clustered (owner_tax_yr, sup_num, prop_id)
		with fillfactor = 100
	)

	insert #layer_assoc (owner_tax_yr, prop_id, sup_num)
	select distinct pv.prop_val_yr, pv.prop_id, max(pv.sup_num)
	from property_val as pv with(nolock)
	left outer join supplement as s with(nolock) on
		s.sup_tax_yr = pv.prop_val_yr and
		s.sup_num = pv.sup_num
	left outer join sup_group as sg with(nolock) on
		sg.sup_group_id = s.sup_group_id
	where (sg.status_cd is null or sg.status_cd in ('A','BC'))
	group by pv.prop_val_yr, pv.prop_id

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()
	
	--Deed History - Export Info

	print 'Exporting Deed History... at ' + convert(varchar(30), getdate(), 109)
	set @status = 'Deed History'
	if @region = @texas
	begin
		set @sql = '
		select
			coopa.prop_id,
			coo.chg_of_owner_id,
			coopa.seq_num,
			convert(varchar(10), coo.deed_dt, 101) as deed_dt,
			coo.deed_type_cd,
			dt.deed_type_desc,
			case when asell.confidential_flag = ''T''
				then (select IsNull(confidential_file_as_name, ''Confidential'') confidential_file_as_name from pacs_system) 
				else isnull(asell.file_as_name, coo.grantor_cv) 
			end as grantor, 
			case when abuy.confidential_flag = ''T'' 
				then (select IsNull(confidential_file_as_name, ''Confidential'') confidential_file_as_name from pacs_system) 
				else isnull(abuy.file_as_name, coo.grantee_cv) 
			end as grantee, 
			coo.deed_book_id,
			coo.deed_book_page,
			coo.coo_sl_dt as sale_date,
			coo.consideration as sale_price,
			null as excise_number,
			coo.deed_num
		into _clientdb_deed_history_detail
		from chg_of_owner_prop_assoc as coopa with (nolock)
		join chg_of_owner as coo with (nolock)
		on coopa.chg_of_owner_id = coo.chg_of_owner_id
		left outer join deed_type as dt with (nolock)
		on coo.deed_type_cd = dt.deed_type_cd
		left outer join buyer_assoc as ba with (nolock)
		on coopa.chg_of_owner_id = ba.chg_of_owner_id
		left outer join seller_assoc as sa with (nolock)
		on coopa.chg_of_owner_id = sa.chg_of_owner_id
		and coopa.prop_id = sa.prop_id
		left outer join account as abuy with (nolock)
		on ba.buyer_id = abuy.acct_id
		left outer join account as asell with (nolock)
		on sa.seller_id = asell.acct_id
		where coopa.seq_num < 3 -- Last three sales 0, 1, 2 
		'
	end
	else --Washington
	begin
		set @sql = '
		select
			coopa.prop_id,
			coo.chg_of_owner_id,
			coopa.seq_num,
			convert(varchar(10), coo.deed_dt, 101) as deed_dt,
			coo.deed_type_cd,
			dt.deed_type_desc,
			case when asell.confidential_flag = ''T'' 
				then (select IsNull(confidential_file_as_name, ''Confidential'') confidential_file_as_name from pacs_system) 
				else isnull(asell.file_as_name, coo.grantor_cv) 
			end as grantor, 
			case when abuy.confidential_flag = ''T'' 
				then (select IsNull(confidential_file_as_name, ''Confidential'') confidential_file_as_name from pacs_system) 
				else isnull(abuy.file_as_name, coo.grantee_cv) 
				end as grantee, 
			coo.deed_book_id,
			coo.deed_book_page,
			coo.coo_sl_dt as sale_date,
			s.adjusted_sl_price as sale_price,
			coo.excise_number,
			coo.deed_num
		into _clientdb_deed_history_detail
		from chg_of_owner_prop_assoc as coopa with (nolock)
		join chg_of_owner as coo with (nolock)
		on coopa.chg_of_owner_id = coo.chg_of_owner_id
		left outer join deed_type as dt with (nolock)
		on coo.deed_type_cd = dt.deed_type_cd
		left outer join buyer_assoc as ba with (nolock)
		on coopa.chg_of_owner_id = ba.chg_of_owner_id
		left outer join seller_assoc as sa with (nolock)
		on coopa.chg_of_owner_id = sa.chg_of_owner_id
		and coopa.prop_id = sa.prop_id
		left outer join account as abuy with (nolock)
		on ba.buyer_id = abuy.acct_id
		left outer join account as asell with (nolock)
		on sa.seller_id = asell.acct_id
		left outer join sale as s with (nolock)
		on s.chg_of_owner_id = coopa.chg_of_owner_id
		'
	end	
	print @sql
	exec(@sql) --populate _clientdb_deed_history_detail

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()
	
	print '    Done at ' + convert(varchar(30), getdate(), 109)

	--Improvement History - Export Info

	print 'Exporting Improvement Building Detail... at ' + convert(varchar(30), getdate(), 109)
	set @status = 'Improvement Details'

-- rgoolsby performance changes, put propert_val and imprv_detail 
-- fields needed in insert statement in temp tables to speed things up
	select pv.prop_val_yr,pv.sup_num,pv.prop_id
		  ,pv.appr_method,isnull(imprv_non_hstd_val, 0) as imprv_non_hstd_val
	INTO #tmpPropVal
	from property_val as pv with (nolock)
	join _clientdb_pacs_year as y with (nolock)
		on pv.prop_val_yr = y.tax_yr
	join #layer_assoc as psa with (nolock)
	on pv.prop_val_yr = psa.owner_tax_yr
	and pv.sup_num = psa.sup_num
	and pv.prop_id = psa.prop_id

	select i.prop_val_yr, i.sup_num, i.sale_id, i.prop_id, i.imprv_id, i.imprv_det_id
	,i.imprv_det_area, i.imprv_det_type_cd, i.imprv_det_class_cd, i.imprv_det_sub_class_cd, i.yr_built, i.imprv_det_val
	into #tmpImprvDetail -- all improvement details
	from imprv_detail as i with (nolock)
	join _clientdb_pacs_year as y with (nolock)
		on i.prop_val_yr = y.tax_yr
	join #layer_assoc as psa with (nolock)
	on i.prop_val_yr = psa.owner_tax_yr
	and i.sup_num = psa.sup_num
	and i.prop_id = psa.prop_id
	
	create index idx_tmpImprvDetail on #tmpImprvDetail (prop_val_yr, sup_num, prop_id, imprv_id, imprv_det_id, imprv_det_val, imprv_det_area, imprv_det_type_cd)
	
	set @sql = 'select
		i.prop_id,
		i.prop_val_yr,
		i.imprv_id,
		it.imprv_type_desc,
		i.imprv_state_cd,
		(select sum(isnull(impd.imprv_det_area, 0)) as living_area
			from #tmpImprvDetail as impd with (nolock)
			join imprv_det_type as impt with (nolock)
			on impd.imprv_det_type_cd = impt.imprv_det_type_cd
			where impd.prop_id = i.prop_id
			and impd.prop_val_yr = i.prop_val_yr
			and impd.sup_num = i.sup_num
			and impd.imprv_id = i.imprv_id
			and isnull(impt.main_area, ''F'') = ''T''
		) as living_area,
		-- HS 44190 Kevin Lloyd
		imprv_val = 
			CASE pv.appr_method
				WHEN ''I'' THEN -1
				WHEN ''D'' THEN isnull(i.dist_val,0)
				WHEN ''C'' THEN isnull(i.imprv_val,0)
				WHEN ''A'' THEN isnull(i.arb_val,0)
				ELSE 0
			END,
		ii.imprv_det_id,
		ii.imprv_det_type_cd,
		idt.imprv_det_typ_desc,
		ii.imprv_det_class_cd,
		ii.imprv_det_sub_class_cd,
		ia.i_attr_val_cd,
		ii.yr_built,
		ii.imprv_det_area as area,
		-- HS 44190 Kevin Lloyd
		isnull(pv.imprv_non_hstd_val, 0) as imprv_non_hstd_val,
		''T'' as show_values
	into _clientdb_improvement_building_detail
	from imprv as i with (nolock)
	join #layer_assoc as psa with (nolock)
	on i.prop_id = psa.prop_id
	and i.prop_val_yr = psa.owner_tax_yr
	and i.sup_num = psa.sup_num
	join _clientdb_pacs_year as y with (nolock)
	on i.prop_val_yr = y.tax_yr
	-- HS 44190 Kevin Lloyd
	join #tmpPropVal as pv with (nolock)
		on pv.prop_val_yr = i.prop_val_yr
		and pv.sup_num = i.sup_num
		and pv.prop_id = i.prop_id
	join imprv_type as it with (nolock)
	on i.imprv_type_cd = it.imprv_type_cd
	left outer join #tmpImprvDetail as ii with (nolock)
	on i.prop_val_yr = ii.prop_val_yr
	and i.sup_num = ii.sup_num
	and i.prop_id = ii.prop_id
	and i.imprv_id = ii.imprv_id
	left outer join imprv_attr as ia with (nolock)
	on ii.imprv_id = ia.imprv_id
	and ii.prop_id = ia.prop_id
	and ii.imprv_det_id = ia.imprv_det_id
	and ii.prop_val_yr = ia.prop_val_yr
	and ii.sup_num = ia.sup_num
	and ia.i_attr_val_id = 3
	left outer join imprv_det_type as idt with (nolock)
	on ii.imprv_det_type_cd = idt.imprv_det_type_cd
	where i.sale_id = 0'
	exec(@sql)
	
	drop table #tmpPropVal 
	
	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()
		
	print 'Exporting Improvement Features... at ' + convert(varchar(30), getdate(), 109)
	set @status = 'Improvement Features'
	create table _clientdb_improvement_features
	(
		prop_id int not null,
		prop_val_yr numeric(4,0) not null,
		imprv_id int not null,
		imprv_det_id int null,
		imprv_attr_desc varchar(50),
		i_attr_val_cd varchar(75)
	)
	-- TODO: replace with Robbie's changes to remove duplicates
	
	select prop_val_yr, sup_num, sale_id, prop_id, imprv_id, imprv_det_id, imprv_det_val
	into #tmpMainArea -- all main areas
	from #tmpImprvDetail as tID with (nolock)
	join imprv_det_type as impt with (nolock)
	on tID.imprv_det_type_cd = impt.imprv_det_type_cd
	where isnull(impt.main_area, 'F') = 'T'
	
	-- now create temp table with highest value info per main area improvement
	select prop_val_yr, sup_num, sale_id, prop_id, imprv_id, max(imprv_det_val) as imprv_det_val
	into #tmpImpDetVal	-- Highest valued improvement details on main areas
	from #tmpMainArea as ima with (nolock)
	group by prop_val_yr, sup_num, sale_id, prop_id, imprv_id
	
	select i.prop_val_yr, i.sup_num, i.sale_id, i.prop_id, i.imprv_id, max(i.imprv_det_id) as imprv_det_id
	into #tmpDetail	-- Highest valued improvement detail (single) on main areas (by year, prop_id, etc)
	from #tmpMainArea as i with (nolock)
	join #tmpImpDetVal as v
	on i.prop_val_yr = v.prop_val_yr  
	and i.sup_num = v.sup_num
	and i.sale_id = v.sale_id
	and i.prop_id = v.prop_id
	and i.imprv_id = v.imprv_id
	and i.imprv_det_val = v.imprv_det_val
	group by i.prop_val_yr, i.sup_num, i.sale_id, i.prop_id, i.imprv_id

	
	if @all_imprv_features = 0
	begin

		insert _clientdb_improvement_features
		(prop_id, prop_val_yr, imprv_id, imprv_det_id, imprv_attr_desc, i_attr_val_cd)

		select  i.prop_id, i.prop_val_yr, i.imprv_id, i.imprv_det_id,  attr.imprv_attr_desc, ia.i_attr_val_cd 
		--	i.imprv_det_val, i.* 
		from #tmpImprvDetail as i with (nolock)
		join
		#tmpDetail d
		on i.prop_val_yr = d.prop_val_yr  
		and i.sup_num = d.sup_num
		and i.sale_id = d.sale_id
		and i.prop_id = d.prop_id
		and i.imprv_id = d.imprv_id 
		and i.imprv_det_id = d.imprv_det_id
		join imprv_attr as ia with (nolock)
		on ia.prop_id = i.prop_id
		and ia.prop_val_yr = i.prop_val_yr
		and ia.sup_num = i.sup_num
		and ia.sale_id = i.sale_id
		and ia.imprv_id = i.imprv_id
		and ia.imprv_det_id = i.imprv_det_id
		join attribute as attr with (nolock)
		on ia.i_attr_val_id = attr.imprv_attr_id
		and attr.imprv_attr_desc is not null
		and attr.web_export = 1

	end
	else
	begin

		insert _clientdb_improvement_features
		(prop_id, prop_val_yr, imprv_id, imprv_det_id, imprv_attr_desc, i_attr_val_cd)

		select  i.prop_id, i.prop_val_yr, i.imprv_id, i.imprv_det_id,  attr.imprv_attr_desc, ia.i_attr_val_cd 
		--	i.imprv_det_val, i.* 
		from #tmpImprvDetail as i with (nolock)
		join imprv_attr as ia with (nolock)
		on ia.prop_val_yr = i.prop_val_yr
		and ia.sup_num = i.sup_num
		and ia.sale_id = i.sale_id
		and ia.prop_id = i.prop_id
		and ia.imprv_id = i.imprv_id
		and ia.imprv_det_id = i.imprv_det_id
		join attribute as attr with (nolock)
		on ia.i_attr_val_id = attr.imprv_attr_id
		and attr.imprv_attr_desc is not null
		and attr.web_export = 1

	end
	
	

/*
select id.prop_id, id.prop_val_yr, id.imprv_id, id.imprv_det_id,  attr.imprv_attr_desc, ia.i_attr_val_cd 
from 
	#tmpImprvDetail  as id

join imprv_attr as ia
on ia.prop_id = id.prop_id
and ia.prop_val_yr = id.prop_val_yr
and ia.sup_num = id.sup_num
and ia.sale_id = id.sale_id
and ia.imprv_id = id.imprv_id
and ia.imprv_det_id = id.imprv_det_id
join attribute as attr
on ia.i_attr_val_id = attr.imprv_attr_id
and attr.imprv_attr_desc is not null
and attr.web_export = 1
where id.imprv_det_val = 
		(
		select  max(idx.imprv_det_val) from #tmpImprvDetail as idx with (nolock)
		join imprv_det_type as impt	with (nolock)
		on id.imprv_det_type_cd = impt.imprv_det_type_cd

		where isnull(impt.main_area, 'F') = 'T'
		and idx.imprv_id = id.imprv_id and
		idx.prop_id = id.prop_id and idx.prop_val_yr = id.prop_val_yr
		and idx.imprv_det_id = id.imprv_det_id 
		)

*/


























	drop table #tmpImprvDetail
	
	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()
	
	print '    Done at ' + convert(varchar(30), getdate(), 109)

	--Improvement Detail Sketch - Export Info

	print 'Exporting Sketch info... at ' + convert(varchar(30), getdate(), 109)
	set @status = 'Sketch'
	create table _clientdb_imprv_det_sketch
	(
		prop_id int not null,
		prop_val_yr numeric(4,0) not null,
		imprv_det_type_cd varchar(10) null,
		imprv_det_typ_desc varchar(50) null,
		imprv_det_area numeric(18,1) null,
		sketch_cmds varchar(1800) null,
		living_area numeric(18,1) null
	)

	insert _clientdb_imprv_det_sketch
	(prop_id, prop_val_yr, imprv_det_type_cd, imprv_det_typ_desc, imprv_det_area,
	 sketch_cmds, living_area)

	select
		i.prop_id,
		i.prop_val_yr,
		i.imprv_det_type_cd,
		idt.imprv_det_typ_desc,
		i.imprv_det_area,
		i.sketch_cmds,
		case when isnull(main_area, 'F') = 'T' then i.imprv_det_area else 0 end as living_area
	from imprv_detail as i with (nolock) 
	join imprv_det_type as idt with (nolock)
	on i.imprv_det_type_cd = idt.imprv_det_type_cd
	join #layer_assoc as psa with (nolock)
	on i.prop_val_yr = psa.owner_tax_yr
	and i.sup_num = psa.sup_num
	and i.prop_id = psa.prop_id
	join _clientdb_pacs_year as y with (nolock)
	on i.prop_val_yr = y.tax_yr
	and i.sale_id = 0
	and i.imprv_id =
	(
		select min(imprv_id)
		from imprv with (nolock)
		where prop_val_yr = psa.owner_tax_yr
		and sup_num = psa.sup_num
		and sale_id = 0
		and prop_id = psa.prop_id
	)

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()
	
	-------------------------
	if @region = @washington
	begin
		set @status = '_clientdb_property_sketch'
		set @sql = '
		create table '+ @input_database_name + '.dbo._clientdb_property_sketch
		(
			id int identity(1,1) not null,
			prop_id int not null,
			prop_val_yr numeric(4,0) not null,
			imprv_id int not null,
			image_path varchar(255) null
		)
		
		insert into ' + @input_database_name + '.dbo._clientdb_property_sketch
		(prop_id, prop_val_yr, imprv_id, image_path)
		
		select img.ref_id as prop_id, img.ref_year as prop_val_yr, img.ref_id1 as imprv_id,
		location as image_path 
		from pacs_image img with (nolock)
		join (	select min(i.imprv_id) minID, i.prop_id, i.prop_val_yr, i.sup_num, i.sale_id
				from imprv i with (nolock)
				join #layer_assoc la with (nolock)
				on i.prop_val_yr = la.owner_tax_yr
				and i.sup_num = la.sup_num
				and i.prop_id = la.prop_id
				group by i.prop_id, i.prop_val_yr, i.sup_num, i.sale_id ) imp on
			img.ref_year = imp.prop_val_yr
			and img.ref_id2 = imp.sup_num			
			and img.ref_id = imp.prop_id
			and img.ref_id3 = imp.sale_id
			and img.ref_id1 = imp.minID
		where img.ref_type = ''SKTCH''
			and img.image_type = ''SKETCH_LG'' 
			--sale_id
			and img.ref_id3 = 0'
		
		exec (@sql)
		set @sql = 'use ' + @input_database_name + ' ;checkpoint'
		exec (@sql)
		
		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
		
		
		set @status = 'Property Image'
		set @sql = '
		create table '+ @input_database_name + '.dbo._clientdb_property_image
		(
			id int identity(1,1) not null,
			prop_id int not null,
			year numeric(4, 0) not null,
			image_path varchar(255) null,
			image_nm varchar(64) null,
			image_type char(10) null,
			sub_type char(10) null,
			rec_type char(10) null,
			comment varchar(255) null
		)
		
		insert into ' + @input_database_name + '.dbo._clientdb_property_image
		(prop_id, image_path, image_nm, year, image_type, sub_type, rec_type, comment)

		select img.ref_id as prop_id, location as image_path, img.image_nm as image_nm,
			img.ref_year as year, img.image_type as image_type, img.sub_type as sub_type,
			img.rec_type as rec_type, img.comment as comment
		
		from pacs_image img with (nolock)
		join sub_type as st with (nolock)
		on img.image_type = st.image_type
			and img.rec_type = st.rect_type
			and img.sub_type = st.sub_type
		where img.ref_type in (''P'' , ''PP'' , ''PI'')
			and isNull(st.allow_website_images, 0) = 1
		'
		
		exec (@sql)
		set @sql = 'use ' + @input_database_name + ' ;checkpoint'
		exec (@sql)

		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
		
		set @status = '_clientdb_payments'
		set @sql = '
		create table '+ @input_database_name + '.dbo._clientdb_payments
		(
			prop_id int not null,
			year numeric(4, 0) not null,
			statement_id int not null,
			paid bit not null default (0),
			primary key clustered (prop_id, year, statement_id)
			with fillfactor = 100
		)'
		
		exec (@sql)
		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
	end
		
	print '    Done at ' + convert(varchar(30), getdate(), 109)

	--Land Detail - Export Info

	print 'Exporting Land Detail... at ' + convert(varchar(30), getdate(), 109)
	set @status = 'Land Detail'
	
	set @sql = 'select
		l.prop_id,
		l.prop_val_yr,
		l.land_seg_id,
		l.land_type_cd,
		lt.land_type_desc,
		l.size_acres,
		l.size_square_feet,
		l.effective_front,
		l.effective_depth,
		isnull(l.land_seg_mkt_val, 0) as land_seg_mkt_val,
		isnull(l.ag_val, 0) as ag_val,
		''T'' as show_values
		into _clientdb_land_detail from land_detail as l with (nolock)
	join #layer_assoc as psa with (nolock)
	on l.prop_val_yr = psa.owner_tax_yr
	and l.sup_num = psa.sup_num
	and l.prop_id = psa.prop_id
	join land_type as lt with (nolock)
	on l.land_type_cd = lt.land_type_cd
	join _clientdb_pacs_year as y with (nolock)
	on l.prop_val_yr = y.tax_yr
	where l.sale_id = 0'
	exec(@sql)

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()

	print '    Done at ' + convert(varchar(30), getdate(), 109)

	--Abstract/Subdv/MH - Export Info

	print 'Exporting Abstract/Subdivision info... at ' + convert(varchar(30), getdate(), 109)
	set @status = 'Abstract/Subdivision'
	
	set @sql = 'select abs_subdv_ind, abs_subdv_cd, abs_subdv_desc into ' + @input_database_name + 
	'.dbo._clientdb_abs_subdv from abs_subdv with (nolock)
	where abs_subdv_yr =
	(
		select max(abs_subdv2.abs_subdv_yr)
		from abs_subdv as abs_subdv2 with (nolock)
		where abs_subdv.abs_subdv_ind = abs_subdv2.abs_subdv_ind
	)
	order by abs_subdv_ind, abs_subdv_cd'
	exec(@sql)
	set @sql = 'use ' + @input_database_name + ' ;checkpoint'
	exec (@sql)
	
	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()

	print '    Done at ' + convert(varchar(30), getdate(), 109)
	print 'Exporting Neighborhood Info... at ' + convert(varchar(30), getdate(), 109)
	set @status = 'Neighborhood'
	
	set @sql = 'select hood_cd, hood_name into ' + @input_database_name + 
	'.dbo._clientdb_neighborhood from neighborhood with (nolock)
	where hood_yr =
	(
		select max(n.hood_yr)
		from neighborhood as n	with (nolock)
	)
	order by hood_cd'
	exec(@sql)
	set @sql = 'use ' + @input_database_name + ' ;checkpoint'
	exec (@sql)

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()

	print '    Done at ' + convert(varchar(30), getdate(), 109)

	-- Property info

	print 'Exporting Property Info... at ' + convert(varchar(30), getdate(), 109)
	set @status = 'Exporting Property Info - Improvement Adj'
	
	create table _clientdb_property
	(
		prop_id int not null,
		prop_val_yr numeric(4,0) not null,
		geo_id varchar(50) null,
		prop_type_cd varchar(5) null,
		prop_type_desc varchar(50) null, 
		dba_name varchar(50) null,
		legal_desc varchar(255) null,
		appraised_val numeric(14,0) null,
		abs_subdv_cd varchar(50) null,
		mapsco varchar(20) null,
		map_id varchar(20) null,
		udi_parent_prop_id int null,
		agent_cd varchar(10) null,
		situs_display varchar(255) null,
		situs_num varchar(15) null,
		situs_street varchar(50) null,
		street_name varchar(75) null,
		situs_city varchar(30) null,
		hood_cd varchar(10) null,
		hood_name varchar(100) null,
		owner_name varchar(70) null,
		addr_line1 varchar(60) null,
		addr_line2 varchar(60) null,
		addr_line3 varchar(60) null,	
		addr_city varchar(50) null,
		addr_state varchar(50) null,
		addr_zip varchar(10) null,
		country_cd varchar(5) null,	
		owner_id int null,
		pct_ownership numeric(13,10) null,
		udi_child_prop_id int null,
		percent_type varchar(5) null,
		exemptions varchar(100) null,
		state_cd varchar(10) null,
		jurisdictions varchar(100) null,
		image_path varchar(255) null,
		show_values varchar(1) null,
		tax_area_id int null,
		tax_area varchar(300),
		dor_use_code varchar(10),
		open_space varchar(1) default 'N',
		dfl varchar(1) default 'N',
		historic varchar(1) default 'N',
		remodel varchar(1) default 'N',
		multi_fam varchar(1) default 'N',
		township_code varchar(20) null,
		range_code varchar(20) null,
		township_section varchar(50) null,
		legal_acreage numeric(14,4) null,
		non_taxed_mkt_val numeric (14,0) null,
		is_leased_land_property bit not null
	)
	
	-- Load imprv_adj and land_detail for use in sub queries
	select distinct ia.prop_val_yr, ia.prop_id,  iat.imprv_adj_type_patype 
	into #imprv_adj from imprv_adj ia with (nolock)
	join imprv_adj_type iat with (nolock)
	on ia.prop_val_yr = iat.imprv_adj_type_year 
	and ia.imprv_adj_type_cd = iat.imprv_adj_type_cd
	join _clientdb_pacs_year as y with (nolock)
	on ia.prop_val_yr = y.tax_yr
	join #layer_assoc as psa with (nolock)
	on ia.prop_val_yr = psa.owner_tax_yr
	and ia.prop_id = psa.prop_id
	and ia.sup_num = psa.sup_num 
	where ia.sale_id = 0
	
	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
	set @status = 'Exporting Property Info - #land_detail'
	
	select distinct ld.prop_val_yr, ld.prop_id, au.dfl, au.timber, au.ag, au.osp
	into #land_detail 
	from land_detail as ld with (nolock)
	join _clientdb_pacs_year as y with (nolock)
	on ld.prop_val_yr = y.tax_yr
	join #layer_assoc as psa with (nolock)
	on ld.prop_val_yr = psa.owner_tax_yr
	and ld.sup_num = psa.sup_num
	and ld.prop_id = psa.prop_id
	join ag_use as au with (nolock)
	on ld.ag_use_cd = au.ag_use_cd
	where ld.sale_id = 0
	and ld.ag_apply = 'T'
	
	
	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
	set @status = 'Exporting Property Info'

	set @sql = '
		declare @region varchar(5)
		select @region = szConfigValue from core_config with (nolock) where szConfigName = ''REGION''
		if(@region is null) set @region = ''WA''

		insert _clientdb_property
		(prop_id, prop_val_yr, geo_id, prop_type_cd, prop_type_desc, dba_name, legal_desc, 
		 appraised_val, abs_subdv_cd, mapsco, map_id, udi_parent_prop_id, 
		 situs_display, situs_num, situs_street, street_name, situs_city,
		 hood_cd, hood_name, owner_name, addr_line1, addr_line2, addr_line3,
		 addr_city, addr_state, addr_zip, country_cd, owner_id, pct_ownership,
		 udi_child_prop_id, percent_type, exemptions, state_cd, jurisdictions, image_path, 
		 dor_use_code, open_space, dfl, historic, remodel, multi_fam,
		 township_code, range_code, township_section, legal_acreage, non_taxed_mkt_val, is_leased_land_property
		 )

		 select	p.prop_id,
				pv.prop_val_yr,
				p.geo_id,
				p.prop_type_cd,
				pt.prop_type_desc,
				p.dba_name,
				pv.legal_desc,
				isnull(pv.appraised_val, 0) as appraised_val,
				case when p.prop_type_cd = ''MH'' then pv.mbl_hm_park else pv.abs_subdv_cd end,
				pv.mapsco,
				pv.map_id,
				pv.udi_parent_prop_id,
				s.situs_display,
				s.situs_num,
				s.situs_street,
					ltrim(rtrim(
					(case 
						when isnull([situs_street_prefx],'''') = '''' then '''' 
						else rtrim(ltrim([situs_street_prefx]))+'' '' 
					end) +
					(case 
						when [situs_street] IS NULL then '''' 
						else rtrim(ltrim([situs_street]))+'' '' 
					end) +
					(case 
						when [situs_street_sufix] IS NULL then '''' 
						else rtrim(ltrim([situs_street_sufix]))
					end)
					))
				as street_name,
				s.situs_city,
				n.hood_cd,
				n.hood_name,
				a.file_as_name as owner_name,
				ad.addr_line1,
				ad.addr_line2,
				ad.addr_line3,
				ad.addr_city,
				ad.addr_state,
				ad.addr_zip,
				ad.country_cd,
				'	
	if @use_col_owner_id = 0
	begin
		set @sql2 = 'o.owner_id,'
	end
	else
	begin
		set @sql2 = 'p.col_owner_id,'
	end

	set @sql = @sql + @sql2 + '
				o.pct_ownership,
				o.udi_child_prop_id,
				o.percent_type,
				dbo.fn_getExemptions(o.prop_id, o.owner_tax_yr, o.sup_num) as exemptions,
				rtrim(pp.state_cd) as state_cd,
				case 
					when @region = ''WA'' 
					then null
					else dbo.fn_getEntities(o.prop_id, o.owner_tax_yr, o.sup_num) 
				end as jurisdictions,
				pv.image_path,
				pu.dor_use_code,
				open_space =
					case when exists (select prop_id from #land_detail as ld with (nolock) 
									where (ld.prop_id = pv.prop_id and ld.prop_val_yr = pv.prop_val_yr)
										and (ld.timber = 1 or ld.ag = 1 or ld.osp = 1)
						)
						then ''Y''
						else ''N''
					end,
				dfl =
					case when exists (select prop_id from #land_detail as ld with (nolock) 
									where (ld.prop_id = pv.prop_id and ld.prop_val_yr = pv.prop_val_yr)
										and ld.dfl = 1
						)
						then ''Y''
						else ''N''
					end,
				historic =
					case when exists (select prop_id from #imprv_adj as ia with (nolock) 
								where ia.prop_id = pv.prop_id and  ia.prop_val_yr = pv.prop_val_yr 
								and ia.imprv_adj_type_patype = 1)
						then ''Y''
						else ''N''
					end,
				remodel =
					case 
					when exists (select prop_id from #imprv_adj as ia with (nolock) 
								where ia.prop_id = pv.prop_id and ia.prop_val_yr = pv.prop_val_yr 
								and ia.imprv_adj_type_patype = 0)
						then ''Y''
						else ''N''
					end,
				multi_fam =
					case 
					when exists (select prop_id from #imprv_adj as ia with (nolock) 
								where ia.prop_id = pv.prop_id and ia.prop_val_yr = pv.prop_val_yr 
								and ia.imprv_adj_type_patype = 3)
						then ''Y''
						else ''N''
					end,
				ts.township_code,
				rr.range_code,
				pv.township_section,
				pv.legal_acreage,
				pv.non_taxed_mkt_val,
				is_leased_land_property =
					case when isnull(pst.imp_leased_land, 0) = 1 and p.prop_type_cd = ''R''
						then 1 else 0 
					end
				
				
		from property_val as pv with (nolock)
		join property as p with (nolock)
		on pv.prop_id = p.prop_id
		join owner as o with (nolock)
		on pv.prop_val_yr = o.owner_tax_yr
		and pv.sup_num = o.sup_num
		and pv.prop_id = o.prop_id
		join #layer_assoc as psa with (nolock)
		on pv.prop_val_yr = psa.owner_tax_yr
		and pv.sup_num = psa.sup_num
		and pv.prop_id = psa.prop_id
		join _clientdb_pacs_year as y with (nolock)
		on pv.prop_val_yr = y.tax_yr
		left outer join property_profile as pp with (nolock)
		on pv.prop_val_yr = pp.prop_val_yr
		and pv.prop_id = pp.prop_id
		'
	if @use_col_owner_id = 0
	begin
		set @sql2 = '
		join account as a with (nolock)
		on o.owner_id = a.acct_id
		join address as ad with (nolock)
		on o.owner_id = ad.acct_id
		'
	end
	else
	begin
		set @sql2 = '
		join account as a with (nolock)
		on p.col_owner_id = a.acct_id
		join address as ad with (nolock)
		on p.col_owner_id = ad.acct_id
		'
	end
	set @sql = @sql + @sql2 + '
		and ad.primary_addr = ''Y''
		join property_type as pt with (nolock)
		on p.prop_type_cd = pt.prop_type_cd
		join pacs_year as py with (nolock)
		on pv.prop_val_yr = py.tax_yr
		left outer join situs as s with (nolock)
		on p.prop_id = s.prop_id
		and s.primary_situs = ''Y''
		left outer join neighborhood as n with (nolock)
		on pv.hood_cd = n.hood_cd
		and pv.prop_val_yr = n.hood_yr
		left outer join property_use as pu with (nolock)
		on pv.property_use_cd = pu.property_use_cd
		left join township as ts with (nolock)
		on pv.township_code = ts.township_code
		and pv.prop_val_yr = ts.township_year
		left join prop_range rr with (nolock)
		on pv.range_code = rr.range_code
		and	pv.prop_val_yr = rr.range_year
		left outer join property_sub_type pst with (nolock)
		on pv.sub_type = pst.property_sub_cd
	
		where ((pv.prop_inactive_dt is null) or 
			(pv.collections_only = 1 and ' + cast(@collections_only as varchar) + ' = 1))
		'
	if @hide_minerals = 1
	begin
		set @sql = @sql + '
		and p.prop_type_cd <> ''MN''
			'
	end
	exec(@sql)
	
	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()
	
	set @status = 'Exporting Property Info - UDI Parents'
	
	
	-- HS 50020 Kevin Lloyd - col_owner_id mod not required here, since this query deals with UDI parents.
	
	set @status = 'UDI Parents'
	set @sql = '
	declare @region varchar(5)
	select @region = szConfigValue from core_config with (nolock) where szConfigName = ''REGION''
	if(@region is null) set @region = ''WA''
		
	insert _clientdb_property
	(prop_id, prop_val_yr, geo_id, prop_type_cd, prop_type_desc, dba_name, legal_desc, 
	 appraised_val, abs_subdv_cd, mapsco, map_id, udi_parent_prop_id, 
	 situs_display, situs_num, situs_street, street_name, situs_city,
	 hood_cd, hood_name, owner_name, addr_line1, addr_line2, addr_line3,
	 addr_city, addr_state, addr_zip, country_cd, owner_id, pct_ownership,
	 udi_child_prop_id, percent_type, exemptions, state_cd, jurisdictions, image_path)

	select	p.prop_id,
			pv.prop_val_yr,
			p.geo_id,
			p.prop_type_cd,
			pt.prop_type_desc,
			p.dba_name,
			pv.legal_desc,
			isnull(pv.appraised_val, 0) as appraised_val,
			case when p.prop_type_cd = ''MH'' then pv.mbl_hm_park else pv.abs_subdv_cd end,
			pv.mapsco,
			pv.map_id,
			pv.udi_parent_prop_id,
			s.situs_display,
			s.situs_num,
			s.situs_street,
				ltrim(rtrim(
				(case 
					when isnull([situs_street_prefx],'''') = '''' then '''' 
					else rtrim(ltrim([situs_street_prefx]))+'' '' 
				end) +
				(case 
					when [situs_street] IS NULL then '''' 
					else rtrim(ltrim([situs_street]))+'' '' 
				end)+
				(case 
					when [situs_street_sufix] IS NULL then '''' 
					else rtrim(ltrim([situs_street_sufix]))
				end)
				))
			as street_name,
			s.situs_city,
			n.hood_cd,
			n.hood_name,
			a.file_as_name as owner_name,
			ad.addr_line1,
			ad.addr_line2,
			ad.addr_line3,
			ad.addr_city,
			ad.addr_state,
			ad.addr_zip,
			ad.country_cd,
			o.owner_id,
			o.pct_ownership,
			o.udi_child_prop_id,
			o.percent_type,
			dbo.fn_getExemptions(o.prop_id, o.owner_tax_yr, o.sup_num) as exemptions,
			rtrim(pp.state_cd) as state_cd,
			case 
				when @region = ''WA'' 
				then null
				else dbo.fn_getEntities(o.prop_id, o.owner_tax_yr, o.sup_num)
			end as jurisdictions,
			pv.image_path
	from property_val as pv with (nolock)
	join property as p with (nolock)
	on pv.prop_id = p.prop_id
	join owner as o with (nolock)
	on pv.prop_val_yr = o.owner_tax_yr
	and pv.sup_num = o.sup_num
	and pv.prop_id = o.prop_id
	join #layer_assoc as psa with (nolock)
	on pv.prop_val_yr = psa.owner_tax_yr
	and pv.sup_num = psa.sup_num
	and pv.prop_id = psa.prop_id
	join _clientdb_pacs_year as y with (nolock)
	on pv.prop_val_yr = y.tax_yr
	left outer join property_profile as pp with (nolock)
	on pv.prop_val_yr = pp.prop_val_yr
	and pv.prop_id = pp.prop_id
	join account as a with (nolock)
	on o.owner_id = a.acct_id
	join address as ad with (nolock)
	on o.owner_id = ad.acct_id
	and ad.primary_addr = ''Y''
	join property_type as pt with (nolock)
	on p.prop_type_cd = pt.prop_type_cd
	join pacs_year as py with (nolock)
	on pv.prop_val_yr = py.tax_yr
	left outer join situs as s with (nolock)
	on p.prop_id = s.prop_id
	and s.primary_situs = ''Y''
	left outer join neighborhood as n with (nolock)
	on pv.hood_cd = n.hood_cd
	and pv.prop_val_yr = n.hood_yr
	where udi_parent = ''T''
	'
	if @hide_minerals = 1
	begin
		set @sql = @sql + '
		and p.prop_type_cd <> ''MN''
		'
	end
	
	exec(@sql)

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()

	set @status = 'Tax Area Updates'
	if @region = @washington
	begin --Populate Tax Area Information
		set @sql = '
		update _clientdb_property set 
			tax_area_id = pta.tax_area_id,
			tax_area = ta.tax_area_number + '' - '' + ta.tax_area_description
		from _clientdb_property as dbP with (nolock)
		join property_tax_area pta with (nolock) on 
			dbP.prop_val_yr = pta.year
			and dbP.prop_id = pta.prop_id
		join tax_area ta with (nolock) on
			ta.tax_area_id = pta.tax_area_id 
		'
		exec(@sql)
	end

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()

	print '  Agent Update... at ' + convert(varchar(30), getdate(), 109)
	set @status = 'Agent'
	-- do agents separately, subquery is too slow
	update c
	set agent_cd = case when ag.agent_cd is null then 'ID:' + cast (ag.agent_id as varchar(7)) else ag.agent_cd end
	from _clientdb_property as c with(tablock)
	join agent_assoc as aa with (nolock)
	on c.prop_val_yr = aa.owner_tax_yr
	and c.prop_id = aa.prop_id
	and c.owner_id = aa.owner_id
	join agent as ag with (nolock)
	on aa.agent_id = ag.agent_id

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()

	print '    Done at ' + convert(varchar(30), getdate(), 109)

	-- Roll Value history

	print 'Exporting Roll History Values... at ' + convert(varchar(30), getdate(), 109)
	set @status = 'Roll History'
	
	if @region = @texas
	begin 
		set @sql = '
		select		
				pv.prop_id,
				pv.prop_val_yr,
				isnull(pv.imprv_hstd_val,0) + isnull(pv.imprv_non_hstd_val,0) as improvements,
				isnull(pv.land_hstd_val,0) + isnull(pv.land_non_hstd_val,0) + isnull(pv.ag_market,0) + isnull(pv.timber_market,0) as land_market,
				isnull(pv.ag_use_val,0) + isnull(pv.timber_use,0) as ag_valuation,
				isnull(pv.appraised_val, 0) as appraised_val,
				pv.ten_percent_cap,
				isnull(pv.assessed_val, 0) as assessed_val,
				''T'' as show_values
		into _clientdb_roll_value_history_detail
		from property_val as pv with (nolock)
		join #layer_assoc as psa with (nolock)
		on pv.prop_val_yr = psa.owner_tax_yr
		and pv.sup_num = psa.sup_num
		and pv.prop_id = psa.prop_id
		join _clientdb_pacs_year as y with (nolock)
		on pv.prop_val_yr = y.tax_yr
		join _clientdb_property as pv2 with (nolock)
		on pv2.prop_id = pv.prop_id
		and pv2.prop_val_yr = pv.prop_val_yr
		'
	
	end 
	else --Washington
	begin
		set @sql = '
		select		
				pv.prop_id,
				pv.prop_val_yr,
				isnull(pv.imprv_hstd_val,0) + isnull(pv.imprv_non_hstd_val,0) as improvements,
				isnull(pv.land_hstd_val,0) + isnull(pv.land_non_hstd_val,0) + isnull(pv.ag_market,0) + isnull(pv.timber_market,0)
							+ isnull(pv.ag_hs_mkt_val,0) + isnull(pv.timber_hs_mkt_val,0) as land_market,
				isnull(pv.ag_use_val,0) + isnull(pv.timber_use,0) + isnull(pv.ag_hs_use_val,0) + isnull(pv.timber_hs_use_val,0) as ag_valuation,
				isnull(wpov.appraised, 0) as appraised_val,
				pv.ten_percent_cap,
				isNull(wpov.taxable_classified, 0) + isNull(wpov.taxable_non_classified, 0) as assessed_val,
				''T'' as show_values
		into _clientdb_roll_value_history_detail
		from property_val as pv with (nolock)
		join #layer_assoc as psa with (nolock)
		on pv.prop_val_yr = psa.owner_tax_yr
		and pv.sup_num = psa.sup_num
		and pv.prop_id = psa.prop_id
		join _clientdb_pacs_year as y with (nolock)
		on pv.prop_val_yr = y.tax_yr
		join _clientdb_property as pv2 with (nolock)
		on pv2.prop_id = pv.prop_id
		and pv2.prop_val_yr = pv.prop_val_yr
		left join wash_prop_owner_val wpov with (nolock)
		on pv.prop_val_yr = wpov.year
		and pv.sup_num = wpov.sup_num
		and pv.prop_id = wpov.prop_id 
		'
	end	
	
	exec(@sql) --_clientdb_roll_value_history_detail

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()

	print '    Done at ' + convert(varchar(30), getdate(), 109)

	-- Taxing Jurisdiction detail

	print 'Exporting Taxing Jurisdiction Detail... at ' + convert(varchar(30), getdate(), 109)
	set @status = 'Taxing Jurisdiction'
	
	create table _clientdb_taxing_jurisdiction_detail
	(
		prop_id int not null,
		owner_prop_id int not null,
		sup_yr numeric(4,0) not null,
		owner_id int not null,
		entity_id int null,
		owner_name varchar(70) null,
		pct_ownership numeric(13,10) null,
		total_market numeric(18,0) null,
		total_appraised_val numeric(18,0) null,
		total_assessed_val numeric(18,0) null,
		entity_cd varchar(5) null,
		file_as_name varchar(70) null,
		tax_rate numeric(15,10) null,	
		appraised_val numeric(18,0) null,
		assessed_val numeric(18,0) null,
		taxable_val numeric(18,0) null,
		freeze_ceiling numeric(14,2) null,
		show_values varchar(1) null,
		homesite_val numeric(18,0) null, --classified
		nonhomesite_val numeric(18,0) null, --non-classified
		tax_area_id int null,
		tax_district_id int,
		levy_rate numeric(13, 10),
		levy_cd varchar(10) null,
		levy_description varchar(50) null,
		taxes numeric (14, 2) null, 
		taxes_wo_ex numeric (14, 2) null
	)
	
	-- HS 50020 Kevin Lloyd
	if @region = @washington
	begin
		set @sql = '		
			insert _clientdb_taxing_jurisdiction_detail
			(prop_id, owner_prop_id, sup_yr, owner_id, owner_name, pct_ownership,
			 total_market, total_appraised_val, total_assessed_val, appraised_val, assessed_val,
			 taxable_val, homesite_val, nonhomesite_val, tax_area_id, tax_district_id, levy_cd, levy_description)

			select	o.prop_id,
					wpov.prop_id as owner_prop_id,
					wpov.[year],
					wpov.owner_id,
					a.file_as_name as owner_name,
					o.pct_ownership,
					wpov.market as total_market,
					isnull(wpov.appraised,0) as total_appraised_val,
					isnull(wpov.taxable_classified, 0) + isnull(wpov.taxable_non_classified, 0) as total_assessed_val,
					isnull(wpov.appraised,0) as appraised_val,
					isnull(wpov.taxable_classified, 0) + isnull(wpov.taxable_non_classified, 0) as assessed_val,
					null,
					isnull(wpov.land_hstd_val,0) + isnull(wpov.imprv_hstd_val,0) as homesite_val,
					isnull(wpov.land_non_hstd_val,0) + isnull(wpov.imprv_non_hstd_val,0) as nonhomesite_val,
					pta.tax_area_id, 
					tafa.tax_district_id,
					tafa.levy_cd,
					levy.levy_description
			from wash_prop_owner_val as wpov with (nolock)
			join owner as o with (nolock)
			on wpov.[year] = o.owner_tax_yr
			and wpov.sup_num = o.sup_num
			and wpov.prop_id = isnull(o.udi_child_prop_id, o.prop_id)
			and wpov.owner_id = o.owner_id
			join #layer_assoc as psa with (nolock)
			on psa.owner_tax_yr = wpov.year
			and psa.sup_num = wpov.sup_num
			and psa.prop_id = wpov.prop_id
			join property_val as pv with (nolock)
			on wpov.year = pv.prop_val_yr
			and wpov.sup_num = pv.sup_num
			and wpov.prop_id = pv.prop_id
			join property_tax_area as pta with (nolock)
			on wpov.year = pta.year and
			wpov.sup_num = pta.sup_num and 
			wpov.prop_id = pta.prop_id			
			join tax_area_fund_assoc as tafa with (nolock)
			on pta.tax_area_id = tafa.tax_area_id
			and pta.[year] = tafa.[year]
			join levy with (nolock)
			on tafa.year = levy.year and
			tafa.tax_district_id = levy.tax_district_id
			and tafa.levy_cd = levy.levy_cd
			'
		if @use_col_owner_id = 0
		begin
			set @sql2 = '
			join account as a with (nolock)
			on o.owner_id = a.acct_id
			join _clientdb_pacs_year as y with (nolock)
			on wpov.[year] = y.tax_yr
			'
		end
		else
		begin
			set @sql2 = '
			join property as p with (nolock)
			on wpov.prop_id = p.prop_id
			join account as a with (nolock)
			on p.col_owner_id = a.acct_id
			join pacs_year as y with (nolock)
			on wpov.[year] = y.tax_yr
			'
		end
	end
	else -- Texas Region
	begin
		set @sql = '		
			insert _clientdb_taxing_jurisdiction_detail
			(prop_id, owner_prop_id, sup_yr, owner_id, entity_id, owner_name, pct_ownership,
			 total_market, total_appraised_val, total_assessed_val, appraised_val, assessed_val,
			 taxable_val, freeze_ceiling, homesite_val, nonhomesite_val)

			select	o.prop_id,
					poev.prop_id as owner_prop_id,
					poev.sup_yr,
					poev.owner_id,
					poev.entity_id,
					a.file_as_name as owner_name,
					o.pct_ownership,
					pv.market as total_market,
					isnull(pv.appraised_val,0) as total_appraised_val,
					isnull(pv.assessed_val, 0) as total_assessed_val,
					isnull(poev.appraised_val,0) as appraised_val,
					isnull(poev.assessed_val, 0) as assessed_val,
					isnull(poev.taxable_val, 0) as taxable_val,
					poev.freeze_ceiling,
					isnull(poev.land_hstd_val,0) + isnull(poev.imprv_hstd_val,0) - isnull(poev.ten_percent_cap,0) as homesite_val,
					isnull(poev.land_non_hstd_val,0) + isnull(poev.imprv_non_hstd_val,0) as nonhomesite_val
				
			from prop_owner_entity_val as poev with (nolock)
			join owner as o with (nolock)
			on poev.sup_yr = o.owner_tax_yr
			and poev.sup_num = o.sup_num
			and poev.prop_id = isnull(o.udi_child_prop_id, o.prop_id)
			and poev.owner_id = o.owner_id
			join #layer_assoc as psa with (nolock)
			on psa.owner_tax_yr = poev.sup_yr
			and psa.sup_num = poev.sup_num
			and psa.prop_id = poev.prop_id
			join property_val as pv with (nolock)
			on poev.sup_yr = pv.prop_val_yr
			and poev.sup_num = pv.sup_num
			and poev.prop_id = pv.prop_id
			'
		if @use_col_owner_id = 0
		begin
			set @sql2 = '
			join account as a with (nolock)
			on o.owner_id = a.acct_id
			join _clientdb_pacs_year as y with (nolock)
			on poev.sup_yr = y.tax_yr
			'
		end
		else
		begin
			set @sql2 = '
			join property as p with (nolock)
			on poev.prop_id = p.prop_id
			join account as a with (nolock)
			on p.col_owner_id = a.acct_id
			join pacs_year as y with (nolock)
			on poev.sup_yr = y.tax_yr
			'
		end
	end
	
	--Execute taxing jurisdiction query
	set @sql = @sql + @sql2
	exec(@sql)

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()

	print '  Tax Rate Update... at ' + convert(varchar(30), getdate(), 109)
	
	if @region = @washington
	begin
		set @status = 'Taxing Rate Update: Step 1'
		create clustered index IDX__clientdb_taxing_jurisdiction_detail_sup_yr_levy_cd
		on _clientdb_taxing_jurisdiction_detail (sup_yr, prop_id, tax_district_id, levy_cd)
		with fillfactor = 90
		
		-- Use @sql so that a reference to the wash_prop_owner_val_tax_vw does not break
		set @sql = '
			update ct
			set levy_rate = case when levy_exemption is null or 
							        levy_exemption not in (	select exmpt_type_cd 
																	from property_exemption with (nolock)
																	
																	where owner_tax_yr = ct.sup_yr
																	and prop_id = ct.prop_id
																	and sup_num = psa.sup_num)
								then tax.levy_rate_non_classified
								else tax.levy_rate_classified 
							end,
				taxable_val = tax.taxable,
				taxes = tax.tax_amt,
				taxes_wo_ex = tax.tax_wout_ex_amt
				
			from _clientdb_taxing_jurisdiction_detail as ct with(tablock)
			join #layer_assoc as psa with (nolock)
			on psa.owner_tax_yr = ct.sup_yr
			and psa.prop_id = ct.prop_id
			join wash_prop_owner_val_tax_vw as tax with (nolock)
			on tax.year = ct.sup_yr
			and tax.prop_id = ct.prop_id
			and tax.tax_district_id = ct.tax_district_id
			and tax.levy_cd = ct.levy_cd
			and tax.sup_num = psa.sup_num
		'
		exec(@sql)
        -- rgoolsby removed update of file_as_name from previous statement for performane
        
    declare @AcctFileName table
       (acct_id int NOT NULL,
         file_as_name varchar(70) NOT NULL
        )

    insert into @AcctFileName(acct_id,file_as_name)
      select a.acct_id,a.file_as_name
        from account as a with(nolock)
             inner join
             ( select distinct tax_district_id 
                 from _clientdb_taxing_jurisdiction_detail
             ) as ct
          on a.acct_id = ct.tax_district_id

    update ct
       set file_as_name = a.file_as_name
      from _clientdb_taxing_jurisdiction_detail as ct
           inner join
           @AcctFileName as a
        on ct.tax_district_id = a.acct_id
        
    insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
		set @status = 'Taxing Rate Update: Step 2'
	end
	else --Texas
	begin
		set @status = 'Taxing Rate Update'
		create nonclustered index IDX__clientdb_taxing_jurisdiction_detail_sup_yr_entity_id
		on _clientdb_taxing_jurisdiction_detail (entity_id, sup_yr)
		with fillfactor = 90

		update ct
		set entity_cd = e.entity_cd,
			file_as_name = ae.file_as_name,
			tax_rate = isnull(tr.m_n_o_tax_pct, 0) + isnull(tr.i_n_s_tax_pct, 0) + isnull(tr.prot_i_n_s_tax_pct,0)
		from _clientdb_taxing_jurisdiction_detail as ct with(tablock)
		join entity as e with (nolock)
		on ct.entity_id = e.entity_id
		join account as ae with (nolock)
		on ct.entity_id = ae.acct_id
		join tax_rate as tr	with (nolock)
		on ct.entity_id = tr.entity_id
		and ct.sup_yr = tr.tax_rate_yr
	end
	
	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()

	print '    Done at ' + convert(varchar(30), getdate(), 109)

	-- Values Detail

	print 'Exporting Values Detail... at ' + convert(varchar(30), getdate(), 109)
	set @status = 'Values Update'
	
	if @region = @texas
	begin
		select	pv.prop_id as prop_id,
				pv.prop_val_yr as prop_val_yr,
				isnull(pv.imprv_hstd_val, 0) as imprv_hstd_val,
				isnull(pv.imprv_non_hstd_val, 0) as imprv_non_hstd_val,
				isnull(pv.land_hstd_val, 0) as land_hstd_val,
				isnull(pv.land_non_hstd_val, 0) as land_non_hstd_val,
				isnull(pv.ag_use_val, 0) as ag_use_val,
				pv.timber_use as timber_use,
				isnull(pv.ag_market, 0) as ag_market,
				isnull(pv.timber_market, 0) as timber_market,
				isnull(pv.market, 0) as market,
				isnull(pv.appraised_val, 0) as appraised_val,
				pv.ten_percent_cap as ten_percent_cap,
				isnull(pv.assessed_val, 0) as assessed_val,
				0 as current_hs_use_val,
				0 as current_nhs_use_val,				
				0 as current_hs_mkt_val,
				0 as current_nhs_mkt_val,
				0 as productivity_loss,
				0 as exmpt_value, 
				0 as snr_exempt_loss,
				'T' as show_values
		into _clientdb_values_detail	
		from property_val as pv with (nolock)
		join #layer_assoc as psa with (nolock)
		on pv.prop_val_yr = psa.owner_tax_yr
		and pv.sup_num = psa.sup_num
		and pv.prop_id = psa.prop_id
		join _clientdb_pacs_year as y with (nolock)
		on pv.prop_val_yr = y.tax_yr
				
	end
	else  --Washington
	begin
		select	pv.prop_id as prop_id,
				pv.prop_val_yr as prop_val_yr,
				isnull(pv.imprv_hstd_val, 0) as imprv_hstd_val,
				isnull(pv.imprv_non_hstd_val, 0) as imprv_non_hstd_val,
				isnull(pv.land_hstd_val, 0) as land_hstd_val,
				isnull(pv.land_non_hstd_val, 0) as land_non_hstd_val,
				isnull(pv.ag_use_val, 0) + isnull(pv.ag_hs_use_val, 0) as ag_use_val,
				isNull(pv.timber_use, 0) + isNull(pv.timber_hs_use_val, 0) as timber_use,
				isnull(pv.ag_market, 0) + isnull(pv.ag_hs_mkt_val, 0) as ag_market,
				isnull(pv.timber_market, 0) + isNull(timber_hs_mkt_val, 0) as timber_market,
				isnull(pv.market, 0) as market,
				isnull(wpv.appraised_classified, 0) + isnull(wpv.appraised_non_classified, 0) as appraised_val,
				pv.ten_percent_cap as ten_percent_cap,
				isNull(wpov.taxable_classified, 0) + isNull(wpov.taxable_non_classified, 0) as assessed_val, --isnull(pv.assessed_val, 0) as assessed_val,
				isNull(pv.ag_hs_use_val, 0) + isNull(pv.timber_hs_use_val, 0) as current_hs_use_val,
				isNull(pv.ag_use_val, 0) + isNull(pv.timber_use, 0) as current_nhs_use_val,				
				isNull(pv.ag_hs_mkt_val, 0) + isNull(pv.timber_hs_mkt_val, 0) as current_hs_mkt_val,
				isNull(pv.ag_market, 0) + isNull(pv.timber_market, 0) as current_nhs_mkt_val,
				isNull(pv.ag_loss, 0) + isNull(pv.ag_hs_loss,0) + 
					isNull(pv.timber_loss, 0) + isNull(pv.timber_hs_loss, 0) as productivity_loss,
				exmpt.exmpt_value as exmpt_value, 
				wpv.snr_exempt_loss as snr_exempt_loss,
				isNull(wpv.appraised_classified, 0) as appraised_classified,
				isNull(wpv.appraised_non_classified, 0) as appraised_non_classified,
				isnull(pv.non_taxed_mkt_val, 0) as non_taxed_mkt_val,
				'T' as show_values
		into _clientdb_values_detail	
		from property_val as pv with (nolock)
		join #layer_assoc as psa with (nolock)
		on pv.prop_val_yr = psa.owner_tax_yr
		and pv.sup_num = psa.sup_num
		and pv.prop_id = psa.prop_id
		join wash_property_val wpv with (nolock)
		on pv.prop_val_yr = wpv.prop_val_yr 
		and pv.sup_num = wpv.sup_num
		and pv.prop_id = wpv.prop_id 
		join _clientdb_pacs_year as y with (nolock)
		on pv.prop_val_yr = y.tax_yr		

		--Non Senior Exemption Loss
		left join (	select sum(exempt_value) exmpt_value, prop_id, year, sup_num  
				from wash_prop_owner_exemption with (nolock)
				where exmpt_type_cd <> 'SNR/DSBL'
				group by prop_id, year, sup_num) as exmpt
		on pv.prop_val_yr = exmpt.year
		and pv.sup_num = exmpt.sup_num
		and pv.prop_id = exmpt.prop_id

		--Taxable Val
		left join wash_prop_owner_val wpov with (nolock)
		on pv.prop_val_yr = wpov.year
		and pv.sup_num = wpov.sup_num
		and pv.prop_id = wpov.prop_id 
		
	end
	
	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()

	print '    Done at ' + convert(varchar(30), getdate(), 109)
	
	set @status = 'Bills'
	--Bills - Export Info
	if @region = @washington 
	begin
		set @sql = '
			if exists (select name from sysobjects WHERE id = OBJECT_ID(''exportYears''))
			begin
				DROP TABLE exportYears
			end

			CREATE TABLE exportYears (prop_id int, year numeric(4, 0))
			CREATE UNIQUE CLUSTERED INDEX IX_1 on exportYears (prop_id, year)

			insert into exportYears
			select distinct prop_id, year 
			from bill with (nolock)
			left outer join payout_agreement_bill_assoc as paba
				on bill.bill_id = paba.bill_id
			where year <= ' + cast(@sys_tax_year as varchar) + ' - 2
			and (current_amount_due - amount_paid > 0
			     or paba.payout_agreement_id is not null)

			insert into exportYears
			select distinct vw.prop_id, f.year
			from fee_property_vw vw with (nolock)
			join fee f with (nolock)
			on f.fee_id = vw.fee_id
			left join exportYears ex with (nolock)
			on ex.prop_id = vw.prop_id
			and ex.year = f.year
			where f.year <= ' + cast(@sys_tax_year as varchar) + ' - 2 
			and current_amount_due - amount_paid > 0
			and isNull(ex.prop_id, -1) = -1

			select bill_id ,b.prop_id ,b.year ,sup_num ,owner_id ,initial_amount_due
				 ,current_amount_due ,amount_paid ,bill_type ,effective_due_date ,earliest_collection_date
				 ,statement_id ,code ,is_active ,last_modified ,adj_effective_dt ,adj_expiration_dt
				 ,comment ,payment_status_type_cd ,created_by_type_cd ,rollback_id ,payment_group_id
				 ,display_year ,cnv_xref ,is_overpaid, case when current_amount_due > amount_paid then 0 else 1 end as taxes_paid 
			into ' + @input_database_name + '.dbo.bill
			from bill as b with (nolock)
			left join exportYears ex with (nolock)
				on b.year = ex.year
				and b.prop_id = ex.prop_id
			where isNull(b.is_active, 0) = 1
			--1/26/11 TFS 18620 Added to prevent exporting bills where the statement_id is null
			and isNull(b.statement_id, -1) > -1
			--Is in the current or previous year OR 
			and (b.year >= ' + cast(@sys_tax_year as varchar) + ' - 1 or isNull(ex.prop_id, 0) > 0)
		'
	end
		
	else  -- region = Texas
	begin
		CREATE TABLE [_clientdb_bill] (
		[bill_id] [int] NOT NULL ,
		[sup_tax_yr] [numeric](4, 0) NOT NULL ,
		[sup_num] [int] NOT NULL ,
		[entity_id] [int] NOT NULL ,
		[prop_id] [int] NOT NULL ,
		[owner_id] [int] NOT NULL ,
		[adjustment_code] [varchar] (10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[adj_effective_dt] [datetime] NULL ,
		[adj_expiration_dt] [datetime] NULL ,
		[adj_comment] [varchar] (500) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[rollback_id] [int] NULL ,
		[coll_status_cd] [char] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[bill_type] [char] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[effective_due_dt] [datetime] NULL ,
		[bill_m_n_o] [numeric](14, 2) NULL ,
		[bill_i_n_s] [numeric](14, 2) NULL ,
		[bill_prot_i_n_s] [numeric](14, 2) NULL ,
		[bill_late_ag_penalty] [numeric](14, 2) NULL ,
		[bill_m_n_o_pd] [numeric](14, 2) NULL ,
		[bill_i_n_s_pd] [numeric](14, 2) NULL ,
		[penalty_m_n_o_pd] [numeric](14, 2) NULL ,
		[penalty_i_n_s_pd] [numeric](14, 2) NULL ,
		[interest_m_n_o_pd] [numeric](14, 2) NULL ,
		[interest_i_n_s_pd] [numeric](14, 2) NULL ,
		[attorney_fees_pd] [numeric](14, 2) NULL ,
		[bill_assessed_value] [numeric](14, 2) NULL ,
		[bill_taxable_val] [numeric](14, 2) NULL ,
		[stmnt_id] [numeric](18, 0) NULL ,
		[discount_mno_pd] [numeric](14, 2) NULL ,
		[discount_ins_pd] [numeric](14, 2) NULL ,
		[prev_bill_id] [int] NULL ,
		[new_bill_id] [int] NULL ,
		[create_dt] [datetime] NULL ,
		[ref_id1] [varchar] (20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[ref_id2] [varchar] (20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[ref_id3] [varchar] (20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[ref_id4] [varchar] (20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[ref_id5] [varchar] (20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[discount_offered] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[levy_group_id] [int] NULL ,
		[levy_run_id] [int] NULL ,
		[active_bill] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[q1_amt] [numeric](14, 2) NULL ,
		[q1_paid] [numeric](14, 2) NULL ,
		[q1_due_dt] [datetime] NULL ,
		[q2_amt] [numeric](14, 2) NULL ,
		[q2_paid] [numeric](14, 2) NULL ,
		[q2_due_dt] [datetime] NULL ,
		[q3_amt] [numeric](14, 2) NULL ,
		[q3_paid] [numeric](14, 2) NULL ,
		[q3_due_dt] [datetime] NULL ,
		[q4_amt] [numeric](14, 2) NULL ,
		[q4_paid] [numeric](14, 2) NULL ,
		[q4_due_dt] [datetime] NULL ,
		[q_bill] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[q_create_dt] [datetime] NULL ,
		[q_remove_dt] [datetime] NULL ,
		[q_created_by] [int] NULL ,
		[q_removed_by] [int] NULL ,
		[bill_adj_m_n_o] [numeric](14, 2) NULL ,
		[bill_adj_i_n_s] [numeric](14, 2) NULL ,
		[refund_m_n_o_pd] [numeric](14, 2) NULL ,
		[refund_i_n_s_pd] [numeric](14, 2) NULL ,
		[refund_pen_m_n_o_pd] [numeric](14, 2) NULL ,
		[refund_pen_i_n_s_pd] [numeric](14, 2) NULL ,
		[refund_int_m_n_o_pd] [numeric](14, 2) NULL ,
		[refund_int_i_n_s_pd] [numeric](14, 2) NULL ,
		[refund_atty_fee_pd] [numeric](14, 2) NULL ,
		[underage_mno_pd] [numeric](14, 2) NULL ,
		[underage_ins_pd] [numeric](14, 2) NULL ,
		[overage_mno_pd] [numeric](14, 2) NULL ,
		[overage_ins_pd] [numeric](14, 2) NULL ,
		[refund_disc_mno_pd] [numeric](14, 2) NULL ,
		[refund_disc_ins_pd] [numeric](14, 2) NULL ,
		[ia_id] [int] NULL ,
		[pay_type] [varchar] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[pay1_amt] [numeric](14, 2) NULL ,
		[pay1_paid] [numeric](14, 2) NULL ,
		[pay1_due_dt] [datetime] NULL ,
		[pay2_amt] [numeric](14, 2) NULL ,
		[pay2_paid] [numeric](14, 2) NULL ,
		[pay2_due_dt] [datetime] NULL ,
		[pay3_amt] [numeric](14, 2) NULL ,
		[pay3_paid] [numeric](14, 2) NULL ,
		[pay3_due_dt] [datetime] NULL ,
		[pay4_amt] [numeric](14, 2) NULL ,
		[pay4_paid] [numeric](14, 2) NULL ,
		[pay4_due_dt] [datetime] NULL ,
		[pay_created_dt] [datetime] NULL ,
		[pay_removed_dt] [datetime] NULL ,
		[pay_created_by] [int] NULL ,
		[pay_removed_by] [int] NULL ,
		[refund_underage_mno_pd] [numeric](14, 2) NULL ,
		[refund_underage_ins_pd] [numeric](14, 2) NULL ,
		[refund_overage_mno_pd] [numeric](14, 2) NULL ,
		[refund_overage_ins_pd] [numeric](14, 2) NULL ,
		[taxes_paid] [bit] NULL,
		CONSTRAINT [CPK__clientdb_bill] PRIMARY KEY  CLUSTERED 
		(
			[bill_id],
			[sup_tax_yr],
			[sup_num],
			[entity_id],
			[prop_id],
			[owner_id]
		) WITH  FILLFACTOR = 90  ON [PRIMARY] 
		) ON [PRIMARY]

		set @sql = '
		insert _clientdb_bill
		(bill_id, sup_tax_yr, sup_num, entity_id, prop_id, owner_id, adjustment_code, adj_effective_dt,
		 adj_expiration_dt, adj_comment, rollback_id, coll_status_cd, bill_type, effective_due_dt,
		 bill_m_n_o, bill_i_n_s, bill_prot_i_n_s, bill_late_ag_penalty, bill_m_n_o_pd, bill_i_n_s_pd,
		 penalty_m_n_o_pd, penalty_i_n_s_pd, interest_m_n_o_pd, interest_i_n_s_pd, attorney_fees_pd,
		 bill_assessed_value, bill_taxable_val, stmnt_id, discount_mno_pd, discount_ins_pd,
		 prev_bill_id, new_bill_id, create_dt, ref_id1, ref_id2, ref_id3, ref_id4, ref_id5,
		 discount_offered, levy_group_id, levy_run_id, active_bill, q1_amt, q1_paid, q2_amt,
		 q2_paid, q2_due_dt, q3_amt, q3_paid, q3_due_dt, q4_amt, q4_paid, q4_due_dt,
		 q_bill, q_create_dt, q_remove_dt, q_created_by, q_removed_by, bill_adj_m_n_o,
		 bill_adj_i_n_s, refund_m_n_o_pd, refund_i_n_s_pd, refund_pen_m_n_o_pd, refund_pen_i_n_s_pd,
		 refund_int_m_n_o_pd, refund_int_i_n_s_pd, refund_atty_fee_pd, underage_mno_pd,
		 underage_ins_pd, overage_mno_pd, overage_ins_pd, refund_disc_mno_pd, refund_disc_ins_pd,
		 ia_id, pay_type, pay1_amt, pay1_paid, pay1_due_dt, pay2_amt, pay2_paid, pay2_due_dt,
		 pay3_amt, pay3_paid, pay3_due_dt, pay4_amt, pay4_paid, pay4_due_dt, pay_created_dt,
		 pay_removed_dt, pay_created_by, pay_removed_by,
		 refund_underage_mno_pd, refund_underage_ins_pd, refund_overage_mno_pd, refund_overage_ins_pd, taxes_paid)

		select b.bill_id, b.sup_tax_yr, b.sup_num, b.entity_id, b.prop_id, b.owner_id, b.adjustment_code, 
		 b.adj_effective_dt, b.adj_expiration_dt, b.adj_comment, b.rollback_id, b.coll_status_cd, 
		 b.bill_type, b.effective_due_dt, b.bill_m_n_o, b.bill_i_n_s, b.bill_prot_i_n_s, 
		 b.bill_late_ag_penalty, b.bill_m_n_o_pd, b.bill_i_n_s_pd, b.penalty_m_n_o_pd, b.penalty_i_n_s_pd, 
		 b.interest_m_n_o_pd, b.interest_i_n_s_pd, b.attorney_fees_pd, b.bill_assessed_value, 
		 b.bill_taxable_val, b.stmnt_id, b.discount_mno_pd, b.discount_ins_pd, b.prev_bill_id, b.new_bill_id, 
		 b.create_dt, b.ref_id1, b.ref_id2, b.ref_id3, b.ref_id4, b.ref_id5, b.discount_offered, 
		 b.levy_group_id, b.levy_run_id, b.active_bill, b.q1_amt, b.q1_paid, b.q2_amt,
		 b.q2_paid, b.q2_due_dt, b.q3_amt, b.q3_paid, b.q3_due_dt, b.q4_amt, b.q4_paid, b.q4_due_dt,
		 b.q_bill, b.q_create_dt, b.q_remove_dt, b.q_created_by, b.q_removed_by, b.bill_adj_m_n_o,
		 b.bill_adj_i_n_s, b.refund_m_n_o_pd, b.refund_i_n_s_pd, b.refund_pen_m_n_o_pd, b.refund_pen_i_n_s_pd,
		 b.refund_int_m_n_o_pd, b.refund_int_i_n_s_pd, b.refund_atty_fee_pd, b.underage_mno_pd,
		 b.underage_ins_pd, b.overage_mno_pd, b.overage_ins_pd, b.refund_disc_mno_pd, b.refund_disc_ins_pd,
		 b.ia_id, b.pay_type, b.pay1_amt, b.pay1_paid, b.pay1_due_dt, b.pay2_amt, b.pay2_paid, b.pay2_due_dt,
		 b.pay3_amt, b.pay3_paid, b.pay3_due_dt, b.pay4_amt, b.pay4_paid, b.pay4_due_dt, b.pay_created_dt,
		 b.pay_removed_dt, b.pay_created_by, b.pay_removed_by,
		 b.refund_underage_mno_pd, b.refund_underage_ins_pd, b.refund_overage_mno_pd, b.refund_overage_ins_pd, 0

		from bill as b	with (nolock)
		-- HS 43670 Kevin Lloyd - Import all bills, not just those existing for years in pacs_year
		where isnull(b.active_bill, ''T'') = ''T''
		and b.coll_status_cd <> ''RS''
		'
	end
	exec(@sql) --Populate Clientdb_bill
	set @sql = 'use ' + @input_database_name + ' ;checkpoint'
	exec (@sql)
	
	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()
	
	print '    Bills Done at ' + convert(varchar(30), getdate(), 109)
	set @status = 'Tax Updates'
	
	if @region = @washington
	begin
		--these tables are needed for the tax due engine
		set @sql = '
			select distinct bpd.* 
			into ' + @input_database_name + '.dbo.[bill_payments_due]
			from bill_payments_due as bpd with (nolock)
			join bill as b with (nolock)
			on bpd.bill_id = b.bill_id
			left join exportYears ex with (nolock)
			on ex.year = b.year
			and ex.prop_id = b.prop_id
			where isNull(b.is_active, 0) = 1
			--1/26/11 TFS 18620 Added to prevent exporting bills where the statement_id is null
			and isNull(b.statement_id, -1) > -1
			and (b.year >= ' + cast(@sys_tax_year as varchar) + ' - 1 or isNull(ex.prop_id, 0) > 0)

			select distinct lb.* 
			into ' + @input_database_name + '.dbo.[levy_bill]
			from levy_bill as lb with (nolock)
			join bill as b with (nolock)
			on lb.bill_id = b.bill_id
			left join exportYears ex with (nolock)
			on ex.year = b.year
			and ex.prop_id = b.prop_id
			where isNull(b.is_active, 0) = 1
			--1/26/11 TFS 18620 Added to prevent exporting bills where the statement_id is null
			and isNull(b.statement_id, -1) > -1
			and (b.year >= ' + cast(@sys_tax_year as varchar) + ' - 1 or isNull(ex.prop_id, 0) > 0)


			select distinct ab.* 
			into ' + @input_database_name + '.dbo.[assessment_bill]
			from assessment_bill as ab with (nolock)
			join bill as b with (nolock)
			on ab.bill_id = b.bill_id
			left join exportYears ex with (nolock)
			on ex.year = b.year
			and ex.prop_id = b.prop_id
			where isNull(b.is_active, 0) = 1
			--1/26/11 TFS 18620 Added to prevent exporting bills where the statement_id is null
			and isNull(b.statement_id, -1) > -1
			and (b.year >= ' + cast(@sys_tax_year as varchar) + ' - 1 or isNull(ex.prop_id, 0) > 0)

			select distinct ct.* 
			into ' + @input_database_name + '.dbo.[coll_transaction]
			from coll_transaction as ct with (nolock)
			join bill as b with (nolock)
			on ct.trans_group_id = b.bill_id
			left join exportYears ex with (nolock)
			on ex.year = b.year
			and ex.prop_id = b.prop_id
			where isNull(b.is_active, 0) = 1
			--1/26/11 TFS 18620 Added to prevent exporting bills where the statement_id is null
			and isNull(b.statement_id, -1) > -1
			and (b.year >= ' + cast(@sys_tax_year as varchar) + ' - 1 or isNull(ex.prop_id, 0) > 0)
			union all 
			select ct.*
			from coll_transaction as ct with (nolock)
			join fee with (nolock)
			on ct.trans_group_id = fee.fee_id
			where isNull(fee.is_active, 0) = 1
			
			select distinct fee.* 
			into ' + @input_database_name + '.dbo.[fee]
			from fee with (nolock)
			join fee_property_vw fpv with (nolock)
			on fee.fee_id = fpv.fee_id
			left join exportYears ex with (nolock)
			on ex.year = fee.year
			and ex.prop_id = fpv.prop_id
			where isNull(fee.is_active, 0) = 1
			and (fee.year >= ' + cast(@sys_tax_year as varchar) + ' - 1 or isNull(ex.prop_id, 0) > 0)

			select distinct fpd.* 
			into ' + @input_database_name + '.dbo.[fee_payments_due]
			from fee_payments_due as fpd with (nolock)
			join fee with (nolock)
			on fpd.fee_id = fee.fee_id
			join fee_property_vw fpv with (nolock)
			on fee.fee_id = fpv.fee_id
			left join exportYears ex with (nolock)
			on ex.year = fee.year
			and ex.prop_id = fpv.prop_id
			where isNull(fee.is_active, 0) = 1
			and (fee.year >= ' + cast(@sys_tax_year as varchar) + ' - 1 or isNull(ex.prop_id, 0) > 0)

			select distinct pta.*
			into ' + @input_database_name + '.dbo.[payment_transaction_assoc]
			from [payment_transaction_assoc] as pta with (nolock)
			join coll_transaction as ct with (nolock)
			on ct.transaction_id = pta.transaction_id
			join bill as b with (nolock)
			on ct.trans_group_id = b.bill_id
			left join exportYears ex with (nolock)
			on ex.year = b.year
			and ex.prop_id = b.prop_id
			where isNull(b.is_active, 0) = 1
			and isNull(b.is_overpaid, 0) = 1 
			--1/26/11 TFS 18620 Added to prevent exporting bills where the statement_id is null
			and isNull(b.statement_id, -1) > -1
			and (b.year >= ' + cast(@sys_tax_year as varchar) + ' - 1 or isNull(ex.prop_id, 0) > 0)

			select distinct rta.*
			into ' + @input_database_name + '.dbo.[refund_transaction_assoc]
			from [refund_transaction_assoc] as rta with (nolock)
			join coll_transaction as ct with (nolock)
			on ct.transaction_id = rta.transaction_id
			join bill as b with (nolock)
			on ct.trans_group_id = b.bill_id
			left join exportYears ex with (nolock)
			on ex.year = b.year
			and ex.prop_id = b.prop_id
			where isNull(b.is_active, 0) = 1
			--1/26/11 TFS 18620 Added to prevent exporting bills where the statement_id is null
			and isNull(b.statement_id, -1) > -1
			and (b.year >= ' + cast(@sys_tax_year as varchar) + ' - 1 or isNull(ex.prop_id, 0) > 0)

			select distinct p.*
			into ' + @input_database_name + '.dbo.[payment]
			from [payment] as p with (nolock)
			join ' + @input_database_name + '.dbo.[payment_transaction_assoc] as pta with (nolock)
			on p.payment_id = pta.payment_id
			
			select distinct paba.*
			into ' + @input_database_name + '.dbo.[payout_agreement_bill_assoc]
			from payout_agreement_bill_assoc as paba with (nolock)
			join bill as b with (nolock)
			on paba.bill_id = b.bill_id
			left join exportYears ex with (nolock)
			on ex.year = b.year
			and ex.prop_id = b.prop_id
			where isNull(b.is_active, 0) = 1
			--1/26/11 TFS 18620 Added to prevent exporting bills where the statement_id is null
			and isNull(b.statement_id, -1) > -1
			and (b.year >= ' + cast(@sys_tax_year as varchar) + ' - 1 or isNull(ex.prop_id, 0) > 0)
			
			select distinct pafa.* 
			into ' + @input_database_name + '.dbo.[payout_agreement_fee_assoc]
			from payout_agreement_fee_assoc as pafa with (nolock)
			join fee with (nolock)
			on pafa.fee_id = fee.fee_id
			join fee_property_vw fpv with (nolock)
			on fee.fee_id = fpv.fee_id
			left join exportYears ex with (nolock)
			on ex.year = fee.year
			and ex.prop_id = fpv.prop_id
			where isNull(fee.is_active, 0) = 1
			and (fee.year >= ' + cast(@sys_tax_year as varchar) + ' - 1 or isNull(ex.prop_id, 0) > 0)

			select *
			into ' + @input_database_name + '.dbo.[payout_agreement]
			from payout_agreement with (nolock)

			select *
			into ' + @input_database_name + '.dbo.[payout_agreement_schedule]
			from payout_agreement_schedule with (nolock)
			
			select *
			into ' + @input_database_name + '.dbo.[special_assessment_statement_options]
			from special_assessment_statement_options with (nolock)
			
			drop table exportYears
		'
		exec(@sql)
		set @sql = 'use ' + @input_database_name + ' ;checkpoint'
		exec (@sql)
		print '    Tax Due Done at ' + convert(varchar(30), getdate(), 109)
	end
	
	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()
	
	--Tax Rate - Export Info
	CREATE TABLE [_clientdb_tax_rate] (
		[entity_id] [int] NOT NULL ,
		[tax_rate_yr] [numeric](4, 0) NOT NULL ,
		[discount_dt] [datetime] NULL ,
		[late_dt] [datetime] NULL ,
		[attorney_fee_dt] [datetime] NULL ,
		[bills_created_dt] [datetime] NULL ,
		[m_n_o_tax_pct] [numeric](13, 10) NULL ,
		[i_n_s_tax_pct] [numeric](13, 10) NULL ,
		[prot_i_n_s_tax_pct] [numeric](13, 10) NULL ,
		[sales_tax_pct] [numeric](13, 10) NULL ,
		[levy_start_rct_num] [numeric](18, 0) NULL ,
		[supp_start_rct_num] [numeric](18, 0) NULL ,
		[stmnt_dt] [datetime] NULL ,
		[collect_for] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[appraise_for] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[ready_to_certify] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[special_inv_entity] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[ready_to_create_bill] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[PLUS_1_INT_PCT] [numeric](13, 10) NULL ,
		[PLUS_1_PENALTY_PCT] [numeric](13, 10) NULL ,
		[PLUS_2_INT_PCT] [numeric](13, 10) NULL ,
		[PLUS_2_PENALTY_PCT] [numeric](13, 10) NULL ,
		[PLUS_3_INT_PCT] [numeric](13, 10) NULL ,
		[PLUS_3_PENALTY_PCT] [numeric](13, 10) NULL ,
		[PLUS_4_INT_PCT] [numeric](13, 10) NULL ,
		[PLUS_4_PENALTY_PCT] [numeric](13, 10) NULL ,
		[PLUS_5_INT_PCT] [numeric](13, 10) NULL ,
		[PLUS_5_PENALTY_PCT] [numeric](13, 10) NULL ,
		[PLUS_6_INT_PCT] [numeric](13, 10) NULL ,
		[PLUS_6_PENALTY_PCT] [numeric](13, 10) NULL ,
		[PLUS_7_INT_PCT] [numeric](13, 10) NULL ,
		[PLUS_7_PENALTY_PCT] [numeric](13, 10) NULL ,
		[PLUS_8_INT_PCT] [numeric](13, 10) NULL ,
		[PLUS_8_PENALTY_PCT] [numeric](13, 10) NULL ,
		[PLUS_9_INT_PCT] [numeric](13, 10) NULL ,
		[PLUS_9_PENALTY_PCT] [numeric](13, 10) NULL ,
		[attorney_fee_pct] [numeric](4, 2) NULL ,
		[effective_due_dt] [datetime] NULL ,
		[collect_option] [char] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[weed_control] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[weed_control_pct] [numeric](4, 2) NULL ,
		[ptd_option] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[apply_bpp_attorney_fees] [bit] NOT NULL CONSTRAINT [DF__clientdb_tax_rate__apply___74F30FE8] DEFAULT (0),
		[bpp_attorney_fee_dt] [datetime] NULL ,
		CONSTRAINT [CPK__clientdb_tax_rate] PRIMARY KEY  CLUSTERED 
		(
			[entity_id],
			[tax_rate_yr]
		) WITH  FILLFACTOR = 90  ON [PRIMARY] ,
	) ON [PRIMARY]
	print '    Tax Rate Done at ' + convert(varchar(30), getdate(), 109)

	if @region = @texas
	begin
		set @status = 'Tax Rate (Entity)'
		insert _clientdb_tax_rate
		(entity_id, tax_rate_yr, discount_dt, late_dt, attorney_fee_dt, bills_created_dt, m_n_o_tax_pct,
		 i_n_s_tax_pct, prot_i_n_s_tax_pct, sales_tax_pct, levy_start_rct_num, supp_start_rct_num,
		 stmnt_dt, collect_for, appraise_for, ready_to_certify, special_inv_entity, ready_to_create_bill,
		 PLUS_1_INT_PCT, PLUS_1_PENALTY_PCT, PLUS_2_INT_PCT, PLUS_2_PENALTY_PCT, PLUS_3_INT_PCT,
		 PLUS_3_PENALTY_PCT, PLUS_4_INT_PCT, PLUS_4_PENALTY_PCT, PLUS_5_INT_PCT, PLUS_5_PENALTY_PCT,
		 PLUS_6_INT_PCT, PLUS_6_PENALTY_PCT, PLUS_7_INT_PCT, PLUS_7_PENALTY_PCT, PLUS_8_INT_PCT,
		 PLUS_8_PENALTY_PCT, PLUS_9_INT_PCT, PLUS_9_PENALTY_PCT, attorney_fee_pct, effective_due_dt,
		 collect_option, weed_control, weed_control_pct, ptd_option, apply_bpp_attorney_fees,
		 bpp_attorney_fee_dt)

		select entity_id, tax_rate_yr, discount_dt, late_dt, attorney_fee_dt, bills_created_dt, m_n_o_tax_pct,
		 i_n_s_tax_pct, prot_i_n_s_tax_pct, sales_tax_pct, levy_start_rct_num, supp_start_rct_num,
		 stmnt_dt, collect_for, appraise_for, ready_to_certify, special_inv_entity, ready_to_create_bill,
		 PLUS_1_INT_PCT, PLUS_1_PENALTY_PCT, PLUS_2_INT_PCT, PLUS_2_PENALTY_PCT, PLUS_3_INT_PCT,
		 PLUS_3_PENALTY_PCT, PLUS_4_INT_PCT, PLUS_4_PENALTY_PCT, PLUS_5_INT_PCT, PLUS_5_PENALTY_PCT,
		 PLUS_6_INT_PCT, PLUS_6_PENALTY_PCT, PLUS_7_INT_PCT, PLUS_7_PENALTY_PCT, PLUS_8_INT_PCT,
		 PLUS_8_PENALTY_PCT, PLUS_9_INT_PCT, PLUS_9_PENALTY_PCT, attorney_fee_pct, effective_due_dt,
		 collect_option, weed_control, weed_control_pct, ptd_option, apply_bpp_attorney_fees,
		 bpp_attorney_fee_dt

		from tax_rate	with (nolock)
	
		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
	end
		
	--Refund Due Trans - Export Info
	CREATE TABLE [_clientdb_refund_due_trans] (
		[transaction_id] [int] NOT NULL ,
		[batch_id] [int] NOT NULL ,
		[bill_id] [int] NOT NULL ,
		[mno_amt] [numeric](14, 2) NULL ,
		[ins_amt] [numeric](14, 2) NULL ,
		[penalty_mno_amt] [numeric](14, 2) NULL ,
		[penalty_ins_amt] [numeric](14, 2) NULL ,
		[interest_mno_amt] [numeric](14, 2) NULL ,
		[interest_ins_amt] [numeric](14, 2) NULL ,
		[atty_fee_amt] [numeric](14, 2) NULL ,
		[payment_trans_id] [int] NULL ,
		[adjust_id] [int] NULL,
		[discount_mno_amt] [numeric](14, 2) NULL,
		[discount_ins_amt] [numeric](14, 2) NULL,
		[underage_mno_amt] [numeric](14, 2) NULL,
		[underage_ins_amt] [numeric](14, 2) NULL,
		[overage_mno_amt] [numeric](14, 2) NULL,
		[overage_ins_amt] [numeric](14, 2) NULL,
		CONSTRAINT [CPK__clientdb_refund_due_trans] PRIMARY KEY  CLUSTERED 
		(
			[transaction_id],
			[batch_id],
			[bill_id]
		) WITH  FILLFACTOR = 100  ON [PRIMARY] 
	) ON [PRIMARY]

	set @status = 'Refund'
	if @region = @texas
	begin
		insert _clientdb_refund_due_trans
		(transaction_id, batch_id, bill_id, mno_amt, ins_amt, penalty_mno_amt, penalty_ins_amt,
		 interest_mno_amt, interest_ins_amt, atty_fee_amt, payment_trans_id,
		 adjust_id, discount_mno_amt, discount_ins_amt, underage_mno_amt, underage_ins_amt, overage_mno_amt, overage_ins_amt)

		select transaction_id, batch_id, bill_id, mno_amt, ins_amt, penalty_mno_amt, penalty_ins_amt,
		 interest_mno_amt, interest_ins_amt, atty_fee_amt, payment_trans_id,
		 adjust_id, discount_mno_amt, discount_ins_amt, underage_mno_amt, underage_ins_amt, overage_mno_amt, overage_ins_amt
		from refund_due_trans	with (nolock)
	end
	
	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()

	--Bill Adjustment Codes - Export Info
	set @status = 'Bill Adj Codes'
	CREATE TABLE [_clientdb_bill_adjust_code] (
		[adjust_cd] [varchar] (10) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL ,
		[adjust_desc] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL ,
		[deferral_cd] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[alert_user] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[use_penalty] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[penalty_rate] [numeric](4, 0) NULL ,
		[use_interest] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[interest_rate] [numeric](4, 0) NULL ,
		[use_attorney_fee] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[attorney_fee_rate] [numeric](4, 0) NULL ,
		[use_range] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[begin_range] [numeric](4, 0) NULL ,
		[end_range] [numeric](4, 0) NULL ,
		[sys_flag] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[judgement_cd] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		CONSTRAINT [CPK__clientdb_bill_adjust_code] PRIMARY KEY  CLUSTERED 
		(
			[adjust_cd]
		) WITH  FILLFACTOR = 100  ON [PRIMARY] 
	) ON [PRIMARY]

	if @region = @texas
	begin
		set @sql = '
		insert _clientdb_bill_adjust_code
		(adjust_cd, adjust_desc, deferral_cd, alert_user, use_penalty, penalty_rate, use_interest,
		 interest_rate, use_attorney_fee, attorney_fee_rate, use_range, begin_range, end_range,
		 sys_flag, judgement_cd)

		select adjust_cd, adjust_desc, deferral_cd, alert_user, use_penalty, penalty_rate, use_interest,
		 interest_rate, use_attorney_fee, attorney_fee_rate, use_range, begin_range, end_range,
		 sys_flag, judgement_cd
		from bill_adjust_code with (nolock)
		'
		exec(@sql)
	end

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()

	--Payment
	set @status = 'Payment'
	CREATE TABLE [_clientdb_payment] (
		[payment_id] [int] NOT NULL ,
		[batch_id] [int] NULL ,
		[amt_due] [numeric](14, 2) NULL ,
		[check_num] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[mo_num] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[check_amt] [numeric](14, 2) NULL ,
		[cash_amt] [numeric](14, 2) NULL ,
		[mo_amt] [numeric](14, 2) NULL ,
		[payment_type] [char] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[payment_code] [char] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[rcpt_num] [int] NULL ,
		[payee_id] [int] NULL ,
		[operator_id] [int] NULL ,
		[post_date] [datetime] NULL ,
		[date_paid] [datetime] NULL ,
		[dl_number] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[dl_state] [varchar] (2) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[dl_exp_date] [datetime] NULL ,
		[void_payment] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[void_date] [datetime] NULL ,
		[void_by_id] [int] NULL ,
		[void_reason] [varchar] (255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[void_batch_id] [int] NULL ,
		[new_payment_id] [int] NULL ,
		[prev_payment_id] [int] NULL ,
		[paid_by] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[cc_type] [varchar] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[cc_amt] [numeric](14, 2) NULL ,
		[cc_fee] [numeric](14, 2) NULL ,
		[cc_last_four_digits] [varchar] (4) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[cc_auth] [varchar] (20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		CONSTRAINT [CPK__clientdb_payment] PRIMARY KEY  CLUSTERED 
		(
			[payment_id]
		) WITH  FILLFACTOR = 90  ON [PRIMARY] ,
	) ON [PRIMARY]

	if @region = @texas 
	begin
		set @sql = '
		insert _clientdb_payment
		(payment_id, batch_id, amt_due, check_num, mo_num, check_amt, cash_amt, mo_amt, payment_type,
		 payment_code, rcpt_num, payee_id, operator_id, post_date, date_paid, dl_number, dl_state,
		 dl_exp_date, void_payment, void_date, void_by_id, void_reason, void_batch_id, new_payment_id,
		 prev_payment_id, paid_by, cc_type, cc_amt, cc_fee, cc_last_four_digits, cc_auth)

		select payment_id, batch_id, amt_due, check_num, mo_num, check_amt, cash_amt, mo_amt, payment_type,
		 payment_code, rcpt_num, payee_id, operator_id, post_date, date_paid, dl_number, dl_state,
		 dl_exp_date, void_payment, void_date, void_by_id, void_reason, void_batch_id, new_payment_id,
		 prev_payment_id, paid_by, cc_type, cc_amt, cc_fee, cc_last_four_digits, cc_auth
		from payment with (nolock)
		'
		exec(@sql)
	end

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()

	--Payment Trans
	set @status = 'Payment Trans'
	CREATE TABLE [_clientdb_payment_trans] (
		[transaction_id] [int] NOT NULL ,
		[payment_id] [int] NOT NULL ,
		[prop_id] [int] NULL ,
		[bill_id] [int] NULL ,
		[fee_id] [int] NULL ,
		[trans_type] [varchar] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[fee_amt] [numeric](14, 2) NULL ,
		[mno_amt] [numeric](14, 2) NULL ,
		[ins_amt] [numeric](14, 2) NULL ,
		[penalty_mno_amt] [numeric](14, 2) NULL ,
		[penalty_ins_amt] [numeric](14, 2) NULL ,
		[interest_mno_amt] [numeric](14, 2) NULL ,
		[interest_ins_amt] [numeric](14, 2) NULL ,
		[attorney_fee_amt] [numeric](14, 2) NULL ,
		[q1_amt] [numeric](14, 2) NULL ,
		[q2_amt] [numeric](14, 2) NULL ,
		[q3_amt] [numeric](14, 2) NULL ,
		[q4_amt] [numeric](14, 2) NULL ,
		[mno_due] [numeric](14, 2) NULL ,
		[ins_due] [numeric](14, 2) NULL ,
		[penalty] [numeric](14, 2) NULL ,
		[interest] [numeric](14, 2) NULL ,
		[attorney_fee] [numeric](14, 2) NULL ,
		[fee_due] [numeric](14, 2) NULL ,
		[fiscal_year] [varchar] (10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[fiscal_month] [int] NULL ,
		[fiscal_entity_id] [int] NULL ,
		[discount_mno_amt] [numeric](14, 2) NULL ,
		[discount_ins_amt] [numeric](14, 2) NULL ,
		[underage_mno_amt] [numeric](14, 2) NULL ,
		[underage_ins_amt] [numeric](14, 2) NULL ,
		[overage_mno_amt] [numeric](14, 2) NULL ,
		[overage_ins_amt] [numeric](14, 2) NULL ,
		[refund_mno_amt] [numeric](14, 2) NULL ,
		[refund_ins_amt] [numeric](14, 2) NULL ,
		[void_trans] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[void_date] [datetime] NULL ,
		[void_by_id] [int] NULL ,
		[void_reason] [varchar] (255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[void_batch_id] [int] NULL ,
		[prev_transaction_id] [int] NULL ,
		[prev_payment_id] [int] NULL ,
		CONSTRAINT [CPK__clientdb_payment_trans] PRIMARY KEY  CLUSTERED 
		(
			[transaction_id],
			[payment_id]
		) WITH  FILLFACTOR = 90  ON [PRIMARY] ,
	) ON [PRIMARY]

	if @region = @texas
	begin
	set @sql = '
		insert _clientdb_payment_trans
		(transaction_id, payment_id, prop_id, bill_id, fee_id, trans_type, fee_amt, mno_amt, ins_amt,
		 penalty_mno_amt, penalty_ins_amt, interest_mno_amt, interest_ins_amt, attorney_fee_amt,
		 q1_amt, q2_amt, q3_amt, q4_amt, mno_due, ins_due, penalty, interest, attorney_fee,
		 fee_due, fiscal_year, fiscal_month, fiscal_entity_id, discount_mno_amt, discount_ins_amt,
		 underage_mno_amt, underage_ins_amt, overage_mno_amt, overage_ins_amt, refund_mno_amt,
		 refund_ins_amt, void_trans, void_date, void_by_id, void_reason, void_batch_id,
		 prev_transaction_id, prev_payment_id)

		select transaction_id, payment_id, prop_id, bill_id, fee_id, trans_type, fee_amt, mno_amt, ins_amt,
		 penalty_mno_amt, penalty_ins_amt, interest_mno_amt, interest_ins_amt, attorney_fee_amt,
		 q1_amt, q2_amt, q3_amt, q4_amt, mno_due, ins_due, penalty, interest, attorney_fee,
		 fee_due, fiscal_year, fiscal_month, fiscal_entity_id, discount_mno_amt, discount_ins_amt,
		 underage_mno_amt, underage_ins_amt, overage_mno_amt, overage_ins_amt, refund_mno_amt,
		 refund_ins_amt, void_trans, void_date, void_by_id, void_reason, void_batch_id,
		 prev_transaction_id, prev_payment_id
		from payment_trans	with (nolock)'
	
		exec(@sql)
	end

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()

	--Entity Codes - Export Info
	set @status = 'Entity'
	CREATE TABLE [_clientdb_entity] (
		[entity_id] [int] NOT NULL ,
		[entity_cd] [char] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL ,
		[entity_type_cd] [char] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL ,
		[entity_disb_bal] [numeric](14, 2) NULL ,
		[taxing_unit_num] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[mbl_hm_submission] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[freeports_allowed] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[ptd_multi_unit] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[appr_company_entity_cd] [char] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[refund_default_flag] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[weed_control] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[fiscal_begin_date] [datetime] NULL ,
		[fiscal_end_date] [datetime] NULL ,
		[fiscal_year] [varchar] (10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[county_taxing_unit_ind] [varchar] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[collector_id] [int] NULL ,
		[rendition_entity] [bit] NULL ,
		[enable_timber_78] [bit] NULL CONSTRAINT [DF__clientdb_entity_enable_timber_78] DEFAULT (0),
		CONSTRAINT [CPK__clientdb_entity] PRIMARY KEY  CLUSTERED 
		(
			[entity_id]
		) WITH  FILLFACTOR = 90  ON [PRIMARY] ,
	) ON [PRIMARY]

	if @region = @texas
	begin
		insert _clientdb_entity
		(entity_id, entity_cd, entity_type_cd, entity_disb_bal, taxing_unit_num, mbl_hm_submission,
		 freeports_allowed, ptd_multi_unit, appr_company_entity_cd, refund_default_flag, weed_control,
		 fiscal_begin_date, fiscal_end_date, fiscal_year, county_taxing_unit_ind, collector_id,
		 rendition_entity, enable_timber_78)
		select entity_id, entity_cd, entity_type_cd, entity_disb_bal, taxing_unit_num, mbl_hm_submission,
		 freeports_allowed, ptd_multi_unit, appr_company_entity_cd, refund_default_flag, weed_control,
		 fiscal_begin_date, fiscal_end_date, fiscal_year, county_taxing_unit_ind, collector_id,
		 rendition_entity, enable_timber_78
		from entity	with (nolock)
	end

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()

	--Account - Export Info
	CREATE TABLE [_clientdb_account] (
		[acct_id] [int] NOT NULL ,
		[first_name] [varchar] (30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[last_name] [varchar] (30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[file_as_name] [varchar] (70) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[dl_num] [varchar] (10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[dl_state] [char] (2) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[dl_expir_dt] [datetime] NULL ,
		[merged_acct_id] [char] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[acct_create_dt] [datetime] NULL ,
		[opening_balance] [money] NULL ,
		[comment] [varchar] (2048) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[misc_code] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[ref_id1] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[source] [varchar] (30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[ref_acct_id] [int] NULL ,
		[confidential_flag] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[confidential_file_as_name] [varchar] (70) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[confidential_first_name] [varchar] (30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[confidential_last_name] [varchar] (30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[dist_m_n_o] [int] NULL ,
		[dist_i_n_s] [int] NULL ,
		[dist_pi] [int] NULL ,
		[dist_atty_fees] [int] NULL ,
		[dist_overages] [int] NULL ,
		[dist_tax_cert_fees] [int] NULL ,
		[dist_misc_fees] [int] NULL ,
		[dist_vit] [int] NULL ,
		[email_addr] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[web_addr] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[ftp_addr] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[update_dt] [datetime] NULL ,
		[web_suppression] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
		[appr_company_id] [int] NULL ,
		CONSTRAINT [CPK__clientdb_account] PRIMARY KEY  CLUSTERED 
		(
			[acct_id]
		) WITH  FILLFACTOR = 90  ON [PRIMARY] 
	) ON [PRIMARY]

	print '    Begin Account ' + convert(varchar(30), getdate(), 109)
	set @status = 'Account'
	
	insert _clientdb_account
	(acct_id, first_name, last_name, file_as_name, dl_num, dl_state, dl_expir_dt, merged_acct_id,
	 acct_create_dt, opening_balance, comment, misc_code, ref_id1, source, ref_acct_id,
	 confidential_flag, confidential_file_as_name, confidential_first_name, confidential_last_name,
	 dist_m_n_o, dist_i_n_s, dist_pi, dist_atty_fees, dist_overages, dist_tax_cert_fees, dist_vit,
	 email_addr, web_addr, ftp_addr, update_dt, web_suppression, appr_company_id)

	select acct_id, first_name, last_name, file_as_name, dl_num, dl_state, dl_expir_dt, merged_acct_id,
	 acct_create_dt, opening_balance, comment, misc_code, ref_id1, source, ref_acct_id,
	 confidential_flag, confidential_file_as_name, confidential_first_name, confidential_last_name,
	 dist_m_n_o, dist_i_n_s, dist_pi, dist_atty_fees, dist_overages, dist_tax_cert_fees, dist_vit,
	 email_addr, web_addr, ftp_addr, update_dt, web_suppression, appr_company_id
	from account with (nolock)

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()

	print 'Exporting Exemptions Info... at ' + convert(varchar(30), getdate(), 109)
	set @status = '_clientdb_exmpt_type'

	set @sql = 'select exmpt_type_cd, exmpt_desc into ' + @input_database_name + 
		'.dbo._clientdb_exmpt_type from exmpt_type with (nolock) order by exmpt_type_cd'
	exec(@sql)
	set @sql = 'use ' + @input_database_name + ' ;checkpoint'
	exec (@sql)

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()
	
	print 'Exporting Improvement Detail Type Info... at ' + convert(varchar(30), getdate(), 109)
	set @status = '_clientdb_imprv_det_type'	

	set @sql = 'select imprv_det_type_cd, imprv_det_typ_desc into ' + @input_database_name + 
		'.dbo._clientdb_imprv_det_type from imprv_det_type with (nolock) where is_permanent_crop_detail = 0
		order by imprv_det_type_cd'
	exec(@sql)
	set @sql = 'use ' + @input_database_name + ' ;checkpoint'
	exec (@sql)

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
	values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()

	print 'Exporting Improvement Detail Sub Class Info... at ' + convert(varchar(30), getdate(), 109)
	set @status = 'imprv_det_sub_class'

	set @sql = 'select imprv_det_sub_cls_cd, imprv_det_sub_cls_desc into ' + @input_database_name + 
		'.dbo._clientdb_imprv_det_sub_class from imprv_det_sub_class with (nolock) where ltrim(rtrim(imprv_det_sub_cls_cd)) not like ''*'' and
		is_permanent_crop_detail = 0 order by imprv_det_sub_cls_cd'
	exec(@sql)
	set @sql = 'use ' + @input_database_name + ' ;checkpoint'
	exec (@sql)
	
	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
	values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()

	print '    Done at ' + convert(varchar(30), getdate(), 109)

	print 'Exporting Improv Detail Class Code Info... at ' + convert(varchar(30), getdate(), 109)
	set @status = '_clientdb_imprv_det_class'
	
	set @sql = 'select imprv_det_class_cd, imprv_det_cls_desc into ' + @input_database_name + 
		'.dbo._clientdb_imprv_det_class from imprv_det_class with (nolock) where ltrim(rtrim(imprv_det_class_cd)) not like ''*'' and
		is_permanent_crop_detail = 0 order by imprv_det_class_cd'
	exec(@sql)
	set @sql = 'use ' + @input_database_name + ' ;checkpoint'
	exec (@sql)

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
		values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()
	

	print '    Done at ' + convert(varchar(30), getdate(), 109)

	/*
	 * This was done originally for Bexar.  If there's a property
	 * group code of X25.19A on a property, do NOT show values.
	 * This is so values will show for properties that have had
	 * their appraisal card printed.
	 */

	
	set @status = 'UpdatePropertyAccessShowValues' 
	if exists(select id from syscomments where object_name(id) like 'UpdatePropertyAccessShowValues')
	begin
		exec UpdatePropertyAccessShowValues
	end
	
	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()


	-- Start: Create all tables, views and procedures
		/*
		 * Create middle tier tables
		 */

		-- HS 60280 Kevin Lloyd
		set @status = 'table_cache_status'
		
		set @sql = 'use ' + @input_database_name + ' '
		set @sql = @sql + 'create table table_cache_status
		(
			[szTableName] [varchar] (128) not null,
			[lDummy] [int] not null,
			[ts] [timestamp] not null,
			CONSTRAINT [CPK_table_cache_status] PRIMARY KEY  CLUSTERED 
			(
				[szTableName]
			)  ON [PRIMARY]
		)'
		exec(@sql)
	
		set @sql = 'insert ' + @input_database_name + '.dbo.table_cache_status(szTableName,lDummy) select szTableName,lDummy from table_cache_status with (nolock)'
		exec(@sql)

		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()

		set @status = 'penalty_and_interest'		
		set @sql = 'select * into ' + @input_database_name + '.dbo.penalty_and_interest from dbo.penalty_and_interest with (nolock)'
		exec(@sql)
		set @sql = 'use ' + @input_database_name + ' ;checkpoint'
		exec (@sql)	

		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
		
		--*****************************************************************************
		--More middle-tier stuff
		
		set @sql = @input_database_name + '.dbo.sp_executesql N''
			set ansi_nulls on
			set ansi_padding on
			set ansi_warnings on
			set arithabort on
			set concat_null_yields_null on
			set quoted_identifier on
			set numeric_roundabort off'''
		exec(@sql)
		
		set @status = '_clientdb_improvement_features'
		set @sql = @input_database_name + '.dbo.sp_executesql N''
			create table _clientdb_improvement_features
			(
				prop_id int not null,
				prop_val_yr numeric(4,0) not null,
				imprv_id int not null,
				imprv_det_id int null,
				imprv_attr_desc varchar(50),
				i_attr_val_cd varchar(75)
			) '''
		exec(@sql)

		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
		
		set @status = '_clientdb_imprv_det_sketch'
		set @sql = @input_database_name + '.dbo.sp_executesql N''
			create table _clientdb_imprv_det_sketch
			(
				prop_id int not null,
				prop_val_yr numeric(4,0) not null,
				imprv_det_type_cd varchar(10) null,
				imprv_det_typ_desc varchar(50) null,
				imprv_det_area numeric(18,1) null,
				sketch_cmds varchar(1800) null,
				living_area numeric(18,1) null
			) '''
		exec(@sql)

		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()

		set @status = '_clientdb_pacs_year'
		set @sql = @input_database_name + '.dbo.sp_executesql N''
			create table _clientdb_pacs_year
			(
				tax_yr numeric(4,0) not null,
				certification_dt datetime null,
				prev_reappraised_yr numeric(4,0) null
			) '''
		exec(@sql)

		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()

		--  HS 55281 Kevin Lloyd

		set @status = '_clientdb_taxing_jurisdiction_detail'
		set @sql = @input_database_name + '.dbo.sp_executesql N''
			create table _clientdb_taxing_jurisdiction_detail
			(
				prop_id int not null,
				owner_prop_id int not null,
				sup_yr numeric(4,0) not null,
				owner_id int not null,
				entity_id int null,
				owner_name varchar(70) null,
				pct_ownership numeric(13,10) null,
				total_market numeric(18,0) null,
				total_appraised_val numeric(18,0) null,
				total_assessed_val numeric(18,0) null,
				entity_cd varchar(5) null,
				file_as_name varchar(70) null,
				tax_rate numeric(15,10) null,	
				appraised_val numeric(18,0) null,
				assessed_val numeric(18,0) null,
				taxable_val numeric(18,0) null,
				freeze_ceiling numeric(14,2) null,
				show_values varchar(1) null,
				homesite_val numeric(18,0) null,
				nonhomesite_val numeric(18,0) null,
				tax_area_id int null,
				tax_district_id int,
				levy_rate numeric(13, 10),
				levy_cd varchar(10) null,
				levy_description varchar(50) null,
				taxes numeric (14, 2) null,
				taxes_wo_ex numeric (14, 2) null
			) '''
		exec(@sql)

		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
		
		set @status = '_clientdb_values_detail'
		set @sql = @input_database_name + '.dbo.sp_executesql N''
			create table _clientdb_values_detail
			(
				prop_id int not null,
				prop_val_yr numeric(4,0) not null,
				imprv_hstd_val numeric(14,0) null,
				imprv_non_hstd_val numeric(14,0) null,
				land_hstd_val numeric(14,0) null,
				land_non_hstd_val numeric(14,0) null,
				ag_use_val numeric(14,0) null,
				timber_use numeric(14,0) null,
				ag_market numeric(14,0) null,
				timber_market numeric(14,0) null,
				market numeric(14,0) null,
				appraised_val numeric(14,0) null,
				ten_percent_cap numeric(14,0) null,
				assessed_val numeric(14,0) null,
				current_hs_use_val numeric(14,0) null,
				current_nhs_use_val numeric(14,0) null,
				current_hs_mkt_val numeric(14,0) null,
				current_nhs_mkt_val numeric(14,0) null,
				productivity_loss numeric(14,0) null,
				exmpt_value numeric(14,0) null,
				snr_exempt_loss numeric(14,0) null,
				appraised_classified numeric (14,0) null,
				appraised_non_classified numeric (14,0) null,
				non_taxed_mkt_val numeric (14,0) null,
				show_values varchar(1) null
			) '''
		exec(@sql)

		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()

		set @status = '[account]'
		set @sql = @input_database_name + '.dbo.sp_executesql N''
			CREATE TABLE [account] (
				[acct_id] [int] NOT NULL ,
				[first_name] [varchar] (30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[last_name] [varchar] (30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[file_as_name] [varchar] (70) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[dl_num] [varchar] (10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[dl_state] [char] (2) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[dl_expir_dt] [datetime] NULL ,
				[merged_acct_id] [char] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[acct_create_dt] [datetime] NULL ,
				[opening_balance] [money] NULL ,
				[comment] [varchar] (2048) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[misc_code] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[ref_id1] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[source] [varchar] (30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[ref_acct_id] [int] NULL ,
				[confidential_flag] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[confidential_file_as_name] [varchar] (70) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[confidential_first_name] [varchar] (30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[confidential_last_name] [varchar] (30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[dist_m_n_o] [int] NULL ,
				[dist_i_n_s] [int] NULL ,
				[dist_pi] [int] NULL ,
				[dist_atty_fees] [int] NULL ,
				[dist_overages] [int] NULL ,
				[dist_tax_cert_fees] [int] NULL ,
				[dist_misc_fees] [int] NULL ,
				[dist_vit] [int] NULL ,
				[email_addr] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[web_addr] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[ftp_addr] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[update_dt] [datetime] NULL ,
				[web_suppression] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[appr_company_id] [int] NULL ,
				CONSTRAINT [CPK__account] PRIMARY KEY  CLUSTERED 
				(
					[acct_id]
				) WITH  FILLFACTOR = 90  ON [PRIMARY] 
			) ON [PRIMARY] '''
		exec(@sql)

		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
	
		if @region = @texas
		begin
			set @status = 'Texas [bill]'
			set @sql = @input_database_name + '.dbo.sp_executesql N''
				CREATE TABLE [bill] (
					[bill_id] [int] NOT NULL ,
					[sup_tax_yr] [numeric](4, 0) NOT NULL ,
					[sup_num] [int] NOT NULL ,
					[entity_id] [int] NOT NULL ,
					[prop_id] [int] NOT NULL ,
					[owner_id] [int] NOT NULL ,
					[adjustment_code] [varchar] (10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
					[adj_effective_dt] [datetime] NULL ,
					[adj_expiration_dt] [datetime] NULL ,
					[adj_comment] [varchar] (500) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
					[rollback_id] [int] NULL ,
					[coll_status_cd] [char] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
					[bill_type] [char] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
					[effective_due_dt] [datetime] NULL ,
					[bill_m_n_o] [numeric](14, 2) NULL ,
					[bill_i_n_s] [numeric](14, 2) NULL ,
					[bill_prot_i_n_s] [numeric](14, 2) NULL ,
					[bill_late_ag_penalty] [numeric](14, 2) NULL ,
					[bill_m_n_o_pd] [numeric](14, 2) NULL ,
					[bill_i_n_s_pd] [numeric](14, 2) NULL ,
					[penalty_m_n_o_pd] [numeric](14, 2) NULL ,
					[penalty_i_n_s_pd] [numeric](14, 2) NULL ,
					[interest_m_n_o_pd] [numeric](14, 2) NULL ,
					[interest_i_n_s_pd] [numeric](14, 2) NULL ,
					[attorney_fees_pd] [numeric](14, 2) NULL ,
					[bill_assessed_value] [numeric](14, 2) NULL ,
					[bill_taxable_val] [numeric](14, 2) NULL ,
					[stmnt_id] [numeric](18, 0) NULL ,
					[discount_mno_pd] [numeric](14, 2) NULL ,
					[discount_ins_pd] [numeric](14, 2) NULL ,
					[prev_bill_id] [int] NULL ,
					[new_bill_id] [int] NULL ,
					[create_dt] [datetime] NULL ,
					[ref_id1] [varchar] (20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
					[ref_id2] [varchar] (20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
					[ref_id3] [varchar] (20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
					[ref_id4] [varchar] (20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
					[ref_id5] [varchar] (20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
					[discount_offered] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
					[levy_group_id] [int] NULL ,
					[levy_run_id] [int] NULL ,
					[active_bill] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
					[q1_amt] [numeric](14, 2) NULL ,
					[q1_paid] [numeric](14, 2) NULL ,
					[q1_due_dt] [datetime] NULL ,
					[q2_amt] [numeric](14, 2) NULL ,
					[q2_paid] [numeric](14, 2) NULL ,
					[q2_due_dt] [datetime] NULL ,
					[q3_amt] [numeric](14, 2) NULL ,
					[q3_paid] [numeric](14, 2) NULL ,
					[q3_due_dt] [datetime] NULL ,
					[q4_amt] [numeric](14, 2) NULL ,
					[q4_paid] [numeric](14, 2) NULL ,
					[q4_due_dt] [datetime] NULL ,
					[q_bill] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
					[q_create_dt] [datetime] NULL ,
					[q_remove_dt] [datetime] NULL ,
					[q_created_by] [int] NULL ,
					[q_removed_by] [int] NULL ,
					[bill_adj_m_n_o] [numeric](14, 2) NULL ,
					[bill_adj_i_n_s] [numeric](14, 2) NULL ,
					[refund_m_n_o_pd] [numeric](14, 2) NULL ,
					[refund_i_n_s_pd] [numeric](14, 2) NULL ,
					[refund_pen_m_n_o_pd] [numeric](14, 2) NULL ,
					[refund_pen_i_n_s_pd] [numeric](14, 2) NULL ,
					[refund_int_m_n_o_pd] [numeric](14, 2) NULL ,
					[refund_int_i_n_s_pd] [numeric](14, 2) NULL ,
					[refund_atty_fee_pd] [numeric](14, 2) NULL ,
					[underage_mno_pd] [numeric](14, 2) NULL ,
					[underage_ins_pd] [numeric](14, 2) NULL ,
					[overage_mno_pd] [numeric](14, 2) NULL ,
					[overage_ins_pd] [numeric](14, 2) NULL ,
					[refund_disc_mno_pd] [numeric](14, 2) NULL ,
					[refund_disc_ins_pd] [numeric](14, 2) NULL ,
					[ia_id] [int] NULL ,
					[pay_type] [varchar] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
					[pay1_amt] [numeric](14, 2) NULL ,
					[pay1_paid] [numeric](14, 2) NULL ,
					[pay1_due_dt] [datetime] NULL ,
					[pay2_amt] [numeric](14, 2) NULL ,
					[pay2_paid] [numeric](14, 2) NULL ,
					[pay2_due_dt] [datetime] NULL ,
					[pay3_amt] [numeric](14, 2) NULL ,
					[pay3_paid] [numeric](14, 2) NULL ,
					[pay3_due_dt] [datetime] NULL ,
					[pay4_amt] [numeric](14, 2) NULL ,
					[pay4_paid] [numeric](14, 2) NULL ,
					[pay4_due_dt] [datetime] NULL ,
					[pay_created_dt] [datetime] NULL ,
					[pay_removed_dt] [datetime] NULL ,
					[pay_created_by] [int] NULL ,
					[pay_removed_by] [int] NULL ,
					[refund_underage_mno_pd] [numeric](14, 2) NULL ,
					[refund_underage_ins_pd] [numeric](14, 2) NULL ,
					[refund_overage_mno_pd] [numeric](14, 2) NULL ,
					[refund_overage_ins_pd] [numeric](14, 2) NULL ,
					[taxes_paid] [bit] NULL,
					CONSTRAINT [CPK_bill] PRIMARY KEY  CLUSTERED 
					(
						[bill_id],
						[sup_tax_yr],
						[sup_num],
						[entity_id],
						[prop_id],
						[owner_id]
					) WITH  FILLFACTOR = 90  ON [PRIMARY] 
				) ON [PRIMARY] '''
			exec(@sql)
		end
		
		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()

		set @status = 'Texas [bill_adjust_code]'
		set @sql = @input_database_name + '.dbo.sp_executesql N''
			CREATE TABLE [bill_adjust_code] (
				[adjust_cd] [varchar] (10) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL ,
				[adjust_desc] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL ,
				[deferral_cd] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[alert_user] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[use_penalty] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[penalty_rate] [numeric](4, 0) NULL ,
				[use_interest] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[interest_rate] [numeric](4, 0) NULL ,
				[use_attorney_fee] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[attorney_fee_rate] [numeric](4, 0) NULL ,
				[use_range] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[begin_range] [numeric](4, 0) NULL ,
				[end_range] [numeric](4, 0) NULL ,
				[sys_flag] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[judgement_cd] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				CONSTRAINT [CPK_bill_adjust_code] PRIMARY KEY  CLUSTERED 
				(
					[adjust_cd]
				) WITH  FILLFACTOR = 100  ON [PRIMARY] 
			) ON [PRIMARY] '''
		exec(@sql)

		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
		
		set @status = 'Texas [entity]'
 		set @sql = @input_database_name + '.dbo.sp_executesql N''
			CREATE TABLE [entity] (
				[entity_id] [int] NOT NULL ,
				[entity_cd] [char] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL ,
				[entity_type_cd] [char] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL ,
				[entity_disb_bal] [numeric](14, 2) NULL ,
				[taxing_unit_num] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[mbl_hm_submission] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[freeports_allowed] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[ptd_multi_unit] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[appr_company_entity_cd] [char] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[refund_default_flag] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[weed_control] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[fiscal_begin_date] [datetime] NULL ,
				[fiscal_end_date] [datetime] NULL ,
				[fiscal_year] [varchar] (10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[county_taxing_unit_ind] [varchar] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[collector_id] [int] NULL ,
				[rendition_entity] [bit] NULL ,
				[enable_timber_78] [bit] NULL CONSTRAINT [DF_entity_enable_timber_78] DEFAULT (0),
				CONSTRAINT [CPK_entity] PRIMARY KEY  CLUSTERED 
				(
					[entity_id]
				) WITH  FILLFACTOR = 90  ON [PRIMARY] ,
			) ON [PRIMARY] '''
		exec(@sql)

		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
		
		if @region = @texas
		begin
			set @status = 'Texas [payment]'
			set @sql = @input_database_name + '.dbo.sp_executesql N''
				CREATE TABLE [payment] (
					[payment_id] [int] NOT NULL ,
					[batch_id] [int] NULL ,
					[amt_due] [numeric](14, 2) NULL ,
					[check_num] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
					[mo_num] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
					[check_amt] [numeric](14, 2) NULL ,
					[cash_amt] [numeric](14, 2) NULL ,
					[mo_amt] [numeric](14, 2) NULL ,
					[payment_type] [char] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
					[payment_code] [char] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
					[rcpt_num] [int] NULL ,
					[payee_id] [int] NULL ,
					[operator_id] [int] NULL ,
					[post_date] [datetime] NULL ,
					[date_paid] [datetime] NULL ,
					[dl_number] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
					[dl_state] [varchar] (2) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
					[dl_exp_date] [datetime] NULL ,
					[void_payment] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
					[void_date] [datetime] NULL ,
					[void_by_id] [int] NULL ,
					[void_reason] [varchar] (255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
					[void_batch_id] [int] NULL ,
					[new_payment_id] [int] NULL ,
					[prev_payment_id] [int] NULL ,
					[paid_by] [varchar] (50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
					[cc_type] [varchar] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
					[cc_amt] [numeric](14, 2) NULL ,
					[cc_fee] [numeric](14, 2) NULL ,
					[cc_last_four_digits] [varchar] (4) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
					[cc_auth] [varchar] (20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
					CONSTRAINT [CPK_payment] PRIMARY KEY  CLUSTERED 
					(
						[payment_id]
					) WITH  FILLFACTOR = 90  ON [PRIMARY] ,
				) ON [PRIMARY] '''
			exec(@sql)

			insert into _clientdb_log (id, start_dt, finish_dt, status, error)
				values (@log_id, @start_date, getdate(), @status, @@error)
			set @start_date = getdate()
		end

		set @status = 'Texas [payment_trans]'
		set @sql = @input_database_name + '.dbo.sp_executesql N''
			CREATE TABLE [payment_trans] (
				[transaction_id] [int] NOT NULL ,
				[payment_id] [int] NOT NULL ,
				[prop_id] [int] NULL ,
				[bill_id] [int] NULL ,
				[fee_id] [int] NULL ,
				[trans_type] [varchar] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[fee_amt] [numeric](14, 2) NULL ,
				[mno_amt] [numeric](14, 2) NULL ,
				[ins_amt] [numeric](14, 2) NULL ,
				[penalty_mno_amt] [numeric](14, 2) NULL ,
				[penalty_ins_amt] [numeric](14, 2) NULL ,
				[interest_mno_amt] [numeric](14, 2) NULL ,
				[interest_ins_amt] [numeric](14, 2) NULL ,
				[attorney_fee_amt] [numeric](14, 2) NULL ,
				[q1_amt] [numeric](14, 2) NULL ,
				[q2_amt] [numeric](14, 2) NULL ,
				[q3_amt] [numeric](14, 2) NULL ,
				[q4_amt] [numeric](14, 2) NULL ,
				[mno_due] [numeric](14, 2) NULL ,
				[ins_due] [numeric](14, 2) NULL ,
				[penalty] [numeric](14, 2) NULL ,
				[interest] [numeric](14, 2) NULL ,
				[attorney_fee] [numeric](14, 2) NULL ,
				[fee_due] [numeric](14, 2) NULL ,
				[fiscal_year] [varchar] (10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[fiscal_month] [int] NULL ,
				[fiscal_entity_id] [int] NULL ,
				[discount_mno_amt] [numeric](14, 2) NULL ,
				[discount_ins_amt] [numeric](14, 2) NULL ,
				[underage_mno_amt] [numeric](14, 2) NULL ,
				[underage_ins_amt] [numeric](14, 2) NULL ,
				[overage_mno_amt] [numeric](14, 2) NULL ,
				[overage_ins_amt] [numeric](14, 2) NULL ,
				[refund_mno_amt] [numeric](14, 2) NULL ,
				[refund_ins_amt] [numeric](14, 2) NULL ,
				[void_trans] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[void_date] [datetime] NULL ,
				[void_by_id] [int] NULL ,
				[void_reason] [varchar] (255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[void_batch_id] [int] NULL ,
				[prev_transaction_id] [int] NULL ,
				[prev_payment_id] [int] NULL ,
				CONSTRAINT [CPK_payment_trans] PRIMARY KEY  CLUSTERED 
				(
					[transaction_id],
					[payment_id]
				) WITH  FILLFACTOR = 90  ON [PRIMARY] ,
			) ON [PRIMARY] '''
		exec(@sql)

		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
		
		set @status = 'Texas [refund_due_trans]'
		set @sql = @input_database_name + '.dbo.sp_executesql N''
			CREATE TABLE [refund_due_trans] (
				[transaction_id] [int] NOT NULL ,
				[batch_id] [int] NOT NULL ,
				[bill_id] [int] NOT NULL ,
				[mno_amt] [numeric](14, 2) NULL ,
				[ins_amt] [numeric](14, 2) NULL ,
				[penalty_mno_amt] [numeric](14, 2) NULL ,
				[penalty_ins_amt] [numeric](14, 2) NULL ,
				[interest_mno_amt] [numeric](14, 2) NULL ,
				[interest_ins_amt] [numeric](14, 2) NULL ,
				[atty_fee_amt] [numeric](14, 2) NULL ,
				[payment_trans_id] [int] NULL ,
				[adjust_id] [int] NULL,
				[discount_mno_amt] [numeric](14, 2) NULL,
				[discount_ins_amt] [numeric](14, 2) NULL,
				[underage_mno_amt] [numeric](14, 2) NULL,
				[underage_ins_amt] [numeric](14, 2) NULL,
				[overage_mno_amt] [numeric](14, 2) NULL,
				[overage_ins_amt] [numeric](14, 2) NULL,
				CONSTRAINT [CPK_refund_due_trans] PRIMARY KEY  CLUSTERED 
				(
					[transaction_id],
					[batch_id],
					[bill_id]
				) WITH  FILLFACTOR = 100  ON [PRIMARY] 
			) ON [PRIMARY] '''
		exec(@sql)

		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
		
		set @status = 'Texas [tax_rate]'
		set @sql = @input_database_name + '.dbo.sp_executesql N''
			CREATE TABLE [tax_rate] (
				[entity_id] [int] NOT NULL ,
				[tax_rate_yr] [numeric](4, 0) NOT NULL ,
				[discount_dt] [datetime] NULL ,
				[late_dt] [datetime] NULL ,
				[attorney_fee_dt] [datetime] NULL ,
				[bills_created_dt] [datetime] NULL ,
				[m_n_o_tax_pct] [numeric](13, 10) NULL ,
				[i_n_s_tax_pct] [numeric](13, 10) NULL ,
				[prot_i_n_s_tax_pct] [numeric](13, 10) NULL ,
				[sales_tax_pct] [numeric](13, 10) NULL ,
				[levy_start_rct_num] [numeric](18, 0) NULL ,
				[supp_start_rct_num] [numeric](18, 0) NULL ,
				[stmnt_dt] [datetime] NULL ,
				[collect_for] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[appraise_for] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[ready_to_certify] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[special_inv_entity] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[ready_to_create_bill] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[PLUS_1_INT_PCT] [numeric](13, 10) NULL ,
				[PLUS_1_PENALTY_PCT] [numeric](13, 10) NULL ,
				[PLUS_2_INT_PCT] [numeric](13, 10) NULL ,
				[PLUS_2_PENALTY_PCT] [numeric](13, 10) NULL ,
				[PLUS_3_INT_PCT] [numeric](13, 10) NULL ,
				[PLUS_3_PENALTY_PCT] [numeric](13, 10) NULL ,
				[PLUS_4_INT_PCT] [numeric](13, 10) NULL ,
				[PLUS_4_PENALTY_PCT] [numeric](13, 10) NULL ,
				[PLUS_5_INT_PCT] [numeric](13, 10) NULL ,
				[PLUS_5_PENALTY_PCT] [numeric](13, 10) NULL ,
				[PLUS_6_INT_PCT] [numeric](13, 10) NULL ,
				[PLUS_6_PENALTY_PCT] [numeric](13, 10) NULL ,
				[PLUS_7_INT_PCT] [numeric](13, 10) NULL ,
				[PLUS_7_PENALTY_PCT] [numeric](13, 10) NULL ,
				[PLUS_8_INT_PCT] [numeric](13, 10) NULL ,
				[PLUS_8_PENALTY_PCT] [numeric](13, 10) NULL ,
				[PLUS_9_INT_PCT] [numeric](13, 10) NULL ,
				[PLUS_9_PENALTY_PCT] [numeric](13, 10) NULL ,
				[attorney_fee_pct] [numeric](4, 2) NULL ,
				[effective_due_dt] [datetime] NULL ,
				[collect_option] [char] (5) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[weed_control] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[weed_control_pct] [numeric](4, 2) NULL ,
				[ptd_option] [char] (1) COLLATE SQL_Latin1_General_CP1_CI_AS NULL ,
				[apply_bpp_attorney_fees] [bit] NOT NULL CONSTRAINT [DF__clientdb_tax_rate__apply___74F30FE8] DEFAULT (0),
				[bpp_attorney_fee_dt] [datetime] NULL ,
				CONSTRAINT [CPK_tax_rate] PRIMARY KEY  CLUSTERED 
				(
					[entity_id],
					[tax_rate_yr]
				) WITH  FILLFACTOR = 90  ON [PRIMARY] ,
			) ON [PRIMARY] '''
		exec(@sql)

		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
		
 
		-- 9.0 MT Stuff
		print 'Creating Middle Tier Specific Tables'
		set @status = 'abs_subdv'
		set @sql = 'use ' + @input_database_name + ' ' 
		set @sql = @sql + 'create table abs_subdv
		(
			[abs_subdv_cd] varchar(10) not null,
			[abs_subdv_yr] numeric(4,0) not null,
			[abs_subdv_desc] varchar(60) null,
			[abs_land_pct] numeric(5,2) not null,
			[abs_imprv_pct] numeric(5,2) not null,
			[abs_subdv_ind] char(1) null,
			[sys_flag] char(1) null,
			[changed_flag] char(1) null,
			[cInCounty] char(1) not null,
			[bActive] bit null,
			[ls_id] int null,
			[active_year] numeric(4,0) null,
			[create_date] datetime null
		)'
		exec(@sql)
		
		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
		
		
		if @region = @washington
		begin
			declare @commercial_codes varchar(200);
			declare @farm_codes varchar(20);
			declare @residential_codes varchar(200);
			
			set @commercial_codes = '12,13,15,16,17,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,61,62,63,64,65,66,67,68,69,71,72,73,74,75,76,77,78,79';
			set @farm_codes = '81,83';
			set @residential_codes = '11,14,18,19,88,94,95,82,84,85,89,91,92,93,96,97,98,99';
			
			
			CREATE TABLE #commercial_dor(dor_use_cd varchar(10))
			INSERT INTO #commercial_dor
			SELECT Id FROM dbo.fn_ReturnTableFromCommaSepValues(@commercial_codes)
			
			CREATE TABLE #farm_dor(dor_use_cd varchar(10))
			INSERT INTO #farm_dor
			SELECT Id FROM dbo.fn_ReturnTableFromCommaSepValues(@farm_codes)
			
			CREATE TABLE #residential_dor(dor_use_cd varchar(10))
			INSERT INTO #residential_dor
			SELECT Id FROM dbo.fn_ReturnTableFromCommaSepValues(@residential_codes)
			
		
			--Sales Search
			set @status = 'Sales Search'
			-- set year value for testing
			declare @input_year	numeric(4,0)
			select @input_year = max(tax_yr) from _clientdb_pacs_year

			-- select count(*) from _clientdb_sales -- 5669 , with tax_area_fund 111727

			--  drop tables needed for processing if they exists
			if object_id('_clientdb_sales') is not null  -- final outcome table
			   begin 
			   truncate table _clientdb_sales
			   drop table _clientdb_sales
			   end
			if object_id('_PA_buyers') is not null   -- work table for buyer name info
			   begin  
			   truncate table _PA_buyers
			   drop table _PA_buyers
			   end
			if object_id('_PA_sellers') is not null  -- work table for seller name info
			   begin 
			   truncate table _PA_sellers
			   drop table _PA_sellers
			   end

			if object_id('_PA_owners') is not null   -- work table for owner name info
			   begin 
			   truncate table _PA_owners
			   drop table _PA_owners
			   end

			-- permanent tables are built for seller,buyer,owner names
			-- so function to creat comma delimited output
			-- has real table to work on -- functions do not allow temp tables 

			/*************************************************************************************
			   get BUYER info, accounting for multiple buyers per sale with comma delimited string
			   broken into several steps to make the processing faster
			*************************************************************************************/
			create table _PA_buyers (chg_of_owner_id int,buyer varchar(1000),multi_buyer bit)

			insert into _PA_buyers(chg_of_owner_id,buyer)
			select
				b.chg_of_owner_id,
				case 
				  when a.confidential_flag = 'T' or a.web_suppression = '1'
				  then (select IsNull(confidential_file_as_name, 'Confidential') as confidential_file_as_name 
							from pacs_system) 
				  else a.file_as_name 
				  end  as buyer
			from account as a with(nolock) -- pk cluster acct_id
			   inner join
			   buyer_assoc as b with(nolock)  -- pk cluster chg_of_owner_id, buyer_id
			on a.acct_id = b.buyer_id 

			create  index idx_tmp  on _PA_buyers(chg_of_owner_id,multi_buyer)

			-- update multi buyer value 
			update b
			   set multi_buyer = 1
			from _PA_buyers b
				 join 
				 (select 
					 chg_of_owner_id 
					from _PA_buyers
				   group by chg_of_owner_id
				having count(*) > 1
			) as dups
			on b.chg_of_owner_id = dups.chg_of_owner_id

			update _PA_buyers
			   set buyer = dbo.fn_PA_GetFileAsName_CommaDelimited(chg_of_owner_id,'B',0)
			where multi_buyer = 1

			/*************************************************************************************
			   get SELLER info, accounting for multiple sellers per sale with comma delimited string
			   broken into several steps to make the processing faster
			*************************************************************************************/
			create table _PA_sellers (chg_of_owner_id int,prop_id int, seller varchar(1000),multi_seller bit)

			insert into _PA_sellers(chg_of_owner_id,prop_id,seller)
			select 
			  s.chg_of_owner_id,
			  s.prop_id,
			  case 
			  when a.confidential_flag = 'T' or a.web_suppression = '1'
			  then (select IsNull(confidential_file_as_name, 'Confidential') as confidential_file_as_name 
						from pacs_system) 
			  else a.file_as_name 
			  end as seller

			from account as a with(nolock) -- pk cluster acct_id
			   inner join
			   seller_assoc as s with(nolock)  -- pk cluster chg_of_owner_id, prop_id, seller_id
			on a.acct_id = s.seller_id
			   

			create index idx_tmp  on _PA_sellers(chg_of_owner_id,prop_id,multi_seller)
			-- update multi seller value 
			update s
			   set multi_seller = 1
			from _PA_sellers s
				 join 
				 (select 
					 chg_of_owner_id 
					from _PA_sellers
				   group by chg_of_owner_id
				having count(*) > 1
			) as dups
			on s.chg_of_owner_id = dups.chg_of_owner_id

			update _PA_sellers
			   set seller = dbo.fn_PA_GetFileAsName_CommaDelimited(chg_of_owner_id,'S',prop_id)
			where multi_seller = 1

			/*************************************************************************************
			   get CURRENT OWNER info, accounting for multiple owners comma delimited string
			   broken into several steps to make the processing faster
			*************************************************************************************/
			-- determine owner name
			create table _PA_owners (prop_id int, owner_name varchar(1000),multi_owner bit)

			insert into _PA_owners(prop_id,owner_name)
			select 
			  o.prop_id,
			  case 
			  when a.confidential_flag = 'T' or a.web_suppression = '1'
			  then (select IsNull(confidential_file_as_name, 'Confidential') as confidential_file_as_name 
						from pacs_system) 
			  else a.file_as_name 
			  end as owner_name

			from account as a with(nolock) -- pk cluster acct_id
				 inner join
				 owner as o with(nolock)  -- pk cluster owner_tax_yr, sup_num, prop_id, owner_id
			 on  o.owner_tax_yr = @input_year
			and  a.acct_id = o.owner_id
				 inner join
				 prop_supp_assoc as psa with(nolock) -- pk cluster owner_tax_yr, sup_num, prop_id
			 on  psa.owner_tax_yr = @input_year
			and  o.owner_tax_yr = psa.owner_tax_yr
			and  o.sup_num = psa.sup_num
			and  o.prop_id = psa.prop_id
			   

			create index idx_tmp  on _PA_owners(prop_id,multi_owner)
			-- update multi owner value 
			update o
			   set multi_owner = 1
			from _PA_owners o
				 join 
				 (select 
					 prop_id 
					from _PA_owners
				   group by prop_id
				having count(*) > 1
			) as dups
			on o.prop_id = dups.prop_id

			update _PA_owners
			   set owner_name = dbo.fn_PA_GetFileAsName_CommaDelimited(0,'O',prop_id)
			where multi_owner = 1

			/*****************************************************************************
			  select into final outcome table
			*****************************************************************************/

			select 
			 sale.chg_of_owner_id, 
			 p.prop_id,
			 p.prop_type_cd, 
			 case 
				when (p.prop_type_cd = 'R' and pu.dor_use_code in (select dor_use_cd from #commercial_dor))
					then 'CM'
				when (p.prop_type_cd = 'R' and pu.dor_use_code in (select dor_use_cd from #farm_dor))
					then 'FM'
				when (p.prop_type_cd = 'R' and pu.dor_use_code in (select dor_use_cd from #residential_dor))
					then 'RS'
				when (p.prop_type_cd = 'MH')
					then 'MH'
				else
					null
			 end as property_type,
			 
			 pp.state_cd, 
			 pp.school_id, 
			 pp.city_id , 
			 pp.class_cd as imprv_class, 
			 pp.yr_blt as actual_yr_built, 
			 pp.living_area as living_area_sqft, 
			 pp.land_type_cd, 
			 sale.sl_dt as sale_dt, 
			 sale.adjusted_sl_price as sl_price, 
			 sale.adjusted_sl_price as sl_adj_price, 
			 sale.sl_type_cd, 
			 sale.land_only_sale,
			 --pv.last_appraiser_id, 
			 case when (pv.prop_inactive_dt is null or pv.udi_parent = 'T') 
				   then IsNull(sale.include_no_calc, 'F')
				   else 'T' 
				  end as include_no_calc, 
			 sale.sl_ratio_type_cd as sl_ratio_cd, 
			 pp.eff_yr_blt as eff_yr_built, 
			 IsNull(sale.include_reason, '') as include_reason, 
			 p.geo_id, 
			 p.simple_geo_id,
			-- pv.map_id, 
			 CASE WHEN sale.sl_price <> sale.adjusted_sl_price 
				   THEN sale.sl_adj_rsn 
				   ELSE '' 
				  END as sl_adj_reason, 
			 sale.sl_price as true_sl_price, 

			-- p.dba_name, 
			 pp.property_use_cd as local_dor_code, 
			 case when isnull(pp.living_area,0) >0 
				   then isnull(pp.land_total_sqft,0) / pp.living_area
				   else 0 
				  end as living_area_sqft2, 

			 isnull(pp.living_area,0) as living_area, 
			 pp.imprv_det_sub_class_cd as imprv_sub_class, 
			 pp.condition_cd, 
			 pp.heat_ac_code, 
			 isnull(pp.land_total_sqft,0) as land_total_sqft, 
			 isnull(pp.land_total_acres,0) as land_total_acres, 
			 isnull(pp.imprv_add_val,0) as additive_val, 
			 isnull(pp.percent_complete,0) as percent_complete, 
			 pp.sub_market_cd ,
			 pp.imprv_type_cd,
			 pp.imprv_det_meth_cd_highvalueimprov as imprv_det_meth_cd,
			 pp.imprv_det_sub_class_cd,
			pu.dor_use_code as state_dor_code,
			ta.tax_area_number,
			ta.tax_area_id,
			pp.characteristic_zoning1 as zoning,
			pp.mbl_hm_make as mh_make,
			pp.mbl_hm_model as mh_model,
			pp.mbl_hm_sn as mh_serial,
			pp.mbl_hm_hud_num as mh_hud,
			pp.mbl_hm_title_num as mh_title,
			cast('0' as bit) as multi_prop_sale,  -- initially set to false, updated later
			pv.market,
			coo.excise_number,
			coo.deed_type_cd,
			coo.deed_num,
			coo.deed_book_id,
			coo.deed_book_page,
			coo.deed_dt,
			coo.grantor_cv,
			coo.grantee_cv 

			,sell.seller
			,buy.buyer
			,own.owner_name as current_owner
			,webp.prop_type_desc
			,webp.situs_display
			,webp.legal_desc
			,webp.owner_name
			,webp.tax_area
			,webp.prop_val_yr
			,webp.show_values
			,webp.abs_subdv_cd
			into _clientdb_sales
			from 
				  property as p WITH (NOLOCK)  -- pk cluster prop_id
				  inner join
				  property_profile as pp WITH (NOLOCK) -- pk cluster prop_val_yr, prop_id
			  on 
				  pp.prop_val_yr =  @input_year
			 and  p.prop_id = pp.prop_id
				  inner join
				  prop_supp_assoc as psa WITH (NOLOCK) -- pk cluster owner_tax_yr, sup_num, prop_id
			  on 
				  psa.owner_tax_yr =  @input_year
			  and pp.prop_val_yr = psa.owner_tax_yr 
			  and pp.prop_id = psa.prop_id
				  inner join 
				  property_val as pv WITH (NOLOCK) -- pk cluster prop_val_yr, sup_num, prop_id
			   on
				  pv.prop_val_yr =  @input_year
			  and psa.owner_tax_yr = pv.prop_val_yr 
			  and psa.sup_num = pv.sup_num 
			  and psa.prop_id = pv.prop_id 
			      left outer join
			      property_use as pu with (nolock)
			  on  pv.property_use_cd = pu.property_use_cd
				  inner join
				  property_tax_area as pta WITH (NOLOCK) -- pk cluster year, sup_num, prop_id
			   on pv.prop_val_yr = pta.year
			  and pv.sup_num = pta.sup_num
			  and pv.prop_id = pta.prop_id
				  inner join
				  tax_area as ta WITH (NOLOCK) -- pk cluster tax_area_id
			   on pta.tax_area_id = ta.tax_area_id
				  inner join
				  chg_of_owner_prop_assoc copa WITH (NOLOCK)  -- pk non cluster chg_of_owner_id, prop_id; cluster on prop_id 
			   on   
				  copa.prop_id = pp.prop_id
				  inner join 
				  sale WITH (NOLOCK) -- pk cluster chg_of_owner_id
				on 
				  copa.chg_of_owner_id = sale.chg_of_owner_id 
				  inner join 
				  chg_of_owner coo with (nolock)  -- pk cluster chg_of_owner_id
				on
				  copa.chg_of_owner_id = coo.chg_of_owner_id 
				  left join
				  (select distinct chg_of_owner_id ,buyer
					 from _PA_buyers 
				   )as buy 
				on 
				  copa.chg_of_owner_id = buy.chg_of_owner_id 
				  left join
				  (select distinct chg_of_owner_id , prop_id, seller
					 from _PA_sellers
				   )as sell
				on 
				  copa.chg_of_owner_id = sell.chg_of_owner_id 
			  and copa.prop_id = sell.prop_id
				  left join
				  (select distinct prop_id, owner_name
					 from _PA_owners
				   )as own
				on 
				  copa.prop_id = own.prop_id
				join _clientdb_property as webp with (nolock)
				on pp.prop_id = webp.prop_id
				and pp.prop_val_yr = webp.prop_val_yr
			 
			 where 
				 (sale.suppress_on_ratio_rpt_cd = 'F' or sale.suppress_on_ratio_rpt_cd is null)
			 and   sale.adjusted_sl_price > 0 and sale.adjusted_sl_price is not null 
			 and (pv.prop_inactive_dt is null or pv.udi_parent = 'T')
			 and (sale.confidential_sale is null or sale.confidential_sale = 'F')

			create index idx__clientdb_sales_chg_of_owner_id on _clientdb_sales(chg_of_owner_id)

			-- _clientdb_property_tax_district_assoc
			select 
			pv.prop_id,
			pv.prop_val_yr,
			td.tax_district_cd
			into _clientdb_property_tax_district_assoc
			from property_val as pv with (nolock)
			join #layer_assoc as psa with (nolock)
			on pv.prop_val_yr = psa.owner_tax_yr and
			pv.sup_num = psa.sup_num and
			pv.prop_id = psa.prop_id
			join property_tax_area as pta with (nolock) -- pk cluster year, sup_num, prop_id
			on pv.prop_val_yr = pta.year and
			pv.sup_num = pta.sup_num and
			pv.prop_id = pta.prop_id
			join (select distinct year, tax_district_id, tax_area_id from  
				tax_area_fund_assoc with (nolock)) as tafa
			on pta.year = tafa.year and
			pta.tax_area_id = tafa.tax_area_id
			join tax_district as td with (nolock)
			on tafa.tax_district_id = td.tax_district_id
			
			create index idx__clientdb_property_tax_district_assoc 
			on _clientdb_property_tax_district_assoc(prop_val_yr, prop_id, tax_district_cd)

			-- find sales with multi properties
			select 
				   chg_of_owner_id 
			  into #tmpDups
			  from _clientdb_sales
			group by chg_of_owner_id
				having count(*) > 1

			create index idx_tmp  on #tmpDups(chg_of_owner_id)

			-- update multi_prop_sale value 
			update h
			   set multi_prop_sale = 1  
			from _clientdb_sales h
				 join 
				 #tmpDups as dups
			on h.chg_of_owner_id = dups.chg_of_owner_id


			-- clear and drop work tables
			drop table #tmpDups

			if object_id('_PA_buyers') is not null
			   begin 
			   truncate table _PA_buyers
			   drop table _PA_buyers
			   end
			if object_id('_PA_sellers') is not null
			   begin 
			   truncate table _PA_sellers
			   drop table _PA_sellers
			   end

			if object_id('_PA_owners') is not null
			   begin 
			   truncate table _PA_owners
			   drop table _PA_owners
			   end

			create index idx__clientdb_sales_sale_dt  on _clientdb_sales(sale_dt)
			CREATE CLUSTERED INDEX IX__clientdb_sales_multi_prop_sale ON dbo._clientdb_sales
			(
			prop_id,
			multi_prop_sale
			) ON [PRIMARY]
	
			--Sales Search
			insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
			set @start_date = getdate()
			
		end
		
		--create a new temp table and populate it
		if not exists (select name from sysobjects WHERE id = OBJECT_ID('#tables'))
		begin		
			create table #tables(tableName varchar(128), populateData bit, buildIndices bit)
		end
		else
		begin
			delete from #tables
		end
		
		insert into #tables(tableName, populateData)
		select szTableName, 0
		from table_cache_status with (nolock)
		
		-- New Tables for ALL regions
		insert into #tables(tableName, populateData)
			values ('pacs_config', 1)
			
		-- Populate for ALL regions
		update #tables
			set populateData = 1
			where tableName in ('pacs_system')
		
		-- Region specific tables
		if @region = @washington
		begin
			update #tables
			set populateData = 1
			where tableName in ('refund_type', 'bill_fee_code', 'fee_type', 'payout_agreement_type',
								'payout_agreement_status_code', 'payment_terms_type', 'imprv_type',
								'penalty_interest_frequency_type', 'penalty_interest_ref_date_type',
								'penalty_interest_ref_type', 'penalty_interest_type', 'tax_district',
								'tax_district_type', 'special_assessment_agency', 'payout_agreement_status_code',
								'payment_terms_type', 'tax_area', 'property_use', 'imprv_det_meth', 'dor_use_code',
								'holiday_schedule',	'special_assessment')
			
			insert into #tables(tableName, populateData)
				values ('bill', 0)
			insert into #tables(tableName, populateData)
				values ('bill_payments_due', 0)
			insert into #tables(tableName, populateData)
				values ('bill_payments_due', 0)
			insert into #tables(tableName, populateData)
				values ('levy_bill', 0)
			insert into #tables(tableName, populateData)
				values ('assessment_bill', 0)
			insert into #tables(tableName, populateData)
				values ('coll_transaction', 0)
			insert into #tables(tableName, populateData)
				values ('fee', 0)
			insert into #tables(tableName, populateData)
				values ('fee_payments_due', 0)
			insert into #tables(tableName, populateData)
				values ('payout_agreement_bill_assoc', 0)
			insert into #tables(tableName, populateData)
				values ('payout_agreement_fee_assoc', 0)
			insert into #tables(tableName, populateData)
				values ('payout_agreement', 0)
			insert into #tables(tableName, populateData)
				values ('payout_agreement_schedule', 0)
			insert into #tables(tableName, populateData)
				values ('special_assessment_statement_options', 0)
			insert into #tables(tableName, populateData)
				values ('trans_group', 0)
			insert into #tables(tableName, populateData)
				values ('next_unique_id', 0)
			insert into #tables(tableName, populateData)
				values ('user_input_query', 0)
			insert into #tables(tableName, populateData)
				values ('user_input_query_idlist', 0)
			insert into #tables(tableName, populateData)
				values ('pending_coll_transaction', 0)
			insert into #tables(tableName, populateData)
				values ('tax_due_calc_list', 0)
			insert into #tables(tableName, populateData)
				values ('tax_due_calc_bill', 0)
			insert into #tables(tableName, populateData)
				values ('tax_due_calc_bill_payments_due', 0)
			insert into #tables(tableName, populateData)
				values ('tax_due_calc_fee', 0)
			insert into #tables(tableName, populateData)
				values ('tax_due_calc_fee_payments_due', 0)
			insert into #tables(tableName, populateData)
				values ('bill_fee_assoc', 1)
			insert into #tables(tableName, populateData)
				values ('fee_prop_assoc', 1)
			insert into #tables(tableName, populateData)
				values ('reet_fee_assoc', 0)
			insert into #tables(tableName, populateData)
				values ('fee_acct_assoc', 0)
			insert into #tables(tableName, populateData)
				values ('property', 1)
			insert into #tables(tableName, populateData)
				values ('levy_link', 1)
			insert into #tables(tableName, populateData)
				values ('next_unique_id', 1)	
			insert into #tables(tableName, populateData)
				values ('property_payout_agreement', 1)	
			insert into #tables(tableName, populateData)
				values ('payment_transaction_assoc', 0)	
			insert into #tables(tableName, populateData)
				values ('payment', 0)
			insert into #tables(tableName, populateData)
				values ('core_config', 1)
			insert into #tables(tableName, populateData)
				values ('imprv_det_sub_class', 1)
			insert into #tables(tableName, populateData)
				values ('_clientdb_sales', 1)	
			insert into #tables(tableName, populateData)
				values ('_clientdb_property_tax_district_assoc', 1)
			insert into #tables(tableName, populateData)
				values ('chg_of_owner_prop_assoc', 1)		
			insert into #tables(tableName, populateData)
				values ('seller_assoc', 1)
			insert into #tables(tableName, populateData)
				values ('buyer_assoc', 1)
			insert into #tables(tableName, populateData)
				values ('_clientdb_deed_history_detail', 1)
			insert into #tables(tableName, populateData)
				values ('_clientdb_improvement_building_detail', 1)
			insert into #tables(tableName, populateData)
				values ('_clientdb_land_detail', 1)		
			insert into #tables(tableName, populateData)
				values ('_clientdb_roll_value_history_detail', 1)
			insert into #tables(tableName, populateData)
				values ('security_fields', 1)
			insert into #tables(tableName, populateData)
				values ('_clientdb_property', 1)
			insert into #tables(tableName, populateData)
				values ('pacs_user', 1)
			insert into #tables(tableName, populateData)
				values ('user_right_user_assoc', 1)
			insert into #tables(tableName, populateData)
				values ('user_role_user_assoc', 1)
			insert into #tables(tableName, populateData)
				values ('user_role_right_assoc', 1)
			insert into #tables(tableName, populateData)
				values ('user_role', 1)
							
			if @township_enabled = 1
			begin
				insert into #tables(tableName, populateData)
					values ('township', 1)
				insert into #tables(tableName, populateData)
					values ('prop_range', 1)
			end	
		end
		
		DECLARE @szTableName varchar(128)
		DECLARE @szKeys varchar(8000)
		DECLARE @szIndexes varchar(8000)
		DECLARE @buildData bit
		DECLARE @buildIndices bit
		DECLARE tabe_cache CURSOR READ_ONLY
		FOR
			SELECT distinct tableName, populateData
			FROM #tables
		OPEN tabe_cache

		FETCH NEXT FROM tabe_cache
		INTO @szTableName, @buildData

		WHILE @@FETCH_STATUS = 0
		BEGIN
			set @sql2 = '';
			exec sp_ScriptTable @szTableName, @sql2 output, @sql output
			exec sp_ScriptSingleTableIndexes @szTableName, @szIndexes output
			exec sp_ScriptSingleTablePrimaryKey @szTableName, @szKeys output 
			if len(@sql2) > 0
			begin
				set @start_date = getdate()
				set @status = 'From OLTP: ' + @szTableName
				set @sql = 'use ' + @input_database_name + ' ' 
				set @sql = @sql + '
				if not exists (select name from sysobjects WHERE id = OBJECT_ID('''+ @szTableName + '''))
				begin ' + @sql2 + '
				end'
				print 'Creating web_internet table: ' + @szTableName
				exec (@sql)

				if @buildData = 1
				begin
					set @sql = 'insert into ' + @input_database_name + '.dbo.' + @szTableName + '
								select * from ' + @szTableName + ' with (nolock)'
					exec(@sql)
					
					set @sql = 'use ' + @input_database_name + ' ;checkpoint'
					exec (@sql)
				end			
								
				set @sql = 'use ' + @input_database_name + ' ' + @szKeys
				exec (@sql)
				
				set @sql = 'use ' + @input_database_name + ' ' + @szIndexes
				exec (@sql)
				
				insert into _clientdb_log (id, start_dt, finish_dt, status, error)
				values (@log_id, @start_date, getdate(), @status, @@error)
			end
				
			FETCH NEXT FROM tabe_cache
			INTO @szTableName, @buildData

		END

		CLOSE tabe_cache
		DEALLOCATE tabe_cache
	
		if exists (select name from sysobjects WHERE id = OBJECT_ID('#tables'))
		begin
			drop table #tables
		end
		
		--app exception log
		set @status = 'app_exception_log'
		set @sql = @input_database_name + '.dbo.sp_executesql N''
		
			CREATE TABLE app_exception_log (
				id int IDENTITY(1,1) NOT NULL,
				date_exception datetime NOT NULL,
				machine_name varchar(23) NOT NULL,
				app_login_id int NOT NULL,
				dll_class_method varchar(255) NULL,
				transaction_id bigint NULL,
				transaction_input_params varbinary(max) NULL,
				exception_data varbinary(max) NOT NULL,
				exception_text1 varchar(max) NOT NULL,
				exception_text2 varchar(max) NOT NULL,
				exception_text3 varchar(max) NOT NULL,
				exception_text4 varchar(max) NOT NULL,
				exception_callstack varchar(max) NOT NULL,
				app_state varchar(max) NULL,
				exception_type varchar(max) NULL,
				app_name varchar(max) NULL,
				server_local_date_exception datetime NOT NULL,
				client_app_version varchar(max) NULL,
				CONSTRAINT CPK_app_exception_log PRIMARY KEY  CLUSTERED (id ASC)
			)'''
		exec (@sql)

		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
		
		print 'Done Creating Middle Tier Specific Tables'
		-- 9.0 MT Stuff		


		/*
		 * Create views
		 */

		set @status = 'clientdb_subdivision_vw'
		set @sql = @input_database_name + '.dbo.sp_executesql N''
			create view dbo.clientdb_subdivision_vw
			as
			select abs_subdv_ind, rtrim(abs_subdv_cd) as code, abs_subdv_desc as description
			from _clientdb_abs_subdv with (nolock) '''
		exec(@sql)

		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()

		set @status = 'clientdb_neighborhood_vw'
		set @sql = @input_database_name + '.dbo.sp_executesql N''
			create view dbo.clientdb_neighborhood_vw
			as
			select rtrim(hood_cd) as code, hood_name as description
			from _clientdb_neighborhood	with (nolock) '''
		exec(@sql)

		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
		
		set @status = 'clientdb_property_vw'
		set @sql = @input_database_name + '.dbo.sp_executesql N''
			create view dbo.clientdb_property_vw
			as
			select p.*, a.web_suppression, a.confidential_flag, y.certification_dt, 
				case when tmpvw.prop_id is null then 1 else 0 end as all_taxes_paid,
				sale.sale_date,
				ts.township_desc as township, rr.range_desc as Range
			from _clientdb_property as p with (nolock)
			join _clientdb_pacs_year as y	with (nolock)
			on p.prop_val_yr = y.tax_yr
			join account as a	with (nolock)
			on a.acct_id=p.owner_id
			left outer join (
				select distinct prop_id
				from bill with (nolock)
				where isnull(taxes_paid,0) = 0
			) as tmpvw on tmpvw.prop_id = p.prop_id
			left outer join (
				select sale_date, prop_id 
				from _clientdb_deed_history_detail with (nolock) 
				where seq_num = 0
			) as sale on sale.prop_id = p.prop_id
			left join township as ts with (nolock)
			on p.township_code = ts.township_code
			and p.prop_val_yr = ts.township_year
			left join prop_range rr with (nolock)
			on p.range_code = rr.range_code
			and	p.prop_val_yr = rr.range_year
			
			where 
				(a.web_suppression = ''''0'''' or a.web_suppression Is Null) '''
		exec(@sql)
		
		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
		
		set @status = 'property_leased_land_vw'
		set @sql = @input_database_name + '.dbo.sp_executesql N''
			CREATE VIEW dbo.property_leased_land_vw
			AS
			SELECT DISTINCT
				p.prop_id,
				p.prop_val_yr,
				is_leased_land_property
			from _clientdb_property as p with (nolock) '''
		exec(@sql)
		
		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
		
		set @status = 'clientdb_taxing_jurisdiction_detail_vw'
		set @sql = @input_database_name + '.dbo.sp_executesql N''
			create view dbo.clientdb_taxing_jurisdiction_detail_vw
			as
			select t.*, y.certification_dt, max_freeze, a.confidential_flag, 
			ta.tax_area_number + '''' - '''' + ta.tax_area_description as tax_area 
			from _clientdb_taxing_jurisdiction_detail as t with (nolock) 
			join (select prop_id, sup_yr, max(isnull(freeze_ceiling,-1)) as max_freeze
				from _clientdb_taxing_jurisdiction_detail with (nolock) group  by prop_id, sup_yr) 
			as t1  on
			t.prop_id = t1.prop_id and
			t.sup_yr = t1.sup_yr
			join _clientdb_pacs_year as y	with (nolock)
			on t.sup_yr = y.tax_yr
			join account as a	with (nolock)
			on a.acct_id=t.owner_id
			left join tax_area as ta 	with (nolock)
			on t.tax_area_id = ta.tax_area_id   '''
		exec(@sql)

		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
		
		set @status = 'clientdb_roll_value_history_detail_vw'
		set @sql = @input_database_name + '.dbo.sp_executesql N''
			create view dbo.clientdb_roll_value_history_detail_vw
			as
			select r.*, y.certification_dt
			from _clientdb_roll_value_history_detail as r	with (nolock)
			join _clientdb_pacs_year as y	with (nolock)
			on r.prop_val_yr = y.tax_yr '''
		exec(@sql)

		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
		
		set @status = 'clientdb_map_vw'
		set @sql = @input_database_name + '.dbo.sp_executesql N''
			create view clientdb_map_vw
			as
			select prop_id,
				prop_val_yr,
				geo_id,
				prop_type_cd,
				prop_type_desc,
				dba_name,
				case when y.certification_dt is null then ''''N/A'''' when ISNULL(p.show_values,''''T'''') = ''''F'''' then ''''N/A'''' else ''''$'''' + convert(varchar(20), appraised_val) end as appraised_val,
				abs_subdv_cd,
				mapsco,
				map_id,
				agent_cd,
				hood_cd,
				hood_name,
				owner_name,
				owner_id,
				pct_ownership,
				exemptions,
				state_cd,
				legal_desc,
				replace(replace(replace(situs_display, char(10), ''''''''), char(13), '''' ''''), ''''  '''', '''' '''') as situs,
				jurisdictions
			from _clientdb_property as p with (nolock)
			join _clientdb_pacs_year as y	with (nolock)
			on p.prop_val_yr = y.tax_yr '''
		exec(@sql)
		
		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()

		set @status = 'clientdb_map_export_vw'
		set @sql = @input_database_name + '.dbo.sp_executesql N''
			create view clientdb_map_export_vw
		as
		select prop_id,
			prop_val_yr,
			geo_id,
			prop_type_cd,
			prop_type_desc,
			convert(varchar(50), replace(replace(dba_name, ''''&'''', ''''&amp;''''), '''''''''''''''', ''''&apos;'''')) as dba_name,
			case when y.certification_dt is null then ''''N/A'''' when ISNULL(p.show_values,''''T'''') = ''''F'''' then ''''N/A'''' else ''''$'''' + convert(varchar(20), appraised_val) end as appraised_val,
			abs_subdv_cd,
			mapsco,
			map_id,
			agent_cd,
			hood_cd,
			convert(varchar(50), replace(replace(hood_name, ''''&'''', ''''&amp;''''), '''''''''''''''', ''''&apos;'''')) as hood_name,
			convert(varchar(80), replace(replace(owner_name, ''''&'''', ''''&amp;''''), '''''''''''''''', ''''&apos;'''')) as owner_name,
			owner_id,
			pct_ownership,
			exemptions,
			state_cd,
			convert(varchar(255), replace(replace(replace(replace(legal_desc, ''''&'''', ''''&amp;''''), '''''''''''''''', ''''&apos;''''), ''''"'''', ''''&quot;''''), ''''<'''', ''''&lt;'''')) as legal_desc,
			convert(varchar(255), replace(replace(replace(situs_display, char(10), ''''''''), char(13), '''' ''''), ''''  '''', '''' '''')) as situs,
			jurisdictions,
			convert(varchar(80), replace(replace(addr_line1, ''''&'''', ''''&amp;''''), '''''''''''''''', ''''&apos;'''')) as owner_address1,
			convert(varchar(80), replace(replace(addr_line2, ''''&'''', ''''&amp;''''), '''''''''''''''', ''''&apos;'''')) as owner_address2,
			convert(varchar(80), replace(replace(addr_line3, ''''&'''', ''''&amp;''''), '''''''''''''''', ''''&apos;'''')) as owner_address3,
			convert(varchar(80), replace(replace(addr_city, ''''&'''', ''''&amp;''''), '''''''''''''''', ''''&apos;'''')) as city,
			convert(varchar(20), replace(replace(addr_state, ''''&'''', ''''&amp;''''), '''''''''''''''', ''''&apos;'''')) as state,
			convert(varchar(20), replace(replace(addr_zip, ''''&'''', ''''&amp;''''), '''''''''''''''', ''''&apos;'''')) as zip,
			convert(varchar(20), rtrim(replace(replace(country_cd, ''''&'''', ''''&amp;''''), '''''''''''''''', ''''&apos;''''))) as country
		from _clientdb_property as p with (nolock)
		join _clientdb_pacs_year as y	with (nolock)
		on p.prop_val_yr = y.tax_yr '''
		exec(@sql)

		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()

		set @status = 'clientdb_exmpt_type_vw'
		set @sql = @input_database_name + '.dbo.sp_executesql N''
			create view dbo.clientdb_exmpt_type_vw
			as
			select rtrim(exmpt_type_cd) as code, exmpt_desc as description
			from ' + @input_database_name + '.dbo._clientdb_exmpt_type with (nolock) '''
			exec(@sql)

		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
		
		set @status = '[fee_property_vw]'
		set @sql = @input_database_name + '.dbo.sp_executesql N''
				create view [dbo].[fee_property_vw]
				as
				select bfa.fee_id, b.prop_id
				from bill_fee_assoc as bfa with(nolock)
				join bill as b with(nolock) on
					b.bill_id = bfa.bill_id 
				
				union 
				
				select fee_id, prop_id
				from fee_prop_assoc as fpa with(nolock)
				
					'''
		exec(@sql)
			
		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
		
		--*****************************************************************************

	-- Stop: Create all tables, views and procedures
	--*****************************************************************************
	print 'Create all tables, views and procedures...'
	if @region = @texas
	begin
		set @start_date = getdate()
		--Add necessary tax due procedures
		declare @sp_exists varchar(2000)
		declare @sp_text1 varchar(8000)
		declare @sp_text2 varchar(8000)
		declare @sp_text3 varchar(8000)
		declare @sp_text4 varchar(8000)
		declare @sp_text5 varchar(8000)
		declare @sp_text6 varchar(8000)
		declare @sp_text7 varchar(8000)
		declare @sp_text8 varchar(8000)
		declare @sp_text9 varchar(8000)
		declare @sp_text10 varchar(8000)
		declare @procedure_index int

		set @status = 'GetPenaltyInterestRate'
		set @sp_text1 = ''
		set @sp_text2 = ''
		set @sp_text3 = ''
		set @sp_text4 = ''
		set @sp_text5 = ''
		set @sp_text6 = ''
		set @sp_text7 = ''
		set @sp_text8 = ''
		set @sp_text9 = ''
		set @sp_text10 = ''

		select @sp_text1 = case when colid = 1 then text else isnull(@sp_text1, '') end,
				@sp_text2 = case when colid = 2 then text else isnull(@sp_text2, '') end,
				@sp_text3 = case when colid = 3 then text else isnull(@sp_text3, '') end,
				@sp_text4 = case when colid = 4 then text else isnull(@sp_text4, '') end,
				@sp_text5 = case when colid = 5 then text else isnull(@sp_text5, '') end,
				@sp_text6 = case when colid = 6 then text else isnull(@sp_text6, '') end,
				@sp_text7 = case when colid = 7 then text else isnull(@sp_text7, '') end,
				@sp_text8 = case when colid = 8 then text else isnull(@sp_text8, '') end,
				@sp_text9 = case when colid = 9 then text else isnull(@sp_text9, '') end,
				@sp_text10 = case when colid = 10 then text else isnull(@sp_text10, '') end
		from syscomments
		with (nolock)
		where object_name(id) = 'GetPenaltyInterestRate'
		order by colid

		set @sp_text1 = replace(@sp_text1, '''', '''''')
		set @sp_text2 = replace(@sp_text2, '''', '''''')
		set @sp_text3 = replace(@sp_text3, '''', '''''')
		set @sp_text4 = replace(@sp_text4, '''', '''''')
		set @sp_text5 = replace(@sp_text5, '''', '''''')
		set @sp_text6 = replace(@sp_text6, '''', '''''')
		set @sp_text7 = replace(@sp_text7, '''', '''''')
		set @sp_text8 = replace(@sp_text8, '''', '''''')
		set @sp_text9 = replace(@sp_text9, '''', '''''')
		set @sp_text10 = replace(@sp_text10, '''', '''''')


		set @sp_exists = 'if exists(select id from syscomments where object_name(id) = ''''GetPenaltyInterestRate'''')' + char(13) + char(10)
		set @sp_exists = @sp_exists + 'drop procedure [GetPenaltyInterestRate]' + char(13) + char(10)
		set @sql = @input_database_name + '.dbo.sp_executesql N'''

		exec(@sql + @sp_exists + '''')

		set @sql = @input_database_name + '.dbo.sp_executesql N'''
		exec(@sql + @sp_text1 + @sp_text2 + @sp_text3 + @sp_text4 + @sp_text5 + @sp_text6 +
					@sp_text7 + @sp_text8 + @sp_text9 + @sp_text10 + '''')

		
		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
		
		set @status = 'GetQHBillPenaltyInterest'
		set @sp_text1 = ''
		set @sp_text2 = ''
		set @sp_text3 = ''
		set @sp_text4 = ''
		set @sp_text5 = ''
		set @sp_text6 = ''
		set @sp_text7 = ''
		set @sp_text8 = ''
		set @sp_text9 = ''
		set @sp_text10 = ''

		select @sp_text1 = case when colid = 1 then text else isnull(@sp_text1, '') end,
				@sp_text2 = case when colid = 2 then text else isnull(@sp_text2, '') end,
				@sp_text3 = case when colid = 3 then text else isnull(@sp_text3, '') end,
				@sp_text4 = case when colid = 4 then text else isnull(@sp_text4, '') end,
				@sp_text5 = case when colid = 5 then text else isnull(@sp_text5, '') end,
				@sp_text6 = case when colid = 6 then text else isnull(@sp_text6, '') end,
				@sp_text7 = case when colid = 7 then text else isnull(@sp_text7, '') end,
				@sp_text8 = case when colid = 8 then text else isnull(@sp_text8, '') end,
				@sp_text9 = case when colid = 9 then text else isnull(@sp_text9, '') end,
				@sp_text10 = case when colid = 10 then text else isnull(@sp_text10, '') end
		from syscomments
		with (nolock)
		where object_name(id) = 'GetQHBillPenaltyInterest'
		order by colid

		set @sp_text1 = replace(@sp_text1, '''', '''''')
		set @sp_text2 = replace(@sp_text2, '''', '''''')
		set @sp_text3 = replace(@sp_text3, '''', '''''')
		set @sp_text4 = replace(@sp_text4, '''', '''''')
		set @sp_text5 = replace(@sp_text5, '''', '''''')
		set @sp_text6 = replace(@sp_text6, '''', '''''')
		set @sp_text7 = replace(@sp_text7, '''', '''''')
		set @sp_text8 = replace(@sp_text8, '''', '''''')
		set @sp_text9 = replace(@sp_text9, '''', '''''')
		set @sp_text10 = replace(@sp_text10, '''', '''''')


		set @sp_exists = 'if exists(select id from syscomments where object_name(id) = ''''GetQHBillPenaltyInterest'''')' + char(13) + char(10)
		set @sp_exists = @sp_exists + 'drop procedure [GetQHBillPenaltyInterest]' + char(13) + char(10)
		set @sql = @input_database_name + '.dbo.sp_executesql N'''

		exec(@sql + @sp_exists + '''')

		set @sql = @input_database_name + '.dbo.sp_executesql N'''
		exec(@sql + @sp_text1 + @sp_text2 + @sp_text3 + @sp_text4 + @sp_text5 + @sp_text6 +
					@sp_text7 + @sp_text8 + @sp_text9 + @sp_text10 + '''')

		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()

		set @status = 'GetPenaltyInterest'
		set @sp_text1 = ''
		set @sp_text2 = ''
		set @sp_text3 = ''
		set @sp_text4 = ''
		set @sp_text5 = ''
		set @sp_text6 = ''
		set @sp_text7 = ''
		set @sp_text8 = ''
		set @sp_text9 = ''
		set @sp_text10 = ''

		select @sp_text1 = case when colid = 1 then text else isnull(@sp_text1, '') end,
				@sp_text2 = case when colid = 2 then text else isnull(@sp_text2, '') end,
				@sp_text3 = case when colid = 3 then text else isnull(@sp_text3, '') end,
				@sp_text4 = case when colid = 4 then text else isnull(@sp_text4, '') end,
				@sp_text5 = case when colid = 5 then text else isnull(@sp_text5, '') end,
				@sp_text6 = case when colid = 6 then text else isnull(@sp_text6, '') end,
				@sp_text7 = case when colid = 7 then text else isnull(@sp_text7, '') end,
				@sp_text8 = case when colid = 8 then text else isnull(@sp_text8, '') end,
				@sp_text9 = case when colid = 9 then text else isnull(@sp_text9, '') end,
				@sp_text10 = case when colid = 10 then text else isnull(@sp_text10, '') end
		from syscomments
		with (nolock)
		where object_name(id) = 'GetPenaltyInterest'
		order by colid

		set @sp_text1 = replace(@sp_text1, '''', '''''')
		set @sp_text2 = replace(@sp_text2, '''', '''''')
		set @sp_text3 = replace(@sp_text3, '''', '''''')
		set @sp_text4 = replace(@sp_text4, '''', '''''')
		set @sp_text5 = replace(@sp_text5, '''', '''''')
		set @sp_text6 = replace(@sp_text6, '''', '''''')
		set @sp_text7 = replace(@sp_text7, '''', '''''')
		set @sp_text8 = replace(@sp_text8, '''', '''''')
		set @sp_text9 = replace(@sp_text9, '''', '''''')
		set @sp_text10 = replace(@sp_text10, '''', '''''')


		set @sp_exists = 'if exists(select id from syscomments where object_name(id) = ''''GetPenaltyInterest'''')' + char(13) + char(10)
		set @sp_exists = @sp_exists + 'drop procedure [GetPenaltyInterest]' + char(13) + char(10)
		set @sql = @input_database_name + '.dbo.sp_executesql N'''

		exec(@sql + @sp_exists + '''')

		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()

		set @sql = @input_database_name + '.dbo.sp_executesql N'''
		exec(@sql + @sp_text1 + @sp_text2 + @sp_text3 + @sp_text4 + @sp_text5 + @sp_text6 +
					@sp_text7 + @sp_text8 + @sp_text9 + @sp_text10 + '''')

		set @status = 'GetBillTaxDue'
		set @sp_text1 = ''
		set @sp_text2 = ''
		set @sp_text3 = ''
		set @sp_text4 = ''
		set @sp_text5 = ''
		set @sp_text6 = ''
		set @sp_text7 = ''
		set @sp_text8 = ''
		set @sp_text9 = ''
		set @sp_text10 = ''

		select @sp_text1 = case when colid = 1 then text else isnull(@sp_text1, '') end,
				@sp_text2 = case when colid = 2 then text else isnull(@sp_text2, '') end,
				@sp_text3 = case when colid = 3 then text else isnull(@sp_text3, '') end,
				@sp_text4 = case when colid = 4 then text else isnull(@sp_text4, '') end,
				@sp_text5 = case when colid = 5 then text else isnull(@sp_text5, '') end,
				@sp_text6 = case when colid = 6 then text else isnull(@sp_text6, '') end,
				@sp_text7 = case when colid = 7 then text else isnull(@sp_text7, '') end,
				@sp_text8 = case when colid = 8 then text else isnull(@sp_text8, '') end,
				@sp_text9 = case when colid = 9 then text else isnull(@sp_text9, '') end,
				@sp_text10 = case when colid = 10 then text else isnull(@sp_text10, '') end
		from syscomments
		with (nolock)
		where object_name(id) = 'GetBillTaxDue'
		order by colid

		set @sp_text1 = replace(@sp_text1, '''', '''''')
		set @sp_text2 = replace(@sp_text2, '''', '''''')
		set @sp_text3 = replace(@sp_text3, '''', '''''')
		set @sp_text4 = replace(@sp_text4, '''', '''''')
		set @sp_text5 = replace(@sp_text5, '''', '''''')
		set @sp_text6 = replace(@sp_text6, '''', '''''')
		set @sp_text7 = replace(@sp_text7, '''', '''''')
		set @sp_text8 = replace(@sp_text8, '''', '''''')
		set @sp_text9 = replace(@sp_text9, '''', '''''')
		set @sp_text10 = replace(@sp_text10, '''', '''''')


		set @sp_exists = 'if exists(select id from syscomments where object_name(id) = ''''GetBillTaxDue'''')' + char(13) + char(10)
		set @sp_exists = @sp_exists + 'drop procedure [GetBillTaxDue]' + char(13) + char(10)
		set @sql = @input_database_name + '.dbo.sp_executesql N'''

		exec(@sql + @sp_exists + '''')

		set @sql = @input_database_name + '.dbo.sp_executesql N'''
		exec(@sql + @sp_text1 + @sp_text2 + @sp_text3 + @sp_text4 + @sp_text5 + @sp_text6 +
					@sp_text7 + @sp_text8 + @sp_text9 + @sp_text10 + '''')

		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()

		set @status = 'PopulatePropertyAccessBills'
		set @sp_text1 = ''
		set @sp_text2 = ''
		set @sp_text3 = ''
		set @sp_text4 = ''
		set @sp_text5 = ''
		set @sp_text6 = ''
		set @sp_text7 = ''
		set @sp_text8 = ''
		set @sp_text9 = ''
		set @sp_text10 = ''

		select @sp_text1 = case when colid = 1 then text else isnull(@sp_text1, '') end,
				@sp_text2 = case when colid = 2 then text else isnull(@sp_text2, '') end,
				@sp_text3 = case when colid = 3 then text else isnull(@sp_text3, '') end,
				@sp_text4 = case when colid = 4 then text else isnull(@sp_text4, '') end,
				@sp_text5 = case when colid = 5 then text else isnull(@sp_text5, '') end,
				@sp_text6 = case when colid = 6 then text else isnull(@sp_text6, '') end,
				@sp_text7 = case when colid = 7 then text else isnull(@sp_text7, '') end,
				@sp_text8 = case when colid = 8 then text else isnull(@sp_text8, '') end,
				@sp_text9 = case when colid = 9 then text else isnull(@sp_text9, '') end,
				@sp_text10 = case when colid = 10 then text else isnull(@sp_text10, '') end
		from syscomments
		with (nolock)
		where object_name(id) = 'PopulatePropertyAccessBills'
		order by colid

		set @sp_text1 = replace(@sp_text1, '''', '''''')
		set @sp_text2 = replace(@sp_text2, '''', '''''')
		set @sp_text3 = replace(@sp_text3, '''', '''''')
		set @sp_text4 = replace(@sp_text4, '''', '''''')
		set @sp_text5 = replace(@sp_text5, '''', '''''')
		set @sp_text6 = replace(@sp_text6, '''', '''''')
		set @sp_text7 = replace(@sp_text7, '''', '''''')
		set @sp_text8 = replace(@sp_text8, '''', '''''')
		set @sp_text9 = replace(@sp_text9, '''', '''''')
		set @sp_text10 = replace(@sp_text10, '''', '''''')


		set @sp_exists = 'if exists(select id from syscomments where object_name(id) = ''''PopulatePropertyAccessBills'''')' + char(13) + char(10)
		set @sp_exists = @sp_exists + 'drop procedure [PopulatePropertyAccessBills]' + char(13) + char(10)
		set @sql = @input_database_name + '.dbo.sp_executesql N'''

		exec(@sql + @sp_exists + '''')

		set @sql = @input_database_name + '.dbo.sp_executesql N'''
		exec(@sql + @sp_text1 + @sp_text2 + @sp_text3 + @sp_text4 + @sp_text5 + @sp_text6 +
					@sp_text7 + @sp_text8 + @sp_text9 + @sp_text10 + '''')

		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)


	end -- only for texas

	if @region = @washington
	begin
		set @start_date = getdate()
		set @status = 'GetUniqueID'
		--Add necessary tax due procedures
		set @sp_text1 = ''
		set @sp_text2 = ''
		set @sp_text3 = ''
		set @sp_text4 = ''
		set @sp_text5 = ''
		set @sp_text6 = ''
		set @sp_text7 = ''
		set @sp_text8 = ''
		set @sp_text9 = ''
		set @sp_text10 = ''

		select @sp_text1 = case when colid = 1 then text else isnull(@sp_text1, '') end,
				@sp_text2 = case when colid = 2 then text else isnull(@sp_text2, '') end,
				@sp_text3 = case when colid = 3 then text else isnull(@sp_text3, '') end,
				@sp_text4 = case when colid = 4 then text else isnull(@sp_text4, '') end,
				@sp_text5 = case when colid = 5 then text else isnull(@sp_text5, '') end,
				@sp_text6 = case when colid = 6 then text else isnull(@sp_text6, '') end,
				@sp_text7 = case when colid = 7 then text else isnull(@sp_text7, '') end,
				@sp_text8 = case when colid = 8 then text else isnull(@sp_text8, '') end,
				@sp_text9 = case when colid = 9 then text else isnull(@sp_text9, '') end,
				@sp_text10 = case when colid = 10 then text else isnull(@sp_text10, '') end
		from syscomments
		with (nolock)
		where object_name(id) = 'GetUniqueID'
		order by colid


		set @sp_text1 = replace(@sp_text1, '''', '''''')
		set @sp_text2 = replace(@sp_text2, '''', '''''')
		set @sp_text3 = replace(@sp_text3, '''', '''''')
		set @sp_text4 = replace(@sp_text4, '''', '''''')
		set @sp_text5 = replace(@sp_text5, '''', '''''')
		set @sp_text6 = replace(@sp_text6, '''', '''''')
		set @sp_text7 = replace(@sp_text7, '''', '''''')
		set @sp_text8 = replace(@sp_text8, '''', '''''')
		set @sp_text9 = replace(@sp_text9, '''', '''''')
		set @sp_text10 = replace(@sp_text10, '''', '''''')


		set @sp_exists = 'if exists(select id from syscomments where object_name(id) = ''''GetUniqueID'''')' + char(13) + char(10)
		set @sp_exists = @sp_exists + 'drop procedure [GetUniqueID]' + char(13) + char(10)
		set @sql = @input_database_name + '.dbo.sp_executesql N'''

		exec(@sql + @sp_exists + '''')
		
		set @sql = @input_database_name + '.dbo.sp_executesql N'''
		exec(@sql + @sp_text1 + @sp_text2 + @sp_text3 + @sp_text4 + @sp_text5 + @sp_text6 +
					@sp_text7 + @sp_text8 + @sp_text9 + @sp_text10 + '''')

		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()

		--GetUniqueIDRS
		set @status = 'GetUniqueIDRS'
		set @sp_text1 = ''
		set @sp_text2 = ''
		set @sp_text3 = ''
		set @sp_text4 = ''
		set @sp_text5 = ''
		set @sp_text6 = ''
		set @sp_text7 = ''
		set @sp_text8 = ''
		set @sp_text9 = ''
		set @sp_text10 = ''

		select @sp_text1 = case when colid = 1 then text else isnull(@sp_text1, '') end,
				@sp_text2 = case when colid = 2 then text else isnull(@sp_text2, '') end,
				@sp_text3 = case when colid = 3 then text else isnull(@sp_text3, '') end,
				@sp_text4 = case when colid = 4 then text else isnull(@sp_text4, '') end,
				@sp_text5 = case when colid = 5 then text else isnull(@sp_text5, '') end,
				@sp_text6 = case when colid = 6 then text else isnull(@sp_text6, '') end,
				@sp_text7 = case when colid = 7 then text else isnull(@sp_text7, '') end,
				@sp_text8 = case when colid = 8 then text else isnull(@sp_text8, '') end,
				@sp_text9 = case when colid = 9 then text else isnull(@sp_text9, '') end,
				@sp_text10 = case when colid = 10 then text else isnull(@sp_text10, '') end
		from syscomments
		with (nolock)
		where object_name(id) = 'GetUniqueIDRS'
		order by colid

		set @sp_text1 = replace(@sp_text1, '''', '''''')
		set @sp_text2 = replace(@sp_text2, '''', '''''')
		set @sp_text3 = replace(@sp_text3, '''', '''''')
		set @sp_text4 = replace(@sp_text4, '''', '''''')
		set @sp_text5 = replace(@sp_text5, '''', '''''')
		set @sp_text6 = replace(@sp_text6, '''', '''''')
		set @sp_text7 = replace(@sp_text7, '''', '''''')
		set @sp_text8 = replace(@sp_text8, '''', '''''')
		set @sp_text9 = replace(@sp_text9, '''', '''''')
		set @sp_text10 = replace(@sp_text10, '''', '''''')


		set @sp_exists = 'if exists(select id from syscomments where object_name(id) = ''''GetUniqueIDRS'''')' + char(13) + char(10)
		set @sp_exists = @sp_exists + 'drop procedure [GetUniqueIDRS]' + char(13) + char(10)
		set @sql = @input_database_name + '.dbo.sp_executesql N'''

		exec(@sql + @sp_exists + '''')
		
		set @sql = @input_database_name + '.dbo.sp_executesql N'''
		exec(@sql + @sp_text1 + @sp_text2 + @sp_text3 + @sp_text4 + @sp_text5 + @sp_text6 +
					@sp_text7 + @sp_text8 + @sp_text9 + @sp_text10 + '''')
		
		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
				
		-- Sales Search
		set @status = 'PA_GetSaleInfo'		
		set @sp_text1 = ''
		set @sp_text2 = ''
		set @sp_text3 = ''
		set @sp_text4 = ''
		set @sp_text5 = ''
		set @sp_text6 = ''
		set @sp_text7 = ''
		set @sp_text8 = ''
		set @sp_text9 = ''
		set @sp_text10 = ''

		select @sp_text1 = case when colid = 1 then text else isnull(@sp_text1, '') end,
				@sp_text2 = case when colid = 2 then text else isnull(@sp_text2, '') end,
				@sp_text3 = case when colid = 3 then text else isnull(@sp_text3, '') end,
				@sp_text4 = case when colid = 4 then text else isnull(@sp_text4, '') end,
				@sp_text5 = case when colid = 5 then text else isnull(@sp_text5, '') end,
				@sp_text6 = case when colid = 6 then text else isnull(@sp_text6, '') end,
				@sp_text7 = case when colid = 7 then text else isnull(@sp_text7, '') end,
				@sp_text8 = case when colid = 8 then text else isnull(@sp_text8, '') end,
				@sp_text9 = case when colid = 9 then text else isnull(@sp_text9, '') end,
				@sp_text10 = case when colid = 10 then text else isnull(@sp_text10, '') end
		from syscomments
		with (nolock)
		where object_name(id) = 'PA_GetSaleInfo'
		order by colid

		set @sp_text1 = replace(@sp_text1, '''', '''''')
		set @sp_text2 = replace(@sp_text2, '''', '''''')
		set @sp_text3 = replace(@sp_text3, '''', '''''')
		set @sp_text4 = replace(@sp_text4, '''', '''''')
		set @sp_text5 = replace(@sp_text5, '''', '''''')
		set @sp_text6 = replace(@sp_text6, '''', '''''')
		set @sp_text7 = replace(@sp_text7, '''', '''''')
		set @sp_text8 = replace(@sp_text8, '''', '''''')
		set @sp_text9 = replace(@sp_text9, '''', '''''')
		set @sp_text10 = replace(@sp_text10, '''', '''''')


		set @sp_exists = 'if exists(select id from syscomments where object_name(id) = ''''PA_GetSaleInfo'''')' + char(13) + char(10)
		set @sp_exists = @sp_exists + 'drop procedure [PA_GetSaleInfo]' + char(13) + char(10)
		set @sql = @input_database_name + '.dbo.sp_executesql N'''

		exec(@sql + @sp_exists + '''')
		
		set @sql = @input_database_name + '.dbo.sp_executesql N'''
		exec(@sql + @sp_text1 + @sp_text2 + @sp_text3 + @sp_text4 + @sp_text5 + @sp_text6 +
					@sp_text7 + @sp_text8 + @sp_text9 + @sp_text10 + '''')
		
		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
		
	
		set @status = 'fn_ReturnTableFromCommaSepValues'		
		set @sp_text1 = ''
		set @sp_text2 = ''
		set @sp_text3 = ''
		set @sp_text4 = ''
		set @sp_text5 = ''
		set @sp_text6 = ''
		set @sp_text7 = ''
		set @sp_text8 = ''
		set @sp_text9 = ''
		set @sp_text10 = ''

		select @sp_text1 = case when colid = 1 then text else isnull(@sp_text1, '') end,
				@sp_text2 = case when colid = 2 then text else isnull(@sp_text2, '') end,
				@sp_text3 = case when colid = 3 then text else isnull(@sp_text3, '') end,
				@sp_text4 = case when colid = 4 then text else isnull(@sp_text4, '') end,
				@sp_text5 = case when colid = 5 then text else isnull(@sp_text5, '') end,
				@sp_text6 = case when colid = 6 then text else isnull(@sp_text6, '') end,
				@sp_text7 = case when colid = 7 then text else isnull(@sp_text7, '') end,
				@sp_text8 = case when colid = 8 then text else isnull(@sp_text8, '') end,
				@sp_text9 = case when colid = 9 then text else isnull(@sp_text9, '') end,
				@sp_text10 = case when colid = 10 then text else isnull(@sp_text10, '') end
		from syscomments
		with (nolock)
		where object_name(id) = 'fn_ReturnTableFromCommaSepValues'
		order by colid

		set @sp_text1 = replace(@sp_text1, '''', '''''')
		set @sp_text2 = replace(@sp_text2, '''', '''''')
		set @sp_text3 = replace(@sp_text3, '''', '''''')
		set @sp_text4 = replace(@sp_text4, '''', '''''')
		set @sp_text5 = replace(@sp_text5, '''', '''''')
		set @sp_text6 = replace(@sp_text6, '''', '''''')
		set @sp_text7 = replace(@sp_text7, '''', '''''')
		set @sp_text8 = replace(@sp_text8, '''', '''''')
		set @sp_text9 = replace(@sp_text9, '''', '''''')
		set @sp_text10 = replace(@sp_text10, '''', '''''')


		set @sp_exists = 'if exists(select id from syscomments where object_name(id) = ''''fn_ReturnTableFromCommaSepValues'''')' + char(13) + char(10)
		set @sp_exists = @sp_exists + 'drop function [fn_ReturnTableFromCommaSepValues]' + char(13) + char(10)
		set @sql = @input_database_name + '.dbo.sp_executesql N'''

		exec(@sql + @sp_exists + '''')
		
		set @sql = @input_database_name + '.dbo.sp_executesql N'''
		exec(@sql + @sp_text1 + @sp_text2 + @sp_text3 + @sp_text4 + @sp_text5 + @sp_text6 +
					@sp_text7 + @sp_text8 + @sp_text9 + @sp_text10 + '''')
		
		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
		
		
		--Sales Search			
			
		--Create a Fake PopulatePropertyAccessBills sp
		--Create a Fake PopulatePropertyAccessBills sp
		set @status = 'Fake PopulatePropertyAccessBills'
		set @sql = '
		if exists (
			select name 
			from sysobjects 
			WHERE id = OBJECT_ID(''PopulatePropertyAccessBills''))
		begin
			drop procedure PopulatePropertyAccessBills
		end'
		exec(@sql)

		set @sql = '
		CREATE PROCEDURE [dbo].[PopulatePropertyAccessBills]
		@input_prop_id      		int,
		@input_effective_date        	varchar(10),
		@input_year			int = 0,
		@input_total_due		bit = 0
		AS
			set nocount on
		'
		exec(@sql)
		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
				values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()

	end

	--Copy tables to the new database
	print 'Copy tables to the new database...'
	
	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()
	
	print 'Populating _clientdb_township_section'
	set @status = 'Copy _clientdb_township_section'
	set @sql = 'select distinct township_section into ' + @input_database_name + '.dbo._clientdb_township_section from _clientdb_property'
	exec(@sql)

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()
	
	print 'Populating _clientdb_street_name'
	set @status = 'Copy _clientdb_street_name'
	
	set @sql = '
	select distinct street = 
		ltrim(rtrim(
		(case 
			when isnull([situs_street_prefx],'''') = '''' then '''' 
			else rtrim(ltrim([situs_street_prefx]))+'' '' 
		end) +
		(case 
			when [situs_street] IS NULL then '''' 
			else rtrim(ltrim([situs_street]))+'' '' 
		end)+
		(case 
			when [situs_street_sufix] IS NULL then '''' 
			else rtrim(ltrim([situs_street_sufix]))
		end)
		))
	into ' 
	set @sql = @sql + @input_database_name + '.dbo._clientdb_street_name from situs with (nolock) where situs_street is not null'
	exec(@sql)

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()
	
	print 'Populating _clientdb_city'
	set @status = 'Copy _clientdb_city'
	set @sql = 'select distinct city = cast(situs_city as varchar) into ' 
	set @sql = @sql + @input_database_name + '.dbo._clientdb_city from situs with (nolock) where situs_city is not null'
	exec(@sql)

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()


	print 'Populating _clientdb_improvement_features'
	set @status = 'Copy _clientdb_improvement_features'
	set @sql = 'insert ' + @input_database_name + '.dbo._clientdb_improvement_features select * from _clientdb_improvement_features'
	exec(@sql)

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()

	print 'Populating _clientdb_taxing_jurisdiction_detail'
	set @status = 'Copy _clientdb_taxing_jurisdiction_detail'
	set @sql = 'insert ' + @input_database_name + '.dbo._clientdb_taxing_jurisdiction_detail select * from _clientdb_taxing_jurisdiction_detail'
	exec(@sql)

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()
	
	print 'Populating _clientdb_values_detail'
	set @status = 'Copy _clientdb_values_detail'
	set @sql = 'insert ' + @input_database_name + '.dbo._clientdb_values_detail select * from _clientdb_values_detail'
	exec(@sql)

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()
	
	print 'Populating _clientdb_pacs_year'
	set @status = 'Copy _clientdb_pacs_year'
	set @sql = 'insert ' + @input_database_name + '.dbo._clientdb_pacs_year select * from _clientdb_pacs_year'
	exec(@sql)

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()
	
	print 'Populating _clientdb_imprv_det_sketch'
	set @status = 'Copy _clientdb_imprv_det_sketch'
	set @sql = 'insert ' + @input_database_name + '.dbo._clientdb_imprv_det_sketch select * from _clientdb_imprv_det_sketch'
	exec(@sql)

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()
	
	
	print 'Populating _clientdb_bill'
	set @status = 'Copy _clientdb_bill'
	if @region = @texas
	begin
		set @sql = 'insert ' + @input_database_name + '.dbo.bill select * from _clientdb_bill'
		exec(@sql)
	end

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()
	

	print 'Populating _clientdb_tax_rate'
	set @status = 'Copy _clientdb_tax_rate'
	set @sql = 'insert ' + @input_database_name + '.dbo.tax_rate select * from _clientdb_tax_rate'
	exec(@sql)

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()
		
	if @region = @texas
	begin
		print 'Populating _clientdb_payment'
		set @status = 'Copy _clientdb_payment'
		set @sql = 'insert ' + @input_database_name + '.dbo.payment select * from _clientdb_payment'
		exec(@sql)
		insert into _clientdb_log (id, start_dt, finish_dt, status, error)
				values (@log_id, @start_date, getdate(), @status, @@error)
		set @start_date = getdate()
	end

	
	
	print 'Populating _clientdb_payment_trans'
	set @status = 'Copy _clientdb_payment_trans'
	set @sql = 'insert ' + @input_database_name + '.dbo.payment_trans select * from _clientdb_payment_trans'
	exec(@sql)

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()
	
	print 'Populating _clientdb_refund_due_trans'
	set @status = 'Copy _clientdb_refund_due_trans'
	set @sql = 'insert ' + @input_database_name + '.dbo.refund_due_trans select * from _clientdb_refund_due_trans'
	exec(@sql)

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()


	print 'Populating _clientdb_bill_adjust_code'
	set @status = 'Copy _clientdb_bill_adjust_code'	
	set @sql = 'insert ' + @input_database_name + '.dbo.bill_adjust_code select * from _clientdb_bill_adjust_code'
	exec(@sql)

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()


	print 'Populating _clientdb_entity'
	set @status = 'Copy _clientdb_entity'
	set @sql = 'insert ' + @input_database_name + '.dbo.entity select * from _clientdb_entity'
	exec(@sql)

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()
	
	print 'Populating _clientdb_account'
	set @status = 'Copy _clientdb_account'
	set @sql = 'insert ' + @input_database_name + '.dbo.account select * from _clientdb_account'
	exec(@sql)

	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()
	
	/**********/
	--Add Indexes
	
	set @status = 'Adding Indexes'
	--  HS 55281 Kevin Lloyd - 
	set @sql = 'use ' + @input_database_name
	set @sql = @sql + '
		CREATE CLUSTERED INDEX IX__clientdb_pacs_year ON dbo._clientdb_pacs_year
		(
		tax_yr
		) ON [PRIMARY]
	
		CREATE CLUSTERED INDEX IX__clientdb_deed_history_detail ON dbo._clientdb_deed_history_detail
		(
		prop_id
		) ON [PRIMARY]
	
		CREATE CLUSTERED INDEX IX__clientdb_roll_value_history_detail ON dbo._clientdb_roll_value_history_detail
		(
		prop_val_yr,
		prop_id
		) ON [PRIMARY]
	
		CREATE CLUSTERED INDEX IX__clientdb_land_detail ON dbo._clientdb_land_detail
		(
		prop_val_yr,
		prop_id
		) ON [PRIMARY]
	
		CREATE CLUSTERED INDEX IX__clientdb_imprv_det_sketch ON dbo._clientdb_imprv_det_sketch
		(
		prop_val_yr,
		prop_id
		) ON [PRIMARY]
	
		CREATE CLUSTERED INDEX IX__clientdb_improvement_building_detail ON dbo._clientdb_improvement_building_detail
		(
		prop_val_yr,
		prop_id,
		imprv_id,
		imprv_det_id
		) ON [PRIMARY]
		
		CREATE CLUSTERED INDEX IX__clientdb_improvement_features ON dbo._clientdb_improvement_features
		(
		prop_val_yr,
		prop_id,
		imprv_id
		) ON [PRIMARY]
	
		CREATE CLUSTERED INDEX IX__clientdb_abs_subdv ON dbo._clientdb_abs_subdv
		(
		abs_subdv_ind,
		abs_subdv_cd
		) ON [PRIMARY]
	
		CREATE CLUSTERED INDEX IX__clientdb_taxing_jurisdiction_detail ON dbo._clientdb_taxing_jurisdiction_detail
		(
		sup_yr,
		prop_id
		) ON [PRIMARY]

		CREATE CLUSTERED INDEX IX__clientdb_values_detail ON dbo._clientdb_values_detail
		(
		prop_val_yr,
		prop_id
		) ON [PRIMARY]
	
		CREATE CLUSTERED INDEX IX__clientdb_property_prop_id_prop_val_yr ON dbo._clientdb_property
		(
		prop_val_yr,
		prop_id
		) ON [PRIMARY]
	
		CREATE NONCLUSTERED INDEX IX__clientdb_property_owner_name_prop_val_yr ON dbo._clientdb_property
		(
		prop_val_yr,
		owner_name
		) ON [PRIMARY]
	
		CREATE NONCLUSTERED INDEX IX__clientdb_property_prop_val_yr_abs_subdv_cd ON dbo._clientdb_property
		(
		prop_val_yr,
		abs_subdv_cd
		) ON [PRIMARY]
	
		CREATE NONCLUSTERED INDEX IX__clientdb_property_prop_val_yr_hood_cd ON dbo._clientdb_property
		(
		prop_val_yr,
		hood_cd
		) ON [PRIMARY]
	
		CREATE NONCLUSTERED INDEX IX__clientdb_property_prop_val_yr_geo_id on dbo._clientdb_property
		(
		prop_val_yr,
		geo_id
		)
	
		CREATE NONCLUSTERED INDEX IX__clientdb_property_prop_val_yr_dba_name on dbo._clientdb_property
		(
		prop_val_yr,
		dba_name
		)
	
		CREATE NONCLUSTERED INDEX IX__clientdb_property_prop_val_yr_mapsco on dbo._clientdb_property
		(
		prop_val_yr,
		mapsco
		)
	
		CREATE NONCLUSTERED INDEX IX__clientdb_property_prop_val_yr_state_cd on dbo._clientdb_property
		(
		prop_val_yr,
		state_cd
		)
		
		CREATE NONCLUSTERED INDEX IX__clientdb_property_prop_val_yr_situs_num on dbo._clientdb_property
		(
		prop_val_yr,
		situs_num
		)
		
		CREATE NONCLUSTERED INDEX IX__clientdb_property_prop_val_yr_situs_street on dbo._clientdb_property
		(
		prop_val_yr,
		situs_street
		)
		
		CREATE NONCLUSTERED INDEX IX__clientdb_property_prop_val_yr_street_name on dbo._clientdb_property
		(
		prop_val_yr,
		street_name
		)
		
		CREATE NONCLUSTERED INDEX IX__clientdb_property_prop_val_yr_situs_city on dbo._clientdb_property
		(
		prop_val_yr,
		situs_city
		)

		create nonclustered index IDX__clientdb_taxing_jurisdiction_detail_sup_yr
		on dbo._clientdb_taxing_jurisdiction_detail (sup_yr)
		with fillfactor = 90

		create nonclustered index IDX__clientdb_roll_value_history_detail_prop_val_yr
		on _clientdb_roll_value_history_detail (prop_val_yr)
		with fillfactor = 90
				
		CREATE NONCLUSTERED INDEX IX_payment_trans_payment_id ON dbo.payment_trans
		(
			payment_id
		) ON [PRIMARY]
	
		CREATE NONCLUSTERED INDEX IX_payment_trans_prop_id ON dbo.payment_trans
		(
			prop_id
		) ON [PRIMARY]
	
		CREATE NONCLUSTERED INDEX IX_payment_trans_bill_id ON dbo.payment_trans
		(
			bill_id
		) ON [PRIMARY]
	
		CREATE NONCLUSTERED INDEX IX_refund_due_trans ON dbo.refund_due_trans
		(
		bill_id
		) ON [PRIMARY] 
		
		
		CREATE NONCLUSTERED INDEX IX__clientdb_street_name ON dbo._clientdb_street_name
		(
		street
		) ON [PRIMARY] 
		

		CREATE NONCLUSTERED INDEX IX__clientdb_city ON dbo._clientdb_city
		(
		city
		) ON [PRIMARY] 
		
		CREATE NONCLUSTERED INDEX IX__clientdb_township_section ON dbo._clientdb_township_section
		(
		township_section
		) ON [PRIMARY] 
		
		CREATE NONCLUSTERED INDEX IX__clientdb_property_image ON dbo._clientdb_property_image
		(
		prop_id
		) ON [PRIMARY]
		
		ALTER TABLE dbo._clientdb_property_image ADD PRIMARY KEY (id)
		
		CREATE NONCLUSTERED INDEX IX__clientdb_property_sketch ON dbo._clientdb_property_sketch
		(
		prop_id
		) ON [PRIMARY]
		
		ALTER TABLE dbo._clientdb_property_sketch ADD PRIMARY KEY (id)
		'
	
	exec(@sql)

	
	if @region = @texas
	begin
		set @status = 'Bill Index '
		set @sql = 'use ' + @input_database_name
		set @sql = @sql + '
			CREATE NONCLUSTERED INDEX IX_bill ON dbo.bill
			(
			bill_id
			) ON [PRIMARY]
		
			CREATE NONCLUSTERED INDEX IX_bill_1 ON dbo.bill
			(
			prop_id
			) ON [PRIMARY]
			'
		exec(@sql)
				insert into _clientdb_log (id, start_dt, finish_dt, status, error)
					values (@log_id, @start_date, getdate(), @status, @@error)
				set @start_date = getdate()
	end
	
	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()
	/*********/

	set @status = 'SHRINKDATABASE and Log'
	set @sql = 'use ' + @input_database_name + '
	declare @db_file varchar(100) 
	
	-- Shrink Log File
	select @db_file = name from sys.database_files where type = 1
	print @db_file
	dbcc shrinkfile (@db_file, 5)
	
	-- Shrink DB file
	select @db_file = name from sys.database_files where type = 0
	print @db_file
	dbcc shrinkfile (@db_file, 5)
	'
	exec(@sql)
	
	
	set @sql = 'DBCC SHRINKDATABASE (' + @input_database_name + ', 5)'
	exec(@sql)
	
	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()
	
	set @status = '_clientdb_log'
	set @sql = 'select * into ' + @input_database_name + '.dbo._clientdb_log from _clientdb_log'
	exec(@sql)
	set @sql = 'use ' + @input_database_name + ' ;checkpoint'
	exec (@sql)	
	
	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()
	
	set @status = 'DropPATempTables'
	exec DropPATempTables
	
	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()
	
	set @status = 'Export Complete!'
	insert into _clientdb_log (id, start_dt, finish_dt, status, error)
			values (@log_id, @start_date, getdate(), @status, @@error)
	set @start_date = getdate()

	print '    Done Exporting at ' + convert(varchar(30), getdate(), 109)
-- Stop: Export Process

set @sql = 'use ' + @input_database_name + '
if not exists (
	select *
	from master.dbo.syslogins
	where name = ''pacsnonprivy''
)
begin
	exec master.dbo.sp_addlogin ''pacsnonprivy'', ''xi4b]ftx1p.w''
	exec master.dbo.sp_grantdbaccess ''pacsnonprivy''
end

if exists (
	select *
	from sysusers
	where name = ''pacsnonprivy''
)
begin
	exec sp_dropuser ''pacsnonprivy''
end

exec sp_grantdbaccess ''pacsnonprivy''
exec sp_addrolemember ''db_datawriter'', ''pacsnonprivy''
exec sp_addrolemember ''db_datareader'', ''pacsnonprivy''
exec(''grant insert on user_input_query to pacsnonprivy'')
exec(''grant insert on user_input_query_idlist to pacsnonprivy'')
'
exec(@sql)

set @sql = '

	if exists (
		select *
		from sysobjects
		where name = ''db_info_pa'' and xtype = ''U''
	)
	begin
		drop table db_info_pa
	end
	create table db_info_pa (
		version varchar(23) not null,
		export_dt datetime not null,
		region varchar(10)
	)
	insert db_info_pa (version, export_dt, region)
	values (''1.2.4.00'', getdate(), '''+ @region +''')
'
set @sql2 = 'exec ' + @input_database_name + '.dbo.sp_executesql N''' + replace(@sql, '''', '''''') + ''''
exec (@sql2)

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


DECLARE @subscriber_server varchar(255)
select @subscriber_server = szConfigValue from pacs_config where szGroup = 'Property Access' and szConfigName = 'Subscriber'

if (select category from master..sysdatabases where name = @input_database_name) > 0 and
	(@subscriber_server is not null)
begin
	-- Start: add publications
	print 'Adding Publications for ' + @input_database_name
	
	DECLARE @name varchar(255)
	
	-- Enabling the replication database
	set @sql = 'master..sp_replicationdboption @dbname = N''' + @input_database_name+ ''', @optname = N''publish'', @value = N''true'''
	exec (@sql)

	set @sql = @input_database_name + '..'
	set @sql = @sql + 'sp_addpublication @publication = N''' + @input_database_name + ''', @restricted = N''false'', @sync_method = N''native'', @repl_freq = N''snapshot'', @description = N''Property Access Automatic Snapshot publication of ' + @input_database_name + ' database.'', @status = N''active'', @allow_push = N''true'', @allow_pull = N''true'', @allow_anonymous = N''false'', @enabled_for_internet = N''false'', @independent_agent = N''false'', @immediate_sync = N''false'', @allow_sync_tran = N''false'', @autogen_sync_procs = N''false'', @retention = 336, @allow_queued_tran = N''false'', @snapshot_in_defaultfolder = N''true'', @compress_snapshot = N''false'', @ftp_port = 21, @ftp_login = N''anonymous'', @allow_dts = N''false'', @allow_subscription_copy = N''false'', @add_to_active_directory = N''false'''

	exec (@sql)

	set @sql = @input_database_name + '..'
	set @sql = @sql + 'sp_addpublication_snapshot @publication = N''' + @input_database_name + ''',@frequency_type = 1, @frequency_interval = 1, @frequency_relative_interval = 1, @frequency_recurrence_factor = 0, @frequency_subday = 1, @frequency_subday_interval = 1, @active_start_date = 0, @active_end_date = 0, @active_start_time_of_day = 0, @active_end_time_of_day = 0'

	exec (@sql)
	set @sql = 'declare cur_object insensitive cursor for select so.name, so.xtype
	from ' + @input_database_name + '..sysobjects as so
	where (so.category & 2) = 0 and so.xtype in (''P'', ''V'', ''U'', ''TF'')
	and so.name not in (''table_cache_status'', ''user_input_query'')'

	execute(@sql)

	OPEN cur_object

	FETCH NEXT FROM cur_object
	INTO @name, @type

	WHILE @@FETCH_STATUS = 0
	BEGIN
		declare @pre_creation_cmd varchar(10)
		set @sql = @input_database_name + '..'
		
		if (@type = 'P')
		begin
			set @sql = @sql + 'sp_addarticle @publication = N''' + @input_database_name + ''', @article = N''' + @name + ''', @source_owner = N''dbo'', @source_object = N''' + @name + ''', @destination_table = N''' + @name + ''', @type = N''proc schema only'', @creation_script = null, @description = null, @pre_creation_cmd = N''drop'', @schema_option = 0x0000000000002001, @status = 16'
		end
		if (@type = 'V')
		begin
			set @sql = @sql + 'sp_addarticle @publication = N''' + @input_database_name + ''', @article = N''' + @name + ''', @source_owner = N''dbo'', @source_object = N''' + @name + ''', @destination_table = N''' + @name + ''', @type = N''view schema only'', @creation_script = null, @description = null, @pre_creation_cmd = N''drop'', @schema_option = 0x0000000000002101, @status = 16'
		end
		if (@type = 'U')
		begin
			set @pre_creation_cmd = 'drop'
			set @sql = @sql + 'sp_addarticle @publication = N''' + @input_database_name + ''', @article = N''' + @name + ''', @source_owner = N''dbo'', @source_object = N''' + @name + ''', @destination_table = N''' + @name + ''', @type = N''logbased'', @creation_script = null, @description = null, @pre_creation_cmd = N''' + @pre_creation_cmd + ''', @schema_option = 0x000000000000FFF1, @status = 16, @vertical_partition = N''false'', @ins_cmd = N''SQL'', @del_cmd = N''SQL'', @upd_cmd = N''SQL'', @filter = null, @sync_object = null'
		end
		if (@type = 'TF')
		begin
			set @sql = @sql + 'sp_addarticle @publication = N''' + @input_database_name + ''', @article = N''' + @name + ''', @source_owner = N''dbo'', @source_object = N''' + @name + ''', @destination_table = N''' + @name + ''', @type = N''func schema only'', @creation_script = null, @description = null, @pre_creation_cmd = N''drop'', @schema_option = 0x0000000008000001, @status = 16'
		end

		exec (@sql)

		FETCH NEXT FROM cur_object
		INTO @name, @type

	END

	CLOSE cur_object
	DEALLOCATE cur_object

	set @sql = @input_database_name + '..'	
	set @sql = @sql + 'sp_addsubscription @publication = N''' + @input_database_name + ''', @article = N''all'', @subscriber = N''' + @subscriber_server + ''', @destination_db = N''' + @input_database_name + ''', @sync_type = N''automatic'', @update_mode = N''read only'', @offloadagent = 0, @dts_package_location = N''distributor'''
	exec (@sql)
	-- Stop: add publications

	
end

GO

