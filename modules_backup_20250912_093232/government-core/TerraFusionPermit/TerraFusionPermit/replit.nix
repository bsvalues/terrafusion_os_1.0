{pkgs}: {
  deps = [
    pkgs.libxcrypt
    pkgs.glibcLocales
    pkgs.jq
    pkgs.docker-compose
    pkgs.docker
    pkgs.postgresql
  ];
}
