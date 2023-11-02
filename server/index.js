const { secp256k1 } = require("ethereum-cryptography/secp256k1");
const { toHex } = require("ethereum-cryptography/utils");
const { hexToBytes } = require("ethereum-cryptography/utils");
const { keccak256 } = require("ethereum-cryptography/keccak");
const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

app.use(cors());
app.use(express.json());

const balances = {
  "0xd6309d24276740bf6e0f5469ea1d3e42698f1da9": 100,
  "0x2c36d9323a2ffbf491626a8afe1153fa963ebfad": 50,
  "0xd2b0cc1074f0d8e97483166b9775abf5678eea70": 75,
};

// Private Key:  fd584399db9536dd0bfc3f519f4b8bf78decb1bcec4d08eb0a3eb3d9ad13ab76
// Public Key:  02cd2beec075806b1ca4f7108f1eb03e269002996192ecf4626ec236986b11e3b7
// Keccak Hash:  31e6a12a9fee869884ec0878d6309d24276740bf6e0f5469ea1d3e42698f1da9
// Address:  0xd6309d24276740bf6e0f5469ea1d3e42698f1da9

// ===
// Private Key:  7592016a50a5a061082fbad2d68f2d1a4e4f852df5ac4908902013a9a0682b9e
// Public Key:  02e06e76e2a87b39bab23eb0c4d57157504a64a999469b92b032114fddbd9e2b88
// Keccak Hash:  77926c91f9b04dfcb5d5cf3b2c36d9323a2ffbf491626a8afe1153fa963ebfad
// Address:  0x2c36d9323a2ffbf491626a8afe1153fa963ebfad

// ===
// Private Key:  128c3390c584067d695f6469d2b6437754af7c6fa86a675ebb3b0986e01f75f7
// Public Key:  03e0b3bb2a44cccdc6290af046966a9ca9b34c943fecbd621e6f24188a8f9a6e98
// Keccak Hash:  ee212eef058ea4ee66275faad2b0cc1074f0d8e97483166b9775abf5678eea70
// Address:  0xd2b0cc1074f0d8e97483166b9775abf5678eea70

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { sign, msg, recoveryBit, recipient, amount } = req.body;

  // convert hex back to Signature Type
  const sig = secp256k1.Signature.fromCompact(sign).addRecoveryBit(recoveryBit);
  // recover public key (ProjPointType)
  const point = sig.recoverPublicKey(msg);
  // convert ProjPointType to Hex
  const publicKey = point.toHex();

  if(secp256k1.verify(sig, msg, publicKey)){
    const keccakHash = keccak256(hexToBytes(publicKey));
    const sender = '0x' + toHex(keccakHash.slice(-20));

    setInitialBalance(sender);
    setInitialBalance(recipient);

    if (balances[sender] < amount) {
      res.status(400).send({ message: "Not enough funds!" });
    } else {
      balances[sender] -= amount;
      balances[recipient] += amount;
      res.send({ balance: balances[sender] });
    }
  
  } else {
    res.status(400).send({ message: "Invalid Signature!" });
  }
    

  

  
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
