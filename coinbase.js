const axios = require("axios");
const CryptoJS = require("crypto-js");
const { v4: uuidv4 } = require("uuid");

async function handleCoinbaseOrder(apiKey, secretKey, message) {
  const { action } = message;
  let endpoint = "";

  let timestamp = await axios({
    method: "GET",
    url: "https://api.exchange.coinbase.com/time",
  });
  timestamp = Math.floor(timestamp.data.epoch).toString();
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

  if (action === "getAccountData") {
    config.method = "GET";
    endpoint = "/accounts";
    config.data = {};
  } else if (action === "getOrderList") {
    config.method = "GET";
    endpoint = "/orders";
    config.data = { accountid: message.accountid };
  } else if (action === "cancelOrder") {
    //Needs Implementation
  } else {
    config.method = "POST";
    endpoint = "/orders";
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

  let requestPath = "/api/v3/brokerage" + endpoint;
  config.url = "https://api.coinbase.com" + requestPath;

  const what = timestamp + config.method + requestPath + config.data;
  function sign(str, secret) {
    const hash = CryptoJS.HmacSHA256(str, secret);
    return hash.toString();
  }
  config.headers["CB-ACCESS-SIGN"] = sign(what, secretKey);
  console.log(config);

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
