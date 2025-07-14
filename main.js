/* global React, ReactDOM, solanaWeb3, solanaWalletAdapterBase,
          solanaWalletAdapterWallets, solanaWalletAdapterReact,
          solanaWalletAdapterReactUi */

          const { useEffect } = React;
          const { ConnectionProvider, WalletProvider, useWallet, useConnection } = solanaWalletAdapterReact;
          const { WalletModalProvider, WalletMultiButton } = solanaWalletAdapterReactUi;
          
          // ---------- constants ----------
          const MINT     = new solanaWeb3.PublicKey('3EVHbsvJYsPAJLbbRbDjFjpo35tdE13e7ETqtqaLpump');
          const REQUIRED = 1_000_000 * 1_000_000; // 1 M raw 3EV
          
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
              const accs = await connection.getTokenAccountsByOwner(pubkey, { mint: MINT });
              let total = 0;
              accs.value.forEach(({ account }) => (total += Number(account.data.readBigUInt64LE(64))));
              return total >= REQUIRED;
            } catch (e) {
              log('Balance error: ' + e.message);
              return false;
            }
          }
          
          // ---------- React components ----------
          const endpoint = 'https://api.mainnet-beta.solana.com';
          
          function Gate() {
            const { publicKey, signMessage } = useWallet();
            const { connection } = useConnection();
          
            useEffect(() => {
              if (!publicKey || !signMessage) return;
          
              (async () => {
                try {
                  // Force user to sign → unlocks key for dApp
                  const message = new TextEncoder().encode('Welcome to 3EV Gate');
                  await signMessage(message);
          
                  const ok = await checkBalance(connection, publicKey);
                  log(ok ? 'Wallet verified' : 'Balance < 1M 3EV');
                  showGate(ok);
                } catch (e) {
                  log('Wallet error: ' + e.message);
                }
              })();
            }, [publicKey, signMessage, connection]);
          
            return null;
          }
          
          function App() {
            const wallets = [
              new solanaWalletAdapterWallets.PhantomWalletAdapter(),
              new solanaWalletAdapterWallets.SolflareWalletAdapter(),
            ];
          
            return React.createElement(
              ConnectionProvider,
              { endpoint },
              React.createElement(
                WalletProvider,
                { wallets, autoConnect: false },
                React.createElement(
                  WalletModalProvider,
                  {},
                  React.createElement('div', { id: 'wallet-btn-container' },
                    React.createElement(WalletMultiButton)
                  ),
                  React.createElement(Gate)
                )
              )
            );
          }
          
          // ---------- mount ----------
          ReactDOM.createRoot(document.body).render(React.createElement(App));