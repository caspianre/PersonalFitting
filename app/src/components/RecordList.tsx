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

export function RecordList() {
  const { address } = useAccount();
  const { instance } = useZamaInstance();
  const signer = useEthersSigner();
  const [decryptingIndex, setDecryptingIndex] = useState<number | null>(null);
  const [decrypted, setDecrypted] = useState<Record<number, {height: string; weight: string; systolic: string; diastolic: string;}>>({});

  const { data: count } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getRecordCount',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const recordIndices = useMemo(() => Array.from({ length: Number(count || 0) }, (_, i) => i), [count]);

  const records = recordIndices.map((i) => ({ index: i }));

  const [fetched, setFetched] = useState<Record<number, RecordView>>({});

  const fetchRecord = async (index: number) => {
    if (!address) return;
    // dynamic import of viem read as wagmi hook already used for count; for individual records, use public client via wagmi is not necessary here
    const { getPublicClient } = await import('wagmi/actions');
    const publicClient = getPublicClient();
    const data: readonly [string, string, string, string, bigint] = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'getRecord',
      args: [address, BigInt(index)],
    }) as any;
    const view: RecordView = {
      index,
      heightHandle: data[0] as string,
      weightHandle: data[1] as string,
      systolicHandle: data[2] as string,
      diastolicHandle: data[3] as string,
      timestamp: Number(data[4] as bigint),
    };
    setFetched((prev) => ({ ...prev, [index]: view }));
  };

  const decryptRecord = async (index: number) => {
    if (!instance || !address || !fetched[index]) return;
    const rec = fetched[index];
    setDecryptingIndex(index);
    try {
      const keypair = instance.generateKeypair();
      const handleContractPairs = [
        { handle: rec.heightHandle, contractAddress: CONTRACT_ADDRESS },
        { handle: rec.weightHandle, contractAddress: CONTRACT_ADDRESS },
        { handle: rec.systolicHandle, contractAddress: CONTRACT_ADDRESS },
        { handle: rec.diastolicHandle, contractAddress: CONTRACT_ADDRESS },
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

      setDecrypted((prev) => ({
        ...prev,
        [index]: {
          height: String(result[rec.heightHandle] ?? ''),
          weight: String(result[rec.weightHandle] ?? ''),
          systolic: String(result[rec.systolicHandle] ?? ''),
          diastolic: String(result[rec.diastolicHandle] ?? ''),
        },
      }));
    } catch (err) {
      console.error('Decrypt error:', err);
      alert(`Failed to decrypt: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDecryptingIndex(null);
    }
  };

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
            {records.map(({ index }) => {
              const rec = fetched[index];
              const dec = decrypted[index];
              return (
                <tr key={index}>
                  <td>{index}</td>
                  <td>
                    {rec ? new Date(rec.timestamp * 1000).toLocaleString() : (
                      <button className="link-btn" onClick={() => fetchRecord(index)}>Load</button>
                    )}
                  </td>
                  <td>{dec ? `${dec.height} cm` : (rec ? '***' : '-')}</td>
                  <td>{dec ? `${dec.weight}` : (rec ? '***' : '-')}</td>
                  <td>{dec ? `${dec.systolic}/${dec.diastolic}` : (rec ? '***' : '-')}</td>
                  <td>
                    {rec && (
                      <button
                        className="action-btn"
                        disabled={decryptingIndex === index}
                        onClick={() => decryptRecord(index)}
                      >
                        {decryptingIndex === index ? 'Decrypting...' : 'Decrypt'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

