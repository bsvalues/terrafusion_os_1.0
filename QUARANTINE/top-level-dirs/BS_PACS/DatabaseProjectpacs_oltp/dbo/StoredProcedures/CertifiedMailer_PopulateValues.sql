
CREATE PROCEDURE CertifiedMailer_PopulateValues
                @certified_mailer_batch_id int

AS

 
-- declare local vars (current)
declare @case_id  int 
declare @prop_val_yr numeric(4,0)
declare @prop_id int
--declare @agent_id varchar(30) 
declare @owner_id int
declare @legal_desc varchar(255)
declare @owner_name varchar(255)
declare @prop_type_cd     varchar(5)
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
declare @mailer_type int
declare @udi_parent bit
declare @sup_num int
--
SET    @sup_num = 0
--SET    @owner_uni = 0
SET    @mail_to_addr = ''
SET    @prot_by_id = 0
--
-- First we update the hearing date
--
UPDATE certified_mailer
SET hear_dt = _arb_protest_hearing_docket.docket_start_date_time
FROM certified_mailer cm 
INNER JOIN  _arb_protest as ap WITH(NOLOCK)
on  ap.prop_id = cm.prop_id 
AND ap.prop_val_yr = cm.prop_val_yr 
AND ap.case_id     = cm.case_id
--AND ap.prot_by_id  = cm.prot_by_id
INNER JOIN _arb_protest_hearing_docket 
on _arb_protest_hearing_docket.docket_id = ap.docket_id
WHERE cm.certified_mailer_batch_id = @certified_mailer_batch_id






DECLARE cert_mail_cursor CURSOR FOR
SELECT prop_val_yr,
       case_id,        
       mailer_type,
       prop_id,
       owner_id,
       prot_by_id,
       prop_type_cd,
       udi_parent,
       sup_num 
FROM certified_mailer where certified_mailer_batch_id = @certified_mailer_batch_id
   
OPEN cert_mail_cursor
FETCH NEXT FROM cert_mail_cursor INTO @prop_val_yr,@case_id,@mailer_type,
                                      @prop_id, @owner_id,@prot_by_id, @prop_type_cd,
                                      @udi_parent, @sup_num
WHILE (@@FETCH_STATUS = 0)
BEGIN  
                                      

    DECLARE val_curs cursor FOR
    SELECT _arb_protest.begin_market,
         _arb_protest.final_market,
         _arb_protest.begin_ag_market,
         _arb_protest.begin_timber_market,
         _arb_protest.final_ag_market,
         _arb_protest.final_timber_market,
         _arb_protest_status.status_cd
    FROM  _arb_protest 
        LEFT OUTER JOIN _arb_protest_status 
        ON _arb_protest_status.status_cd = _arb_protest.prot_status 
        WHERE  _arb_protest.case_id = @case_id AND _arb_protest.prop_val_yr = @prop_val_yr
        OPEN val_curs
        FETCH NEXT FROM val_curs into @real_est_val_bef,@real_est_val_aft,@ag_val_bef,@tm_val_bef,@ag_val_aft,@tm_val_aft,@status_cd
    --
    if @real_est_val_bef IS NULL SELECT @real_est_val_bef = 0.0
    if @real_est_val_aft IS NULL SELECT @real_est_val_aft  = 0.0
    if @ag_val_bef IS NULL SELECT @ag_val_bef  = 0.0
    if @tm_val_bef IS NULL SELECT @tm_val_bef  = 0.0
    if @ag_val_aft IS NULL SELECT @ag_val_aft  = 0.0
    if @tm_val_aft IS NULL SELECT @tm_val_aft  = 0.0   
    --
    --IF @mailer_type = 0
    --    BEGIN
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
                        set @owner_addr = 'UDI Property'
						if (@mail_to_addr = '')
	           		    begin
							set @mail_to_addr = 'UDI Property'
						end
                end
        
                IF (@prop_type_cd = 'R' OR @prop_type_cd = 'MH' OR @prop_type_cd = 'A' OR @prop_type_cd = 'MN')        
                BEGIN
                        UPDATE certified_mailer SET 
                        owner_id          = @owner_id,
                        owner_name        = @owner_name, 
                        real_est_val_bef  = @real_est_val_bef, 
                        pers_prop_val_bef = 0.0, --pers_prop_val_bef
                        ag_val_bef        = @ag_val_bef+@tm_val_bef,--ag_val_bef
                        real_est_val_aft  = @real_est_val_aft,--real_est_val_aft
                        pers_prop_val_aft = 0.0,--pers_prop_val_aft
                        ag_val_aft        = @ag_val_aft+@tm_val_aft,--ag_val_aft
                        acct_id           = @prot_by_id, --acct_id
                        mail_to_addr      = @mail_to_addr,--mail_to_addr
                        owner_addr        = @owner_addr,--owner_addr
                        status_cd         = @status_cd --status_cd 
                        WHERE CURRENT OF cert_mail_cursor
                          
                END
                ELSE IF (@prop_type_cd = 'P')
                BEGIN
                        UPDATE certified_mailer SET 
                        owner_id          = @owner_id,
                        owner_name        = @owner_name, 
                        real_est_val_bef  = 0.0, 
                        pers_prop_val_bef = @real_est_val_bef, --pers_prop_val_bef
                        ag_val_bef        = @ag_val_bef+@tm_val_bef,--ag_val_bef
                        real_est_val_aft  = 0.0,--real_est_val_aft
                        pers_prop_val_aft = @real_est_val_aft,--pers_prop_val_aft
                        ag_val_aft        = @ag_val_aft+@tm_val_aft,--ag_val_aft
                        acct_id           = @prot_by_id, --acct_id
                        mail_to_addr      = @mail_to_addr,--mail_to_addr
                        owner_addr        = @owner_addr,--owner_addr
                        status_cd         = @status_cd --status_cd 
                        WHERE CURRENT OF cert_mail_cursor
                END
        
        --END -- end @mailer_type = 0
        CLOSE val_curs
        DEALLOCATE val_curs
        
        
FETCH NEXT FROM cert_mail_cursor INTO @prop_val_yr,@case_id,@mailer_type,
                                      @prop_id, @owner_id,@prot_by_id, @prop_type_cd,
                                      @udi_parent, @sup_num
    --
END --cert_mail_cursor
close cert_mail_cursor
deallocate cert_mail_cursor
drop table ##src

GO

