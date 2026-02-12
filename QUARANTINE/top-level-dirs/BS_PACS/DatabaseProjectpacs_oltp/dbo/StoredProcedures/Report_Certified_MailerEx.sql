

CREATE PROCEDURE dbo.Report_Certified_MailerEx
    @mailer_batch_id int,
    @mailer_type int = null,
	@strSQL varchar(8000) = null
AS

declare @temp_prot_by_id as int
set @temp_prot_by_id = 0 
-- This global temp table makes the certified mailer process have the requirement that 
-- only one user can run certified mailers at a time.
if EXISTS (select name from tempdb.dbo.sysobjects where name = '##src')
begin
    drop table ##src
end

if exists (select * from tempdb.dbo.sysobjects where id = object_id(N'#src_single') )
BEGIN
    drop table #src_single
END

if exists (select * from tempdb.dbo.sysobjects where id = object_id(N'#src_multiple') ) 
BEGIN
    drop table #src_multiple
END

if	 @strSQL is null OR @mailer_type is NULL
	return

declare @strQuery varchar(8000)
-- add temp table to query
SELECT @strQuery = REPLACE(@strSQL,'from_replace', ', qualify = 0 , SendCertMail = 0   into ##src from ') 
-- execute query 
EXECUTE   (@strQuery)
--  
 
if NOT EXISTS(SELECT TOP 1 * FROM ##src) 
BEGIN
    return 
END
-- 1) Process all the prot_by_id(s) that are listed only once and remove them from the ##src table
    SELECT * INTO #src_single FROM ##src WITH(NOLOCK) where [prot_by_id] in 
    (select  prot_by_id from ##src WITH(NOLOCK) GROUP BY prot_by_id HAVING count(prot_by_id) = 1 )

    delete from ##src WHERE prot_by_id in (SELECT prot_by_id from  #src_single)
-- 1.a) We only need to mark the records in #src_single for either qualify or non-qualify  
    UPDATE #src_single  SET qualify = dbo.fn_CertifiedMailerBoardQualify(  case_id,  prop_id,  prop_val_yr)
      --FROM #src_single as s 
    -- They all receive a certified mailer
    UPDATE #src_single SET SendCertMail = 1  
-- 2) What's left in the #src is or should be a list of all the accounts that are protesting
--    on multiple properties. We need to Qualify them for board arbitration and send to each distinct
--    prot_by_id a certified mailer
    SELECT * INTO #src_multiple FROM ##src WITH(NOLOCK) where [prot_by_id] in 
    (select  prot_by_id from ##src WITH(NOLOCK) GROUP BY prot_by_id HAVING count(prot_by_id) > 1 )
    delete from ##src WHERE prot_by_id in (SELECT prot_by_id from  #src_multiple)
--  The ##src should be now empty
--  debug
    --SELECT COUNT(*) FROM ##src
--  2.a) Mark the qualify flag
    UPDATE #src_multiple SET qualify = dbo.fn_CertifiedMailerBoardQualify(  case_id,  prop_id,  prop_val_yr)
     -- FROM #src_multiple as s 
--  2.b) Send a certified mailer to each 'prot_by_id' that qualifies for board letter
    DECLARE cert_curs_q cursor FOR SELECT DISTINCT prot_by_id FROM #src_multiple WHERE [qualify]=1
    OPEN cert_curs_q
    FETCH NEXT FROM cert_curs_q INTO @temp_prot_by_id 
    WHILE @@FETCH_STATUS = 0
    BEGIN

        UPDATE #src_multiple SET SendCertMail = 1
        FROM ( SELECT TOP 1 * FROM #src_multiple as sm with(nolock) where sm.prot_by_id = @temp_prot_by_id AND [qualify]=1 ) as top1
        WHERE #src_multiple.case_id = top1.case_id 
          AND #src_multiple.prop_id = top1.prop_id 
          AND #src_multiple.prop_val_yr = top1.prop_val_yr
        --
        FETCH NEXT FROM cert_curs_q INTO @temp_prot_by_id 
    
    END--[WHILE]
    close cert_curs_q
    deallocate cert_curs_q
    -- Do the same for the non-qualify
    DECLARE cert_curs_nq cursor FOR SELECT DISTINCT prot_by_id FROM #src_multiple WHERE [qualify]=0
    OPEN cert_curs_nq
    FETCH NEXT FROM cert_curs_nq INTO @temp_prot_by_id 
    WHILE @@FETCH_STATUS = 0
    BEGIN
        UPDATE #src_multiple SET SendCertMail = 1
        FROM ( SELECT TOP 1 * FROM #src_multiple as sm with(nolock) where sm.prot_by_id = @temp_prot_by_id AND [qualify]=0 ) as top1
        WHERE #src_multiple.case_id = top1.case_id 
          AND #src_multiple.prop_id = top1.prop_id 
          AND #src_multiple.prop_val_yr = top1.prop_val_yr
         --
        FETCH NEXT FROM cert_curs_nq INTO @temp_prot_by_id 
    
    END--[WHILE]
    close cert_curs_nq
    deallocate cert_curs_nq

--  3- We must now insert the cases into  the certified_mailer table
--  3.a work with the single     
    INSERT INTO certified_mailer( 
    prop_val_yr, 
    case_id, 
    certified_mailer_batch_id, 
    mailer_type,
    prop_id,
    agent_id,
    legal_desc,
    prot_by_id,
    qualify,
    generate_cm, -- = 'INSERT_CM_ID'   
    owner_id,
    acct_id,
    prop_type_cd,
    udi_parent,
    sup_num
    --owner_name,
    --real_est_val_bef,
    --pers_prop_val_bef,
    --ag_val_bef,
    --real_est_val_aft,
    --ag_val_aft,
    --hear_dt,
    --mail_to_addr,
    --owner_addr,
    --status_cd,
    --cert_mail_cd,
    )
    SELECT 
    prop_val_yr,
    case_id,
    @mailer_batch_id, 
    @mailer_type,
    prop_id,
    agent_id,
    legal_desc,
    prot_by_id,
    qualify, 
    1, -- marker value, meaning the sp that populates the cert_mail_id generates a new certified
    0,  -- mailer code for the current prot_by_id, this should be unique in the qualify subgroup.
    0,
    p_type,
    case when (ISNULL(udi_parent,'') = 'T') then 1 else 0 end,
    sup_num
    FROM #src_single
--  3.b work with the multi
    INSERT INTO certified_mailer( 
    prop_val_yr, 
    case_id, 
    certified_mailer_batch_id, 
    mailer_type,
    prop_id,
    agent_id,
    legal_desc,
    prot_by_id,
    qualify,
    generate_cm, -- Same as for single cases      
    owner_id,
    acct_id,
    prop_type_cd,
    udi_parent,
    sup_num
    )
    SELECT 
    prop_val_yr,
    case_id,
    @mailer_batch_id, 
    case when @mailer_type = 1 then 2 else @mailer_type end,
    prop_id,
    agent_id,
    legal_desc,
    prot_by_id,
    qualify, 
    case when ( SendCertMail = 1 ) then 1 else 0 END,
    0,
    0,
    p_type,
    case when (ISNULL(udi_parent,'') = 'T') then 1 else 0 end,
    sup_num
    FROM #src_multiple

GO

