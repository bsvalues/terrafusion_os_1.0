
create procedure sp_SaveText
	@text varchar(8000) output,
	@seq int output,
	@flush bit=0, 
	@limit int=7000
as

if @seq is null
	set @seq=1

if datalength(@text)>=@limit or @flush=1
begin
	insert into ##text_export_table
	(text,seq,spid)
	select @text,@seq,@@SPID
	set @seq=@seq+1
	set @text=''
end

GO

