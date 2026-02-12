
CREATE PROCEDURE PropMortAssoc_ProcessErrors 

	@bGEOID bit

AS

declare @lRowCount int
declare @nMatch int
declare @client_name varchar(50)

select top 1 @client_name = upper(client_name)
from pacs_system
with (nolock)

if not exists (select * from PropMortAssoc_ErrMsgs)
begin
	insert PropMortAssoc_ErrMsgs (errCode, errMsg)
	values('P','No matching property id for the given property id')
	
	insert PropMortAssoc_ErrMsgs (errCode, errMsg)
	values('G','No matching property id for the given geo id')
	
	insert PropMortAssoc_ErrMsgs (errCode, errMsg)
	values('M','No matching mortgage company id for the given lender number')
	
	insert PropMortAssoc_ErrMsgs (errCode, errMsg)
	values('PM','No matching property id and mortgage company id for the given property id and lender number respectively')
	
	insert PropMortAssoc_ErrMsgs (errCode, errMsg)
	values('GM','No matching property id and mortgage company id for the given geo id and lender number respectively')
end

truncate table PropMortAssoc_errors

select @lRowCount = count(distinct lenderNo)
from PropMortAssoc_data
with (nolock)

insert into PropMortAssoc_DataSummary (memo)
values ('Distinct Lenders: '+ ltrim(str(@lRowCount)))

if @client_name <> 'TRAVIS'
begin
	if (@bGeoID = 1)
	begin
		insert PropMortAssoc_errors (datRec, errType)
		select recNo as datRec, 
		      errType = case
		        when ((propID is null) and (mortID is not null)) then 'G'
		        when ((mortID is null) and (propID is not null)) then 'M'
		        when ((propID is null) and (mortID is null)) then 'GM'
		      end
		from PropMortAssoc_GeoID_Vw
		where (propID is null) or (mortID is null) 
		
		select @lRowCount = count(propID) from PropMortAssoc_GeoID_Vw
		where (propID is not null) and (mortID is not null)
		
		set @nMatch = @lRowCount
		
		insert into PropMortAssoc_DataSummary (memo)
		values ('Matches: ' + ltrim(str(@nMatch)))
	end
	else if (@bGeoID = 0)
	begin
	   insert PropMortAssoc_errors (datRec, errType)
	   select recNo as datRec, 
	          errType = case 
	            when ((propID is null) and (mortID is not null)) then 'P'
	            when ((mortID is null) and (propID is not null)) then 'M'
	            when ((propID is null) and (mortID is null)) then 'PM'
	          end
	   from PropMortAssoc_PropID_Vw
	   where (propID is null) or (mortID is null) 
	   
	   select @lRowCount = count(propID) from PropMortAssoc_PropID_Vw
	   where (propID is not null) and (mortID is not null)
	      
	   set @nMatch = @lRowCount
	
	   insert into PropMortAssoc_DataSummary (memo)
	   values ('Matches: ' + ltrim(str(@nMatch)))
	 end
	
	
end
else
begin
	insert PropMortAssoc_errors (datRec, errType)
	select recNo as datRec, 
	      errType = case
	        when ((p.prop_id is null) and (mc.mortgage_co_id is not null)) then 'P'
	        when ((mc.mortgage_co_id is null) and (p.prop_id is not null)) then 'M'
	        when ((p.prop_id is null) and (mc.mortgage_co_id is null)) then 'PM'
	      end
	from PropMortAssoc_data as pmad
	with (nolock)
	join property as p
	with (nolock)
	on pmad.parcelID = p.ref_id2
	join mortgage_co as mc
	with (Nolock)
	on pmad.lenderNo = right('000' + mc.mortgage_cd, 3)
	where (p.prop_id is null) or (mc.mortgage_co_id is null) 
	
	select @lRowCount = count(p.prop_id)
	from PropMortAssoc_data as pmad
	with (nolock)
	join property as p
	with (nolock)
	on pmad.parcelID = p.ref_id2
	join mortgage_co as mc
	with (Nolock)
	on pmad.lenderNo = right('000' + mc.mortgage_cd, 3)
	where (p.prop_id is not null) and (mc.mortgage_co_id is not null)
	
	set @nMatch = @lRowCount
	
	insert into PropMortAssoc_DataSummary (memo)
	values ('Matches: ' + ltrim(str(@nMatch)))
end

if (@nMatch <> 0)
begin
	insert into PropMortAssoc_DataSummary (memo)
	values ('*** Update Pending ***')
end

set @lRowCount = 0
select @lRowCount = count(datRec) 
from PropMortAssoc_errors
with (nolock)

set @nMatch = isnull(@lRowCount, 0)

if (@nMatch <> 0)
begin
	insert into PropMortAssoc_DataSummary (memo)
	values('Mapping Errors: ' + ltrim(str(@nMatch)))
end
else if (@nMatch = 0)
begin
	insert into PropMortAssoc_DataSummary (memo)
	values('No Errors')
end

GO

