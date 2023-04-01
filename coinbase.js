const axios = require("axios");
const CryptoJS = require("crypto-js");
const { v4: uuidv4 } = require("uuid");

async function handleCoinbaseOrder(apiKey, secretKey, message) {
  let timestamp = await getCurrentTime();

  //build the config object for the axios fetch
  let config = buildConfig(apiKey, message, timestamp);
  let requestPath = "/api/v3/brokerage" + config.url;
  config.url = "https://api.coinbase.com" + requestPath;

  //Generate Signature
  const what = timestamp + config.method + requestPath + config.data;
  config.headers["CB-ACCESS-SIGN"] = sign(what, secretKey);

  //Use API Authentication to access account via axios.
  try {
    const result = await axios(config);
    console.log("response: " + result.response.status);
    return {
      status: result.response.status,
      statusText: result.response.statusText,
    };
  } catch (err) {
    console.log("Error response:\n" + err.response.status);
    return { status: err.response.status, statusText: err.response.statusText };
  }
}

async function getCurrentTime() {
  let timestamp = await axios({
    method: "GET",
    url: "https://api.exchange.coinbase.com/time",
  });
  timestamp = Math.floor(timestamp.data.epoch).toString();
  return timestamp;
}

function buildConfig(apiKey, message, timestamp) {
  const { action } = message;
  let config = {
    method: "",
    url: "",
    headers: {
      "CB-ACCESS-KEY": apiKey,
      "CB-ACCESS-SIGN": "",
      "CB-ACCESS-TIMESTAMP": timestamp,
      "Content-Type": "application/json",
    },
    data: {},
  };

  //Determine Endpoint on Coinbase
  if (action === "getAccountData") {
    config.method = "GET";
    config.url = "/accounts";
    config.data = {};
  } else if (action === "getOrderList") {
    config.method = "GET";
    config.url = "/orders";
    config.data = { accountid: message.accountid };
  } else if (action === "cancelOrder") {
    //Needs Implementation
  } else {
    config.method = "POST";
    config.url = "/orders";
    config.data = {
      client_order_id: uuidv4(),
      product_id: message.symbol,
      side: action.toUpperCase(),
      order_configuration: {
        limit_limit_gtc: {
          base_size: message.quantity,
          limit_price: message.positionPrice,
          post_only: true,
        },
      },
    };
  }
  return config;
}

function sign(str, secret) {
  const hash = CryptoJS.HmacSHA256(str, secret);
  return hash.toString();
}
module.exports = handleCoinbaseOrder;


// {
//   method: 'GET',
//   url: 'https://api.coinbase.com/api/v3/brokerage/accounts',
//   headers: {
//     'CB-ACCESS-KEY': 'keyStringHere',
//     'CB-ACCESS-SIGN': 'b79359cc68c411b42c906c0b54c48192c8081b8c7c943609417c2a00dfd94a05',
//     'CB-ACCESS-TIMESTAMP': '1680303764',
//     'Content-Type': 'application/json'
//   },
//   data: {}
// }
