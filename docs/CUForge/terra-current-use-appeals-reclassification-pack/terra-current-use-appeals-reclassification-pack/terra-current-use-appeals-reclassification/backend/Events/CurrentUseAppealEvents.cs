namespace TerraFusion.Modules.CurrentUse.Events;

public sealed record CurrentUseAppealWindowOpened(
    Guid CountyId,
    Guid ParcelId,
    Guid AppealId,
    DateOnly AppealDeadline,
    string CreatedBy,
    DateTimeOffset CreatedAt
);

public sealed record CurrentUseAppealFiled(
    Guid CountyId,
    Guid ParcelId,
    Guid AppealId,
    string BoardReferenceNumber,
    DateOnly FiledDate,
    string UpdatedBy,
    DateTimeOffset UpdatedAt
);

public sealed record CurrentUseReclassificationOptionOpened(
    Guid CountyId,
    Guid ParcelId,
    Guid ReclassificationId,
    DateOnly ApplicationDeadline,
    string CreatedBy,
    DateTimeOffset CreatedAt
);

public sealed record CurrentUseReclassificationApplicationReceived(
    Guid CountyId,
    Guid ParcelId,
    Guid ReclassificationId,
    DateOnly ApplicationReceivedDate,
    string UpdatedBy,
    DateTimeOffset UpdatedAt
);
