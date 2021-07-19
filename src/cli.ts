import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { accounts, getNft, mint } from "./commands";

yargs(hideBin(process.argv))
  .showHelpOnFail(true)
  .demandCommand()
  .command(
    "accounts",
    "get accounts list",
    (yargs) => {
      return yargs.option("with-inventory", {
        type: "boolean",
        default: false,
        description: "Load NFT inventory as well",
      });
    },
    async (argv) => {
      process.exit(await accounts(argv));
    }
  )
  .command(
    "mint to id url [minter]",
    "mint an nft",
    (yargs) => {
      return yargs
        .positional("to", {
          describe: "receiver address",
          type: "string",
        })
        .positional("id", {
          describe: "the id of the token to mint",
          type: "string",
        })
        .positional("url", {
          describe: "the url of the asset",
          type: "string",
        })
        .positional("minter", {
          describe: "the address of the minter",
          type: "string",
        });
    },
    async (argv) => {
      process.exit(await mint(argv));
    }
  )
  .command(
    "create-sales-agreement did",
    "creates an sales agreement",
    (yargs) => {
      return yargs.positional("did", {
        describe: "the did to retrieve",
        type: "string",
      });
    },
    async (argv) => {
      process.exit(await mint(argv));
    }
  )
  .command(
    "nft did",
    "Retrieves information about an NFT",
    (yargs) => {
      return yargs.positional("did", {
        describe: "the did to retrieve",
        type: "string",
      });
    },
    async (argv) => {
      process.exit(await getNft(argv));
    }
  )
  .option("verbose", {
    alias: "v",
    type: "boolean",
    description: "Run with verbose logging",
  })
  .option("network", {
    alias: "n",
    type: "string",
    default: "rinkeby",
    description: "the network to use",
  }).argv;
