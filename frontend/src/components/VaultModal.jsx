import React, { useState } from 'react';
import { doc, getDocs, updateDoc, collection, query, where, runTransaction } from 'firebase/firestore';

export default function VaultModal({ isOpen, onClose, db, currentUser, currentUserData, onShowToast }) {
  const [activeTab, setActiveTab] = useState('id'); // 'id' or 'transfer'
  const [newNickname, setNewNickname] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  if (!isOpen) return null;

  const handleUpdateNickname = async (e) => {
    e.preventDefault();
    const name = newNickname.trim();
    if (!name || name.length < 3) {
      onShowToast("Nickname must be at least 3 characters.", "error");
      return;
    }

    setIsUpdatingName(true);
    onShowToast("Checking availability...", "info");

    try {
      // Uniqueness check
      const q = query(collection(db, "users"), where("nickname_lowercase", "==", name.toLowerCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        onShowToast("Identity collision! That nickname is already taken.", "error");
        setIsUpdatingName(false);
        return;
      }

      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        nickname: name,
        nickname_lowercase: name.toLowerCase()
      });
      onShowToast(`Name updated! Welcome, ${name}!`, "success");
      setNewNickname('');
    } catch (err) {
      onShowToast(`Update failed: ${err.message}`, "error");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    const targetRecipient = recipient.trim();
    const transferAmount = parseInt(amount, 10);

    if (!targetRecipient || !transferAmount || transferAmount <= 0) {
      onShowToast("Please enter a recipient name and a valid positive amount.", "error");
      return;
    }

    if (currentUserData && targetRecipient.toLowerCase() === currentUserData.nickname.toLowerCase()) {
      onShowToast("You cannot transfer points to yourself.", "error");
      return;
    }

    setIsTransferring(true);
    onShowToast("Initiating transmission...", "info");

    try {
      const discoveryPromise = (async () => {
        const normalized = targetRecipient.toLowerCase();
        const q = query(collection(db, "users"), where("nickname_lowercase", "==", normalized));
        const snap = await getDocs(q);
        if (snap.empty) throw new Error(`${targetRecipient} not found. Verify the nickname.`);
        return snap;
      })();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Connection timeout. Please retry.")), 5000)
      );

      const snap = await Promise.race([discoveryPromise, timeoutPromise]);
      const recipientId = snap.docs[0].id;
      const recipientDetails = snap.docs[0].data();
      const recipientRef = doc(db, "users", recipientId);
      const senderRef = doc(db, "users", currentUser.uid);

      await runTransaction(db, async (transaction) => {
        const senderSnap = await transaction.get(senderRef);
        const currentPoints = senderSnap.data().points || 0;
        if (currentPoints < transferAmount) throw new Error("Insufficient SkyPoints in your vault.");

        const recipientSnap = await transaction.get(recipientRef);
        transaction.update(senderRef, { points: currentPoints - transferAmount });
        transaction.update(recipientRef, { points: (recipientSnap.data().points || 0) + transferAmount });
      });

      onShowToast(`Success! Transferred ${transferAmount} SkyPoints to ${recipientDetails.nickname}.`, "success");
      setRecipient('');
      setAmount('');
    } catch (err) {
      onShowToast(`Transmission Failed: ${err.message}`, "error");
    } finally {
      setIsTransferring(false);
    }
  };

  const copyReferralLink = () => {
    if (!currentUserData || !currentUserData.nickname) return;
    const link = `${window.location.origin}?ref=${encodeURIComponent(currentUserData.nickname)}`;
    navigator.clipboard.writeText(link)
      .then(() => onShowToast("Referral link copied to clipboard!", "success"))
      .catch(() => onShowToast("Failed to copy link.", "error"));
  };

  return (
    <div
      className="modal-overlay"
      style={{
        display: 'flex',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(5, 7, 12, 0.95)',
        zIndex: 100000,
        backdropFilter: 'blur(40px)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '15px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '600px',
          padding: '40px 25px',
          position: 'relative',
          border: '1px solid rgba(88, 166, 255, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(10, 15, 25, 0.9) !important',
          boxShadow: '0 50px 100px rgba(0,0,0,1)',
          overflowY: 'auto',
          maxHeight: '90%',
          textAlign: 'left'
        }}
      >
        <div
          onClick={onClose}
          style={{
            position: 'absolute',
            right: '30px',
            top: '30px',
            cursor: 'pointer',
            fontSize: '2rem',
            color: 'rgba(255,255,255,0.3)',
            transition: '0.3s',
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = 'white'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
        >
          &times;
        </div>

        <h2
          style={{
            color: 'var(--accent-color)',
            marginBottom: '30px',
            fontWeight: 700,
            fontSize: '2rem',
            letterSpacing: '-1px',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
          }}
        >
          <i className="bi bi-shield-lock"></i> SkyPoints Vault
        </h2>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '30px',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '5px',
            borderRadius: '12px',
          }}
        >
          <button
            onClick={() => setActiveTab('id')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'id' ? 'var(--accent-color)' : 'transparent',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
              transition: '0.3s',
            }}
          >
            Identity
          </button>
          <button
            onClick={() => setActiveTab('transfer')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'transfer' ? 'var(--accent-color)' : 'transparent',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
              transition: '0.3s',
            }}
          >
            Transfer
          </button>
        </div>

        {activeTab === 'id' && (
          <div>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Your globally unique identity in the Vyamir ecosystem.
            </p>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '25px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '25px',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>
                Active Nickname
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 300, color: 'white' }}>
                {currentUserData?.nickname || 'Syncing...'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#81c784', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>
                  <i className="bi bi-coin"></i> {currentUserData?.points ?? 0} SkyPoints
                </span>
                <button
                  onClick={copyReferralLink}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--accent-color)',
                    color: 'var(--accent-color)',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    transition: '0.3s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'var(--accent-color)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--accent-color)';
                  }}
                >
                  Share Identity
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateNickname} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Enter new nickname..."
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '15px',
                  color: 'white',
                  outline: 'none',
                  transition: '0.3s',
                }}
              />
              <button
                type="submit"
                disabled={isUpdatingName}
                style={{
                  background: 'var(--accent-color)',
                  border: 'none',
                  color: 'white',
                  padding: '0 25px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isUpdatingName ? 'Updating...' : 'Update'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'transfer' && (
          <div>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Transfer SkyPoints securely to any Vyamir node.
            </p>
            <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input
                type="text"
                placeholder="Recipient Nickname (e.g. Medhini)"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '15px',
                  color: 'white',
                  outline: 'none',
                }}
              />
              <input
                type="number"
                placeholder="Amount (Tokens)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '15px',
                  color: 'white',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={isTransferring}
                style={{
                  background: 'var(--accent-gradient)',
                  border: 'none',
                  color: 'white',
                  padding: '18px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  marginTop: '10px',
                  cursor: 'pointer',
                  boxShadow: '0 10px 20px rgba(88, 166, 255, 0.2)',
                }}
              >
                {isTransferring ? 'TRANSMITTING...' : 'EXECUTE TRANSFER'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
