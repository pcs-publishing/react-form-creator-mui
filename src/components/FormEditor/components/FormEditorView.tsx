import React, { useState, useMemo } from 'react'
import Typography from '@mui/material/Typography'
import Toolbox from './Toolbox/Toolbox'
import ToolOptions from './ToolOptions'
import { FormStructure } from 'types/index'
import FormArea from './FormArea'
import {
  useSensors,
  useSensor,
  PointerSensor,
  DragEndEvent,
  DndContext,
  DragStartEvent
} from '@dnd-kit/core'
import { useTools } from 'context/ToolContext'
import useTopLevelDragHandler from './Drag/hooks/useTopLevelDragHandler'
import formatToolInstancesToItems from 'utils/formatToolInstancesToItems'

export interface FormEditorViewProps<T extends FormStructure> {
  header: React.FC<{
    initialValue: T
    onSave: (performSave: (data: Pick<T, 'items'>) => T) => void
  }>
  initialValue: T
  onSave: (form: T) => void
}

const FormEditorView = <T extends FormStructure>(
  props: FormEditorViewProps<T>
) => {
  const { tools, toolInstances, selectedToolInstance } = useTools()

  const onDragEnd = useTopLevelDragHandler()

  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10
      }
    })
  )

  const activeDraggingTool = useMemo(
    () => tools.find((t) => t.toolType === activeDragId),
    [activeDragId, tools]
  )

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null)
    onDragEnd(event)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id)
  }

  const handleSave = (modifierFn: (form: Pick<T, 'items'>) => T) => {
    const form = modifierFn({
      items: formatToolInstancesToItems(toolInstances)
    })
    props.onSave(form)
  }

  const Header = props.header

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div className="w-full h-full flex gap-x-3">
        <div className="flex-1 flex flex-col">
          <Header
            initialValue={props.initialValue}
            onSave={handleSave}
          />
          <FormArea />
        </div>
        <div className="w-1/5 min-w-64 flex flex-col h-full">
          <Typography
            variant="h5"
            className="text-center mb-3"
          >
            Toolbox
          </Typography>
          <Toolbox
            className="overflow-y-auto flex-1"
            activeDraggingTool={activeDraggingTool}
          />
          {selectedToolInstance && (
            <div className="flex-1 mt-4">
              <Typography
                variant="h5"
                className="text-center mb-3"
              >
                {selectedToolInstance.title} Settings
              </Typography>
              <ToolOptions
                className="overflow-y-auto flex-1"
                toolInstance={selectedToolInstance}
              />
            </div>
          )}
        </div>
      </div>
    </DndContext>
  )
}

export default FormEditorView
