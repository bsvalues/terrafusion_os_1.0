
CREATE PROCEDURE CertifiedMailerDeleteBatchID
   @input_batch_id int 
AS

--Remove the event
DELETE from _arb_event
WHERE lEventID in 
(
    SELECT lEventID from _arb_event_object with(nolock)
    where szObjectPath  in 
    (
    	SELECT szPathLocation FROM _arb_letter_history  alh with(nolock)
    	INNER JOIN CERTIFIED_MAILER   cmb  with(nolock) ON
    	cmb.prop_val_yr = alh.lPropValYr AND
    	cmb.case_id     = alh.lCaseID    AND
    	cmb.CERTIFIED_MAILER_BATCH_ID = isnull(alh.lBatchID,0)
    	WHERE cmb.CERTIFIED_MAILER_BATCH_ID = @input_batch_id
    ) 
)
 
--Remove the event objects
DELETE FROM _arb_event_object 
where szObjectPath   in 
(
	SELECT szPathLocation FROM _arb_letter_history  alh with(nolock)
	INNER JOIN CERTIFIED_MAILER   cmb  with(nolock) ON
	cmb.prop_val_yr = alh.lPropValYr AND
	cmb.case_id     = alh.lCaseID    AND
	cmb.CERTIFIED_MAILER_BATCH_ID = isnull(alh.lBatchID,0)
	WHERE cmb.CERTIFIED_MAILER_BATCH_ID = @input_batch_id
)

--Remove the letters
DELETE FROM _arb_letter_history WHERE 
lARBLetterHistoryID IN 
(
select lARBLetterHistoryID
from _arb_letter_history  alh with(nolock)
        INNER JOIN CERTIFIED_MAILER   cmb with(nolock) ON
        cmb.prop_val_yr = alh.lPropValYr AND
        cmb.case_id     = alh.lCaseID    AND
        cmb.CERTIFIED_MAILER_BATCH_ID = isnull(alh.lBatchID,0)
        WHERE cmb.CERTIFIED_MAILER_BATCH_ID = @input_batch_id 
)
--Remove the items from the certified mailer table
DELETE FROM CERTIFIED_MAILER WHERE CERTIFIED_MAILER_BATCH_ID = @input_batch_id
--Remove the batch id from the CERTIFIED_MAILER_BATCH table
DELETE FROM CERTIFIED_MAILER_BATCH WHERE CERTIFIED_MAILER_BATCH_ID = @input_batch_id

GO

