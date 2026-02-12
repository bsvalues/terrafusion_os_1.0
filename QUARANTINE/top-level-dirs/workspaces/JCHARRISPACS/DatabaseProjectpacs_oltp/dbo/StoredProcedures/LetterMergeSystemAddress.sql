

--	HelpStar 20185
--	Added two 'null' parameters so the procedure would work
--	as both a "two id" and a "four id" procedure

CREATE PROCEDURE LetterMergeSystemAddress
	@id1 int,
	@id2 int,
	@year numeric(4,0) = null,
	@sup_num int = null

AS

declare @szLine1 varchar(50)
declare @szLine2 varchar(50)
declare @szLine3 varchar(50)
declare @szCity varchar(50)
declare @szState varchar(2)
declare @szZip varchar(50)
declare @szAddress varchar(400)

select @szLine1  = isnull(addr_line1, ''),
	@szLine2 = isnull(addr_line2, ''),
	@szLine3 = isnull(addr_line3, ''),
	@szCity  = isnull(city, ''),
	@szState = isnull(state, ''),
	@szZip 	 = isnull(zip, '')
from system_address
where system_type IN ('A','C')

set @szAddress = ''

if @szLine1 <> ''
begin
	set @szAddress = @szLine1 + char(13) + char(10)
end

if @szLine2 <> ''
begin
	set @szAddress = @szAddress + @szLine2 + char(13) + char(10)
end

if @szLine3 <> ''
begin
	set @szAddress = @szAddress + @szLine3 + char(13) + char(10)
end

if @szCity <> '' or @szState <> '' or @szZip <> ''
begin
	set @szAddress = @szAddress + @szCity + ', ' + @szState + ' ' + @szZip + char(13) + char(10)
end

if len(@szAddress) > 0
begin
	set @szAddress = left(@szAddress, len(@szAddress) - 1)
end

select county_name as 'county_name',
	office_name as 'office_name',
	chief_appraiser as 'chief_appraiser',
	@szLine1 as 'address_line_1',
	@szLine2 as 'address_line_2',
	@szLine3 as 'address_line_3',
	@szCity + ', ' + @szState + ' ' + @szZip as 'address_city_state_zip',
	@szAddress as 'address_5_lines',
	phone_num as 'phone_number_1',
	phone_num2 as 'phone_number_2',
	fax_num as 'fax_number',
	url as 'internet_url',
	cad_id_code as 'cad_id_code'
from system_address
where system_type IN ('A','C')

GO

