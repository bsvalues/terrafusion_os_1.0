CREATE TABLE [dbo].[split_merge] (
    [split_merge_id]                            INT            NOT NULL,
    [parent_split_merge_id]                     INT            NULL,
    [type]                                      VARCHAR (10)   NULL,
    [status]                                    VARCHAR (10)   NULL,
    [bla_process]                               BIT            NULL,
    [current_use_required]                      BIT            NULL,
    [current_use_complete]                      BIT            NULL,
    [current_use_complete_user_id]              INT            NULL,
    [current_use_complete_date]                 DATETIME       NULL,
    [senior_required]                           BIT            NULL,
    [senior_complete]                           BIT            NULL,
    [senior_complete_user_id]                   INT            NULL,
    [senior_complete_date]                      DATETIME       NULL,
    [ownership_transfer_required]               BIT            NULL,
    [ownership_transfer_complete]               BIT            NULL,
    [ownership_transfer_complete_user_id]       INT            NULL,
    [ownership_transfer_complete_date]          DATETIME       NULL,
    [delete_create_account]                     BIT            NULL,
    [intermediate_split_merge]                  BIT            NULL,
    [intermediate_split_merge_complete]         BIT            NULL,
    [intermediate_split_merge_complete_user_id] INT            NULL,
    [intermediate_split_merge_complete_date]    DATETIME       NULL,
    [create_event]                              BIT            NULL,
    [event_description]                         VARCHAR (2048) NULL,
    [print_letter]                              BIT            NULL,
    [number_of_new_properties]                  INT            NULL,
    [letter_id]                                 INT            NULL,
    [new_property_id]                           INT            NULL,
    [sup_comment]                               VARCHAR (3000) NULL,
    [sup_reason]                                VARCHAR (500)  NULL,
    [sup_group]                                 INT            NULL,
    [sup_cd]                                    CHAR (10)      NULL,
    [exclude_change_of_value]                   BIT            NULL,
    [has_supp_conflict]                         BIT            NULL,
    [income_required]                           BIT            NULL,
    [income_complete]                           BIT            NULL,
    [income_complete_user_id]                   INT            NULL,
    [income_complete_date]                      DATETIME       NULL,
    CONSTRAINT [CPK_split_merge] PRIMARY KEY CLUSTERED ([split_merge_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_split_merge_letter_id] FOREIGN KEY ([letter_id]) REFERENCES [dbo].[letter] ([letter_id]),
    CONSTRAINT [CFK_split_merge_parent_split_merge_id] FOREIGN KEY ([parent_split_merge_id]) REFERENCES [dbo].[split_merge] ([split_merge_id]),
    CONSTRAINT [CFK_split_merge_status] FOREIGN KEY ([status]) REFERENCES [dbo].[split_merge_status_code] ([status_code])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Specifies the date the review was complete', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'split_merge', @level2type = N'COLUMN', @level2name = N'income_complete_date';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicates whether or not this split/merge has properties that were in an active supplement', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'split_merge', @level2type = N'COLUMN', @level2name = N'has_supp_conflict';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Determines if Income Value Review is required', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'split_merge', @level2type = N'COLUMN', @level2name = N'income_required';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Determines if Income Value Review has been completed', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'split_merge', @level2type = N'COLUMN', @level2name = N'income_complete';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Specifies the user that completed the review', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'split_merge', @level2type = N'COLUMN', @level2name = N'income_complete_user_id';


GO

