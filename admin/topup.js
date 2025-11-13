require('dotenv').config();
const starknet = require('starknet');
const ERC20 = require('./ERC20.json');

const recipient = process.env.TOPUP_ADDRESS;
const fee_token_address = '0x1ad102b4c4b3e40a51b6fb8a446275d600555bd63a95cdceed3e5cef8a6bc1d';
const topup_amount = 1000000000000000000000;

const provider = new starknet.RpcProvider({
    nodeUrl: 'https://ztarknet-madara.d.karnot.xyz',
});
const account = new starknet.Account({
    provider,
    address: process.env.ADMIN_ADDRESS,
    signer: process.env.ADMIN_KEY,
    cairoVersion: '1',
    transactionVersion: '0x3',
    defaultTipType: 'recommendedTip',
});

async function transfer() {
    const contract = new starknet.Contract({
        abi: ERC20.abi,
        address: fee_token_address,
        providerOrAccount: provider,
    });
    const nonce = await provider.getNonceForAddress(
        account.address,
        'pre_confirmed'
    );
    let result = contract.populate('transfer', {
        recipient,
        amount: {
            low: topup_amount,
            high: 0,
        },
    });

    let tx_result = await account.execute(result, {
        blockIdentifier: 'pre_confirmed',
        tip: 1000n,
        nonce,
    });
    const receipt = await provider.waitForTransaction(
        tx_result.transaction_hash,
        {
            retryInterval: 100,
        }
    );
    console.log('receipt - ', receipt);
}

transfer();