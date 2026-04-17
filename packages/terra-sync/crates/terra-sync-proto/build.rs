fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Use vendored protoc + include path for well-known types
    // (google/protobuf/timestamp.proto etc.). This makes the build
    // fully self-contained — no dependency on a system `protoc` or
    // on whatever well-known-types directory a system install ships.
    let protoc_path = protoc_bin_vendored::protoc_bin_path()?;
    let include_path = protoc_bin_vendored::include_path()?;
    std::env::set_var("PROTOC", protoc_path);

    tonic_build::configure()
        .build_server(true)
        .build_client(true)
        .compile_protos(
            &[
                "proto/control_plane.proto",
                "proto/audit.proto",
                "proto/policy.proto",
            ],
            &[
                "proto",
                include_path.to_str().ok_or("include path not UTF-8")?,
            ],
        )?;
    Ok(())
}
