/* global window, document, solanaWeb3, solanaWalletAdapterBase,
          solanaWalletAdapterWallets, solanaWalletAdapterReact,
          solanaWalletAdapterReactUi */
          (() => {
            const MINT     = new solanaWeb3.PublicKey('3EVHbsvJYsPAJLbbRbDjFjpo35tdE13e7ETqtqaLpump');
            const REQUIRED = 1_000_000 * 1_000_000; // 1M raw 3EV
            const conn     = new solanaWeb3.Connection(
              'https://api.mainnet-beta.solana.com',
              'confirmed'
            );
          
            const status  = document.getElementById('status');
            const gate    = document.getElementById('gate');
            const btn     = document.getElementById('btnConnect');
          
            /* ---------- helpers ---------- */
            const log = (msg) => {
              console.log(msg);
              status.textContent = msg;
            };
            const showGate = (open) => gate.classList.toggle('hidden', !open);
          
            /* ---------- balance check ---------- */
            async function checkBalance(pubkey) {
              try {
                const accs = await conn.getTokenAccountsByOwner(pubkey, { mint: MINT });
                let total = 0;
                accs.value.forEach(({ account }) => {
                  total += Number(account.data.readBigUInt64LE(64));
                });
                return total >= REQUIRED;
              } catch (e) {
                log('Balance error: ' + e.message);
                return false;
              }
            }
          
            /* ---------- wallet adapter setup ---------- */
            const wallets = [
              new solanaWalletAdapterWallets.PhantomWalletAdapter(),
              new solanaWalletAdapterWallets.SolflareWalletAdapter(),
            ];
          
            const walletStore = solanaWalletAdapterReact.useWalletStore({
              wallets,
              autoConnect: false,
            });
          
            /* ---------- universal connect / sign ---------- */
            btn.addEventListener('click', async () => {
              try {
                log('Opening wallet modal…');
                await walletStore.connect(); // shows adapter modal
                if (!walletStore.publicKey) throw new Error('No public key returned');
          
                /* Force the wallet to sign a message – this is the missing step */
                const encodedMsg = new TextEncoder().encode('Welcome to 3EV Gate');
                await walletStore.signMessage(encodedMsg);
          
                /* Now the wallet has truly “unlocked” and we can safely query balances */
                const ok = await checkBalance(walletStore.publicKey);
                log(ok ? 'Verified' : 'Balance too low');
                showGate(ok);
              } catch (err) {
                log('Connection failed: ' + err.message);
                walletStore.disconnect();
              }
            });
          
            /* expose for dev tools */
            window.walletStore = walletStore;
          })();