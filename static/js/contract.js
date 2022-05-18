

const forwarderOrigin = 'http://localhost:9011';
let currentAccount = null;
const onboardButton = document.getElementById('connectButton');
let ether_price = 0;
let addy_price = 0;
let chainId = -1;
let rec_address = '';



const onClickConnect = async () => {
  try {
    // Will open the MetaMask UI
    // You should disable this button while the request is pending!
    await ethereum.request({ method: 'eth_requestAccounts' });
  } catch (error) {
    console.error(error);
  }
};

function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    // MetaMask is locked or the user has not connected any accounts
    console.log('Please connect to MetaMask.');
    currentAccount = null;
    ConnectButtonInit(false);
  } else {
    currentAccount = accounts[0];
    ConnectButtonInit(true);
    // Do any other work!
    return true;
  }
}

function ConnectButtonInit(val){
  if (val)
  {
    onboardButton.innerText = 'Wallet Connected';
    onboardButton.onclick = onClickConnect;
    onboardButton.disabled = false;
  }
  else
  {
    onboardButton.innerText = 'Connect Wallet';
    onboardButton.onclick = onClickConnect;
    onboardButton.disabled = false;
  }
}

const initialize = () => {
  // Basic Actions Section
  const isMetaMaskInstalled = () => {
    const { ethereum } = window;
    return Boolean(ethereum && ethereum.isMetaMask);
  };

  const onboarding = new MetamaskOnboarding({ forwarderOrigin });
  // This will start the onboarding proccess
  const onClickInstall = () => {
    onboardButton.innerText = 'Installing...';
    onboardButton.disabled = true;
    // On this object we have startOnboarding which will start the onboarding process for our end user
    onboarding.startOnboarding();
  };

  const MetaMaskClientCheck = () => {
    if (!isMetaMaskInstalled()) {
      onboardButton.innerText = 'Install MetaMask!';
      onboardButton.onclick = onClickInstall;
      onboardButton.disabled = false;
    } else {
        try {
            currentAccount = ethereum.selectedAddress;
            if (currentAccount === null)
                ConnectButtonInit(false);
            else
                ConnectButtonInit(true);
        } catch (e) {
            ConnectButtonInit(false);
        }
    }
  };
  MetaMaskClientCheck();
  /*const getAccountsButton = document.getElementById('getAccounts');
  const getAccountsResult = document.getElementById('getAccountsResult');
  getAccountsButton.addEventListener('click', async () => {
  // we use eth_accounts because it returns a list of addresses owned by us.
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    // We take the first address in the array of addresses and display it
    getAccountsResult.innerHTML = accounts[0] || 'Not able to get accounts';
  });*/
};
window.addEventListener('DOMContentLoaded', initialize);

try
{
    ethereum.on('accountsChanged', (accounts) => {
      if (accounts == null || accounts.length <= 0)
      {
        ConnectButtonInit(false);
      }
      else
      {
        ConnectButtonInit(true);
        currentAccount = accounts[0];
        window.location.reload();
      }
    });

    ethereum.on('chainChanged', (_chainId) => {
        chainId = _chainId;
        window.location.reload();
    });


    ethereum.on('connect', (ConnectInfo) => {
      if (!ethereum.isConnected())
      {
        ConnectButtonInit(false);
        return;
      }
      ethereum._metamask.isUnlocked().then( (val) => {
        if (val)
        {
          ethereum
            .request({ method: 'eth_accounts' })
            .then(handleAccountsChanged)
            .catch((err) => {
              // Some unexpected error.
              // For backwards compatibility reasons, if no accounts are available,
              // eth_accounts will return an empty array.
              console.error(err);
              ConnectButtonInit(false);
              return;
          });
        }
        else
        {
          ConnectButtonInit(val);
        }
      }).catch(function(err) {
        console.log('then error : ', err); // then error :  Error: Error in then()
        ConnectButtonInit(false);
      });
    });
    ethereum.on('disconnect', (ProviderRpcError) => {
      ConnectButtonInit(false);
    });
} catch (e) {
    console.log(e.toString());
}


function onclick_submit() {
    if (currentAccount === null || currentAccount === '')
    {
        alert('Please connect Metamask');
        return;
    }
    let url = document.getElementById("reg_url").value;
    if (url === "")
    {
        return;
    }
    if (url.lastIndexOf('.') < 0)
    {
        alert("Please put the correct url type");
        return;
    }
    let justification = document.getElementById("reg_justification").value;
    if (justification === "")
    {
        return;
    }
    const files = document.getElementById('file_path').files;
    if (files.length <= 0)
    {
        return;
    }
    const selectedFiles = files[0];
    let formData = new FormData($('.register_file_upload').get(0));
    formData.append('url', url);
    formData.append('justification', justification);
    formData.append('address', currentAccount);
    formData.append('uploading_file', selectedFiles);

    $.ajax({
        type: 'POST',
        url: 'submit_verify',
        data: formData,
        processData: false,  // tell jQuery not to process the data
        contentType: false,
        success: function (res) {
            if (res === 'success') {
                alert("Succeed");
            }
            else {
                alert(res);
            }
        }
    });
}

function onclick_recipient() {
    rec_address = '';
    if (currentAccount === null || currentAccount === '')
    {
        alert('Please connect Metamask');
        return;
    }
    let url = document.getElementById("recipient_url").value;
    if (url === "")
    {
        return;
    }

    $.ajax({
        type: 'GET',
        url: 'get_recipient',
        data: {'url': url},
        success: function (result) {
            let res = JSON.parse(result);
            if (res['result'] === 'success') {
                $('#first_step').attr('hidden', true);
                $('#second_step').attr('hidden', false);
                $('#third_step').attr('hidden', true);
                const rec_website = document.getElementById("rec_website");
                rec_website.innerHTML = res['url'];
                rec_website.href = "http://" + res['url'];
                /*document.getElementById("rec_justification").innerHTML = res['justification'];*/
                document.getElementById("rec_justification").innerHTML = "Designer, Developer & Maker";
                rec_address = res['address'];
                addy_price = parseFloat(res['addy']);
                ether_price = parseFloat(res['ether']);
            }
            else {
                alert(res['result']);
            }
        }
    });
}

function input_function() {
    if ($('#wei-amount').val() === '') return;
    if (parseFloat($('#wei-amount').val()) < 0 && $('#wei-amount').val() !== '') {
        document.getElementById("usd-amount").innerHTML = '$0.00 USD';
        alert("Please input only positive number");
        return;
    }
    let usd_amount;
    let selectedValue = document.getElementById("token_type").value;
    if (selectedValue === 'ether')
    {
        usd_amount = ether_price * parseFloat($('#wei-amount').val());
    }
    else
    {
        usd_amount = addy_price * parseFloat($('#wei-amount').val());
    }
    if (isNaN(usd_amount)) return;
    document.getElementById("usd-amount").innerHTML = '$' + usd_amount.toFixed(2).toString() + ' USD';
}

$('#wei-amount').on('input',function () {
    input_function();
});

let token_type_object = document.getElementById("token_type");
if (token_type_object !== null)
{
    token_type_object.addEventListener('change', (event) => {
        input_function();
    });
}

function get_etherscan_url(chainId, txHash)
{
    let result = '';
    let chain = parseInt(chainId);
    if (chain === 1)
    {
        result = 'https://etherscan.io/tx/' + txHash;
    }
    else if (chain === 3)
    {
        result = 'https://ropsten.etherscan.io/tx/' + txHash;
    }
    else if (chain === 4)
    {
        result = 'https://rinkeby.etherscan.io/tx/' + txHash;
    }
    else if (chain === 5)
    {
        result = 'https://goerli.etherscan.io/tx/' + txHash;
    }
    else
    {
        result = 'https://etherscan.io/tx/' + txHash;
    }
    return result;
}

async function onclick_send() {
    try
    {
        if ($('#wei-amount').val() === '') return;
        let amount = parseFloat($('#wei-amount').val());
        if (isNaN(amount)) return;
        if (amount <= 0) return;
        let amount_wei = amount * Math.pow(10, 18);
        amount_wei = parseInt(amount_wei);
        let value = '0x' + amount_wei.toString(16);
        if (currentAccount === null || currentAccount === '') {
            alert('Please connect Metamask');
            return;
        }
        if (chainId <= 0) {
            chainId = await ethereum.request({method: 'eth_chainId'});
        }
        if (chainId <= 0) return;
        if (rec_address === '')
        {
            alert('Undefined recipient address');
            return;
        }
        if (rec_address === currentAccount)
        {
            alert('Please choose the different address as a recipient');
            return;
        }
        let txHash = '';
        let selectedValue = document.getElementById("token_type").value;
        if (selectedValue === 'ether')
        {
            const transactionParameters = {
              nonce: '0x00', // ignored by MetaMask
              to: rec_address, // Required except during contract publications.
              from: currentAccount, // must match user's active address.
              value: value,
              chainId: chainId.toString()
            };
            txHash = await ethereum.request({
              method: 'eth_sendTransaction',
              params: [transactionParameters],
            });
        }
        else if (selectedValue === 'addy')
        {
            let ajax_result = {'result': 'none'};
            $.ajax({
                type: 'GET',
                url: 'get_addy_transfer_data',
                async: false,
                data: {'amount': amount, 'to_address': rec_address},
                success: function (result) {
                    ajax_result = JSON.parse(result);
                }
            });
            if (ajax_result['result'] === 'success') {
                const transactionParameters = {
                  nonce: '0x00', // ignored by MetaMask
                  to: ajax_result['contract_address'], // Required except during contract publications.
                  from: currentAccount, // must match user's active address.
                  value: '0x0',
                  data: ajax_result['data'],
                  gas: ajax_result['gas'],
                  gasPrice: ajax_result['gasPrice'],
                  chainId: chainId.toString()
                };
                txHash = await ethereum.request({
                  method: 'eth_sendTransaction',
                  params: [transactionParameters],
                });
            }
            else {
                alert(ajax_result['result']);
                return;
            }
        }
        let url = document.getElementById("recipient_url").value;

        $.ajax({
            type: 'POST',
            url: 'save_transaction',
            data: {'url': url, 'amount': amount, 'to_address': rec_address, 'from_address': currentAccount,
            'chain_id': chainId, 'tx_hash': txHash, 'coin': selectedValue},
            success: function (res) {
                if (res === 'success') {
                    $('#first_step').attr('hidden', true);
                    $('#second_step').attr('hidden', true);
                    $('#third_step').attr('hidden', false);
                    const view = document.getElementById('view-on-etherscan');
                    view.href = get_etherscan_url(chainId, txHash);
                }
                else {
                    alert(res);
                }
            }
        });
    } catch (e) {
        console.log(e);
        alert(e.message.toString());
    }
}

