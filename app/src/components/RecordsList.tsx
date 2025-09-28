import React, { useState, useEffect } from 'react'
import { useFitnessContract } from '../hooks/useFitnessContract'
import { FHEVMInstance, FitnessRecord, EncryptedFitnessRecord } from '../types'

interface RecordsListProps {
  fhevmInstance: FHEVMInstance | null
  refreshTrigger: number
}

const RecordsList: React.FC<RecordsListProps> = ({ fhevmInstance, refreshTrigger }) => {
  const { getEncryptedRecords, decryptRecords, getRecordCount } = useFitnessContract(fhevmInstance)
  const [encryptedRecords, setEncryptedRecords] = useState<EncryptedFitnessRecord[]>([])
  const [decryptedRecords, setDecryptedRecords] = useState<FitnessRecord[]>([])
  const [recordCount, setRecordCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [showDecrypted, setShowDecrypted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadRecords = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const count = await getRecordCount()
      setRecordCount(count)

      if (count > 0) {
        const records = await getEncryptedRecords()
        setEncryptedRecords(records)
      }
    } catch (err: any) {
      setError('Failed to load records: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDecrypt = async () => {
    if (encryptedRecords.length === 0) return

    setIsDecrypting(true)
    setError(null)

    try {
      const decrypted = await decryptRecords(encryptedRecords)
      setDecryptedRecords(decrypted)
      setShowDecrypted(true)
    } catch (err: any) {
      setError('Failed to decrypt records: ' + err.message)
    } finally {
      setIsDecrypting(false)
    }
  }

  useEffect(() => {
    loadRecords()
  }, [refreshTrigger])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const formatWeight = (weightInGrams: number) => {
    return (weightInGrams / 1000).toFixed(1)
  }

  if (isLoading) {
    return (
      <div className="section">
        <h2>Your Fitness Records</h2>
        <div className="loading">Loading records...</div>
      </div>
    )
  }

  return (
    <div className="section">
      <h2>Your Fitness Records ({recordCount} total)</h2>

      {error && <div className="error">{error}</div>}

      {recordCount === 0 ? (
        <div className="no-records">
          <p>No fitness records found. Add your first record above!</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={handleDecrypt}
              className="button secondary"
              disabled={isDecrypting || encryptedRecords.length === 0}
            >
              {isDecrypting ? 'Decrypting...' : 'Decrypt All Records'}
            </button>
            {showDecrypted && (
              <button
                onClick={() => setShowDecrypted(false)}
                className="button"
                style={{ marginLeft: '10px' }}
              >
                Hide Decrypted Data
              </button>
            )}
          </div>

          {showDecrypted && decryptedRecords.length > 0 ? (
            <div>
              <h3>Decrypted Records</h3>
              {decryptedRecords.map((record, index) => (
                <div key={index} className="record-card">
                  <div className="record-header">
                    <h4>Record #{index + 1}</h4>
                    <span className="record-timestamp">
                      {formatDate(record.timestamp)}
                    </span>
                  </div>
                  <div className="record-data">
                    <div className="data-item">
                      <label>Height</label>
                      <div className="value">{record.height} cm</div>
                    </div>
                    <div className="data-item">
                      <label>Weight</label>
                      <div className="value">{formatWeight(record.weight)} kg</div>
                    </div>
                    <div className="data-item">
                      <label>Systolic BP</label>
                      <div className="value">{record.systolic} mmHg</div>
                    </div>
                    <div className="data-item">
                      <label>Diastolic BP</label>
                      <div className="value">{record.diastolic} mmHg</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <h3>Encrypted Records</h3>
              <p>Click "Decrypt All Records" to view your private health data.</p>
              {encryptedRecords.map((record, index) => (
                <div key={index} className="record-card">
                  <div className="record-header">
                    <h4>Record #{index + 1}</h4>
                    <span className="record-timestamp">
                      {formatDate(record.timestamp)}
                    </span>
                  </div>
                  <div className="record-data">
                    <div className="data-item">
                      <label>Height</label>
                      <div className="value encrypted-value">
                        {record.height.substring(0, 20)}...
                      </div>
                    </div>
                    <div className="data-item">
                      <label>Weight</label>
                      <div className="value encrypted-value">
                        {record.weight.substring(0, 20)}...
                      </div>
                    </div>
                    <div className="data-item">
                      <label>Systolic BP</label>
                      <div className="value encrypted-value">
                        {record.systolic.substring(0, 20)}...
                      </div>
                    </div>
                    <div className="data-item">
                      <label>Diastolic BP</label>
                      <div className="value encrypted-value">
                        {record.diastolic.substring(0, 20)}...
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default RecordsList