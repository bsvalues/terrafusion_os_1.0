use std::path::PathBuf;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let proto_dir = PathBuf::from("../../protos");
    
    // Build all TerraFusion protobuf services with file descriptor support for reflection
    tonic_build::configure()
        .build_server(true)
        .build_client(true)
        .emit_rerun_if_changed(true)
        .file_descriptor_set_path("src/proto_descriptor.bin")
        .compile_protos(
            &[
                "terrafusion/demo/v1/demo.proto",
            ],
            &[proto_dir],
        )?;

    println!("cargo:rerun-if-changed=../../protos");
    
    Ok(())
}