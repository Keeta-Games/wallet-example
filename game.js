let score = 0
let highScore = 0
let walletAddress = null

// Detect wallet extension (handles async injection)
async function detectWallet() {
  // Check immediate availability (try both names)
  if (typeof window.keeta !== 'undefined' || typeof window.keethings !== 'undefined') {
    return true
  }

  // Wait for extension to inject (extensions load asynchronously)
  await new Promise(resolve => setTimeout(resolve, 500))

  return typeof window.keeta !== 'undefined' || typeof window.keethings !== 'undefined'
}

// Check if wallet is already connected
window.addEventListener('load', async () => {
  // Initial check
  let walletDetected = await detectWallet()

  if (walletDetected) {
    console.log('Keethings Wallet detected!')
  } else {
    // Retry every 2 seconds for up to 10 seconds
    // (in case extension loads late)
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      walletDetected = await detectWallet()
      if (walletDetected) {
        console.log('Keethings Wallet detected!')
        break
      }
    }
  }

  loadHighScore()
})

async function connectWallet() {
  const walletDetected = await detectWallet()

  if (!walletDetected) {
    alert('Please install Keethings Wallet extension!')
    window.open('https://chromewebstore.google.com/detail/keythings-wallet/jhngbkboonmpephhenljbljnpffabloh', '_blank')
    return
  }

  try {
    const accounts = await window.keeta.request({
      method: 'keeta_requestAccounts'
    })

    if (accounts && accounts.length > 0) {
      walletAddress = accounts[0]
      document.getElementById('wallet-status').innerHTML =
        `Connected: ${walletAddress.substring(0, 12)}...`

      // Load high score from localStorage (in a real app, load from blockchain)
      loadHighScore()
    }
  } catch (error) {
    console.error('Connection failed:', error)
    alert('Failed to connect wallet')
  }
}

function incrementScore() {
  score++
  document.getElementById('score').textContent = score

  if (score > highScore) {
    highScore = score
    document.getElementById('high-score').textContent = highScore
    saveHighScore()
  }
}

function saveHighScore() {
  // In a real app, you would save to blockchain
  // For now, we'll use localStorage
  if (walletAddress) {
    localStorage.setItem(`highscore_${walletAddress}`, highScore)
  }
}

function loadHighScore() {
  if (walletAddress) {
    const saved = localStorage.getItem(`highscore_${walletAddress}`)
    if (saved) {
      highScore = parseInt(saved)
      document.getElementById('high-score').textContent = highScore
    }
  }
}

// Listen for wallet disconnection (after wallet is available)
detectWallet().then(walletDetected => {
  if (walletDetected && (window.keeta || window.keethings)) {
    const wallet = window.keeta || window.keethings
    wallet.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        walletAddress = null
        document.getElementById('wallet-status').innerHTML =
          '<button onclick="connectWallet()">Connect Wallet</button>'
      } else {
        walletAddress = accounts[0]
        loadHighScore()
      }
    })
  }
})