import React from 'react'
import { ChangeEventHandler, useState, FormEventHandler } from 'react';
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { Tool, ToolInstance } from '../../../types'
import Alert from '@mui/material/Alert'
import { cloneDeep } from 'lodash'

interface ToolNameDialogProps {
  tool: Tool | null
  onClose: () => void
  onAdd: (tool: ToolInstance) => true | string
}

const ToolNameDialog = (props: ToolNameDialogProps) => {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const { tool } = props

  const onSubmit: FormEventHandler = (e) => {
    e.preventDefault()
    if (!props.tool || !name) return
    const result = props.onAdd({ ...cloneDeep(props.tool), name })

    if (result === true) {
      onClose()
    } else {
      setError(result)
    }
  }

  const onClose = () => {
    setName('')
    setError('')
    props.onClose()
  }

  const handleNameChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setName(e.target.value)
    setError('')
  }

  if (!tool) return null

  return <Dialog open={!!props.tool} onClose={onClose} maxWidth='xs'>
    <form onSubmit={onSubmit}>
      <DialogTitle>Add {tool.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Enter a unique name for the {tool.title.toLowerCase()} you want to add to the page.
        </DialogContentText>
        <div className='flex flex-col gap-y-4'>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            error={!!error}
            autoFocus
            margin="dense"
            label="Field Name"
            type="text"
            variant='standard'
            fullWidth
            value={name}
            onChange={handleNameChange}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button type="submit" disabled={!name || !!error}>Add Tool</Button>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </form>
  </Dialog>
}

export default ToolNameDialog