

CREATE           PROCEDURE Report_Certified_Mailer
    @mailer_batch int,
    @mailer_type int = null,
	@strSQL varchar(8000) = null
AS


if EXISTS (select name from tempdb.dbo.sysobjects where name = '##src')
begin
drop table ##src
end



-- Delete any previous records associated with this SPID
delete from certified_mailer where certified_mailer_batch_id=@mailer_batch AND mailer_type = @mailer_type

if	 @strSQL is null OR @mailer_type is NULL
	return

declare @strQuery varchar(8000)

-- add local temp table to query
 SELECT @strQuery = REPLACE(@strSQL,'from_replace',' into ##src from ') 

-- execute query
--PRINT @strQuery
EXECUTE   (@strQuery)

-- declare local vars (current)
declare @case_id  int 
declare @prop_val_yr numeric(4,0)
declare @prop_id int
declare @agent_id varchar(30) 
declare @owner_id int
declare @legal_desc varchar(255)
declare @owner_name varchar(255)
declare @p_type     varchar(5)
declare @real_est_val_bef numeric(19,2)
declare @pers_prop_val_bef numeric(19,2)
declare @ag_val_bef numeric (19,2)
declare @tm_val_bef numeric (19,2)
declare @real_est_val_aft numeric(19,2)
declare @pers_prop_val_aft numeric(19,2)
declare @ag_val_aft numeric (19,2)
declare @tm_val_aft numeric (19,2)
declare @hear_dt smalldatetime
declare @mail_to_addr varchar(100)
declare @owner_addr varchar(100)
declare @status_cd varchar(50)
declare @prot_by_id int

-- declare local vars (previous)
declare @case_id_p  int 
declare @prop_val_yr_p numeric(4,0)
declare @prop_id_p int
declare @agent_id_p varchar(30) 
declare @owner_id_p int
declare @legal_desc_p varchar(255)
declare @owner_name_p varchar(255)
declare @p_type_p     varchar(5)
declare @real_est_val_bef_p numeric(19,2)
declare @pers_prop_val_bef_p numeric(19,2)
declare @ag_val_bef_p numeric (19,2)
declare @tm_val_bef_p numeric (19,2)
declare @real_est_val_aft_p numeric(19,2)
declare @pers_prop_val_aft_p numeric(19,2)
declare @ag_val_aft_p numeric (19,2)
declare @tm_val_aft_p numeric (19,2)
declare @hear_dt_p smalldatetime
declare @mail_to_addr_p varchar(100)
declare @owner_addr_p varchar(100)
declare @status_cd_p varchar(50)
declare @prot_by_id_p int

declare @owner_uni bit
SELECT @owner_uni = 0
SELECT @mail_to_addr = ''
Select @prot_by_id_p = 0

declare @udi_parent varchar(1)
set @udi_parent = ''

declare @sup_num int
set @sup_num = 0

--
-- declare curson, open and fetch first
DECLARE src_curs cursor FOR
SELECT  case_id, prop_val_yr, prop_id, agent_id, legal_desc, p_type, prot_by_id, udi_parent, sup_num
FROM ##src
OPEN src_curs
--FETCH NEXT FROM src_curs into @case_id,@prop_val_yr,@prop_id,@agent_id,@owner_id,@legal_desc,@owner_name,@p_type, @prot_by_id
FETCH NEXT FROM src_curs into @case_id,@prop_val_yr,@prop_id,@agent_id,@legal_desc,@p_type, @prot_by_id, @udi_parent, @sup_num
WHILE (@@FETCH_STATUS = 0)
BEGIN

-- hearing date
DECLARE hr_dt_curs cursor SCROLL FOR SELECT _arb_protest_hearing_docket.docket_start_date_time FROM property_val inner join
_arb_protest on property_val.prop_id = _arb_protest.prop_id 
AND property_val.prop_val_yr = _arb_protest.prop_val_yr INNER JOIN _arb_protest_hearing_docket 
on _arb_protest_hearing_docket.docket_id = _arb_protest.docket_id WHERE  property_val.prop_val_yr = @prop_val_yr AND _arb_protest.case_id = @case_id
OPEN hr_dt_curs
FETCH NEXT FROM hr_dt_curs into @hear_dt

IF (@@FETCH_STATUS <> 0) SELECT @hear_dt = NULL
CLOSE hr_dt_curs

DEALLOCATE hr_dt_curs
-- end hearing date

-- prop_vals
DECLARE val_curs cursor FOR SELECT _arb_protest.begin_market,_arb_protest.final_market,_arb_protest.begin_ag_market,_arb_protest.begin_timber_market,_arb_protest.final_ag_market,_arb_protest.final_timber_market,_arb_protest_status.status_cd
FROM _arb_protest LEFT OUTER JOIN _arb_protest_status 
ON _arb_protest_status.status_cd = _arb_protest.prot_status 
 WHERE  _arb_protest.case_id = @case_id AND _arb_protest.prop_val_yr = @prop_val_yr
OPEN val_curs
FETCH NEXT FROM val_curs into @real_est_val_bef,@real_est_val_aft,@ag_val_bef,@tm_val_bef,@ag_val_aft,@tm_val_aft,@status_cd

if @real_est_val_bef IS NULL SELECT @real_est_val_bef = 0.0
if @real_est_val_aft IS NULL SELECT @real_est_val_aft  = 0.0
if @ag_val_bef IS NULL SELECT @ag_val_bef  = 0.0
if @tm_val_bef IS NULL SELECT @tm_val_bef  = 0.0
if @ag_val_aft IS NULL SELECT @ag_val_aft  = 0.0
if @tm_val_aft IS NULL SELECT @tm_val_aft  = 0.0

IF @mailer_type = 0
BEGIN
select @mail_to_addr = ISNULL(NULLIF(account.file_as_name + CHAR(13),CHAR(13)),'') + 
ISNULL(NULLIF(address.addr_line1 + CHAR(13),CHAR(13)),'') + 
ISNULL(NULLIF(address.addr_line2 + CHAR(13),CHAR(13)),'') + 
ISNULL(NULLIF(address.addr_line3 + CHAR(13),CHAR(13)),'') + 
ISNULL(NULLIF(address.addr_city + ', ',', '),'') + 
ISNULL(NULLIF(address.addr_state + ' ',' '),'') + addr_zip
from _arb_protest 
INNER JOIN _arb_protest_protest_by_assoc as appba ON
appba.case_id = _arb_protest.case_id AND appba.prop_val_yr = _arb_protest.prop_val_yr
AND appba.prot_by_id = @prot_by_id
INNER JOIN account 
ON appba.prot_by_id = account.acct_id INNER JOIN
address ON address.acct_id = account.acct_id AND address.primary_addr = 'Y'	
where _arb_protest.case_id = @case_id AND _arb_protest.prop_val_yr = @prop_val_yr

if (@udi_parent = '')
begin
select  @owner_id = owner.owner_id,
	@owner_name = account.file_as_name,
	@owner_addr = ISNULL(NULLIF(account.file_as_name + CHAR(13),CHAR(13)),'') + 
	ISNULL(NULLIF(address.addr_line1 + CHAR(13),CHAR(13)),'') + 
	ISNULL(NULLIF(address.addr_line2 + CHAR(13),CHAR(13)),'') + 
	ISNULL(NULLIF(address.addr_line3 + CHAR(13),CHAR(13)),'') + 
	ISNULL(NULLIF(address.addr_city + ', ',', '),'') + 
	ISNULL(NULLIF(address.addr_state + ' ',' '),'') + addr_zip
from owner with (nolock) 
INNER JOIN account 
ON owner.owner_id = account.acct_id INNER JOIN
address ON address.acct_id = account.acct_id AND address.primary_addr = 'Y'	
where owner.prop_id = @prop_id AND owner.owner_tax_yr = @prop_val_yr
and owner.sup_num = @sup_num
end

else 
begin
set @owner_id = 0
set @owner_name = 'UDI Property'
set @owner_addr = ''
end

IF (@p_type = 'R' OR @p_type = 'MH' OR @p_type = 'A' OR @p_type = 'MN')

BEGIN
	INSERT certified_mailer (prop_val_yr,case_id,certified_mailer_batch_id,mailer_type,prop_id,agent_id,owner_id,legal_desc,owner_name,real_est_val_bef,pers_prop_val_bef,ag_val_bef,real_est_val_aft,pers_prop_val_aft,ag_val_aft,hear_dt,acct_id,mail_to_addr,owner_addr,status_cd,cert_mail_cd,prot_by_id,qualify)
	VALUES (@prop_val_yr,@case_id,@mailer_batch,@mailer_type,@prop_id,@prot_by_id,@owner_id,@legal_desc,@owner_name,@real_est_val_bef,0.0,@ag_val_bef+@tm_val_bef,@real_est_val_aft,0.0,@ag_val_aft+@tm_val_aft,@hear_dt,@prot_by_id,@mail_to_addr,@owner_addr,@status_cd,NULL,@prot_by_id, NULL)
END
ELSE IF (@p_type = 'P')
BEGIN
	INSERT certified_mailer (prop_val_yr,case_id,certified_mailer_batch_id,mailer_type,prop_id,agent_id,owner_id,legal_desc,owner_name,real_est_val_bef,pers_prop_val_bef,ag_val_bef,real_est_val_aft,pers_prop_val_aft,ag_val_aft,hear_dt,acct_id,mail_to_addr,owner_addr,status_cd,cert_mail_cd,prot_by_id,qualify)
	VALUES (@prop_val_yr,@case_id,@mailer_batch,@mailer_type,@prop_id,@prot_by_id,@owner_id,@legal_desc,@owner_name,0.0,@real_est_val_bef,@ag_val_bef+@tm_val_bef,0.0,@real_est_val_aft,@ag_val_aft+@tm_val_aft,@hear_dt,@prot_by_id,@mail_to_addr,@owner_addr,@status_cd,NULL,@prot_by_id, NULL)
END

END -- end @mailer_type = 0
ELSE IF @mailer_type = 1
BEGIN
	IF @prot_by_id <> @prot_by_id_p AND @owner_uni = 1
	 BEGIN
		IF (@p_type_p = 'R' OR @p_type_p = 'MH' OR @p_type_p = 'A' OR @p_type_p = 'MN')
		BEGIN
			INSERT certified_mailer (prop_val_yr,case_id,certified_mailer_batch_id,mailer_type,prop_id,agent_id,owner_id,legal_desc,owner_name,real_est_val_bef,pers_prop_val_bef,ag_val_bef,real_est_val_aft,pers_prop_val_aft,ag_val_aft,hear_dt,acct_id,mail_to_addr,owner_addr,status_cd,cert_mail_cd,prot_by_id,qualify)
			VALUES (@prop_val_yr_p,@case_id_p,@mailer_batch,@mailer_type,@prop_id_p,@agent_id_p,@owner_id_p,@legal_desc_p,@owner_name_p,@real_est_val_bef_p,0.0,@ag_val_bef_p+@tm_val_bef_p,@real_est_val_aft_p,0.0,@ag_val_aft_p+@tm_val_aft_p,@hear_dt_p,@owner_id_p,@mail_to_addr_p,@owner_addr_p,@status_cd_p,NULL,@prot_by_id_p, NULL)
		END
		ELSE IF (@p_type_p = 'P')
		BEGIN
			INSERT certified_mailer (prop_val_yr,case_id,certified_mailer_batch_id,mailer_type,prop_id,agent_id,owner_id,legal_desc,owner_name,real_est_val_bef,pers_prop_val_bef,ag_val_bef,real_est_val_aft,pers_prop_val_aft,ag_val_aft,hear_dt,acct_id,mail_to_addr,owner_addr,status_cd,cert_mail_cd,prot_by_id,qualify)
			VALUES (@prop_val_yr_p,@case_id_p,@mailer_batch,@mailer_type,@prop_id_p,@agent_id_p,@owner_id_p,@legal_desc_p,@owner_name_p,0.0,@real_est_val_bef_p,@ag_val_bef_p+@tm_val_bef_p,0.0,@real_est_val_aft_p,@ag_val_aft_p+@tm_val_aft_p,@hear_dt_p,@owner_id_p,@mail_to_addr_p,@owner_addr_p,@status_cd_p,NULL,@prot_by_id_p, NULL)
		END
	 END
        ELSE IF @prot_by_id = @prot_by_id_p
	 BEGIN
		SELECT @owner_uni = 0
	 END
	ELSE IF @prot_by_id <> @prot_by_id_p AND @owner_uni = 0
	 BEGIN
		SELECT @owner_uni = 1
	 END

END -- end @mailer_type = 1
ELSE IF @mailer_type = 2
BEGIN
	IF @prot_by_id = @prot_by_id_p  
	 BEGIN
		IF (@p_type_p = 'R' OR @p_type_p = 'MH' OR @p_type_p = 'A' OR @p_type_p = 'MN')
		BEGIN
			INSERT certified_mailer (prop_val_yr,case_id,certified_mailer_batch_id,mailer_type,prop_id,agent_id,owner_id,legal_desc,owner_name,real_est_val_bef,pers_prop_val_bef,ag_val_bef,real_est_val_aft,pers_prop_val_aft,ag_val_aft,hear_dt,acct_id,mail_to_addr,owner_addr,status_cd,cert_mail_cd,prot_by_id,qualify)
			VALUES (@prop_val_yr_p,@case_id_p,@mailer_batch,@mailer_type,@prop_id_p,@agent_id_p,@owner_id_p,@legal_desc_p,@owner_name_p,@real_est_val_bef_p,0.0,@ag_val_bef_p+@tm_val_bef_p,@real_est_val_aft_p,0.0,@ag_val_aft_p+@tm_val_aft_p,@hear_dt_p,@owner_id_p,@mail_to_addr_p,@owner_addr_p,@status_cd_p,NULL,@prot_by_id_p, NULL)
		END
		ELSE IF (@p_type_p = 'P')
		BEGIN
			INSERT certified_mailer (prop_val_yr,case_id,certified_mailer_batch_id,mailer_type,prop_id,agent_id,owner_id,legal_desc,owner_name,real_est_val_bef,pers_prop_val_bef,ag_val_bef,real_est_val_aft,pers_prop_val_aft,ag_val_aft,hear_dt,acct_id,mail_to_addr,owner_addr,status_cd,cert_mail_cd,prot_by_id,qualify)
			VALUES (@prop_val_yr_p,@case_id_p,@mailer_batch,@mailer_type,@prop_id_p,@agent_id_p,@owner_id_p,@legal_desc_p,@owner_name_p,0.0,@real_est_val_bef_p,@ag_val_bef_p+@tm_val_bef_p,0.0,@real_est_val_aft_p,@ag_val_aft_p+@tm_val_aft_p,@hear_dt_p,@owner_id_p,@mail_to_addr_p,@owner_addr_p,@status_cd_p,NULL,@prot_by_id_p, NULL)
		END
		
		SELECT @owner_uni = 1
	 END
        ELSE IF @prot_by_id <> @prot_by_id_p AND @owner_uni = 0
	 BEGIN
		SELECT @owner_uni = 0
	 END
	ELSE IF @prot_by_id <> @prot_by_id_p AND @owner_uni = 1
	 BEGIN
		IF (@p_type_p = 'R' OR @p_type_p = 'MH' OR @p_type_p = 'A' OR @p_type_p = 'MN')
		BEGIN
			INSERT certified_mailer (prop_val_yr,case_id,certified_mailer_batch_id,mailer_type,prop_id,agent_id,owner_id,legal_desc,owner_name,real_est_val_bef,pers_prop_val_bef,ag_val_bef,real_est_val_aft,pers_prop_val_aft,ag_val_aft,hear_dt,acct_id,mail_to_addr,owner_addr,status_cd,cert_mail_cd,prot_by_id,qualify)
			VALUES (@prop_val_yr_p,@case_id_p,@mailer_batch,@mailer_type,@prop_id_p,@agent_id_p,@owner_id_p,@legal_desc_p,@owner_name_p,@real_est_val_bef_p,0.0,@ag_val_bef_p+@tm_val_bef_p,@real_est_val_aft_p,0.0,@ag_val_aft_p+@tm_val_aft_p,@hear_dt_p,@owner_id_p,@mail_to_addr_p,@owner_addr_p,@status_cd_p,NULL,@prot_by_id_p, NULL)
		END
		ELSE IF (@p_type_p = 'P')
		BEGIN
			INSERT certified_mailer (prop_val_yr,case_id,certified_mailer_batch_id,mailer_type,prop_id,agent_id,owner_id,legal_desc,owner_name,real_est_val_bef,pers_prop_val_bef,ag_val_bef,real_est_val_aft,pers_prop_val_aft,ag_val_aft,hear_dt,acct_id,mail_to_addr,owner_addr,status_cd,cert_mail_cd,prot_by_id,qualify)
			VALUES (@prop_val_yr_p,@case_id_p,@mailer_batch,@mailer_type,@prop_id_p,@agent_id_p,@owner_id_p,@legal_desc_p,@owner_name_p,0.0,@real_est_val_bef_p,@ag_val_bef_p+@tm_val_bef_p,0.0,@real_est_val_aft_p,@ag_val_aft_p+@tm_val_aft_p,@hear_dt_p,@owner_id_p,@mail_to_addr_p,@owner_addr_p,@status_cd_p,NULL,@prot_by_id_p, NULL)
		END

		SELECT @owner_uni = 0
	 END
END -- end @mailer_type = 2

-- save vals to _p vars for comparison
if (@mailer_type = 1 OR @mailer_type = 2)
BEGIN
SELECT @case_id_p            = @case_id   		 
SELECT @prop_val_yr_p   = @prop_val_yr 
SELECT @prop_id_p   = @prop_id 
SELECT @agent_id_p    = @agent_id  

SELECT @prot_by_id_p = @prot_by_id
SELECT @legal_desc_p   = @legal_desc 

SELECT @p_type_p       = @p_type     
SELECT @real_est_val_bef_p   = @real_est_val_bef 
SELECT @pers_prop_val_bef_p  = @pers_prop_val_bef
SELECT @ag_val_bef_p   = @ag_val_bef  
SELECT @tm_val_bef_p   = @tm_val_bef  
SELECT @real_est_val_aft_p   = @real_est_val_aft 
SELECT @pers_prop_val_aft_p  = @pers_prop_val_aft
SELECT @ag_val_aft_p   = @ag_val_aft  
SELECT @tm_val_aft_p   = @tm_val_aft  
SELECT @hear_dt_p   = @hear_dt 

SELECT @status_cd_p = @status_cd

select @mail_to_addr = ISNULL(NULLIF(account.file_as_name + CHAR(13),CHAR(13)),'') + 
ISNULL(NULLIF(address.addr_line1 + CHAR(13),CHAR(13)),'') + 
ISNULL(NULLIF(address.addr_line2 + CHAR(13),CHAR(13)),'') + 
ISNULL(NULLIF(address.addr_line3 + CHAR(13),CHAR(13)),'') + 
ISNULL(NULLIF(address.addr_city + ', ',', '),'') + 
ISNULL(NULLIF(address.addr_state + ' ',' '),'') + addr_zip
from _arb_protest 
INNER JOIN _arb_protest_protest_by_assoc as appba ON
appba.case_id = _arb_protest.case_id AND appba.prop_val_yr = _arb_protest.prop_val_yr
AND appba.prot_by_id = @prot_by_id
INNER JOIN account 
ON appba.prot_by_id = account.acct_id INNER JOIN
address ON address.acct_id = account.acct_id AND address.primary_addr = 'Y'	
where _arb_protest.case_id = @case_id_p AND _arb_protest.prop_val_yr = @prop_val_yr_p

if (@udi_parent = '')
begin
select  @owner_id = owner.owner_id,
	@owner_name = account.file_as_name,
	@owner_addr = ISNULL(NULLIF(account.file_as_name + CHAR(13),CHAR(13)),'') + 
	ISNULL(NULLIF(address.addr_line1 + CHAR(13),CHAR(13)),'') + 
	ISNULL(NULLIF(address.addr_line2 + CHAR(13),CHAR(13)),'') + 
	ISNULL(NULLIF(address.addr_line3 + CHAR(13),CHAR(13)),'') + 
	ISNULL(NULLIF(address.addr_city + ', ',', '),'') + 
	ISNULL(NULLIF(address.addr_state + ' ',' '),'') + addr_zip
from owner with (nolock) 
INNER JOIN account 
ON owner.owner_id = account.acct_id INNER JOIN
address ON address.acct_id = account.acct_id AND address.primary_addr = 'Y'	
where owner.prop_id = @prop_id AND owner.owner_tax_yr = @prop_val_yr
and owner.sup_num = @sup_num
end

else 
begin
set @owner_id = 0
set @owner_name = 'UDI Property'
set @owner_addr = ''
end

SELECT @owner_id_p   = @owner_id 
SELECT @owner_name_p   = @owner_name 
SELECT @mail_to_addr_p = @mail_to_addr
SELECT @owner_addr_p = @owner_addr

END -- end save _p vars

CLOSE val_curs
DEALLOCATE val_curs
-- end prop_vals

--FETCH NEXT FROM src_curs into @case_id,@prop_val_yr,@prop_id,@agent_id,@owner_id,@legal_desc,@owner_name,@p_type, @prot_by_id
FETCH NEXT FROM src_curs into @case_id,@prop_val_yr,@prop_id,@agent_id,@legal_desc,@p_type, @prot_by_id, @udi_parent, @sup_num

END --  End outer loop

-- Need to check for last record if @mailer_type is 1 or 2
	IF  @owner_uni = 1 AND (@mailer_type = 1 OR @mailer_type = 2)
	 BEGIN
		IF (@p_type_p = 'R' OR @p_type_p = 'MH' OR @p_type_p = 'A' OR @p_type_p = 'MN')
		BEGIN
			INSERT certified_mailer (prop_val_yr,case_id,certified_mailer_batch_id,mailer_type,prop_id,agent_id,owner_id,legal_desc,owner_name,real_est_val_bef,pers_prop_val_bef,ag_val_bef,real_est_val_aft,pers_prop_val_aft,ag_val_aft,hear_dt,acct_id,mail_to_addr,owner_addr,status_cd,cert_mail_cd,prot_by_id,qualify)
			VALUES (@prop_val_yr_p,@case_id_p,@mailer_batch,@mailer_type,@prop_id_p,@agent_id_p,@owner_id_p,@legal_desc_p,@owner_name_p,@real_est_val_bef_p,0.0,@ag_val_bef_p+@tm_val_bef_p,@real_est_val_aft_p,0.0,@ag_val_aft_p+@tm_val_aft_p,@hear_dt_p,@owner_id_p,@mail_to_addr_p,@owner_addr_p,@status_cd_p,NULL,@prot_by_id_p, NULL)
		END
		ELSE IF (@p_type_p = 'P')
		BEGIN
			INSERT certified_mailer (prop_val_yr,case_id,certified_mailer_batch_id,mailer_type,prop_id,agent_id,owner_id,legal_desc,owner_name,real_est_val_bef,pers_prop_val_bef,ag_val_bef,real_est_val_aft,pers_prop_val_aft,ag_val_aft,hear_dt,acct_id,mail_to_addr,owner_addr,status_cd,cert_mail_cd,prot_by_id,qualify)
			VALUES (@prop_val_yr_p,@case_id_p,@mailer_batch,@mailer_type,@prop_id_p,@agent_id_p,@owner_id_p,@legal_desc_p,@owner_name_p,0.0,@real_est_val_bef_p,@ag_val_bef_p+@tm_val_bef_p,0.0,@real_est_val_aft_p,@ag_val_aft_p+@tm_val_aft_p,@hear_dt_p,@owner_id_p,@mail_to_addr_p,@owner_addr_p,@status_cd_p,NULL,@prot_by_id_p, NULL)
		END
	 END

close src_curs
deallocate src_curs
drop table ##src

GO

