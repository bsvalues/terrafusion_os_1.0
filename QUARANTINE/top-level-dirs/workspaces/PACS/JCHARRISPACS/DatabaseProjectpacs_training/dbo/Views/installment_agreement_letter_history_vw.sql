

CREATE VIEW dbo.installment_agreement_letter_history_vw
AS
SELECT     dbo.installment_agreement_letter_history.ia_id, dbo.installment_agreement_letter_history.letter_id, dbo.letter.letter_name, 
                      dbo.installment_agreement_letter_history.pacs_user_id, dbo.pacs_user.full_name, dbo.installment_agreement_letter_history.create_dt, 
                      dbo.installment_agreement_letter_history.app_location, dbo.installment_agreement_letter_history.path_location
FROM         dbo.installment_agreement_letter_history LEFT OUTER JOIN
                      dbo.letter ON dbo.installment_agreement_letter_history.letter_id = dbo.letter.letter_id LEFT OUTER JOIN
                      dbo.pacs_user ON dbo.installment_agreement_letter_history.pacs_user_id = dbo.pacs_user.pacs_user_id

GO

