

CREATE PROCEDURE AGRollbacks_1D1_rpt
	@entity as int = null,
	@year as int = null,
	@maket_value as numeric(18, 8)= null,
	@ag_value as numeric(18, 8)= null,
	@acres    as numeric(18, 8) = null,
	@rollback_taxable as numeric(18, 8) = null,
	@tax_rate as numeric(18, 8) = null,
	@interest_rate as numeric(18, 8) = null,
	@rollback_tax as numeric(18, 8) = null,
        @initialize as int 

AS


-- If the table does not exist then create it
IF NOT EXISTS (select name from tempdb.dbo.sysobjects where name = 
	'##ag_rollbacks_1D1_rpt')
begin
	create table ##ag_rollbacks_1D1_rpt 
	(
		session_id int ,
		entity int  ,
                year int,
		market_value numeric  (18,8) ,
		ag_value numeric(18,8),
		acres numeric(18,8),
		rollback_taxable numeric(18,8),
		tax_rate numeric(18,8),
		interest_rate  numeric(18,8),
		rollback_tax numeric(18,8),
		
		 
	)	
end

--if we are initializing the table then we need to remove any previous data
--with the current spid
if (@initialize <> 0)
begin
	delete from ##ag_rollbacks_1D1_rpt where session_id=@@SPID
end
else
begin
  insert into ##ag_rollbacks_1D1_rpt (session_id, year, entity, market_value, ag_value, acres, rollback_taxable,
              tax_rate,interest_rate,rollback_tax)
  VALUES ( @@SPID, @year, @entity, @maket_value, @ag_value, @acres, @rollback_taxable,
	   @tax_rate, @interest_rate, @rollback_tax)

end

GO

