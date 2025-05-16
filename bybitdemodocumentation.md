Create API Key
You need to log in to your mainnet account;
Switch to Demo Trading, please note it is an independent account for demo trading only, and it has its own user ID;
Hover the mouse on user avatar, then click "API" to generate api key and secret;
Usage rules
Basic trading rules are the same as real trading
Orders generated in demo trading keep 7 days
Default rate limit, not upgradable
Domain
Mainnet Demo Trading URL:
Rest API: https://api-demo.bybit.com
Websocket: wss://stream-demo.bybit.com (note that this only supports the private streams; public data is identical to that found on mainnet with wss://stream.bybit.com; WS Trade is not supported)

Tips
Please note that demo trading is an isolated module. When you create the key from demo trading, please use above domain to connect.
By the way, it is meaningless to use demo trading service in the testnet website, so do not create a key from Testnet demo trading.
Available API List
Cateogory	Title	Endpoint
Market	All	all endpoints
Trade	Place Order	/v5/order/create
Amend Order	/v5/order/amend
Cancel order	/v5/order/cancel
Get Open Orders	/v5/order/realtime
Cancel All Orders	/v5/order/cancel-all
Get Order History	/v5/order/history
Get Trade History	/v5/execution/list
Batch Place Order	/v5/order/create-batch (linear,option)
Batch Amend Order	/v5/order/amend-batch (linear,option)
Batch Cancel Order	/v5/order/cancel-batch (linear,option)
Position	Get Position Info	/v5/position/list
Set Leverage	/v5/position/set-leverage
Switch Position Mode	/v5/position/switch-mode
Set Trading Stop	/v5/position/trading-stop
Set Auto Add Margin	/v5/position/set-auto-add-margin
Add Or Reduce Margin	/v5/position/add-margin
Get Closed PnL	/v5/position/closed-pnl
Account	Get Wallet Balance	/v5/account/wallet-balance
Get Borrow History	/v5/account/borrow-history
Set Collateral Coin	/v5/account/set-collateral-switch
Get Collateral Info	/v5/account/collateral-info
Get Coin Greeks	/v5/asset/coin-greeks
Get Account Info	/v5/account/info
Get Transaction Log	/v5/account/transaction-log
Set Margin Mode	/v5/account/set-margin-mode
Set Spot Hedging	/v5/account/set-hedging-mode
Asset	Get Delivery Record	/v5/asset/delivery-record
Get USDC Session Settlement	/v5/asset/settlement-record
Spot Margin Trade	Toggle Margin Trade	/v5/spot-margin-trade/switch-mode
Set Leverage	/v5/spot-margin-trade/set-leverage
Get Status And Leverage	/v5/spot-margin-uta/status
WS Private	order,execution,position,wallet,greeks	/v5/private
Request Demo Trading Funds
API rate limit: 1 req per minute

HTTP Request
POST /v5/account/demo-apply-money

Request Parameters
Parameter	Required	Type	Comments
adjustType	false	integer	0(default): add demo funds; 1: reduce demo funds
utaDemoApplyMoney	false	array	
> coin	false	string	Applied coin, supports BTC, ETH, USDT, USDC
> amountStr	false	string	Applied amount, the max applied amount in each request
BTC: "15"
ETH: "200"
USDT: "100000"
USDC: "100000"
Request Example
POST /v5/account/demo-apply-money HTTP/1.1
Host: api-demo.bybit.com
X-BAPI-SIGN: XXXXXXX
X-BAPI-API-KEY: XXXXXXX
X-BAPI-TIMESTAMP: 1711420489915
X-BAPI-RECV-WINDOW: 5000
Content-Type: application/json

{
    "adjustType": 0,
    "utaDemoApplyMoney": [
        {
            "coin": "USDT",
            "amountStr": "109"
        },
        {
            "coin": "ETH",
            "amountStr": "1"
        }
    ]
}

Create Demo Account
API rate limit: 5 req per second
Permission: AccountTransfer, SubMemberTransfer or SubMemberTransferList

info
Use product main account or sub account key to call the interface, the domain needs to be "api.bybit.com"
If demo account is existing, this POST request will return the existing UID directly
If using main account key to call, then the generated demo account is under the main account
If using sub account key to call, then the generated demo account is under the sub account
HTTP Request
POST /v5/user/create-demo-member

Request Parameters
None

Response Parameters
Parameter	Type	Comments
subMemberId	string	Demo account ID
Request Example
POST /v5/user/create-demo-member HTTP/1.1
Host: api.bybit.com
X-BAPI-SIGN: XXXXXXX
X-BAPI-API-KEY: XXXXXXX
X-BAPI-TIMESTAMP: 1728460942776
X-BAPI-RECV-WINDOW: 5000
Content-Type: application/json
Content-Length: 2

{}

Create Demo Account API Key
info
Input generated demo account uid
Use production main account key to call the interface, the domain needs to be "api.bybit.com"
Update Demo Account API Key
info
Use production main account key to call the interface, the domain needs to be "api.bybit.com"
Get Demo Account API Key Info
info
Use accordingly demo account key to call the interface, the domain needs to be "api-demo.bybit.com"
Delete Demo Account API Key
info
Use production main account key to call the interface, the domain needs to be "api.bybit.com