
create function fn_LetterMailingNameAddress
(
	@acct_id int
)
returns varchar(500)

as

begin

declare @crlf char(2)
set @crlf = char(13) + char(10)

declare @file_as_name varchar(70)
declare @addr_line1 varchar(60)
declare @addr_line2 varchar(60)
declare @addr_line3 varchar(60)
declare @addr_city varchar(50)
declare @addr_state varchar(50)
declare @addr_zip varchar(10)
declare @country_name varchar(50)

select @file_as_name = ltrim(rtrim(isnull(a.file_as_name,''))),
			@addr_line1 = ltrim(rtrim(isnull(ad.addr_line1,''))),
			@addr_line2 = ltrim(rtrim(isnull(ad.addr_line2,''))),
			@addr_line3 = ltrim(rtrim(isnull(ad.addr_line3,''))),
			@addr_city = ltrim(rtrim(isnull(ad.addr_city,''))),
			@addr_state = ltrim(rtrim(isnull(ad.addr_state,''))),
			@addr_zip = ltrim(rtrim(isnull(ad.addr_zip,''))),
			@country_name = case when ad.is_international = 1 then c.country_name else '' end
from account as a
with (nolock)
join address as ad
with (nolock)
on a.acct_id = ad.acct_id
and ad.primary_addr = 'Y'
left outer join country as c
with (nolock)
on ad.country_cd = c.country_cd
where a.acct_id = @acct_id

declare @line1 varchar(70)
declare @line2 varchar(70)
declare @line3 varchar(70)
declare @line4 varchar(70)
declare @line5 varchar(70)
declare @line6 varchar(70)

set @line1 = @file_as_name
set @line2 = @addr_line1
set @line3 = @addr_line2
set @line4 = @addr_line3
set @line5 = ''
set @line6 = ''

if len(@addr_city) > 0
begin
	set @line5 = @addr_city
end

if len(@addr_state) > 0
begin
	if len(@line5) > 0
	begin
		set @line5 = @line5 + ', '
	end
	set @line5 = @line5 + @addr_state
end

if len(@addr_zip) > 0
begin
	if len(@line5) > 0
	begin
		set @line5 = @line5 + '  '
	end
	set @line5 = @line5 + @addr_zip
end

if len(@country_name) > 0
begin
	set @line6 = @country_name
end

declare @full_address varchar(500)

set @full_address = @line1

if len(@line2) > 0
begin
	set @full_address = @full_address + @crlf + @line2
end

if len(@line3) > 0
begin
	set @full_address = @full_address + @crlf + @line3
end

if len(@line4) > 0
begin
	set @full_address = @full_address + @crlf + @line4
end

if len(@line5) > 0
begin
	set @full_address = @full_address + @crlf + @line5
end

if len(@line6) > 0
begin
	set @full_address = @full_address + @crlf + @line6
end

return @full_address

end

GO

