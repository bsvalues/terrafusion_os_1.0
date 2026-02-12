{
  pkgs ? import <nixpkgs> {}
}:

pkgs.nodePackages.mkNodeApplication {
  pname = "codeagent-cli";
  version = "1.0.0";
  src = ./.;
  npmDepsHash = "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
  nativeBuildInputs = [
    pkgs.makeWrapper
  ];
  postInstall = ''
    wrapProgram $out/bin/codeagent --set NODE_PATH "$NODE_PATH:$out/lib/node_modules"
  '';
  meta = {
    description = "Enhanced AI code assistant with learning capabilities";
    homepage = "https://github.com/yourusername/codeagent-cli";
    license = pkgs.lib.licenses.mit;
  };
}