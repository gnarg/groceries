with (import<nixpkgs> {});
mkShell {
  buildInputs = [
    ruby_3_2
    bundler
    sqlite
    libyaml
  ];
}