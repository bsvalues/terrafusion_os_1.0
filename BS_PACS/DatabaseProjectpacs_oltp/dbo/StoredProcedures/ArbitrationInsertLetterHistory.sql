
create procedure ArbitrationInsertLetterHistory

	@arbitration_id int,
	@prop_val_yr numeric(4,0),
	@letter_id int,
	@pacs_user_id int,
	@letter_path varchar(255)
as

insert arbitration_letter_history
(arbitration_id, prop_val_yr, letter_id, pacs_user_id, create_dt, letter_path)
values
(@arbitration_id, @prop_val_yr, @letter_id, @pacs_user_id, getdate(), @letter_path)

GO

