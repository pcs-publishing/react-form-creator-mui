import React from 'react'
import FileView from './components/FileView'
import { times } from 'lodash'
import FileForm from './components/FileForm'
import useFileViewCount from './hooks/useFileViewCount'
import { FieldProps } from '@pcs/react-form-creator-core'

export interface FileUploadProps extends FieldProps {
  name: string
}

const FileUpload = (props: FileUploadProps) => {
  const fileViewCount = useFileViewCount(props.name)

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-4 w-full">
      {times(fileViewCount, (i) => (
        <FileView
          formComponent={FileForm}
          key={i}
          name={`${props.name}[${i}]`}
          toolInstance={props.toolInstance}
        />
      ))}
    </div>
  )
}

export default FileUpload
