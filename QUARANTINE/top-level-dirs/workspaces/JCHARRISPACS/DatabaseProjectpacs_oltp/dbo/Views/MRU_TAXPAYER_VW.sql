










CREATE VIEW dbo.MRU_TAXPAYER_VW
AS
SELECT pacs_user_id, mru_acct_id1, mru_acct_id2, mru_acct_id3, 
    mru_acct_id4, mru_acct_id5, mru_acct_id6, mru_acct_id7, 
    mru_acct_id8
FROM pacs_user

GO

