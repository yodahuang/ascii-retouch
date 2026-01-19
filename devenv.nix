{ pkgs, lib, config, inputs, ... }:

{
  languages.javascript = {
    enable = true;
    bun.enable = true;
  };

  packages = [
    pkgs.claude-code
    pkgs.biome
  ];

  scripts = {
    test.exec = "bun test";
    dev.exec = "bunx serve .";
    lint.exec = "biome check .";
    "lint:fix".exec = "biome check --write .";
  };
}
