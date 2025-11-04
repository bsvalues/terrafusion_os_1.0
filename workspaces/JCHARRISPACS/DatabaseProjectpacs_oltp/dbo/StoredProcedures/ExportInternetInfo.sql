


CREATE PROCEDURE ExportInternetInfo

@input_database_name	varchar(50) = ''

WITH RECOMPILE

AS

SET NOCOUNT ON

declare @sql varchar(8000)

set @sql = ''

if (len(@input_database_name) = 0)
begin
	declare @county_name varchar(20)

	select @county_name = lower(isnull(county_name, 'cad')) from system_address where system_type = 'A'

	set @input_database_name = 'web_internet_' + isnull(@county_name, 'cad') + replace(convert(varchar(8), GetDate(), 1), '/', '')
end

--*****************************************************************************
--Drop web database if it exists
if exists (select * from master..sysdatabases where name = @input_database_name)
begin
	set @sql = 'drop database ' + @input_database_name
	exec(@sql)
end

--*****************************************************************************
--Drop all tables
if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_web_pacs_year]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_web_pacs_year]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_web_deed_history]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_web_deed_history]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_web_imprv_history]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_web_imprv_history]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_web_imprv_det_history]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_web_imprv_det_history]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_web_imprv_det_sketch]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_web_imprv_det_sketch]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_web_land_detail]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_web_land_detail]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_web_abs_subdv]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_web_abs_subdv]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_web_property_general]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_web_property_general]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_web_property_entities]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_web_property_entities]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_web_owner]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_web_owner]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_web_owner_value]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_web_owner_value]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_web_owner_exemption]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_web_owner_exemption]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_web_poev]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_web_poev]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_web_bill]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_web_bill]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_web_tax_rate]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_web_tax_rate]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_web_refund_due_trans]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_web_refund_due_trans]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_web_bill_adjust_code]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_web_bill_adjust_code]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_web_entity]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_web_entity]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_web_account]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_web_account]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_web_pacs_system]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_web_pacs_system]
end


--*****************************************************************************
--PACS_SYSTEM - Currently only need the pacs_system.tax_yr column for the GetQHBillPenaltyInterest procedure used with quarterly bills
select *
into _web_pacs_system
from pacs_system with (nolock)

--Year History - Export Info
select *
into _web_pacs_year
from pacs_year with (nolock)
order by tax_yr

--Deed History - Export Info
select
	prop_id,
	seq_num,
	deed_dt,
	grantee,
	grantor,
	volume,
	page,
	deed_type,
	deed_type_desc
into _web_deed_history
from web_chg_of_owner_vw with (nolock),
deed_type with (nolock),
_web_pacs_year with (nolock)
where deed_type = deed_type_cd
and web_chg_of_owner_vw.sup_tax_yr = _web_pacs_year.tax_yr
order by prop_id, seq_num

--Improvement History - Export Info
select
	prop_id,
	owner_tax_yr,
	imprv_id,
	imprv_type_cd,
	imprv_desc,
	imprv_type_desc,
	imprv_state_cd,
	ma_sqft,
	base_unit_price,
	imprv_val
into _web_imprv_history
from web_imprv_vw with (nolock),
_web_pacs_year with (nolock)
where web_imprv_vw.owner_tax_yr = _web_pacs_year.tax_yr
order by prop_id, owner_tax_yr

--Improvement Detail History - Export Info
select
	prop_id,
	owner_tax_yr,
	imprv_id,
	imprv_det_id,
	imprv_det_type_cd,
	imprv_det_class_cd,
	yr_built,
	imprv_det_typ_desc,
	imprv_det_desc,
	imprv_det_area_type,
	sketch_area,
	calc_area,
	imprv_det_val
into _web_imprv_det_history
from web_imprv_detail_vw with (nolock),
_web_pacs_year with (nolock)
where web_imprv_detail_vw.owner_tax_yr = _web_pacs_year.tax_yr
order by prop_id, owner_tax_yr, imprv_id

--Improvement Detail Sketch - Export Info
select
	imprv_detail.prop_id,
	imprv_detail.prop_val_yr,
	imprv_detail.imprv_det_type_cd,
	imprv_det_type.imprv_det_typ_desc,
	imprv_det_area,
	sketch_cmds,
	case when isnull(main_area, 'F') = 'T' then imprv_det_area else 0 end as living_area
into _web_imprv_det_sketch
from imprv_detail with (nolock),
imprv_det_type with (nolock),
prop_supp_assoc with (nolock),
_web_pacs_year with (nolock),
imprv with(nolock),
state_code as s with(nolock)
where imprv_detail.prop_val_yr = imprv.prop_val_yr
and   imprv_detail.prop_id = imprv.prop_id
and   imprv_detail.sup_num = imprv.sup_num
and   imprv_detail.imprv_id = imprv.imprv_id
and   imprv_detail.prop_val_yr = prop_supp_assoc.owner_tax_yr
and 	imprv.imprv_state_cd=s.state_cd
and imprv_detail.prop_val_yr = _web_pacs_year.tax_yr
and   imprv_detail.prop_id = prop_supp_assoc.prop_id
and   imprv_detail.sup_num = prop_supp_assoc.sup_num
and   imprv_detail.prop_val_yr = prop_supp_assoc.owner_tax_yr
and   imprv_detail.imprv_det_type_cd = imprv_det_type.imprv_det_type_cd
and   imprv_detail.sale_id = 0
and   imprv_detail.imprv_id =
(
	select min(imprv_id)
	from imprv with (nolock)
	where imprv.prop_id = prop_supp_assoc.prop_id
	and imprv.prop_val_yr = prop_supp_assoc.owner_tax_yr
	and imprv.sale_id = 0
)
and s.allow_website_images = 1
order by imprv_detail.prop_id, imprv_detail.prop_val_yr

--Land Detail - Export Info
select
	prop_id,
	owner_tax_yr,
	land_seg_id,
	land_type_cd,
	land_type_desc,
	ls_method,
	size_acres,
	size_square_feet,
	effective_front,
	effective_depth,
	land_seg_mkt_val,
	mkt_unit_price,
	ag_val
into _web_land_detail
from web_land_detail_vw with (nolock),
_web_pacs_year with (nolock)
where web_land_detail_vw.owner_tax_yr = _web_pacs_year.tax_yr
order by prop_id, owner_tax_yr

--Abstract/Subdv/MH - Export Info
select
	abs_subdv_ind,
	abs_subdv_cd,
	abs_subdv_desc
into _web_abs_subdv
from abs_subdv with (nolock)
where abs_subdv_yr =
(
	select max(abs_subdv2.abs_subdv_yr)
	from abs_subdv as abs_subdv2 with (nolock)
	where abs_subdv.abs_subdv_ind = abs_subdv2.abs_subdv_ind
)
order by abs_subdv_ind, abs_subdv_cd

--Property General - Export Info
select
	prop_id,
	owner_tax_yr,
	sup_num,
	file_as_name,
	abs_subdv_cd,
	mbl_hm_park,
	legal_desc,
	prop_type_desc,
	hood_name,
	hood_cd,
	geo_id,
	map_id,
	situs_num,
	situs_street_prefx,
	situs_street,
	situs_street_sufix,
	situs_city,
	situs_state,
	situs_zip,
	imprv,
	land_market,
	ag_valuation,
	hs_cap,
	active_acct,
	land_hstd_val,
	land_non_hstd_val,
	imprv_hstd_val,
	imprv_non_hstd_val,
	appraised_val,
	assessed_val,
	market,
	ag_use_val,
	ag_market,
	timber_use,
	timber_market,
	ten_percent_cap,
	image_path
into _web_property_general
from web_general_vw with (nolock),
_web_pacs_year with (nolock)
where web_general_vw.owner_tax_yr = _web_pacs_year.tax_yr
order by prop_id, owner_tax_yr

--Property Entities - Export Info
select
	prop_id,
	owner_tax_yr,
	entity_id,
	entity_cd,
	entity_desc,
	appraise_for,
	tax_rate
into _web_property_entities
from web_entity_vw with (nolock),
_web_pacs_year with (nolock)
where web_entity_vw.owner_tax_yr = _web_pacs_year.tax_yr
order by prop_id, owner_tax_yr, entity_cd

--Owner - Export Info
select
	prop_id,
	owner_tax_yr,
	owner_id,
	file_as_name,
	pct_ownership,
	addr_line1,
	addr_line2,
	addr_line3,
	addr_city,
	addr_state,
	addr_zip
into _web_owner
from web_owner_vw with (nolock),
_web_pacs_year with (nolock)
where web_owner_vw.owner_tax_yr = _web_pacs_year.tax_yr
order by prop_id, owner_tax_yr

--Owner Value - Export Info
select
	prop_supp_assoc.prop_id,
	prop_supp_assoc.owner_tax_yr,
	account.file_as_name,
	owner.pct_ownership,
	property_val.assessed_val as value
into _web_owner_value
from owner with (nolock),
account with (nolock),
property_val with (nolock),
prop_supp_assoc with (nolock),
_web_pacs_year with (nolock)
where prop_supp_assoc.owner_tax_yr = _web_pacs_year.tax_yr
and property_val.prop_id = prop_supp_assoc.prop_id
and property_val.sup_num = prop_supp_assoc.sup_num
and property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr
and property_val.prop_id = owner.prop_id
and property_val.sup_num = owner.sup_num
and property_val.prop_val_yr = owner.owner_tax_yr
and owner.owner_id = account.acct_id
order by prop_supp_assoc.prop_id, prop_supp_assoc.owner_tax_yr

--Owner Exemption - Export Info
select
	prop_id,
	owner_tax_yr,
	owner_id,
	exmpt_type_cd
into _web_owner_exemption
from web_exemption_vw with (nolock),
_web_pacs_year with (nolock)
where web_exemption_vw.owner_tax_yr = _web_pacs_year.tax_yr
order by prop_id, owner_tax_yr, owner_id, exmpt_type_cd

--POEV - Export Info
select
	poev.prop_id,
	poev.sup_yr,
	poev.entity_id,
	isnull(poev.assessed_val, 0) as appraised_val,
	isnull(poev.taxable_val, 0) as taxable_val,
	isnull(poev.frz_taxable_val, 0) as frz_taxable_val,
	isnull(poev.frz_assessed_val, 0) as frz_assessed_val,
	isnull(poev.frz_actual_tax, 0) as frz_actual_tax
into _web_poev
from prop_owner_entity_val as poev with (nolock),
prop_supp_assoc as psa with (nolock),
_web_pacs_year with (nolock)
where poev.sup_yr = _web_pacs_year.tax_yr
and poev.prop_id = psa.prop_id
and poev.sup_num = psa.sup_num
and poev.sup_yr = psa.owner_tax_yr
order by poev.prop_id, poev.sup_yr, poev.entity_id

--Bills - Export Info
select
	bill.*
into _web_bill
from bill with (nolock)
	where isnull(bill.active_bill, 'T') = 'T'
/*
	and (((bill.bill_adj_m_n_o + bill.bill_adj_i_n_s) - 
		((bill.bill_m_n_o_pd + bill.bill_i_n_s_pd + bill.discount_mno_pd + bill.discount_ins_pd + bill.underage_mno_pd + bill.underage_ins_pd) - 
		(bill.refund_m_n_o_pd + bill.refund_i_n_s_pd + bill.refund_disc_mno_pd + bill.refund_disc_ins_pd))) > 0)
*/
	and bill.coll_status_cd <> 'RS'
order by bill.bill_id

--Tax Rate - Export Info
select
	tax_rate.*
into _web_tax_rate
from tax_rate
order by tax_rate.entity_id, tax_rate.tax_rate_yr desc

--Refund Due Trans - Export Info
select
	refund_due_trans.*
into _web_refund_due_trans
from refund_due_trans
order by refund_due_trans.bill_id

--Bill Adjustment Codes - Export Info
select
	bill_adjust_code.*
into _web_bill_adjust_code
from bill_adjust_code
order by bill_adjust_code.adjust_cd

--Entity Codes - Export Info
select
	entity.*
into _web_entity
from entity
order by entity.entity_id

--Account - Export Info
select
	account.*
into _web_account
from account
order by account.acct_id

--*****************************************************************************
--CREATE NEW WEB DATABASE IF IT DOESN'T EXIST
declare @db_path varchar(255)

select @db_path = filename from master..sysdatabases where name = db_name()

set @db_path = reverse(@db_path)

set @db_path = right(@db_path, len(@db_path) - charindex('\', @db_path, 1) + 1)

set @db_path = reverse(@db_path)

if not exists (select * from master..sysdatabases where name = @input_database_name)
begin
	set @sql = 'CREATE DATABASE ' + @input_database_name + ' ON 
	(
		NAME = ' + @input_database_name + '_data,
		FILENAME = ''' + @db_path + @input_database_name + '_data.MDF' + '''' + '
	)
	LOG ON
	(
		NAME = ' + @input_database_name + '_log,
		FILENAME = ''' + @db_path + @input_database_name + '_log.LDF' + '''' + '
	)'

	exec(@sql)
end

set @sql = 'exec master..sp_dboption ''' + @input_database_name + ''', ''select into/bulkcopy'', ''TRUE'''
exec(@sql)

--Copy tables to the new database
set @sql = 'select * into ' + @input_database_name + '.dbo._web_abs_subdv from _web_abs_subdv'
exec(@sql)

set @sql = 'select * into ' + @input_database_name + '.dbo._web_deed_history from _web_deed_history'
exec(@sql)

set @sql = 'select * into ' + @input_database_name + '.dbo._web_imprv_det_history from _web_imprv_det_history'
exec(@sql)

set @sql = 'select * into ' + @input_database_name + '.dbo._web_imprv_det_sketch from _web_imprv_det_sketch'
exec(@sql)

set @sql = 'select * into ' + @input_database_name + '.dbo._web_imprv_history from _web_imprv_history'
exec(@sql)

set @sql = 'select * into ' + @input_database_name + '.dbo._web_land_detail from _web_land_detail'
exec(@sql)

set @sql = 'select * into ' + @input_database_name + '.dbo._web_owner from _web_owner'
exec(@sql)

set @sql = 'select * into ' + @input_database_name + '.dbo._web_owner_exemption from _web_owner_exemption'
exec(@sql)

set @sql = 'select * into ' + @input_database_name + '.dbo._web_owner_value from _web_owner_value'
exec(@sql)

set @sql = 'select * into ' + @input_database_name + '.dbo._web_pacs_year from _web_pacs_year'
exec(@sql)

set @sql = 'select * into ' + @input_database_name + '.dbo._web_poev from _web_poev'
exec(@sql)

set @sql = 'select * into ' + @input_database_name + '.dbo._web_property_entities from _web_property_entities'
exec(@sql)

set @sql = 'select * into ' + @input_database_name + '.dbo._web_property_general from _web_property_general'
exec(@sql)

set @sql = 'select * into ' + @input_database_name + '.dbo.bill from _web_bill'
exec(@sql)

set @sql = 'select * into ' + @input_database_name + '.dbo.tax_rate from _web_tax_rate'
exec(@sql)

set @sql = 'select * into ' + @input_database_name + '.dbo.refund_due_trans from _web_refund_due_trans'
exec(@sql)

set @sql = 'select * into ' + @input_database_name + '.dbo.bill_adjust_code from _web_bill_adjust_code'
exec(@sql)

set @sql = 'select * into ' + @input_database_name + '.dbo.entity from _web_entity'
exec(@sql)

set @sql = 'select * into ' + @input_database_name + '.dbo.account from _web_account'
exec(@sql)

set @sql = 'select * into ' + @input_database_name + '.dbo.pacs_system from _web_pacs_system'
exec(@sql)

--*****************************************************************************
--Add Indexes

set @sql = 'use ' + @input_database_name
set @sql = @sql + '
	CREATE CLUSTERED INDEX IX__web_pacs_year ON dbo._web_pacs_year
	(
	tax_yr
	) ON [PRIMARY]

	CREATE CLUSTERED INDEX IX__web_deed_history ON dbo._web_deed_history
	(
	prop_id
	) ON [PRIMARY]

	CREATE CLUSTERED INDEX IX__web_imprv_history ON dbo._web_imprv_history
	(
	prop_id,
	owner_tax_yr
	) ON [PRIMARY]

	CREATE CLUSTERED INDEX IX__web_imprv_det_history ON dbo._web_imprv_det_history
	(
	prop_id,
	owner_tax_yr,
	imprv_id
	) ON [PRIMARY]

	CREATE CLUSTERED INDEX IX__web_imprv_det_sketch ON dbo._web_imprv_det_sketch
	(
	prop_id,
	prop_val_yr
	) ON [PRIMARY]

	CREATE CLUSTERED INDEX IX__web_land_detail ON dbo._web_land_detail
	(
	prop_id,
	owner_tax_yr
	) ON [PRIMARY]

	CREATE CLUSTERED INDEX IX__web_abs_subdv ON dbo._web_abs_subdv
	(
	abs_subdv_ind,
	abs_subdv_cd
	) ON [PRIMARY]

	CREATE CLUSTERED INDEX IX__web_property_general ON dbo._web_property_general
	(
	prop_id,
	owner_tax_yr
	) ON [PRIMARY]

	CREATE NONCLUSTERED INDEX IX__web_property_general_1 ON dbo._web_property_general
		(
		prop_id
		) ON [PRIMARY]

	CREATE NONCLUSTERED INDEX IX__web_property_general_2 ON dbo._web_property_general
		(
		file_as_name
		) ON [PRIMARY]

	CREATE NONCLUSTERED INDEX IX__web_property_general_3 ON dbo._web_property_general
		(
		situs_num,
		situs_street
		) ON [PRIMARY]

	CREATE NONCLUSTERED INDEX IX__web_property_general_4 ON dbo._web_property_general
		(
		prop_id
		) ON [PRIMARY]

	CREATE NONCLUSTERED INDEX IX__web_property_general_5 ON dbo._web_property_general
		(
		situs_street
		) ON [PRIMARY]

	CREATE NONCLUSTERED INDEX IX__web_property_general_6 ON dbo._web_property_general
		(
		geo_id
		) ON [PRIMARY]

	CREATE NONCLUSTERED INDEX IX__web_property_general_7 ON dbo._web_property_general
		(
		abs_subdv_cd
		) ON [PRIMARY]

	CREATE NONCLUSTERED INDEX IX__web_property_general_8 ON dbo._web_property_general
		(
		mbl_hm_park
		) ON [PRIMARY]

	CREATE CLUSTERED INDEX IX__web_property_entities ON dbo._web_property_entities
	(
	prop_id,
	owner_tax_yr,
	entity_cd
	) ON [PRIMARY]

	CREATE CLUSTERED INDEX IX__web_owner ON dbo._web_owner
	(
	prop_id,
	owner_tax_yr
	) ON [PRIMARY]

	CREATE CLUSTERED INDEX IX__web_owner_value ON dbo._web_owner_value
	(
	prop_id,
	owner_tax_yr
	) ON [PRIMARY]

	CREATE CLUSTERED INDEX IX__web_owner_exemption ON dbo._web_owner_exemption
	(
	prop_id,
	owner_tax_yr,
	owner_id,
	exmpt_type_cd
	) ON [PRIMARY]

	CREATE CLUSTERED INDEX IX__web_poev ON dbo._web_poev
	(
	prop_id,
	sup_yr,
	entity_id
	) ON [PRIMARY]

	CREATE CLUSTERED INDEX IX_bill ON dbo.bill
	(
	bill_id
	) ON [PRIMARY]

	CREATE NONCLUSTERED INDEX IX_bill_1 ON dbo.bill
	(
	prop_id
	) ON [PRIMARY]

	CREATE NONCLUSTERED INDEX IX_tax_rate ON dbo.tax_rate
	(
	entity_id,
	tax_rate_yr
	) ON [PRIMARY]

	CREATE NONCLUSTERED INDEX IX_refund_due_trans ON dbo.refund_due_trans
	(
	bill_id
	) ON [PRIMARY]

	CREATE CLUSTERED INDEX IX_bill_adjust_code ON dbo.bill_adjust_code
	(
	adjust_cd
	) ON [PRIMARY]

	CREATE CLUSTERED INDEX IX_entity ON dbo.entity
	(
	entity_id
	) ON [PRIMARY]

	CREATE CLUSTERED INDEX IX_account ON dbo.account
	(
	acct_id
	) ON [PRIMARY]

	DBCC SHRINKDATABASE (' + @input_database_name + ', 0)

	exec sp_grantdbaccess ''web_inquiry''

	exec sp_addrolemember ''db_owner'', ''web_inquiry'''

exec(@sql)

GO

