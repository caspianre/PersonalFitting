import React, { useState } from 'react'
import { useFitnessContract } from '../hooks/useFitnessContract'
import { FHEVMInstance } from '../types'

interface AddRecordFormProps {
  fhevmInstance: FHEVMInstance | null
  onRecordAdded: () => void
}

const AddRecordForm: React.FC<AddRecordFormProps> = ({ fhevmInstance, onRecordAdded }) => {
  const { addFitnessRecord, isLoading, error } = useFitnessContract(fhevmInstance)
  const [formData, setFormData] = useState({
    height: '',
    weight: '',
    systolic: '',
    diastolic: ''
  })
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(null)

    if (!formData.height || !formData.weight || !formData.systolic || !formData.diastolic) {
      return
    }

    try {
      await addFitnessRecord({
        height: parseInt(formData.height),
        weight: parseInt(formData.weight) * 1000, // Convert kg to grams
        systolic: parseInt(formData.systolic),
        diastolic: parseInt(formData.diastolic)
      })

      setSuccess('Fitness record added successfully!')
      setFormData({ height: '', weight: '', systolic: '', diastolic: '' })
      onRecordAdded()
    } catch (err: any) {
      console.error('Error adding record:', err)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="section">
      <h2>Add New Fitness Record</h2>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="height">Height (cm)</label>
            <input
              type="number"
              id="height"
              name="height"
              value={formData.height}
              onChange={handleChange}
              placeholder="e.g., 175"
              min="50"
              max="250"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="weight">Weight (kg)</label>
            <input
              type="number"
              id="weight"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              placeholder="e.g., 70"
              min="20"
              max="300"
              step="0.1"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="systolic">Systolic Blood Pressure (mmHg)</label>
            <input
              type="number"
              id="systolic"
              name="systolic"
              value={formData.systolic}
              onChange={handleChange}
              placeholder="e.g., 120"
              min="70"
              max="250"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="diastolic">Diastolic Blood Pressure (mmHg)</label>
            <input
              type="number"
              id="diastolic"
              name="diastolic"
              value={formData.diastolic}
              onChange={handleChange}
              placeholder="e.g., 80"
              min="40"
              max="150"
              required
            />
          </div>
        </div>

        <button type="submit" className="button" disabled={isLoading}>
          {isLoading ? 'Adding Record...' : 'Add Encrypted Record'}
        </button>
      </form>
    </div>
  )
}

export default AddRecordForm