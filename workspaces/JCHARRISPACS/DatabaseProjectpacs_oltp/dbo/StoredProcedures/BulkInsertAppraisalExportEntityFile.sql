
create procedure BulkInsertAppraisalExportEntityFile
@data_file_name varchar(255),
@table_name varchar(255) = 'import_entity_prop',
@version as varchar(10)='8_0_2',
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
if @version='8_0_3' or  @version='8_0_2' or  @version='8_0_1'
begin

	exec sp_SaveText '7.0' , @seq output , 1
	exec sp_SaveText '63' , @seq output , 1
	exec sp_SaveText '1 SQLCHAR 0 12 "" 1 prop_id' , @seq output , 1
	exec sp_SaveText '2 SQLCHAR 0 5 "" 2 sup_yr' , @seq output , 1
	exec sp_SaveText '3 SQLCHAR 0 12 "" 3 sup_num' , @seq output , 1
	exec sp_SaveText '4 SQLCHAR 0 12 "" 4 owner_id' , @seq output , 1
	exec sp_SaveText '5 SQLCHAR 0 12 "" 5 entity_id' , @seq output , 1
	exec sp_SaveText '6 SQLCHAR 0 10 "" 6 entity_cd' , @seq output , 1
	exec sp_SaveText '7 SQLCHAR 0 50 "" 7 entity_name' , @seq output , 1
	exec sp_SaveText '8 SQLCHAR 0 20 "" 8 entity_xref_id' , @seq output , 1
	exec sp_SaveText '9 SQLCHAR 0 15 "" 9 reserved1' , @seq output , 1
	exec sp_SaveText '10 SQLCHAR 0 15 "" 10 assessed_val' , @seq output , 1
	exec sp_SaveText '11 SQLCHAR 0 15 "" 11 taxable_val' , @seq output , 1
	exec sp_SaveText '12 SQLCHAR 0 15 "" 12 ab_amt' , @seq output , 1
	exec sp_SaveText '13 SQLCHAR 0 15 "" 13 en_amt' , @seq output , 1
	exec sp_SaveText '14 SQLCHAR 0 15 "" 14 fr_amt' , @seq output , 1
	exec sp_SaveText '15 SQLCHAR 0 15 "" 15 ht_amt' , @seq output , 1
	exec sp_SaveText '16 SQLCHAR 0 15 "" 16 pro_amt' , @seq output , 1
	exec sp_SaveText '17 SQLCHAR 0 15 "" 17 pc_amt' , @seq output , 1
	exec sp_SaveText '18 SQLCHAR 0 15 "" 18 so_amt' , @seq output , 1
	exec sp_SaveText '19 SQLCHAR 0 15 "" 19 ex366_amt' , @seq output , 1
	exec sp_SaveText '20 SQLCHAR 0 15 "" 20 hs_amt' , @seq output , 1
	exec sp_SaveText '21 SQLCHAR 0 15 "" 21 ov65_amt' , @seq output , 1
	exec sp_SaveText '22 SQLCHAR 0 15 "" 22 dp_amt' , @seq output , 1
	exec sp_SaveText '23 SQLCHAR 0 15 "" 23 dv_amt' , @seq output , 1
	exec sp_SaveText '24 SQLCHAR 0 15 "" 24 ex_amt' , @seq output , 1
	exec sp_SaveText '25 SQLCHAR 0 15 "" 25 ch_amt' , @seq output , 1
	exec sp_SaveText '26 SQLCHAR 0 15 "" 26 market_val' , @seq output , 1
	exec sp_SaveText '27 SQLCHAR 0 15 "" 27 appraised_val' , @seq output , 1
	exec sp_SaveText '28 SQLCHAR 0 15 "" 28 hs_cap' , @seq output , 1
	exec sp_SaveText '29 SQLCHAR 0 15 "" 29 ag_late_loss' , @seq output , 1
	exec sp_SaveText '30 SQLCHAR 0 15 "" 30 freeport_late_loss' , @seq output , 1
	exec sp_SaveText '31 SQLCHAR 0 15 "" 31 hs_state_amt' , @seq output , 1
	exec sp_SaveText '32 SQLCHAR 0 15 "" 32 hs_local_amt' , @seq output , 1
	exec sp_SaveText '33 SQLCHAR 0 15 "" 33 land_hstd_val' , @seq output , 1
	exec sp_SaveText '34 SQLCHAR 0 15 "" 34 land_non_hstd_val' , @seq output , 1
	exec sp_SaveText '35 SQLCHAR 0 15 "" 35 imprv_hstd_val' , @seq output , 1
	exec sp_SaveText '36 SQLCHAR 0 15 "" 36 imprv_non_hstd_val' , @seq output , 1
	exec sp_SaveText '37 SQLCHAR 0 15 "" 37 ag_use_val' , @seq output , 1
	exec sp_SaveText '38 SQLCHAR 0 15 "" 38 ag_market' , @seq output , 1
	exec sp_SaveText '39 SQLCHAR 0 15 "" 39 timber_use' , @seq output , 1
	exec sp_SaveText '40 SQLCHAR 0 15 "" 40 timber_market' , @seq output , 1
	exec sp_SaveText '41 SQLCHAR 0 1 "" 41 partial_entity' , @seq output , 1
	exec sp_SaveText '42 SQLCHAR 0 4 "" 42 freeze_yr' , @seq output , 1
	exec sp_SaveText '43 SQLCHAR 0 15 "" 43 freeze_ceiling' , @seq output , 1
	exec sp_SaveText '44 SQLCHAR 0 1 "" 44 freeze_transfer_flag' , @seq output , 1
	exec sp_SaveText '45 SQLCHAR 0 25 "" 45 freeze_transfer_date' , @seq output , 1
	exec sp_SaveText '46 SQLCHAR 0 15 "" 46 freeze_previous_tax' , @seq output , 1
	exec sp_SaveText '47 SQLCHAR 0 15 "" 47 freeze_previous_tax_unfrozen' , @seq output , 1
	exec sp_SaveText '48 SQLCHAR 0 9 "" 48 freeze_tranfer_percentage' , @seq output , 1
	exec sp_SaveText '49 SQLCHAR 0 15 "" 49 lve_amt' , @seq output , 1
	exec sp_SaveText '50 SQLCHAR 0 15 "" 50 eco_amt' , @seq output , 1
	exec sp_SaveText '51 SQLCHAR 0 15 "" 51 ag_use_val_ne' , @seq output , 1
	exec sp_SaveText '52 SQLCHAR 0 15 "" 52 ag_use_val_ex' , @seq output , 1
	exec sp_SaveText '53 SQLCHAR 0 15 "" 53 ag_market_ne' , @seq output , 1
	exec sp_SaveText '54 SQLCHAR 0 15 "" 54 ag_market_ex' , @seq output , 1
	exec sp_SaveText '55 SQLCHAR 0 15 "" 55 timber_use_ne' , @seq output , 1
	exec sp_SaveText '56 SQLCHAR 0 15 "" 56 timber_use_ex' , @seq output , 1
	exec sp_SaveText '57 SQLCHAR 0 15 "" 57 timber_market_ne' , @seq output , 1
	exec sp_SaveText '58 SQLCHAR 0 15 "" 58 timber_market_ex' , @seq output , 1
	exec sp_SaveText '59 SQLCHAR 0 15 "" 59 new_val_hs' , @seq output , 1
	exec sp_SaveText '60 SQLCHAR 0 15 "" 60 new_val_nhs' , @seq output , 1
	exec sp_SaveText '61 SQLCHAR 0 15 "" 61 new_val_p' , @seq output , 1
	exec sp_SaveText '62 SQLCHAR 0 15 "" 62 new_val_taxable' , @seq output , 1
	exec sp_SaveText '63 SQLCHAR 0 15 "\r\n" 63 dataset_id' , @seq output , 1

end

set @file_name = @path_fmt + '\' +'PROP_ENTITY.FMT'
set @fmt_file_name=@file_name
-- Save the text file
exec sp_SaveTextFile @file_name,@trusted,@user,@pwd

-- Clear the text table
exec sp_SaveTextFile
set @seq = null

-- Create the table script
if @version='8_0_3' or  @version='8_0_2' or  @version='8_0_1'
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
	exec sp_SaveText 'prop_id int NOT NULL ,' , @seq output , 1
	exec sp_SaveText 'prop_val_yr numeric(4, 0) NOT NULL ,' , @seq output , 1
	exec sp_SaveText 'sup_num int NOT NULL ,' , @seq output , 1
	exec sp_SaveText 'owner_id int NOT NULL ,' , @seq output , 1
	exec sp_SaveText 'entity_id int NOT NULL ,' , @seq output , 1
	exec sp_SaveText 'entity_cd varchar (10)  NULL ,' , @seq output , 1
	exec sp_SaveText 'entity_name varchar (50)  NULL ,' , @seq output , 1
	exec sp_SaveText 'entity_prop_id varchar (50)  NULL ,' , @seq output , 1
	exec sp_SaveText 'reserved1 varchar (15)  NULL ,' , @seq output , 1
	exec sp_SaveText 'assessed_val numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'taxable_val numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'ab_amt numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'en_amt numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'fr_amt numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'ht_amt numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'pro_amt numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'pc_amt numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'so_amt numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'ex366_amt numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'hs_amt numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'ov65_amt numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'dp_amt numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'dv_amt numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'ex_amt numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'ch_amt numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'market_value numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'appraised_value numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'hs_cap numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'ag_late_loss numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'freeport_late_loss numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'hs_state_amt numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'hs_local_amt numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'land_hstd_val numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'land_non_hstd_val numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'imprv_hstd_val numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'imprv_non_hstd_val numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'ag_use_val numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'ag_market_val numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'tim_use_val numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'tim_market_val numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'partial_entity varchar (1)  NULL ,' , @seq output , 1
	exec sp_SaveText 'freeze_yr numeric(4, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'freeze_ceiling numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'freeze_transfer_flag char (1)  NULL ,' , @seq output , 1
	exec sp_SaveText 'freeze_transfer_date char (25)  NULL ,' , @seq output , 1
	exec sp_SaveText 'freeze_previous_tax numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'freeze_previous_tax_unfrozen numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'freeze_transfer_percentage varchar(20) ,' , @seq output , 1
	exec sp_SaveText 'lve_amt numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'eco_amt numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'ag_use_val_ne numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'ag_use_val_ex numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'ag_market_ne numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'ag_market_ex numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'timber_use_ne numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'timber_use_ex numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'timber_market_ne numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'timber_market_ex numeric(15, 0) NULL ,' , @seq output , 1

	exec sp_SaveText 'new_val_hs numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'new_val_nhs numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'new_val_p numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'new_val_taxable numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'dataset_id bigint' , @seq output , 1  


	exec sp_SaveText 'constraint pk_import_entity_prop primary key clustered' , @seq output , 1
	exec sp_SaveText '(' , @seq output , 1
	exec sp_SaveText 'prop_val_yr,' , @seq output , 1
	exec sp_SaveText 'prop_id,' , @seq output , 1
	exec sp_SaveText 'owner_id,' , @seq output , 1
	exec sp_SaveText 'sup_num,' , @seq output , 1
	exec sp_SaveText 'entity_id' , @seq output , 1
	exec sp_SaveText ')  ' , @seq output , 1
	exec sp_SaveText ') ' , @seq output , 1
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

