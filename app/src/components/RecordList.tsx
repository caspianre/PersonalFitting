import { useMemo, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { useEthersSigner } from '../hooks/useEthersSigner';
import '../styles/RecordList.css';

type RecordView = {
  index: number;
  heightHandle: string;
  weightHandle: string;
  systolicHandle: string;
  diastolicHandle: string;
  timestamp: number;
};

function RecordRow({ index, address }: { index: number; address: `0x${string}` }) {
  const { instance } = useZamaInstance();
  const signer = useEthersSigner();
  const [decrypting, setDecrypting] = useState(false);
  const [decrypted, setDecrypted] = useState<{height?: string; weight?: string; systolic?: string; diastolic?: string}>({});

  const { data: recData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getRecord',
    args: [address, BigInt(index)],
  });

  const decrypt = async () => {
    if (!instance || !recData) return;
    const [heightHandle, weightHandle, systolicHandle, diastolicHandle] = recData as readonly [string, string, string, string, bigint];
    setDecrypting(true);
    try {
      const keypair = instance.generateKeypair();
      const handleContractPairs = [
        { handle: heightHandle as string, contractAddress: CONTRACT_ADDRESS },
        { handle: weightHandle as string, contractAddress: CONTRACT_ADDRESS },
        { handle: systolicHandle as string, contractAddress: CONTRACT_ADDRESS },
        { handle: diastolicHandle as string, contractAddress: CONTRACT_ADDRESS },
      ];
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '10';
      const contractAddresses = [CONTRACT_ADDRESS];

      const eip712 = instance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimeStamp,
        durationDays
      );

      const resolvedSigner = await signer;
      if (!resolvedSigner) throw new Error('Signer not available');
      const signature = await resolvedSigner.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );

      const result = await instance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        contractAddresses,
        address,
        startTimeStamp,
        durationDays
      );

      setDecrypted({
        height: String(result[heightHandle as string] ?? ''),
        weight: String(result[weightHandle as string] ?? ''),
        systolic: String(result[systolicHandle as string] ?? ''),
        diastolic: String(result[diastolicHandle as string] ?? ''),
      });
    } catch (err) {
      console.error('Decrypt error:', err);
      alert(`Failed to decrypt: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDecrypting(false);
    }
  };

  if (!recData) {
    return (
      <tr>
        <td>{index}</td>
        <td colSpan={4}>Loading...</td>
        <td>-</td>
      </tr>
    );
  }

  const time = new Date(Number((recData as any)[4]) * 1000).toLocaleString();
  const hasDecrypted = Boolean(decrypted.height);

  return (
    <tr>
      <td>{index}</td>
      <td>{time}</td>
      <td>{hasDecrypted ? `${decrypted.height} cm` : '***'}</td>
      <td>{hasDecrypted ? `${decrypted.weight}` : '***'}</td>
      <td>{hasDecrypted ? `${decrypted.systolic}/${decrypted.diastolic}` : '***'}</td>
      <td>
        <button className="action-btn" disabled={decrypting} onClick={decrypt}>
          {decrypting ? 'Decrypting...' : 'Decrypt'}
        </button>
      </td>
    </tr>
  );
}

export function RecordList() {
  const { address } = useAccount();
  const { data: count } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getRecordCount',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const recordIndices = useMemo(() => Array.from({ length: Number(count || 0) }, (_, i) => i), [count]);

  if (!address) {
    return (
      <div className="no-record-message">
        <p className="no-record-description">Please connect your wallet</p>
      </div>
    );
  }

  if (!count || Number(count) === 0) {
    return (
      <div className="record-list-container">
        <div className="status-card no-record-message">
          <h2 className="no-record-title">No Records Found</h2>
          <p className="no-record-description">Add a record in the "Add Record" tab.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="record-list-container">
      <div className="status-card">
        <h2 className="status-title">Your Fitness Records</h2>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Time</th>
              <th>Height</th>
              <th>Weight</th>
              <th>BP</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {recordIndices.map((i) => (
              <RecordRow key={i} index={i} address={address as `0x${string}`} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
