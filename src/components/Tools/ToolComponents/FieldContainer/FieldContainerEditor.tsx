import React from 'react'
import { useDroppable, DragEndEvent, useDndMonitor } from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import { useTools } from 'context/ToolContext'
import ToolInstanceContainer from 'components/FormEditor/components/ToolInstanceContainer'
import getToolInstanceByName from 'utils/getToolInstanceByName'
import { FieldContainerProps } from '.'
import { getClassNameFromProps } from './util'

const FieldContainerEditor = (props: FieldContainerProps) => {
  const { toolInstance } = props
  const {
    createToolInstance,
    tools,
    toolInstances,
    removeToolInstance,
    updateToolInstance
  } = useTools()

  const childToolInstances = toolInstance.children

  const { setNodeRef, isOver } = useDroppable({
    id: props.name
  })

  useDndMonitor({
    onDragEnd: (event: DragEndEvent) => {
      const isOverThis = event.over?.id === props.name
      const isDraggingSelf = event.active.id === props.name

      console.log('isOverThis: ', isOverThis)

      if (!isOverThis || isDraggingSelf) {
        return
      }

      const isTool = event.active.data.current?.type === 'tool'

      if (isTool) {
        const toolType = event.active.id
        const tool = tools.find((t) => t.toolType === toolType)
        if (!tool) return
        createToolInstance(tool, undefined, props.name)
      } else {
        const name = event.active.id
        const movedToolInstance = getToolInstanceByName(name, toolInstances)

        // If the moved tool instance is a child of this field container, then don't move it
        if (movedToolInstance.parent === props.name) {
          return
        }

        removeToolInstance(movedToolInstance)

        updateToolInstance({
          ...toolInstance,
          children: [
            ...toolInstance.children,
            { ...movedToolInstance, parent: toolInstance.name }
          ]
        })
      }
    }
  })

  const className = `${getClassNameFromProps(props)} border-2 min-h-64 rounded ${isOver ? 'bg-slate-100' : ''
    }`

  return (
    <div
      ref={setNodeRef}
      className={className}
    >
      <SortableContext items={childToolInstances.map((ti) => ti.name)}>
        {childToolInstances.map((ti, index) => {
          return (
            <ToolInstanceContainer
              key={ti.name}
              toolInstance={ti}
              index={index}
            />
          )
        })}
      </SortableContext>
    </div>
  )
}

export default FieldContainerEditor
