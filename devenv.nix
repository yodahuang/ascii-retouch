{ pkgs, lib, config, inputs, ... }:

{
  languages.javascript = {
    enable = true;
    bun.enable = true;
  };

  packages = [
    pkgs.claude-code
    pkgs.biome
    pkgs.gh
    pkgs.wrangler
  ];

  scripts = {
    test.exec = "bun test";
    dev.exec = "bunx serve .";
    lint.exec = "biome check .";
    "lint:fix".exec = "biome check --write .";
    deploy.exec = ''
      rm -rf dist && mkdir -p dist
      cp index.html style.css app.js retouch.js dist/
      wrangler pages deploy dist --project-name=ascii-retouch
    '';
  };
}
