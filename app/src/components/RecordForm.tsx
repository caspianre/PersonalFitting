import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Contract } from 'ethers';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { useZamaInstance } from '../hooks/useZamaInstance';
import '../styles/RecordForm.css';

export function RecordForm() {
  const { address } = useAccount();
  const { instance, isLoading: zamaLoading, error } = useZamaInstance();
  const signerPromise = useEthersSigner();

  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [systolic, setSystolic] = useState<string>('');
  const [diastolic, setDiastolic] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const resetForm = () => {
    setHeight('');
    setWeight('');
    setSystolic('');
    setDiastolic('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      alert('Please connect your wallet');
      return;
    }
    if (!instance || zamaLoading || error) {
      alert('Encryption service is not ready');
      return;
    }

    const h = Number(height);
    const w = Number(weight);
    const s = Number(systolic);
    const d = Number(diastolic);

    if (!Number.isFinite(h) || !Number.isFinite(w) || !Number.isFinite(s) || !Number.isFinite(d)) {
      alert('Please enter valid numbers');
      return;
    }

    setIsSubmitting(true);
    setIsConfirming(false);
    setIsSuccess(false);

    try {
      // Prepare encrypted inputs (euint32 for all 4 fields)
      const buffer = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
      buffer.add32(h);
      buffer.add32(w);
      buffer.add32(s);
      buffer.add32(d);
      const encrypted = await buffer.encrypt();

      const signer = await signerPromise;
      if (!signer) throw new Error('No signer available');

      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.addRecord(
        encrypted.handles[0],
        encrypted.handles[1],
        encrypted.handles[2],
        encrypted.handles[3],
        encrypted.inputProof
      );

      setIsConfirming(true);
      await tx.wait();
      setIsSuccess(true);
      resetForm();
    } catch (err) {
      console.error('Error submitting record:', err);
      alert(`Failed to submit: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
      setIsConfirming(false);
    }
  };

  return (
    <div className="record-form-container">
      <div className="record-card">
        <h2 className="record-title">Add Fitness Record</h2>
        <form onSubmit={handleSubmit} className="record-form">
          <div className="form-grid">
            <div className="form-field">
              <label className="label">Height (cm)</label>
              <input
                type="number"
                min="0"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="input"
                placeholder="e.g. 175"
                required
              />
            </div>

            <div className="form-field">
              <label className="label">Weight (kg)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="input"
                placeholder="e.g. 70.5"
                required
              />
            </div>

            <div className="form-field">
              <label className="label">Systolic</label>
              <input
                type="number"
                min="0"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                className="input"
                placeholder="e.g. 120"
                required
              />
            </div>

            <div className="form-field">
              <label className="label">Diastolic</label>
              <input
                type="number"
                min="0"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                className="input"
                placeholder="e.g. 80"
                required
              />
            </div>
          </div>

          <div className="actions">
            <button
              type="submit"
              className="submit-btn"
              disabled={zamaLoading || isSubmitting || isConfirming}
            >
              {zamaLoading && 'Initializing encryption...'}
              {!zamaLoading && isSubmitting && !isConfirming && 'Submitting...'}
              {!zamaLoading && isConfirming && 'Confirming...'}
              {!zamaLoading && !isSubmitting && !isConfirming && 'Submit Record'}
            </button>
          </div>

          {isSuccess && (
            <div className="success">
              Record submitted successfully!
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

