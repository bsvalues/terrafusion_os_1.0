



CREATE PROCEDURE CopyTaxRates
 @input_from_yr		numeric(4),
 @input_to_yr		numeric(4),
 @input_entity_id  	int

AS

--Declare variables here
declare @num_of_years	numeric(4)

--Initialize variables here
select @num_of_years = @input_to_yr - @input_from_yr

--Drop any temporary tables if it just so happens to exist...
if exists (select * from sysobjects where id = object_id(N'[dbo].[ta_tax_rate_temp]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
drop table [dbo].[ta_tax_rate_temp]


--*****************Create the new TAX RATE stuff***********
--*********************************************************
if (@input_entity_id = 0)
begin
	--Now create the temp table and select all rows from the tax_rate table where the tax_rate_yr = @input_from_yr...
	select * into ta_tax_rate_temp from tax_rate where tax_rate_yr = @input_from_yr
end
else
begin
	--Now create the temp table and select all rows from the tax_rate table where the tax_rate_yr = @input_from_yr and the entity_id = @input_entity_id
	select * into ta_tax_rate_temp from tax_rate where tax_rate_yr = @input_from_yr and entity_id = @input_entity_id
end

--*********************************************************
--*********************************************************
--Now change the tax_rate_yr in the temp table to be the @input_to_yr...
update ta_tax_rate_temp
set 	tax_rate_yr 	 = @input_to_yr, 
	attorney_fee_dt  = dateadd(year, @num_of_years, attorney_fee_dt),
	stmnt_dt 	 = dateadd(year, @num_of_years, stmnt_dt),
	effective_due_dt = dateadd(year, @num_of_years, effective_due_dt),
	bills_created_dt = null

--*********************************************************
--*********************************************************
--Copy the new contents of the temp table to the tax rate table with the new year...
/*insert into tax_rate select * from ta_tax_rate_temp where not exists (select * from tax_rate as tr1 where
								tr1.entity_id     = ta_tax_rate_temp.entity_id
								and tr1.tax_rate_yr = @input_to_yr)*/
--PratimaV HS  15622

if  (@input_entity_id = 0)
	begin
		delete from tax_rate where tax_rate_yr = @input_to_yr
		
	end
else 
	
	begin
		delete from tax_rate where tax_rate_yr = @input_to_yr and entity_id  = @input_entity_id
		
	end

insert into tax_rate  select * from ta_tax_rate_temp where not exists (select * from tax_rate as tr1 where
									tr1.entity_id     = ta_tax_rate_temp.entity_id
									and tr1.tax_rate_yr = @input_to_yr)



--*********************************************************
--*********************************************************
--Drop the temporary table if it just so happens to exist...
if exists (select * from sysobjects where id = object_id(N'[dbo].[ta_tax_rate_temp]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
drop table [dbo].[ta_tax_rate_temp]

GO

