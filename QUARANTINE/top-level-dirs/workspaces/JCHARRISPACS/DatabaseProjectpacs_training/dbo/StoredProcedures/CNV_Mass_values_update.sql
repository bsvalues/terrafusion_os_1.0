/*
exec CNV_Mass_values_update 
		@year=2009,
		@mode='R',
		@lSup_num='',
		@lTAAppSvrEnvironmentID=4,
		@szTAAppSvr='SVCSCNV03E',
		@szPACSUsername='System',
		@szPACSPassword='system123'

CNV_Mass_values_update 
		@year=2009,
		@mode='T',
		@lSup_num='',
		@lTAAppSvrEnvironmentID=4,
		@szTAAppSvr='SVCSCNV03E',
		@szPACSUsername='System',
		@szPACSPassword='system123'

CNV_Mass_values_update 
		@year=2009,
		@mode='X',
		@lSup_num='',
		@lTAAppSvrEnvironmentID=3,
		@szTAAppSvr='SVCSCNV03E',
		@szPACSUsername='System',
		@szPACSPassword='qwop1290'

John Webber May 2009

This procedure is made to call 1 of 2 extended stored procedures that allow the PACS 9.x system to have 
values recalculated or just the taxable values calculated from SQL studio manager instead of using the UI. 

There are several steps that need to be completed before this can be run on a new environment. These steps have 
been commented into the bottom of this procedure.

Explaination of procedure variables;

@year --This is is the year layer to be acted upon.
@mode -- R for recalc and taxable, or T for taxable only
@lSup_num -- Passes the maximum supplement number to process on. If '' is passed all supplements are processed.
@lTAAppSvrEnvironmentID --The application server environment to be acted upon.
@szTAAppSvr --The application server name (server name or IP address).
@szPACSUsername --The system user name (usually System).
@szPACSPassword -- The system user password (usually system123 or system2600).

	
*/
	

create PROCEDURE [dbo].[CNV_Mass_values_update]

		@year int,
		@mode varchar(1), -- R for recalc and taxable, or T for taxable only
		@lSup_num int ='',  -- as of supplement number, '' for all supplements
		@lTAAppSvrEnvironmentID int = 2,
		@szTAAppSvr varchar(64), -- UNC name of TA APP SERVER
		@szPACSUsername varchar(64), -- usually System (case sensitive)
		@szPACSPassword varchar(64) -- system password
AS
BEGIN

SET NOCOUNT ON


DECLARE @PROP_VAL_YR	NUMERIC(4,0)
DECLARE @SUP_NUM		INT

declare @recalc varchar(440),
		@calc	varchar(440),
		@main	varchar(440),
		@begin datetime,
		@end datetime,
		@time int,
		@max_sup_num int,
		@num_props int,
		@num_props_sup int

set @begin=getdate()

if @mode='R'
begin
set @main='Recalc and taxable for year; '+cast (@year as varchar(4))
end
if @mode='T'
begin
set @main='Calculate taxable for year; '+cast (@year as varchar(4))
end
if @mode not in('T','R')
begin
print 'Invalid Mode, Please use R (recalculate and taxable), or T (taxable only)'
return
end

print'Server ' +@szTAAppSvr
print'Environment '+cast(@lTAAppSvrEnvironmentID as varchar(5))
print @begin
RAISERROR (@main, 0, 1) WITH NOWAIT

-- get max supplment number if '' is passed through @lSup_num
if @lSup_num=''
begin
select @max_sup_num= max(sup_num)
from supplement
where sup_tax_yr=@year
end
else
select @max_sup_num=@lSup_num

if @max_sup_num is null
begin
print 'Error-- No data in supplement table for year; '+@year
return
end

print'As of Supplement number; '+cast(@max_sup_num as varchar(3))
select @num_props=(select count(prop_id) from property_val where prop_inactive_dt is null
and prop_val_yr=@year)
print 'Number of properties: '+cast(@num_props as varchar(55))


-- recalculate loop

if @mode='R'
begin

RAISERROR ('Begin recalculate...', 0, 1) WITH NOWAIT



DECLARE BUILD_RECORDS CURSOR FAST_FORWARD
FOR SELECT DISTINCT PROP_VAL_YR, SUP_NUM FROM PROPERTY_VAL WITH (NOLOCK) WHERE PROP_VAL_YR = @year  and sup_num<@max_sup_num+1 ORDER BY PROP_VAL_YR DESC, SUP_NUM

OPEN BUILD_RECORDS
FETCH NEXT FROM BUILD_RECORDS into @PROP_VAL_YR, @SUP_NUM

WHILE (@@FETCH_STATUS = 0)
BEGIN

select @num_props_sup=(select count(prop_id) from property_val 
where prop_inactive_dt is null and sup_num=@sup_num and prop_val_yr=@year)

print 'Number of properties in sup '+cast(@sup_num as varchar(3))+'; '+cast(@num_props_sup as varchar(55))

set @recalc='Done with Recalc for Sup #; '+ cast(@sup_num as varchar(3))

	exec master..xp_RecalcProperty90

                @szTAAppSvr, @lTAAppSvrEnvironmentID, @szPACSUsername, @szPACSPassword,
				0, @year, @sup_num, 0,0, 0, 0,-1, 0, 0


RAISERROR (@recalc, 0, 1) WITH NOWAIT


	
	FETCH NEXT FROM BUILD_RECORDS into @PROP_VAL_YR, @SUP_NUM
END


CLOSE BUILD_RECORDS
DEALLOCATE BUILD_RECORDS


end

-- calculate taxable loop

if @mode='T'
begin

RAISERROR ('Begin calculate taxable...', 0, 1) WITH NOWAIT

DECLARE BUILD_RECORDS1 CURSOR FAST_FORWARD
FOR SELECT DISTINCT PROP_VAL_YR, SUP_NUM FROM PROPERTY_VAL WITH (NOLOCK) WHERE PROP_VAL_YR = @year and sup_num<@max_sup_num+1 ORDER BY PROP_VAL_YR DESC, SUP_NUM

OPEN BUILD_RECORDS1
FETCH NEXT FROM BUILD_RECORDS1 into @PROP_VAL_YR, @SUP_NUM

WHILE (@@FETCH_STATUS = 0)
BEGIN

select @num_props_sup=(select count(prop_id) from property_val 
where prop_inactive_dt is null and sup_num=@sup_num and prop_val_yr=@year)

print 'Number of properties in sup '+cast(@sup_num as varchar(3))+'; '+cast(@num_props_sup as varchar(55))



set @calc='Done with Calucalate taxable for Sup #; '+ cast(@sup_num as varchar(3))

	EXEC master..xp_CALCULATETAXABLE90 

                @szTAAppSvr, @lTAAppSvrEnvironmentID, @szPACSUsername, @szPACSPassword,
				0, @year, @sup_num, 0,0, '', ''

RAISERROR (@calc, 0, 1) WITH NOWAIT


	
	FETCH NEXT FROM BUILD_RECORDS1 into @PROP_VAL_YR, @SUP_NUM
END

CLOSE BUILD_RECORDS1
DEALLOCATE BUILD_RECORDS1

end

set @end=getdate()

print @end

select @time =datediff(minute,@begin,@end)

RAISERROR ('Minutes to complete...', 0, 1) WITH NOWAIT

print @time

end

/*
SETUP INSTRUCTIONS 

developed by James Welch May 2009


At \\pacs.local\tashares\RELEASE\9.0.x\XSP you will find the xsp_pacs.dll ; note that it is platform specific, 
so install the correct one.

 

To set it up, first obtain TAClientApi.dll (this is the client side TCP connect-to-MT dll)
 and copy it to the SQL machine.  Note that since this is native code, that again, 
the proper platform version needs to be used.  The 32-bit version can be found in the normal PACS 9.0 client 
distribution channels.  The 64-bit version has heretofore not been used, therefore it is not built by our regular 
build process.  Going forward at least for the foreseeable future the XSP would be the only consumer, therefore, 
I’ve built it and placed it beside the 64-bit XSP in the folder above (you will never find it in the regular 
distribution channels).  Once you’ve placed the correct one on the machine, regsvr32 it.  
Note that when you do so, specify the full directory name & path to it ; otherwise, the load order may find another one first.

 

Next, place the XSP_PACS.dll alongside sqlservr.exe just as you would in 8.0.  Then:

exec sp_addextendedproc 'xp_CalculateTaxable90', 'XSP_PACS.dll'

go

exec sp_addextendedproc 'xp_RecalcProperty90', 'XSP_PACS.dll'

go

 

You are now ready to use the above methods.  Note that I did not, and will not, 
update/create the regular stored procedures RecalcProperty and CalculateTaxable.  
This is because, while xsp_pacs_config does exist in 9.0 (only b/c I forgot to drop it many moons ago), 
it is not used by anything in the application, nor shall it be, and as such, there are 
no procedures to update it when people restore a DB & set things up.  Ex: never rely on 
anyone but yourself to have it configured.  But if you wish to use it you may.  
If you wish to create your own conversion specific stored procedure to make the below easier to use, feel free.

 

To do a full layer calculation, set @prop_id = 0 of course.  
The first 4 parameters to each of these are 1) the middle tier master machine name, 2) environment ID, 3) 
PACS user name, 4) PACS password

 

Note that on a Washington environment, that executing a recalc also executes taxable for you.  
There is no need to call both for the same property/layer-set.

*/

GO

