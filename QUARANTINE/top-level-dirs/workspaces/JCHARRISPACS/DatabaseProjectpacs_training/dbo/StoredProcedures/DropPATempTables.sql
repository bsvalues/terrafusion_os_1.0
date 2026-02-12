
/*
* Clean out the _clientdb_* tables from pacs_oltp before and after an export
 */

CREATE PROCEDURE DropPATempTables

WITH RECOMPILE

AS

--*****************************************************************************
--Drop all tables
if exists (select id from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_pacs_year]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_pacs_year]
end

if exists (select id from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_property]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_property]
end

if exists (select id from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_values_detail]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_values_detail]
end

if exists (select id from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_taxing_jurisdiction_detail]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_taxing_jurisdiction_detail]
end

if exists (select id from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_improvement_building_detail]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_improvement_building_detail]
end

if exists (select id from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_improvement_features]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_improvement_features]
end

if exists (select id from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_land_detail]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_land_detail]
end

if exists (select id from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_roll_value_history_detail]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_roll_value_history_detail]
end

if exists (select id from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_deed_history_detail]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_deed_history_detail]
end

if exists (select id from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_tax_due_detail]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_tax_due_detail]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_imprv_det_sketch]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_imprv_det_sketch]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_bill]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_bill]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_tax_rate]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_tax_rate]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_refund_due_trans]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_refund_due_trans]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_bill_adjust_code]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_bill_adjust_code]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_payment]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_payment]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_payment_trans]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_payment_trans]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_entity]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_entity]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_account]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_account]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_pacs_system]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_pacs_system]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_pacs_config]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_pacs_config]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_abs_subdv]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_abs_subdv]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_neighborhood]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_neighborhood]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_exmpt_type]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_exmpt_type]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_imprv_det_class]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_imprv_det_class]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_sales]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_sales]
end

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_property_tax_district_assoc]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[_clientdb_property_tax_district_assoc]
end

GO

