//! Protobuf contracts for TerraFusion Sync v4.
//!
//! Generated code is produced at build time by `build.rs`.

pub mod control {
    tonic::include_proto!("terrafusion.sync.v4.control");
}

pub mod audit {
    tonic::include_proto!("terrafusion.sync.v4.audit");
}

pub mod policy {
    tonic::include_proto!("terrafusion.sync.v4.policy");
}
