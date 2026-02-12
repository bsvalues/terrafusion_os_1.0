



CREATE                PROCEDURE SetCertMailIds
        @mailer_type int,
        @batch_id int
AS

DECLARE @prot_by_id int
DECLARE @case_id int
DECLARE @prop_val_yr int
DECLARE @cert_mail_cd varchar(50)
DECLARE @prot_by_id_p int
DECLARE @case_id_p int
DECLARE @prop_val_yr_p int
DECLARE @cert_mail_cd_p varchar(50)

DECLARE @serv_type varchar(5)
DECLARE @cust_id varchar(16)

DECLARE @cert_mail_num varchar(50)

SELECT @prot_by_id_p = 0
SELECT @case_id_p = 0
SELECT @prop_val_yr_p  = 0

IF @mailer_type = 0
BEGIN
   DECLARE temp_curs cursor FOR
   SELECT     agent_id,case_id,prop_val_yr
   FROM certified_mailer
   WHERE     mailer_type = @mailer_type AND certified_mailer_batch_id = @batch_id
   order by agent_id, mail_to_addr, prop_id
END
ELSE
BEGIN
-- THIS CHANGED DUE TO DATA CONVERSION. STILL WAITING ON WORD OF WHICH VERTION TO USE.
   DECLARE temp_curs cursor FOR
   SELECT     prot_by_id,case_id,prop_val_yr
   FROM certified_mailer
   WHERE     mailer_type = @mailer_type AND certified_mailer_batch_id = @batch_id
   order by prot_by_id, prop_id
--DECLARE temp_curs cursor FOR
--   SELECT     agent_id,case_id,prop_val_yr
--   FROM certified_mailer
--   WHERE     mailer_type = @mailer_type AND certified_mailer_batch_id = @batch_id
--   order by agent_id
END

SELECT TOP 1
  @serv_type = serv_type,
  @cust_id = cust_id
    FROM next_cert_mail_id


OPEN temp_curs
FETCH NEXT FROM temp_curs into @prot_by_id,@case_id,@prop_val_yr
 
WHILE (@@FETCH_STATUS = 0)
BEGIN

IF @prot_by_id_p <> @prot_by_id
BEGIN
   exec CreateCertMailUse 0,@cert_mail_cd_out = @cert_mail_cd OUTPUT
   SELECT @cert_mail_cd_p = @cert_mail_cd
END
ELSE
BEGIN
   SELECT @cert_mail_cd = @cert_mail_cd_p
END

UPDATE certified_mailer
    SET cert_mail_cd = @cert_mail_cd
       WHERE case_id = @case_id AND prop_val_yr = @prop_val_yr AND certified_mailer_batch_id = @batch_id
	AND prot_by_id = @prot_by_id

INSERT mail_assoc (ref_id1,ref_type,val_yr,mail_id,serv_type,cust_id,date_printed)
    VALUES (@case_id,'AP',@prop_val_yr,@cert_mail_cd,@serv_type,@cust_id,GETDATE())

SELECT @prot_by_id_p = @prot_by_id
FETCH NEXT FROM temp_curs into @prot_by_id,@case_id,@prop_val_yr

END

close temp_curs
deallocate temp_curs

GO

