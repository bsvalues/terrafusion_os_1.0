
create procedure BulkInsertAppraisalExportPropertyFile
@data_file_name varchar(255),
@table_name varchar(255) = 'import_prop',
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
	exec sp_SaveText '194' , @seq output , 1
	exec sp_SaveText '1 SQLCHAR 0 12 "" 1 prop_id' , @seq output , 1
	exec sp_SaveText '2 SQLCHAR 0 5 "" 2 prop_type_cd' , @seq output , 1
	exec sp_SaveText '3 SQLCHAR 0 5 "" 3 prop_val_yr' , @seq output , 1
	exec sp_SaveText '4 SQLCHAR 0 12 "" 4 sup_num' , @seq output , 1
	exec sp_SaveText '5 SQLCHAR 0 2 "" 5 sup_action' , @seq output , 1
	exec sp_SaveText '6 SQLCHAR 0 10 "" 6 sup_cd' , @seq output , 1
	exec sp_SaveText '7 SQLCHAR 0 500 "" 7 sup_desc' , @seq output , 1
	exec sp_SaveText '8 SQLCHAR 0 50 "" 8 geo_id' , @seq output , 1
	exec sp_SaveText '9 SQLCHAR 0 12 "" 9 owner_id' , @seq output , 1
	exec sp_SaveText '10 SQLCHAR 0 70 "" 10 py_owner_name' , @seq output , 1
	exec sp_SaveText '11 SQLCHAR 0 1 "" 11 partial_owner' , @seq output , 1
	exec sp_SaveText '12 SQLCHAR 0 14 "" 12 reserved1' , @seq output , 1
	exec sp_SaveText '13 SQLCHAR 0 60 "" 13 py_addr_line1' , @seq output , 1
	exec sp_SaveText '14 SQLCHAR 0 60 "" 14 py_addr_line2' , @seq output , 1
	exec sp_SaveText '15 SQLCHAR 0 60 "" 15 py_addr_line3' , @seq output , 1
	exec sp_SaveText '16 SQLCHAR 0 50 "" 16 py_addr_city' , @seq output , 1
	exec sp_SaveText '17 SQLCHAR 0 50 "" 17 py_addr_state' , @seq output , 1
	exec sp_SaveText '18 SQLCHAR 0 5 "" 18 py_country_cd' , @seq output , 1
	exec sp_SaveText '19 SQLCHAR 0 5 "" 19 py_addr_zip' , @seq output , 1
	exec sp_SaveText '20 SQLCHAR 0 4 "" 20 py_addr_zip_cass' , @seq output , 1
	exec sp_SaveText '21 SQLCHAR 0 2 "" 21 py_addr_zip_rt' , @seq output , 1
	exec sp_SaveText '22 SQLCHAR 0 1 "" 22 py_confidential_flag' , @seq output , 1
	exec sp_SaveText '23 SQLCHAR 0 1 "" 23 py_address_suppress_flag' , @seq output , 1
	exec sp_SaveText '24 SQLCHAR 0 20 "" 24 reserved2' , @seq output , 1
	exec sp_SaveText '25 SQLCHAR 0 1 "" 25 py_addr_ml_deliverable' , @seq output , 1
	exec sp_SaveText '26 SQLCHAR 0 27 "" 26 reserved3' , @seq output , 1
	exec sp_SaveText '27 SQLCHAR 0 10 "" 27 situs_street_prefix' , @seq output , 1
	exec sp_SaveText '28 SQLCHAR 0 50 "" 28 situs_street' , @seq output , 1
	exec sp_SaveText '29 SQLCHAR 0 10 "" 29 situs_street_sufix' , @seq output , 1
	exec sp_SaveText '30 SQLCHAR 0 30 "" 30 situs_city' , @seq output , 1
	exec sp_SaveText '31 SQLCHAR 0 10 "" 31 situs_zip' , @seq output , 1
	exec sp_SaveText '32 SQLCHAR 0 255 "" 32 legal_desc' , @seq output , 1
	exec sp_SaveText '33 SQLCHAR 0 255 "" 33 legal_desc_2' , @seq output , 1
	exec sp_SaveText '34 SQLCHAR 0 16 "" 34 legal_acreage' , @seq output , 1
	exec sp_SaveText '35 SQLCHAR 0 10 "" 35 abs_subdv_cd' , @seq output , 1
	exec sp_SaveText '36 SQLCHAR 0 10 "" 36 hood_cd' , @seq output , 1
	exec sp_SaveText '37 SQLCHAR 0 50 "" 37 block' , @seq output , 1
	exec sp_SaveText '38 SQLCHAR 0 50 "" 38 tract_or_lot' , @seq output , 1
	exec sp_SaveText '39 SQLCHAR 0 15 "" 39 land_hstd_val' , @seq output , 1
	exec sp_SaveText '40 SQLCHAR 0 15 "" 40 land_non_hstd_val' , @seq output , 1
	exec sp_SaveText '41 SQLCHAR 0 15 "" 41 imprv_hstd_val' , @seq output , 1
	exec sp_SaveText '42 SQLCHAR 0 15 "" 42 imprv_non_hstd_val' , @seq output , 1
	exec sp_SaveText '43 SQLCHAR 0 15 "" 43 ag_use_val' , @seq output , 1
	exec sp_SaveText '44 SQLCHAR 0 15 "" 44 ag_market' , @seq output , 1
	exec sp_SaveText '45 SQLCHAR 0 15 "" 45 timber_use' , @seq output , 1
	exec sp_SaveText '46 SQLCHAR 0 15 "" 46 timber_market' , @seq output , 1
	exec sp_SaveText '47 SQLCHAR 0 15 "" 47 appraised_val' , @seq output , 1
	exec sp_SaveText '48 SQLCHAR 0 15 "" 48 ten_percent_cap' , @seq output , 1
	exec sp_SaveText '49 SQLCHAR 0 15 "" 49 assessed_val' , @seq output , 1
	exec sp_SaveText '50 SQLCHAR 0 20 "" 50 reserved4' , @seq output , 1
	exec sp_SaveText '51 SQLCHAR 0 1 "" 51 arb_protest_flag' , @seq output , 1
	exec sp_SaveText '52 SQLCHAR 0 12 "" 52 reserved5' , @seq output , 1
	exec sp_SaveText '53 SQLCHAR 0 20 "" 53 deed_book_id' , @seq output , 1
	exec sp_SaveText '54 SQLCHAR 0 20 "" 54 deed_book_page' , @seq output , 1
	exec sp_SaveText '55 SQLCHAR 0 25 "" 55 deed_book_dt' , @seq output , 1
	exec sp_SaveText '56 SQLCHAR 0 12 "" 56 mortgage_co_id' , @seq output , 1
	exec sp_SaveText '57 SQLCHAR 0 70 "" 57 mortgage_co_name' , @seq output , 1
	exec sp_SaveText '58 SQLCHAR 0 50 "" 58 mortgage_acct_id' , @seq output , 1
	exec sp_SaveText '59 SQLCHAR 0 12 "" 59 jan1_owner_id' , @seq output , 1
	exec sp_SaveText '60 SQLCHAR 0 70 "" 60 jan1_owner_name' , @seq output , 1
	exec sp_SaveText '61 SQLCHAR 0 60 "" 61 jan1_addr_line1' , @seq output , 1
	exec sp_SaveText '62 SQLCHAR 0 60 "" 62 jan1_addr_line2' , @seq output , 1
	exec sp_SaveText '63 SQLCHAR 0 60 "" 63 jan1_addr_line3' , @seq output , 1
	exec sp_SaveText '64 SQLCHAR 0 50 "" 64 jan1_addr_city' , @seq output , 1
	exec sp_SaveText '65 SQLCHAR 0 50 "" 65 jan1_addr_state' , @seq output , 1
	exec sp_SaveText '66 SQLCHAR 0 5 "" 66 jan1_addr_country' , @seq output , 1
	exec sp_SaveText '67 SQLCHAR 0 5 "" 67 jan1_addr_zip' , @seq output , 1
	exec sp_SaveText '68 SQLCHAR 0 4 "" 68 jan1_addr_zip_cass' , @seq output , 1
	exec sp_SaveText '69 SQLCHAR 0 2 "" 69 jan1_addr_zip_rt' , @seq output , 1
	exec sp_SaveText '70 SQLCHAR 0 1 "" 70 jan1_confidential_flag' , @seq output , 1
	exec sp_SaveText '71 SQLCHAR 0 1 "" 71 jan1_address_suppress_flag' , @seq output , 1
	exec sp_SaveText '72 SQLCHAR 0 37 "" 72 reserved6' , @seq output , 1
	exec sp_SaveText '73 SQLCHAR 0 1 "" 73 jan1_ml_deleverible' , @seq output , 1
	exec sp_SaveText '74 SQLCHAR 0 1 "" 74 hs_exempt' , @seq output , 1
	exec sp_SaveText '75 SQLCHAR 0 1 "" 75 ov65_exempt' , @seq output , 1
	exec sp_SaveText '76 SQLCHAR 0 25 "" 76 ov65_prorate_begin' , @seq output , 1
	exec sp_SaveText '77 SQLCHAR 0 25 "" 77 ov65_prorate_end' , @seq output , 1
	exec sp_SaveText '78 SQLCHAR 0 1 "" 78 ov65s_exempt' , @seq output , 1
	exec sp_SaveText '79 SQLCHAR 0 1 "" 79 dp_exempt' , @seq output , 1
	exec sp_SaveText '80 SQLCHAR 0 1 "" 80 dv1_exempt' , @seq output , 1
	exec sp_SaveText '81 SQLCHAR 0 1 "" 81 dv1s_exempt' , @seq output , 1
	exec sp_SaveText '82 SQLCHAR 0 1 "" 82 dv2_exempt' , @seq output , 1
	exec sp_SaveText '83 SQLCHAR 0 1 "" 83 dv2s_exempt' , @seq output , 1
	exec sp_SaveText '84 SQLCHAR 0 1 "" 84 dv3_exempt' , @seq output , 1
	exec sp_SaveText '85 SQLCHAR 0 1 "" 85 dv3s_exempt' , @seq output , 1
	exec sp_SaveText '86 SQLCHAR 0 1 "" 86 dv4_exempt' , @seq output , 1
	exec sp_SaveText '87 SQLCHAR 0 1 "" 87 dv4s_exempt' , @seq output , 1
	exec sp_SaveText '88 SQLCHAR 0 1 "" 88 ex_exempt' , @seq output , 1
	exec sp_SaveText '89 SQLCHAR 0 25 "" 89 ex_prorate_begin' , @seq output , 1
	exec sp_SaveText '90 SQLCHAR 0 25 "" 90 ex_prorate_end' , @seq output , 1
	exec sp_SaveText '91 SQLCHAR 0 1 "" 91 lve_exempt' , @seq output , 1
	exec sp_SaveText '92 SQLCHAR 0 1 "" 92 ab_exempt' , @seq output , 1
	exec sp_SaveText '93 SQLCHAR 0 1 "" 93 en_exempt' , @seq output , 1
	exec sp_SaveText '94 SQLCHAR 0 1 "" 94 fr_exempt' , @seq output , 1
	exec sp_SaveText '95 SQLCHAR 0 1 "" 95 ht_exempt' , @seq output , 1
	exec sp_SaveText '96 SQLCHAR 0 1 "" 96 pro_exempt' , @seq output , 1
	exec sp_SaveText '97 SQLCHAR 0 1 "" 97 pc_exempt' , @seq output , 1
	exec sp_SaveText '98 SQLCHAR 0 1 "" 98 so_exempt' , @seq output , 1
	exec sp_SaveText '99 SQLCHAR 0 1 "" 99 ex366_exempt' , @seq output , 1
	exec sp_SaveText '100 SQLCHAR 0 1 "" 100 ch_exempt' , @seq output , 1
	exec sp_SaveText '101 SQLCHAR 0 10 "" 101 imprv_state_cd' , @seq output , 1
	exec sp_SaveText '102 SQLCHAR 0 10 "" 102 land_state_cd' , @seq output , 1
	exec sp_SaveText '103 SQLCHAR 0 10 "" 103 personal_state_cd' , @seq output , 1
	exec sp_SaveText '104 SQLCHAR 0 10 "" 104 mineral_state_cd' , @seq output , 1
	exec sp_SaveText '105 SQLCHAR 0 20 "" 105 land_acres' , @seq output , 1
	exec sp_SaveText '106 SQLCHAR 0 12 "" 106 entity_agent_id' , @seq output , 1
	exec sp_SaveText '107 SQLCHAR 0 70 "" 107 entity_agent_name' , @seq output , 1
	exec sp_SaveText '108 SQLCHAR 0 60 "" 108 entity_agent_addr_line1' , @seq output , 1
	exec sp_SaveText '109 SQLCHAR 0 60 "" 109 entity_agent_addr_line2' , @seq output , 1
	exec sp_SaveText '110 SQLCHAR 0 60 "" 110 entity_agent_addr_line3' , @seq output , 1
	exec sp_SaveText '111 SQLCHAR 0 50 "" 111 entity_agent_city' , @seq output , 1
	exec sp_SaveText '112 SQLCHAR 0 50 "" 112 entity_agent_state' , @seq output , 1
	exec sp_SaveText '113 SQLCHAR 0 5 "" 113 entity_agent_country' , @seq output , 1
	exec sp_SaveText '114 SQLCHAR 0 5 "" 114 entity_agent_zip' , @seq output , 1
	exec sp_SaveText '115 SQLCHAR 0 4 "" 115 entity_agent_cass' , @seq output , 1
	exec sp_SaveText '116 SQLCHAR 0 2 "" 116 entity_agent_rt' , @seq output , 1
	exec sp_SaveText '117 SQLCHAR 0 34 "" 117 reserved7' , @seq output , 1
	exec sp_SaveText '118 SQLCHAR 0 12 "" 118 ca_agent_id' , @seq output , 1
	exec sp_SaveText '119 SQLCHAR 0 70 "" 119 ca_agent_name' , @seq output , 1
	exec sp_SaveText '120 SQLCHAR 0 60 "" 120 ca_agent_addr_line1' , @seq output , 1
	exec sp_SaveText '121 SQLCHAR 0 60 "" 121 ca_agent_addr_line2' , @seq output , 1
	exec sp_SaveText '122 SQLCHAR 0 60 "" 122 ca_agent_addr_line3' , @seq output , 1
	exec sp_SaveText '123 SQLCHAR 0 50 "" 123 ca_agent_city' , @seq output , 1
	exec sp_SaveText '124 SQLCHAR 0 50 "" 124 ca_agent_state' , @seq output , 1
	exec sp_SaveText '125 SQLCHAR 0 5 "" 125 ca_agent_country' , @seq output , 1
	exec sp_SaveText '126 SQLCHAR 0 5 "" 126 ca_agent_zip' , @seq output , 1
	exec sp_SaveText '127 SQLCHAR 0 4 "" 127 ca_agent_cass' , @seq output , 1
	exec sp_SaveText '128 SQLCHAR 0 2 "" 128 ca_agent_rt' , @seq output , 1
	exec sp_SaveText '129 SQLCHAR 0 34 "" 129 reserved8' , @seq output , 1
	exec sp_SaveText '130 SQLCHAR 0 12 "" 130 arb_agent_id' , @seq output , 1
	exec sp_SaveText '131 SQLCHAR 0 70 "" 131 arb_agent_name' , @seq output , 1
	exec sp_SaveText '132 SQLCHAR 0 60 "" 132 arb_agent_addr_line1' , @seq output , 1
	exec sp_SaveText '133 SQLCHAR 0 60 "" 133 arb_agent_addr_line2' , @seq output , 1
	exec sp_SaveText '134 SQLCHAR 0 60 "" 134 arb_agent_addr_line3' , @seq output , 1
	exec sp_SaveText '135 SQLCHAR 0 50 "" 135 arb_agent_city' , @seq output , 1
	exec sp_SaveText '136 SQLCHAR 0 50 "" 136 arb_agent_state' , @seq output , 1
	exec sp_SaveText '137 SQLCHAR 0 5 "" 137 arb_agent_country' , @seq output , 1
	exec sp_SaveText '138 SQLCHAR 0 5 "" 138 arb_agent_zip' , @seq output , 1
	exec sp_SaveText '139 SQLCHAR 0 4 "" 139 arb_agent_cass' , @seq output , 1
	exec sp_SaveText '140 SQLCHAR 0 2 "" 140 arb_agent_rt' , @seq output , 1
	exec sp_SaveText '141 SQLCHAR 0 34 "" 141 reserved9' , @seq output , 1
	exec sp_SaveText '142 SQLCHAR 0 5 "" 142 mineral_type_of_int' , @seq output , 1
	exec sp_SaveText '143 SQLCHAR 0 15 "" 143 mineral_pct_int' , @seq output , 1
	exec sp_SaveText '144 SQLCHAR 0 3 "" 144 productivity_use_code' , @seq output , 1
	exec sp_SaveText '145 SQLCHAR 0 40 "" 145 reserved17' , @seq output , 1
	exec sp_SaveText '146 SQLCHAR 0 12 "" 146 timber_78_market' , @seq output , 1
	exec sp_SaveText '147 SQLCHAR 0 12 "" 147 ag_late_loss' , @seq output , 1
	exec sp_SaveText '148 SQLCHAR 0 12 "" 148 late_freeport_penalty' , @seq output , 1
	exec sp_SaveText '149 SQLCHAR 0 2 "" 149 reserved10' , @seq output , 1
	exec sp_SaveText '150 SQLCHAR 0 5 "" 150 reserved11' , @seq output , 1
	exec sp_SaveText '151 SQLCHAR 0 2 "" 151 reserved12' , @seq output , 1
	exec sp_SaveText '152 SQLCHAR 0 40 "" 152 dba_name' , @seq output , 1
	exec sp_SaveText '153 SQLCHAR 0 38 "" 153 reserved13' , @seq output , 1
	exec sp_SaveText '154 SQLCHAR 0 14 "" 154 market_value' , @seq output , 1
	exec sp_SaveText '155 SQLCHAR 0 20 "" 155 mh_label' , @seq output , 1
	exec sp_SaveText '156 SQLCHAR 0 20 "" 156 mh_serial' , @seq output , 1
	exec sp_SaveText '157 SQLCHAR 0 20 "" 157 mh_model' , @seq output , 1
	exec sp_SaveText '158 SQLCHAR 0 1 "" 158 reserved14' , @seq output , 1
	exec sp_SaveText '159 SQLCHAR 0 1 "" 159 reserved15' , @seq output , 1
	exec sp_SaveText '160 SQLCHAR 0 70 "" 160 reserved16' , @seq output , 1
	exec sp_SaveText '161 SQLCHAR 0 25 "" 161 ov65_deferral_date' , @seq output , 1
	exec sp_SaveText '162 SQLCHAR 0 25 "" 162 dp_deferral_date' , @seq output , 1
	exec sp_SaveText '163 SQLCHAR 0 25 "" 163 ref_id1' , @seq output , 1
	exec sp_SaveText '164 SQLCHAR 0 25 "" 164 ref_id2' , @seq output , 1
	exec sp_SaveText '165 SQLCHAR 0 15 "" 165 situs_num' , @seq output , 1
	exec sp_SaveText '166 SQLCHAR 0 5 "" 166 situs_unit' , @seq output , 1
	exec sp_SaveText '167 SQLCHAR 0 12 "" 167 appr_owner_id' , @seq output , 1
	exec sp_SaveText '168 SQLCHAR 0 70 "" 168 appr_owner_name' , @seq output , 1
	exec sp_SaveText '169 SQLCHAR 0 60 "" 169 appr_addr_line1' , @seq output , 1
	exec sp_SaveText '170 SQLCHAR 0 60 "" 170 appr_addr_line2' , @seq output , 1
	exec sp_SaveText '171 SQLCHAR 0 60 "" 171 appr_addr_line3' , @seq output , 1
	exec sp_SaveText '172 SQLCHAR 0 50 "" 172 appr_addr_city' , @seq output , 1
	exec sp_SaveText '173 SQLCHAR 0 50 "" 173 appr_addr_state' , @seq output , 1
	exec sp_SaveText '174 SQLCHAR 0 5 "" 174 appr_addr_country' , @seq output , 1
	exec sp_SaveText '175 SQLCHAR 0 5 "" 175 appr_addr_zip' , @seq output , 1
	exec sp_SaveText '176 SQLCHAR 0 4 "" 176 appr_addr_zip_cass' , @seq output , 1
	exec sp_SaveText '177 SQLCHAR 0 2 "" 177 appr_addr_zip_cass_route' , @seq output , 1
	exec sp_SaveText '178 SQLCHAR 0 1 "" 178 appr_ml_deliverable' , @seq output , 1
	exec sp_SaveText '179 SQLCHAR 0 1 "" 179 appr_confidential_flag' , @seq output , 1
	exec sp_SaveText '180 SQLCHAR 0 1 "" 180 appr_address_suppress_flag' , @seq output , 1
	exec sp_SaveText '181 SQLCHAR 0 70 "" 181 appr_confidential_name' , @seq output , 1
	exec sp_SaveText '182 SQLCHAR 0 70 "" 182 py_confidential_name' , @seq output , 1
	exec sp_SaveText '183 SQLCHAR 0 70 "" 183 jan1_confidential_name' , @seq output , 1
	exec sp_SaveText '184 SQLCHAR 0 5 "" 184 sic_code' , @seq output , 1
	exec sp_SaveText '185 SQLCHAR 0 1 "" 185 rendition_filed' , @seq output , 1
	exec sp_SaveText '186 SQLCHAR 0 25 "" 186 rendition_date' , @seq output , 1
	exec sp_SaveText '187 SQLCHAR 0 15 "" 187 rendition_penalty' , @seq output , 1
	exec sp_SaveText '188 SQLCHAR 0 25 "" 188 rendition_penalty_date_paid' , @seq output , 1
	exec sp_SaveText '189 SQLCHAR 0 15 "" 189 fraud_penalty' , @seq output , 1
	exec sp_SaveText '190 SQLCHAR 0 25 "" 190 rendition_fraud_penalty_date_paid' , @seq output , 1
	exec sp_SaveText '191 SQLCHAR 0 20 "" 191 deed_num' , @seq output , 1
	exec sp_SaveText '192 SQLCHAR 0 140 "" 192 entities' , @seq output , 1
	exec sp_SaveText '193 SQLCHAR 0 1 "" 193 eco_exempt' , @seq output , 1
	exec sp_SaveText '194 SQLCHAR 0 15 "\r\n" 194 dataset_id' , @seq output , 1

end

set @file_name = @path_fmt + '\' +'PROP.FMT'
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
	exec sp_SaveText 'prop_type_cd varchar (5) NULL ,' , @seq output , 1
	exec sp_SaveText 'prop_val_yr numeric(5, 0) NOT NULL ,' , @seq output , 1
	exec sp_SaveText 'sup_num int NOT NULL ,' , @seq output , 1
	exec sp_SaveText 'sup_action varchar (2) NULL ,' , @seq output , 1
	exec sp_SaveText 'sup_cd varchar (10) NULL ,' , @seq output , 1
	exec sp_SaveText 'sup_desc varchar (500) NULL ,' , @seq output , 1
	exec sp_SaveText 'geo_id varchar (50) NULL ,' , @seq output , 1
	exec sp_SaveText 'py_owner_id int NOT NULL ,' , @seq output , 1
	exec sp_SaveText 'py_owner_name varchar (70) NULL ,' , @seq output , 1
	exec sp_SaveText 'partial_owner varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'filler1 varchar (14) NULL ,' , @seq output , 1
	exec sp_SaveText 'py_addr_line1 varchar (60) NULL ,' , @seq output , 1
	exec sp_SaveText 'py_addr_line2 varchar (60) NULL ,' , @seq output , 1
	exec sp_SaveText 'py_addr_line3 varchar (60) NULL ,' , @seq output , 1
	exec sp_SaveText 'py_addr_city varchar (50) NULL ,' , @seq output , 1
	exec sp_SaveText 'py_addr_state varchar (50) NULL ,' , @seq output , 1
	exec sp_SaveText 'py_addr_country varchar (5) NULL ,' , @seq output , 1
	exec sp_SaveText 'py_addr_zip varchar (5) NULL ,' , @seq output , 1
	exec sp_SaveText 'py_addr_zip_cass varchar (4) NULL ,' , @seq output , 1
	exec sp_SaveText 'py_addr_zip_rt varchar (2) NULL ,' , @seq output , 1
	exec sp_SaveText 'py_confidential_flag varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'py_address_suppress_flag varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'filler2 varchar (20) NULL ,' , @seq output , 1
	exec sp_SaveText 'py_addr_ml_deliverable varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'filler3 varchar (27) NULL ,' , @seq output , 1
	exec sp_SaveText 'situs_street_prefx varchar (10) NULL ,' , @seq output , 1
	exec sp_SaveText 'situs_street varchar (50) NULL ,' , @seq output , 1
	exec sp_SaveText 'situs_street_suffix varchar (10) NULL ,' , @seq output , 1
	exec sp_SaveText 'situs_city varchar (30) NULL ,' , @seq output , 1
	exec sp_SaveText 'situs_zip varchar (10) NULL ,' , @seq output , 1
	exec sp_SaveText 'legal_desc varchar (255) NULL ,' , @seq output , 1
	exec sp_SaveText 'legal_desc2 varchar (255) NULL ,' , @seq output , 1
	exec sp_SaveText 'legal_acreage numeric(16, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'abs_subdv_cd varchar (10) NULL ,' , @seq output , 1
	exec sp_SaveText 'hood_cd varchar (10) NULL ,' , @seq output , 1
	exec sp_SaveText 'block varchar (50) NULL ,' , @seq output , 1
	exec sp_SaveText 'tract_or_lot varchar (50) NULL ,' , @seq output , 1
	exec sp_SaveText 'land_hstd_val numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'land_non_hstd_val numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'imprv_hstd_val numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'imprv_non_hstd_val numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'ag_use_val numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'ag_market numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'timber_use numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'timber_market numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'appraised_val numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'ten_percent_cap numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'assessed_val numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'filler4 varchar (20) NULL ,' , @seq output , 1
	exec sp_SaveText 'arb_protest_flag varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'filler5 int NULL ,' , @seq output , 1
	exec sp_SaveText 'deed_book_id varchar (20) NULL ,' , @seq output , 1
	exec sp_SaveText 'deed_book_page varchar (20) NULL ,' , @seq output , 1
	exec sp_SaveText 'deed_dt varchar (25) NULL ,' , @seq output , 1
	exec sp_SaveText 'mortgage_co_id int NULL ,' , @seq output , 1
	exec sp_SaveText 'mortage_co_name varchar (70) NULL ,' , @seq output , 1
	exec sp_SaveText 'mortgage_acct_id varchar (50) NULL ,' , @seq output , 1
	exec sp_SaveText 'jan1_owner_id int NULL ,' , @seq output , 1
	exec sp_SaveText 'jan1_owner_name varchar (70) NULL ,' , @seq output , 1
	exec sp_SaveText 'jan1_addr_line1 varchar (60) NULL ,' , @seq output , 1
	exec sp_SaveText 'jan1_addr_line2 varchar (60) NULL ,' , @seq output , 1
	exec sp_SaveText 'jan1_addr_line3 varchar (60) NULL ,' , @seq output , 1
	exec sp_SaveText 'jan1_addr_city varchar (50) NULL ,' , @seq output , 1
	exec sp_SaveText 'jan1_addr_state varchar (50) NULL ,' , @seq output , 1
	exec sp_SaveText 'jan1_addr_country varchar (5) NULL ,' , @seq output , 1
	exec sp_SaveText 'jan1_addr_zip varchar (5) NULL ,' , @seq output , 1
	exec sp_SaveText 'jan1_addr_zip_cass varchar (4) NULL ,' , @seq output , 1
	exec sp_SaveText 'jan1_addr_zip_rt varchar (2) NULL ,' , @seq output , 1
	exec sp_SaveText 'jan1_confidential_flag varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'jan1_address_suppress_flag varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'filler6 varchar (37) NULL ,' , @seq output , 1
	exec sp_SaveText 'jan1_ml_deliverable varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'hs_exempt varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'ov65_exempt varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'ov65_prorate_begin varchar (25) NULL ,' , @seq output , 1
	exec sp_SaveText 'ov65_prorate_end varchar (25) NULL ,' , @seq output , 1
	exec sp_SaveText 'ov65s_exempt varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'dp_exempt varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'dv1_exempt varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'dv1s_exempt varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'dv2_exempt varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'dv2s_exempt varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'dv3_exempt varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'dv3s_exempt varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'dv4_exempt varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'dv4s_exempt varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'ex_exempt varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'ex_prorate_begin varchar (25) NULL ,' , @seq output , 1
	exec sp_SaveText 'ex_prorate_end varchar (25) NULL ,' , @seq output , 1
	exec sp_SaveText 'lve_exempt varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'ab_exempt varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'en_exempt varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'fr_exempt varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'ht_exempt varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'pro_exempt varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'pc_exempt varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'so_exempt varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'ex366_exempt varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'ch_exempt varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'imprv_state_cd varchar (10) NULL ,' , @seq output , 1
	exec sp_SaveText 'land_state_cd varchar (10) NULL ,' , @seq output , 1
	exec sp_SaveText 'personal_state_cd varchar (10) NULL ,' , @seq output , 1
	exec sp_SaveText 'mineral_state_cd varchar (10) NULL ,' , @seq output , 1
	exec sp_SaveText 'land_acres numeric(20, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'entity_agent_id int NULL ,' , @seq output , 1
	exec sp_SaveText 'entity_agent_name varchar (70) NULL ,' , @seq output , 1
	exec sp_SaveText 'entity_agent_addr_line1 varchar (60) NULL ,' , @seq output , 1
	exec sp_SaveText 'entity_agent_addr_line2 varchar (60) NULL ,' , @seq output , 1
	exec sp_SaveText 'entity_agent_addr_line3 varchar (60) NULL ,' , @seq output , 1
	exec sp_SaveText 'entity_agent_city varchar (50) NULL ,' , @seq output , 1
	exec sp_SaveText 'entity_agent_state varchar (50) NULL ,' , @seq output , 1
	exec sp_SaveText 'entity_agent_country varchar (5) NULL ,' , @seq output , 1
	exec sp_SaveText 'entity_agent_zip varchar (5) NULL ,' , @seq output , 1
	exec sp_SaveText 'entity_agent_cass varchar (4) NULL ,' , @seq output , 1
	exec sp_SaveText 'entity_agent_rt varchar (2) NULL ,' , @seq output , 1
	exec sp_SaveText 'filler7 varchar (34) NULL ,' , @seq output , 1
	exec sp_SaveText 'ca_agent_id int NULL ,' , @seq output , 1
	exec sp_SaveText 'ca_agent_name varchar (70) NULL ,' , @seq output , 1
	exec sp_SaveText 'ca_agent_addr_line1 varchar (60) NULL ,' , @seq output , 1
	exec sp_SaveText 'ca_agent_addr_line2 varchar (60) NULL ,' , @seq output , 1
	exec sp_SaveText 'ca_agent_addr_line3 varchar (60) NULL ,' , @seq output , 1
	exec sp_SaveText 'ca_agent_city varchar (50) NULL ,' , @seq output , 1
	exec sp_SaveText 'ca_agent_state varchar (50) NULL ,' , @seq output , 1
	exec sp_SaveText 'ca_agent_country varchar (5) NULL ,' , @seq output , 1
	exec sp_SaveText 'ca_agent_zip varchar (5) NULL ,' , @seq output , 1
	exec sp_SaveText 'ca_agent_zip_cass varchar (4) NULL ,' , @seq output , 1
	exec sp_SaveText 'ca_agent_zip_rt varchar (2) NULL ,' , @seq output , 1
	exec sp_SaveText 'filler8 varchar (34) NULL ,' , @seq output , 1
	exec sp_SaveText 'arb_agent_id int NULL ,' , @seq output , 1
	exec sp_SaveText 'arb_agent_name varchar (70) NULL ,' , @seq output , 1
	exec sp_SaveText 'arb_agent_addr_line1 varchar (60) NULL ,' , @seq output , 1
	exec sp_SaveText 'arb_agent_addr_line2 varchar (60) NULL ,' , @seq output , 1
	exec sp_SaveText 'arb_agent_addr_line3 varchar (60) NULL ,' , @seq output , 1
	exec sp_SaveText 'arb_agent_city varchar (50) NULL ,' , @seq output , 1
	exec sp_SaveText 'arb_agent_state varchar (50) NULL ,' , @seq output , 1
	exec sp_SaveText 'arb_agent_country varchar (5) NULL ,' , @seq output , 1
	exec sp_SaveText 'arb_agent_zip varchar (5) NULL ,' , @seq output , 1
	exec sp_SaveText 'arb_agent_zip_cass varchar (4) NULL ,' , @seq output , 1
	exec sp_SaveText 'arb_agent_zip_rt varchar (2) NULL ,' , @seq output , 1
	exec sp_SaveText 'filler9 varchar (34) NULL ,' , @seq output , 1
	exec sp_SaveText 'mineral_type_of_int varchar (5) NULL ,' , @seq output , 1
	exec sp_SaveText 'mineral_int_pct varchar (15) NULL ,' , @seq output , 1
	exec sp_SaveText 'productivity_use_code varchar (3) NULL ,' , @seq output , 1
	exec sp_SaveText 'filler10 varchar (40) NULL ,' , @seq output , 1
	exec sp_SaveText 'timber_78_market int NULL ,' , @seq output , 1
	exec sp_SaveText 'ag_late_loss int NULL ,' , @seq output , 1
	exec sp_SaveText 'late_freeport_penalty int NULL ,' , @seq output , 1
	exec sp_SaveText 'filler11 varchar (2) NULL ,' , @seq output , 1
	exec sp_SaveText 'filler12 varchar (5) NULL ,' , @seq output , 1
	exec sp_SaveText 'filler13 varchar (2) NULL ,' , @seq output , 1
	exec sp_SaveText 'dba varchar (40) NULL ,' , @seq output , 1
	exec sp_SaveText 'filler14 varchar (38) NULL ,' , @seq output , 1
	exec sp_SaveText 'market_value numeric(14, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'mh_label varchar (20) NULL ,' , @seq output , 1
	exec sp_SaveText 'mh_serial varchar (20) NULL ,' , @seq output , 1
	exec sp_SaveText 'mh_model varchar (20) NULL ,' , @seq output , 1
	exec sp_SaveText 'filler15 varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'filler16 varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'filler17 varchar (70) NULL ,' , @seq output , 1
	exec sp_SaveText 'ov65_deferral_date varchar (25) NULL ,' , @seq output , 1
	exec sp_SaveText 'dp_deferral_date varchar (25) NULL ,' , @seq output , 1
	exec sp_SaveText 'ref_id1 varchar (25) NULL ,' , @seq output , 1
	exec sp_SaveText 'ref_id2 varchar (25) NULL ,' , @seq output , 1
	exec sp_SaveText 'situs_num varchar (15) NULL ,' , @seq output , 1
	exec sp_SaveText 'situs_unit varchar (5) NULL ,' , @seq output , 1
	exec sp_SaveText 'appr_owner_id int NULL ,' , @seq output , 1
	exec sp_SaveText 'appr_owner_name varchar (70) NULL ,' , @seq output , 1
	exec sp_SaveText 'appr_addr_line1 varchar (60) NULL ,' , @seq output , 1
	exec sp_SaveText 'appr_addr_line2 varchar (60) NULL ,' , @seq output , 1
	exec sp_SaveText 'appr_addr_line3 varchar (60) NULL ,' , @seq output , 1
	exec sp_SaveText 'appr_addr_city varchar (50) NULL ,' , @seq output , 1
	exec sp_SaveText 'appr_addr_state varchar (50) NULL ,' , @seq output , 1
	exec sp_SaveText 'appr_addr_country varchar (5) NULL ,' , @seq output , 1
	exec sp_SaveText 'appr_addr_zip varchar (5) NULL ,' , @seq output , 1
	exec sp_SaveText 'appr_addr_zip_cass varchar (4) NULL ,' , @seq output , 1
	exec sp_SaveText 'appr_addr_zip_cass_route varchar (2) NULL ,' , @seq output , 1
	exec sp_SaveText 'appr_ml_deliverable varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'appr_confidential_flag varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'appr_address_suppress_flag varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'appr_confidential_name varchar (70) NULL ,' , @seq output , 1
	exec sp_SaveText 'py_confidential_name varchar (70) NULL ,' , @seq output , 1
	exec sp_SaveText 'jan1_confidential_name varchar (70) NULL ,' , @seq output , 1
	exec sp_SaveText 'sic_code varchar (5) NULL ,' , @seq output , 1
	exec sp_SaveText 'rendition_filed varchar (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'rendition_date varchar (25) NULL ,' , @seq output , 1
	exec sp_SaveText 'rendition_penalty numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'rendition_penalty_date_paid varchar (25) NULL ,' , @seq output , 1
	exec sp_SaveText 'rendition_fraud_penalty numeric(15, 0) NULL ,' , @seq output , 1
	exec sp_SaveText 'rendition_fraud_penalty_date_paid varchar (25) NULL ,' , @seq output , 1
	exec sp_SaveText 'deed_num varchar (20) NULL ,' , @seq output , 1
	exec sp_SaveText 'entities varchar (140) NULL ,' , @seq output , 1
	exec sp_SaveText 'eco_exempt char (1) NULL ,' , @seq output , 1
	exec sp_SaveText 'dataset_id bigint NULL ' , @seq output , 1
	exec sp_SaveText 'constraint pk_import_prop primary key clustered' , @seq output , 1
	exec sp_SaveText '(' , @seq output , 1
	exec sp_SaveText 'prop_val_yr,' , @seq output , 1
	exec sp_SaveText 'sup_num,' , @seq output , 1
	exec sp_SaveText 'prop_id,' , @seq output , 1
	exec sp_SaveText 'py_owner_id' , @seq output , 1
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

