
create procedure BulkInsertPTDExportAJRFile
@data_file_name varchar(255),
@table_name varchar(255) = 'ptd_ajr',
@version as varchar(10)='8_0_0',
@path_fmt as varchar(255)=NULL, -- Will use the report directory if not specified
@trusted bit = 1,
@user as varchar(64) = NULL,
@pwd as varchar(64) = NULL

as

set nocount on

--declare @table_name varchar(255)
--declare @version as varchar(10)
--declare @path_fmt as varchar(255)
--declare @trusted bit
--declare @user as varchar(64)
--declare @pwd as varchar(64)

--set @table_name = 'import_entity_prop'
--set @version ='8_0_2'
--set @path_fmt = NULL -- Will use the report directory if not specified

declare @file_name varchar(255)
declare @fmt_file_name varchar(255)
declare @line varchar(255)
declare @seq int
declare @db varchar(65)

-- Get the database name
select @db=d.name
from master..sysprocesses as p with(nolock)
inner join master..sysdatabases as d with(nolock) on
		p.dbid=d.dbid
where spid=@@SPID

-- Get The path

if @path_fmt is null
begin
	select top 1 @path_fmt=left(location,len(location)-charindex('\',reverse(location)))
	from report
end

-- Make sure global temp table is created and empty for this spid
exec sp_SaveTextFile

-- Create the BCP file
if @version='8_0_0'
begin

	exec sp_SaveText '7.0' , @seq output , 1
	exec sp_SaveText '59' , @seq output , 1
	exec sp_SaveText '1 SQLCHAR 0 3 "" 1 rec_type' , @seq output , 1
	exec sp_SaveText '2 SQLCHAR 0 3 "" 2 cad_id_code' , @seq output , 1
	exec sp_SaveText '3 SQLCHAR 0 25 "" 3 account_number' , @seq output , 1
	exec sp_SaveText '4 SQLCHAR 0 8 "" 4 taxing_unit_id_code' , @seq output , 1
	exec sp_SaveText '5 SQLCHAR 0 1 "" 5 county_fund_type_ind' , @seq output , 1
	exec sp_SaveText '6 SQLCHAR 0 9 "" 6 local_optional_percentage_homestead_exemption_amount' , @seq output , 1
	exec sp_SaveText '7 SQLCHAR 0 9 "" 7 state_mandated_homestead_exemption_amount' , @seq output , 1
	exec sp_SaveText '8 SQLCHAR 0 9 "" 8 state_mandated_over65_homeowner_exemption_amount' , @seq output , 1
	exec sp_SaveText '9 SQLCHAR 0 9 "" 9 state_mandated_disabled_homeowner_exemption_amount' , @seq output , 1
	exec sp_SaveText '10 SQLCHAR 0 9 "" 10 local_optional_over65_homeowner_exemption_amount' , @seq output , 1
	exec sp_SaveText '11 SQLCHAR 0 9 "" 11 local_optional_disabled_homeowner_exemption_amount' , @seq output , 1
	exec sp_SaveText '12 SQLCHAR 0 9 "" 12 total_exemption_amount' , @seq output , 1
	exec sp_SaveText '13 SQLCHAR 0 9 "" 13 local_optional_historical_exemption_amount' , @seq output , 1
	exec sp_SaveText '14 SQLCHAR 0 9 "" 14 solar_wind_powered_exemption_amount' , @seq output , 1
	exec sp_SaveText '15 SQLCHAR 0 9 "" 15 state_mandated_disabled_deceased_veteran_exemption_amount' , @seq output , 1
	exec sp_SaveText '16 SQLCHAR 0 9 "" 16 other_exemption_loss_amount' , @seq output , 1
	exec sp_SaveText '17 SQLCHAR 0 9 "" 17 total_appraised_value_lost_due_to_tax_abatement_agreements' , @seq output , 1
	exec sp_SaveText '18 SQLCHAR 0 9 "" 18 total_payments_into_tax_increment_financing_funds' , @seq output , 1
	exec sp_SaveText '19 SQLCHAR 0 2 "" 19 comptrollers_category_code' , @seq output , 1
	exec sp_SaveText '20 SQLCHAR 0 11 "" 20 category_market_value_land_before_any_cap' , @seq output , 1
	exec sp_SaveText '21 SQLCHAR 0 11 "" 21 total_acres_for_category' , @seq output , 1
	exec sp_SaveText '22 SQLCHAR 0 11 "" 22 productivity_value' , @seq output , 1
	exec sp_SaveText '23 SQLCHAR 0 11 "" 23 productivity_value_loss' , @seq output , 1
	exec sp_SaveText '24 SQLCHAR 0 11 "" 24 category_market_value_improvement_before_any_cap' , @seq output , 1
	exec sp_SaveText '25 SQLCHAR 0 11 "" 25 account_taxable_value' , @seq output , 1
	exec sp_SaveText '26 SQLCHAR 0 11 "" 26 tax_ceiling' , @seq output , 1
	exec sp_SaveText '27 SQLCHAR 0 11 "" 27 freeport_exemption_loss' , @seq output , 1
	exec sp_SaveText '28 SQLCHAR 0 9 "" 28 pollution_control_exemption_loss' , @seq output , 1
	exec sp_SaveText '29 SQLCHAR 0 11 "" 29 personal_property_value' , @seq output , 1
	exec sp_SaveText '30 SQLCHAR 0 9 "" 30 proration_loss_to_property' , @seq output , 1
	exec sp_SaveText '31 SQLCHAR 0 9 "" 31 levy_lost_to_tax_deferral_of_over65_or_increasing_home_taxes' , @seq output , 1
	exec sp_SaveText '32 SQLCHAR 0 9 "" 32 capped_value_of_residential_homesteads' , @seq output , 1
	exec sp_SaveText '33 SQLCHAR 0 9 "" 33 value_loss_to_the_hscap_on_residential_homesteads' , @seq output , 1
	exec sp_SaveText '34 SQLCHAR 0 9 "" 34 water_conservation_initiatives_exemption_amount' , @seq output , 1
	exec sp_SaveText '35 SQLCHAR 0 3 "" 35 local_optional_homestead_exemption_percentage' , @seq output , 1
	exec sp_SaveText '36 SQLCHAR 0 9 "" 36 total_appraised_value_lost_due_to_tax_abatement_agreements_granted_before_may311993' , @seq output , 1
	exec sp_SaveText '37 SQLCHAR 0 9 "" 37 total_appraised_value_lost_due_to_tax_abatement_agreements_granted_since_may311993' , @seq output , 1
	exec sp_SaveText '38 SQLCHAR 0 9 "" 38 tax_increment_financing_captured_appraised_value_loss' , @seq output , 1
	exec sp_SaveText '39 SQLCHAR 0 11 "" 39 mineral_value' , @seq output , 1
	exec sp_SaveText '40 SQLCHAR 0 4 "" 40 last_reappraisal_year' , @seq output , 1
	exec sp_SaveText '41 SQLCHAR 0 1 "" 41 state_mandated_homestead_exemption_indicator' , @seq output , 1
	exec sp_SaveText '42 SQLCHAR 0 1 "" 42 state_mandated_over6555_surviving_spouse_exemption_indicator' , @seq output , 1
	exec sp_SaveText '43 SQLCHAR 0 1 "" 43 state_mandated_disabled_homeowner_exemption_indicator' , @seq output , 1
	exec sp_SaveText '44 SQLCHAR 0 1 "" 44 local_optional_percentage_homestead_exemption_indicator' , @seq output , 1
	exec sp_SaveText '45 SQLCHAR 0 1 "" 45 local_optional_over6555_surviving_spouse_exemption_indicator' , @seq output , 1
	exec sp_SaveText '46 SQLCHAR 0 1 "" 46 local_optional_disabled_homeowner_exemption_indicator' , @seq output , 1
	exec sp_SaveText '47 SQLCHAR 0 1 "" 47 state_mandated_disabled_or_deceased_veteran_exemption_indicator' , @seq output , 1
	exec sp_SaveText '48 SQLCHAR 0 1 "" 48 abatements_indicator' , @seq output , 1
	exec sp_SaveText '49 SQLCHAR 0 1 "" 49 tax_increment_financing_indicator' , @seq output , 1
	exec sp_SaveText '50 SQLCHAR 0 1 "" 50 certified_value_indicator' , @seq output , 1
	exec sp_SaveText '51 SQLCHAR 0 1 "" 51 pollution_control_exemption_indicator' , @seq output , 1
	exec sp_SaveText '52 SQLCHAR 0 1 "" 52 freeport_exemption_indicator' , @seq output , 1
	exec sp_SaveText '53 SQLCHAR 0 1 "" 53 tax_ceiling_indicator' , @seq output , 1
	exec sp_SaveText '54 SQLCHAR 0 1 "" 54 hscap_on_residential_homesteads_indicator' , @seq output , 1
	exec sp_SaveText '55 SQLCHAR 0 1 "" 55 water_conservation_initiatives_indicator' , @seq output , 1
	exec sp_SaveText '56 SQLCHAR 0 1 "" 56 multiple_owner_indicator' , @seq output , 1
	exec sp_SaveText '57 SQLCHAR 0 9 "" 57 payments_into_tax_increment_financing_funds_eligible_for_deduction' , @seq output , 1
	exec sp_SaveText '58 SQLCHAR 0 1 "" 58 land_units' , @seq output , 1
	exec sp_SaveText '59 SQLCHAR 0 1 "\r\n" 59 abatement_granted_before_may311993_indicator' , @seq output , 1

end

set @file_name = @path_fmt + '\' +'AJR.FMT'
set @fmt_file_name=@file_name
-- Save the text file
exec sp_SaveTextFile @file_name,@trusted,@user,@pwd

-- Clear the text table
exec sp_SaveTextFile
set @seq = null

-- Create the table script
if @version='8_0_0'
begin
	set @line='if object_id(''' + @table_name + ''') is not null'
	exec sp_SaveText @line , @seq output , 1
	exec sp_SaveText 'begin' , @seq output , 1
	set @line='drop table ' + @table_name
	exec sp_SaveText '' , @seq output , 1
	exec sp_SaveText @line , @seq output , 1
	exec sp_SaveText 'end' , @seq output , 1
	exec sp_SaveText 'go' , @seq output , 1
	set @line='create table ' + @table_name
	exec sp_SaveText @line , @seq output , 1

	exec sp_SaveText '(' , @seq output , 1
	exec sp_SaveText '[record_type] [char] (3)  NULL ,' , @seq output , 1
	exec sp_SaveText '[cad_id_code] [varchar] (3)  NULL ,' , @seq output , 1
	exec sp_SaveText '[account_number] [varchar] (25)  NULL ,' , @seq output , 1
	exec sp_SaveText '[taxing_unit_id_code] [varchar] (10)  NULL ,' , @seq output , 1
	exec sp_SaveText '[county_fund_type_ind] [char] (1)  NULL ,' , @seq output , 1
	exec sp_SaveText '[local_optional_percentage_homestead_exemption_amount] [numeric](9, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[state_mandated_homestead_exemption_amount] [numeric](9, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[state_mandated_over65_homeowner_exemption_amount] [numeric](9, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[state_mandated_disabled_homeowner_exemption_amount] [numeric](9, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[local_optional_over65_homeowner_exemption_amount] [numeric](9, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[local_optional_disabled_homeowner_exemption_amount] [numeric](9, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[total_exemption_amount] [numeric](9, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[local_optional_historical_exemption_amount] [numeric](9, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[solar_wind_powered_exemption_amount] [numeric](9, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[state_mandated_disabled_deceased_veteran_exemption_amount] [numeric](9, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[other_exemption_loss_amount] [numeric](9, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[total_appraised_value_lost_due_to_tax_abatement_agreements] [numeric](9, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[total_payments_into_tax_increment_financing_funds] [numeric](9, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[comptrollers_category_code] [varchar] (2)  NULL ,' , @seq output , 1
	exec sp_SaveText '[category_market_value_land_before_any_cap] [numeric](11, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[total_acres_for_category] [numeric](20, 8) NULL ,' , @seq output , 1
	exec sp_SaveText '[productivity_value] [numeric](11, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[productivity_value_loss] [numeric](11, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[category_market_value_improvement_before_any_cap] [numeric](11, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[account_taxable_value] [numeric](11, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[tax_ceiling] [numeric](11, 2) NULL ,' , @seq output , 1
	exec sp_SaveText '[freeport_exemption_loss] [numeric](11, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[pollution_control_exemption_loss] [numeric](9, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[personal_property_value] [numeric](11, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[proration_loss_to_property] [numeric](9, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[levy_lost_to_tax_deferral_of_over65_or_increasing_home_taxes] [numeric](9, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[capped_value_of_residential_homesteads] [numeric](9, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[value_loss_to_the_hscap_on_residential_homesteads] [numeric](9, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[water_conservation_initiatives_exemption_amount] [numeric](9, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[local_optional_homestead_exemption_percentage] [numeric](3, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[total_appraised_value_lost_due_to_tax_abatement_agreements_granted_before_may311993] [numeric](9, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[total_appraised_value_lost_due_to_tax_abatement_agreements_granted_since_may311993] [numeric](9, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[tax_increment_financing_captured_appraised_value_loss] [varchar] (9)  NULL ,' , @seq output , 1
	exec sp_SaveText '[mineral_value] [numeric](11, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[last_reappraisal_year] [numeric](4, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[state_mandated_homestead_exemption_indicator] [char] (1)  NULL ,' , @seq output , 1
	exec sp_SaveText '[state_mandated_over6555_surviving_spouse_exemption_indicator] [char] (1)  NULL ,' , @seq output , 1
	exec sp_SaveText '[state_mandated_disabled_homeowner_exemption_indicator] [char] (1)  NULL ,' , @seq output , 1
	exec sp_SaveText '[local_optional_percentage_homestead_exemption_indicator] [char] (1)  NULL ,' , @seq output , 1
	exec sp_SaveText '[local_optional_over6555_surviving_spouse_exemption_indicator] [char] (1)  NULL ,' , @seq output , 1
	exec sp_SaveText '[local_optional_disabled_homeowner_exemption_indicator] [char] (1)  NULL ,' , @seq output , 1
	exec sp_SaveText '[state_mandated_disabled_or_deceased_veteran_exemption_indicator] [char] (1)  NULL ,' , @seq output , 1
	exec sp_SaveText '[abatements_indicator] [char] (1)  NULL ,' , @seq output , 1
	exec sp_SaveText '[tax_increment_financing_indicator] [char] (1)  NULL ,' , @seq output , 1
	exec sp_SaveText '[certified_value_indicator] [char] (1)  NULL ,' , @seq output , 1
	exec sp_SaveText '[pollution_control_exemption_indicator] [char] (1)  NULL ,' , @seq output , 1
	exec sp_SaveText '[freeport_exemption_indicator] [char] (1)  NULL ,' , @seq output , 1
	exec sp_SaveText '[tax_ceiling_indicator] [char] (1)  NULL ,' , @seq output , 1
	exec sp_SaveText '[hscap_on_residential_homesteads_indicator] [char] (1)  NULL ,' , @seq output , 1
	exec sp_SaveText '[water_conservation_initiatives_indicator] [char] (1)  NULL ,' , @seq output , 1
	exec sp_SaveText '[multiple_owner_indicator] [char] (1)  NULL ,' , @seq output , 1
	exec sp_SaveText '[payments_into_tax_increment_financing_funds_eligible_for_deduction] [numeric](11, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[land_units] [numeric](5, 0) NULL ,' , @seq output , 1
	exec sp_SaveText '[abatement_granted_before_may311993_indicator] [char] (1)  NULL ' , @seq output , 1
	exec sp_SaveText ') ON [PRIMARY]' , @seq output , 1	
	exec sp_SaveText '' , @seq output , 1
	exec sp_SaveText 'go' , @seq output , 1
	exec sp_SaveText '' , @seq output , 1

end




-- Save the create table script file
set @line = 'create_' + @table_name + '.sql'
set @file_name = @path_fmt + '\' +@line
-- Save the text file
exec sp_SaveTextFile @file_name,@trusted,@user,@pwd

-- Execute the script to create the table
declare @cmd varchar(4000)

if @trusted = 0
	begin
		set @cmd='isql -i"'+@file_name+'" -S"'+@@SERVERNAME+'" -U"'+@user+'" -P"'+@pwd+'" -d"'+@db+'"'
		exec master..xp_CmdShell @cmd
	end
else
	begin
		set @cmd='isql -i"'+@file_name+'" -S"'+@@SERVERNAME+'" -E -d"'+@db+'"'
		exec master..xp_CmdShell @cmd
	end

-- Do the bulk insert
set @cmd = ''
set @cmd = @cmd + 'bulk insert ' + @table_name + ' ' + char(10)+char(13)
set @cmd = @cmd + 'from ''' + @data_file_name + ''' ' + char(10)+char(13)
set @cmd = @cmd + 'with ' + char(10)+char(13)
set @cmd = @cmd + '(' + char(10)+char(13)
set @cmd = @cmd + 'FORMATFILE=''' + @fmt_file_name + '''' + char(10)+char(13)
set @cmd = @cmd + ')' + char(10)+char(13)
print @cmd

exec(@cmd)

GO

