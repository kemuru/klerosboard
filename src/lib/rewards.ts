import { BigNumber, BigNumberish, ethers } from "ethers";

function getTarget(): number {
    let months;
    const start = new Date(2023, 11, 1)  // When KIP-66 started
    const initialTarget = 0.28  // initial staking target for KIP-66
    const now = new Date();
    // add 1% per month since start date of kip66 with max 50%
    months = (now.getFullYear() - start.getFullYear()) * 12;
    months -= start.getMonth();
    months += now.getMonth();
    months = months <= 0 ? 0 : months
    const target = initialTarget + months * 0.01
    return target > 0.5 ? 0.5 : target
}

function getPreviousMonthAndYear(date: Date = new Date()): { month: string, year: string } {
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    let month, year: number
    // month starts with 0
    if (currentMonth === 0) {
        // month is 12 and the previous year
        month = 12
        year = currentYear - 1
    } else {
        // no need to do month -1 because starts in zero.
        month = currentMonth;
        year = currentYear;
    }
    return {
        month: month < 10 ? `0${month}` : month.toString(),
        year: year.toString()
    }
}

export async function getLastMonthReward(): Promise<number> {

    let { month, year } = getPreviousMonthAndYear();
    // fetch the script where the court get the rewads. There is a list of IPFS files with the rewards there.
    const res = await fetch("https://raw.githubusercontent.com/kleros/court/master/src/components/claim-modal.js")
    const test = await res.text();
    // extract the ipfs files from the court code of the last month (for gnosis and mainnet)
    let reg = new RegExp(`"(?<url>https://ipfs.kleros.io/ipfs/([a-zA-Z0-9]*)/(?<chain>xdai-)?snapshot-${year}-${month}.json)"`, "g");
    let urls = Array.from(test.matchAll(reg)).map(r => r.groups!.url)
    if (urls.length === 0) {
        // try with previous month if no urls where found.
        let { month: prevMonth, year: prevYear } = getPreviousMonthAndYear(new Date(Number(year), Number(month), 1));
        reg = new RegExp(`"(?<url>https://ipfs.kleros.io/ipfs/([a-zA-Z0-9]*)/(?<chain>xdai-)?snapshot-${prevYear}-${prevMonth}.json)"`, "g");
        urls = Array.from(test.matchAll(reg)).map(r => r.groups!.url)
    }
    let lastMonthReward = BigNumber.from(0);
    // read the reward from the ipfs file and add it.
    for (const url of urls) {
        const res = await fetch(url)
        const json = await res.json()
        lastMonthReward = lastMonthReward.add(ethers.BigNumber.from(json.totalClaimable.hex));
    }
    return Number(ethers.utils.formatEther(lastMonthReward.toString()))
}

export async function getStakingReward(
    chainId: string,
    totalStaked: BigNumberish | undefined,
    totalSupply: number | undefined
): Promise<number> {
    if (!totalStaked) return 0;
    if (!totalSupply) return 0;
    const totalStake = Number(ethers.utils.formatUnits(totalStaked, 'ether'));
    const chainRewardPercentage = chainId === '100' ? 0.1 : 0.9  // Reward splitted by court
    const lastMonthReward = await getLastMonthReward();
    const target = getTarget();
    const currentStakedRate = totalStake / totalSupply;
    const chainReward = chainRewardPercentage * lastMonthReward * (1 + target - currentStakedRate);
    return chainReward / totalStake * 12 * 100;
}