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
  
    /* ---------- 1. Phantom ---------- */
    document.getElementById('btnPhantom').addEventListener('click', async () => {
      if (!window.solana?.isPhantom) return log('Phantom not installed');
      log('Connecting Phantom…');
      try {
        await window.solana.connect();
        const ok = await checkBalance(window.solana.publicKey);
        log(ok ? 'Phantom OK' : 'Phantom low');
        showGate(ok);
      } catch (e) {
        log('Phantom error: ' + e.message);
      }
    });
  
    /* ---------- 2. Solflare ---------- */
    document.getElementById('btnSolflare').addEventListener('click', async () => {
      if (!window.solflare?.isSolflare) return log('Solflare not installed');
      log('Connecting Solflare…');
      try {
        await window.solflare.connect();
        const ok = await checkBalance(window.solflare.publicKey);
        log(ok ? 'Solflare OK' : 'Solflare low');
        showGate(ok);
      } catch (e) {
        log('Solflare error: ' + e.message);
      }
    });
  
    /* ---------- 3. WalletConnect v2 ---------- */
    document.getElementById('btnWalletConnect').addEventListener('click', async () => {
      log('Opening WalletConnect…');
      try {
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
      } catch (e) {
        log('WalletConnect error: ' + e.message);
      }
    });
  })();