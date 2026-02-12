{pkgs}: {
  deps = [
    pkgs.cargo
    pkgs.rustc
    pkgs.postgresql
    pkgs.jq
  ];
}
