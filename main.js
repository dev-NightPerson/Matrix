/* global window, document, solanaWalletAdapterWallets, solanaWalletAdapterUi */
(function () {
    const MINT     = new solanaWeb3.PublicKey('3EVHbsvJYsPAJLbbRbDjFjpo35tdE13e7ETqtqaLpump');
    const REQUIRED = 1_000_000 * 1_000_000; // 1M raw 3EV
    const conn     = new solanaWeb3.Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  
    const status = document.getElementById('status');
    const gate   = document.getElementById('gate');
  
    /* helper log */
    const log = (msg) => {
      console.log(msg);
      status.textContent = msg;
    };
  
    const showGate = (open) => gate.classList.toggle('hidden', !open);
  
    /* balance check */
    async function checkBalance(pubkey) {
      try {
        const accs = await conn.getTokenAccountsByOwner(pubkey, { mint: MINT });
        let total = 0;
        accs.value.forEach(({ account }) => (total += Number(account.data.readBigUInt64LE(64))));
        return total >= REQUIRED;
      } catch (e) {
        log('Balance error: ' + e.message);
        return false;
      }
    }
  
    /* ---------- Universal “Connect Wallet” button ---------- */
    document.getElementById('btnConnect').addEventListener('click', async () => {
      try {
        // 1. Try Phantom
        if (window.solana?.isPhantom) {
          log('Connecting Phantom…');
          await window.solana.connect();
          const ok = await checkBalance(window.solana.publicKey);
          log(ok ? 'Phantom OK' : 'Phantom low');
          showGate(ok);
          return;
        }
  
        // 2. Try Solflare
        if (window.solflare?.isSolflare) {
          log('Connecting Solflare…');
          await window.solflare.connect();
          const ok = await checkBalance(window.solflare.publicKey);
          log(ok ? 'Solflare OK' : 'Solflare low');
          showGate(ok);
          return;
        }
  
        // 3. Fallback to WalletConnect
        log('Opening WalletConnect…');
        await window.solib.init({
          connectors: [
            new window.solib.WalletConnectConnector({
              relayerRegion: 'wss://relay.walletconnect.com',
              metadata: { name: '3EV Gate', url: location.origin, icons: [''] },
              qrcode: true
            })
          ],
          chosenCluster: window.solib.mainnetBetaWalletConnect()
        });
        const wallet = await window.solib.connect();
        const ok = await checkBalance(wallet);
        log(ok ? 'WC OK' : 'WC low');
        showGate(ok);
      } catch (err) {
        log('Connection error: ' + err.message);
      }
    });
  })();