/* global React, ReactDOM, solanaWeb3,
          walletAdapterBase, walletAdapterWallets,
          walletAdapterReact, walletAdapterReactUi */

          import './style.js'; // keeps bundler-free; optional

          const { useEffect, createElement } = React;
          const { ConnectionProvider, WalletProvider, useWallet, useConnection } = walletAdapterReact;
          const { WalletModalProvider, WalletMultiButton } = walletAdapterReactUi;
          const { PhantomWalletAdapter, SolflareWalletAdapter } = walletAdapterWallets;
          
          const MINT     = new solanaWeb3.PublicKey('3EVHbsvJYsPAJLbbRbDjFjpo35tdE13e7ETqtqaLpump');
          const REQUIRED = 1_000_000 * 1_000_000; // 1 M raw 3EV
          const ENDPOINT = 'https://api.mainnet-beta.solana.com';
          
          // ---------- helpers ----------
          const log = (msg) => {
            console.log(msg);
            document.getElementById('status').textContent = msg;
          };
          const showGate = (open) =>
            document.getElementById('gate').classList.toggle('hidden', !open);
          
          // ---------- balance check ----------
          async function checkBalance(connection, pubkey) {
            try {
              const { value: accounts } = await connection.getTokenAccountsByOwner(pubkey, { mint: MINT });
              let total = 0;
              accounts.forEach(({ account }) => (total += Number(account.data.readBigUInt64LE(64))));
              return total >= REQUIRED;
            } catch (e) {
              log('Balance error: ' + e.message);
              return false;
            }
          }
          
          // ---------- React components ----------
          const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];
          
          function Gate() {
            const { publicKey, signMessage } = useWallet();
            const { connection } = useConnection();
          
            useEffect(() => {
              if (!publicKey || !signMessage) return;
          
              (async () => {
                try {
                  // force wallet unlock via signature
                  const msg = new TextEncoder().encode('Welcome to 3EV Gate');
                  await signMessage(msg);
          
                  const ok = await checkBalance(connection, publicKey);
                  log(ok ? 'Verified' : 'Balance < 1M 3EV');
                  showGate(ok);
                } catch (e) {
                  log('Wallet error: ' + e.message);
                }
              })();
            }, [publicKey, signMessage, connection]);
          
            return null;
          }
          
          function App() {
            return createElement(
              ConnectionProvider,
              { endpoint: ENDPOINT },
              createElement(
                WalletProvider,
                { wallets, autoConnect: false },
                createElement(
                  WalletModalProvider,
                  {},
                  createElement('div', { id: 'wallet-btn-container' }, createElement(WalletMultiButton)),
                  createElement(Gate)
                )
              )
            );
          }
          
          // ---------- mount ----------
          ReactDOM.createRoot(document.body).render(createElement(App));