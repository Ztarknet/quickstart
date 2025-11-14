# Deploying Noir app on Ztarknet

This is a step by step tutorial showing how to deploy a toy privacy preserving app on Ztarknet.  
We will use Noir for writing ZK circuit, Garaga toolchain to generate Cairo contract, and sncast to interact with the chain.

## Set up the environment

### Installation

Install Starknet development suite (recommended way is via asdf):
- Scarb https://docs.swmansion.com/scarb/download.html#install-via-asdf
- Starknet Foundry https://foundry-rs.github.io/starknet-foundry/getting-started/installation.html

### Create and deploy your account

```
make account-create
```

Go to the [faucet](https://faucet.ztarknet.cash/) and top up your account address.

```
make account-deploy
```

Make sure you received the funds:

```
make account-balance
```

## Deploy application

### Installation

Install Noir development toolchain:

```
make install-noir
make install-barretenberg
```

Install Garaga SDK & CLI:

```
pip install garaga==0.18.1
```

> [!NOTE]
> Python 3.10 is required to install Garaga.
> Use `pyenv` to manage your Python versions.

### Create and prove a circuit

Start with creating a new Noir project:

```bash
nargo new circuit
cd circuit
nargo check
```

Fill the `Prover.toml` file with the inputs:

```toml
x = "1"
y = "2"
```

Execute the circuit to generate a witness:

```bash
nargo execute witness
```

Prove the circuit:

```bash
bb prove --scheme ultra_honk --zk --oracle_hash starknet -b ./target/circuit.json -w ./target/witness.gz -o ./target
```

Generate a verifying key:

```bash
bb write_vk --scheme ultra_honk --oracle_hash starknet -b ./target/circuit.json -o ./target
```

### Generate and verifier contract

Let Garaga automatically generate a Scarb project for you:

```bash
garaga gen --system ultra_starknet_zk_honk --vk ./circuit/target/vk --project-name verifier
```

Now we can build the contract:

```bash
scarb build
```

### Deploy verifier contract

First we need to declare the contract ("upload it's code hash to the network"):

```bash
# In the root dir
cd verifier && sncast declare --contract-name UltraStarknetZKHonkVerifier
```

Then we can instantiate it (change class-hash according to the output on the previous step):

```bash
# In the root dir
sncast invoke \
  --contract-address 0x041a78e741e5af2fec34b695679bc6891742439f7afb8484ecd7766661ad02bf \
  --function "deployContract" \
  --calldata 0x3575239fa10a4e2bacbf0e2105f8d86473aa19d21441b39675be7fbb5924adf 0x0 0x0 0x0
```

Check the transaction in the [explorer](https://explorer-zstarknet.d.karnot.xyz/) to see the deployed contract address (see events).

What just happened:
- We asked universal deployer contract (UDC v1) to deploy Garaga verifier
- We passed verifier class hash as a first argument and set the rest to zeros (no constructor parameters)

### Verify the proof on Ztarknet

Serialize Noir proof as contract calldata:

```bash
garaga calldata --system ultra_starknet_zk_honk --proof circuit/target/proof --vk circuit/target/vk --public-inputs circuit/target/public_inputs > calldata.txt
```

Let's first call the verifier contract (without creating a transaction):

```bash
sncast call \
    --contract-address 0x02048def58e122c910f80619ebab076b0ef5513550d38afdfdf2d8a1710fa7c6 \
    --function "verify_ultra_starknet_zk_honk_proof" \
    --calldata $(cat calldata.txt)
```

Now let's invoke the verifier contract:

```bash
sncast invoke \
  --contract-address 0x02048def58e122c910f80619ebab076b0ef5513550d38afdfdf2d8a1710fa7c6 \
  --function "verify_ultra_starknet_zk_honk_proof" \
  --calldata $(cat calldata.txt)
```

Check the transaction in the [explorer](https://explorer-zstarknet.d.karnot.xyz/).

## Get help

Something got wrong?

Ask us in the [Zypherpunk hackathon chat](https://t.me/+euCua6eocTc1NmM1).
