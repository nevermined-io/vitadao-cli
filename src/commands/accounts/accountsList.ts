import { Constants, getConfig, loadNftContract, StatusCodes } from "../../utils";
import { Nevermined } from "@nevermined-io/nevermined-sdk-js";
import chalk from "chalk";
import utils from "web3-utils";

export const accountsList = async (argv: any): Promise<number> => {
  const { verbose, network, withInventory } = argv;

  if (verbose) console.log(`Loading accounts`);

  const config = getConfig(network as string);
  const nvm = await Nevermined.getInstance(config.nvm);

  if (!nvm.keeper) {
    console.log(Constants.ErrorNetwork(network));
    return StatusCodes.FAILED_TO_CONNECT;
  }

  const accounts = await nvm.accounts.list();

  const nft = loadNftContract(config);

  const decimals = await nvm.keeper.token.decimals();

  const loadedAccounts = await Promise.all(
    accounts.map(async (a, index) => {
      const ethBalance = utils.fromWei(
        (await a.getEtherBalance()).toString(),
        "ether"
      );

      const tokenBalance =
        (await nvm.keeper.token.balanceOf(a.getId())) / 10 ** decimals;

      console.log(await nvm.keeper.token.balanceOf(a.getId()));

      const inventory = withInventory
        ? await Promise.all(
            (
              await nft.getPastEvents("Transfer", {
                fromBlock: 0,
                toBlock: "latest",
                filter: {
                  to: a.getId(),
                },
              })
            ).map(async (l) => {
              // check if the account is still the owner
              if (
                ((await nft.methods
                  .ownerOf(l.returnValues.tokenId)
                  .call()) as string).toLowerCase() === a.getId().toLowerCase()
              ) {
                return {
                  block: l.blockNumber,
                  tokenId: utils.toHex(l.returnValues.tokenId),
                  url: `${config.etherscanUrl}/token/${config.nftTokenAddress}?a=${l.returnValues.tokenId}#inventory`,
                };
              }
            })
          )
        : [];

      return {
        index,
        id: a.getId(),
        ethBalance,
        tokenBalance,
        url: `${config.etherscanUrl}/address/${a.getId()}`,
        nftTokenUrl: `${config.etherscanUrl}/token/${config.nftTokenAddress}`,
        nftBalance: await nft.methods.balanceOf(a.getId()).call(),
        inventory,
      };
    })
  );

  for (const a of loadedAccounts) {
    console.log(
      chalk.dim(`===== Account ${chalk.whiteBright(a.index + 1)} =====`)
    );
    console.log(chalk.dim(`Address: ${chalk.whiteBright(a.id)}`));
    console.log(chalk.dim(`ETH Balance: ${chalk.whiteBright(a.ethBalance)}`));
    console.log(
      chalk.dim(`Token Balance: ${chalk.whiteBright(a.tokenBalance)}`)
    );
    console.log(chalk.dim(`Etherscan Url: ${chalk.whiteBright(a.url)}`));
    console.log(chalk.dim(`NFT Balance: ${chalk.whiteBright(a.nftBalance)}`));

    if (a.inventory.length > 0) {
      console.log(chalk.whiteBright(`\nNFT Inventory`));
      for (const inv of a.inventory) {
        console.log(
          chalk.dim(`===== NFT ${chalk.whiteBright(inv!.tokenId)} =====`)
        );
        console.log(
          chalk.dim(`Received at block: ${chalk.whiteBright(inv!.block)}`)
        );
        console.log(chalk.dim(`Etherscan Url: ${chalk.whiteBright(inv!.url)}`));
      }
    }

    console.log("\n");
  }

  return StatusCodes.OK;
};
