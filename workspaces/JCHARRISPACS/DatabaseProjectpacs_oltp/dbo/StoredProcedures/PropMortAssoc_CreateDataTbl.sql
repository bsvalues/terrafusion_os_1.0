
CREATE PROCEDURE PropMortAssoc_CreateDataTbl

	@strFilename varchar(128),
	@bProduction bit,
	@bGEOID bit

AS

SET NOCOUNT ON

declare @client_name varchar(50)

select top 1 @client_name = upper(client_name)
from pacs_system

truncate table PropMortAssoc_data
truncate table PropMortAssoc_dPropMort
truncate table PropMortAssoc_DataSummary

insert into PropMortAssoc_DataSummary (memo) values('Filename: ' + @strFilename)

if (@bProduction = 1)
	insert into PropMortAssoc_DataSummary (memo) values('Execution Mode: Production')
else 
	insert into PropMortAssoc_DataSummary (memo) values('Execution Mode: Test')

if @client_name <> 'TRAVIS'
begin
	if (@bGEOID = 1)
		insert into PropMortAssoc_DataSummary (memo) values('Mapping Key: Geo ID')
	else 
		insert into PropMortAssoc_DataSummary (memo) values('Mapping Key: Prop ID')
end
else
begin
	insert into PropMortAssoc_DataSummary (memo) values('Mapping Key: Ref ID2')
end

GO

