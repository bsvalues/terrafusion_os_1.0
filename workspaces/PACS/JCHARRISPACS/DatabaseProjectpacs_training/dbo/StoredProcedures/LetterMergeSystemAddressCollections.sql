
CREATE PROCEDURE LetterMergeSystemAddressCollections
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
where system_type = 'C'

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

select county_name as 'coll_county_name',
	office_name as 'coll_office_name',
	@szLine1 as 'coll_address_line_1',
	@szLine2 as 'coll_address_line_2',
	@szLine3 as 'coll_address_line_3',
	@szCity + ', ' + @szState + ' ' + @szZip as 'coll_address_city_state_zip',
	@szAddress as 'coll_address_5_lines',
	phone_num as 'coll_phone_number_1',
	phone_num2 as 'coll_phone_number_2',
	fax_num as 'coll_fax_number',
	url as 'coll_internet_url'
from system_address
where system_type = 'C'

GO

