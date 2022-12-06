/* eslint-disable */
export default [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_owner",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_nonce",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bytes",
        "name": "_returnData",
        "type": "bytes"
      }
    ],
    "name": "CallEvent",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "_logicContractAddress",
        "type": "address[]"
      },
      {
        "internalType": "bytes[]",
        "name": "_payload",
        "type": "bytes[]"
      },
      {
        "internalType": "uint256[]",
        "name": "_value",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256",
        "name": "_timeout",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "_v",
        "type": "uint8"
      },
      {
        "internalType": "bytes32",
        "name": "_r",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "_s",
        "type": "bytes32"
      }
    ],
    "name": "call",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nonce",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
]
